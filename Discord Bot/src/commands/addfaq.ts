import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils';
import * as discord from 'discord.js';
import { faq } from '../models/faq';
import { resourceLink } from '../models/resourceLink';
import { apiRequestHandler } from '../apiRequestHandler';
import { dialogueHandler, dialogueStep } from '../dialogueHandler';

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
        faqEntity.Question = data[0];
        faqEntity.Answer = data[1];
        if(data[2].toLowerCase() == 'yes' && data[3] != null && data[4] != null){
            faqEntity.ResourceLink = new resourceLink();
            faqEntity.ResourceLink.Link = data[3];
            faqEntity.ResourceLink.DisplayName = data[4];
            new apiRequestHandler().RequestAPI("POST", faqEntity, 'https://api.dapperdino.co.uk/api/faq', config);
        }
        else if(data[2].toLowerCase() != 'yes'){
            new apiRequestHandler().RequestAPI("POST", faqEntity, 'https://api.dapperdino.co.uk/api/faq', config);
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

        collectedInfo = await handler.GetInput(message.channel as discord.TextChannel, message.member, config as IBotConfig);

        let faqEmbed = new discord.RichEmbed()
            .setTitle("-Q: " + collectedInfo[0])
            .setDescription("-A: " + collectedInfo[1])
            .setColor("#2dff2d")
        if(collectedInfo[2].toLowerCase() == 'yes')
        {
            faqEmbed.addField("Useful Resource: ", "[" + collectedInfo[4] + "](" + collectedInfo[3] + ")");
        }
        message.channel.send(faqEmbed).then(newMsg =>{
            message.delete(0);
        });
    }
}