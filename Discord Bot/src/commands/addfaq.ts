import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils';
import * as discord from 'discord.js';
import { faq } from '../models/faq/faq';
import { resourceLink } from '../models/faq/resourceLink';
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { dialogueHandler, dialogueStep } from '../handlers/dialogueHandler';
import { faqMessage } from '../models/faq/faqMessage';
import { faqHandler } from '../handlers/faqHandler';

export default class AddFaqCommand implements IBotCommand {

    private readonly CMD_REGEXP = /^\?addfaq/im

    public getHelp(): IBotCommandHelp {
        return { caption: '?addfaq', description: 'ADMIN ONLY - Creates a new entry to the FAQ channel, follow the prompts' }
    }

    public init(bot: IBot, dataPath: string): void { }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg)
    }

    add = (response: any, data: any, endEarly: any) => {
        if (data == null) {
            data = new Array<string>(response);
        }
        else {
            data.push(response);
        }
        if(data[2]){
            if(data[2] != 'yes' || data[2] == 'Yes'){
                endEarly = true;
            }
        }
        console.log("cbfunc " + endEarly);
        console.log(data.join(", "));
        return [data, endEarly];
    };

    httpFunc = (response: any, data: any, ticketuser: any, config: any) => {
        let faqEntity:faq = new faq();
        faqEntity.question = data[0];
        faqEntity.answer = data[1];
        let faqEmbed = new discord.RichEmbed()
        .setTitle("-Q: " + data[0])
        .setDescription("-A: " + data[1])
        .setColor("#2dff2d")

        if(data[2].toLowerCase() == 'yes' && data[3] != null && data[4] != null){
            faqEntity.resourceLink = new resourceLink();
            faqEntity.resourceLink.link = data[3];
            faqEntity.resourceLink.displayName = data[4];
            faqEmbed.addField("Useful Resource: ", "[" + data[4] + "](" + data[3] + ")");
            new faqHandler(config).addFaq(faqEntity)
            .then(faqData => {
                ((ticketuser as discord.GuildMember).guild.channels.get("461486560383336458") as discord.TextChannel)
                .send(faqEmbed)
                .then(newMsg =>{
                    this.setFaqMessageId((newMsg as discord.Message).id, faqData.id, config);
                });
            })
        }
        else if(data[2].toLowerCase() === 'no'){
            new faqHandler(config).addFaq(faqEntity)
            .then(faqData => {
                ((ticketuser as discord.GuildMember).guild.channels.get("461486560383336458") as discord.TextChannel)
                .send(faqEmbed)
                .then(newMsg =>{
                    this.setFaqMessageId((newMsg as discord.Message).id, faqData.id, config);
                });
            })
        }

        return data;
    };
    
    public async process(messageContent: string, answer: IBotMessage, message: discord.Message, client: discord.Client, config: IBotConfig, commands: IBotCommand[]): Promise<void> {
        if(!message.member.hasPermission("MANAGE_MESSAGES"))
        {
            message.channel.send("You don't have the privileges to add to the FAQ channel!"); //Makes sure the user has the correct permissions to be able to use this command
            return;
        }

        let collectedInfo;
        //datacallback

        let questionStep: dialogueStep = new dialogueStep("Enter Question:", "Question Successful", "Question Unsuccessful", this.add, collectedInfo);
        let answerStep: dialogueStep = new dialogueStep("Enter Answer:", "Answer Successful", "Answer Unsuccessful", this.add, collectedInfo);
        let faqUrlVerifyStep: dialogueStep = new dialogueStep("Would you like to add a resourceful URL related to the FAQ? (Enter 'Yes' if so, otherwise enter 'No')", "URL Choice Successful", "URL Choice Unsuccessful", this.add, this.httpFunc, collectedInfo);
        let faqUrlStep: dialogueStep = new dialogueStep("Enter URL:", "URL Successful", "URL Unsuccessful", this.add, collectedInfo);
        let faqUrlMaskStep: dialogueStep = new dialogueStep("Enter URL Mask:", "URL Mask Successful", "URL Mask Unsuccessful", this.add, this.httpFunc, collectedInfo);

        let handler = new dialogueHandler([questionStep, answerStep, faqUrlVerifyStep, faqUrlStep, faqUrlMaskStep], collectedInfo);

        collectedInfo = await handler.getInput(message.channel as discord.TextChannel, message.member, config as IBotConfig);

        message.delete(0);
    }

    private setFaqMessageId(messageId: string, faqId: number, config: IBotConfig)
    {
        let faqMessageObject = new faqMessage();
        faqMessageObject.id = faqId;
        faqMessageObject.messageId = messageId;

        new apiRequestHandler().requestAPI("POST", faqMessageObject, 'https://api.dapperdino.co.uk/api/faq/AddMessageId', config)
    }
}