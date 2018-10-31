import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils'
import * as discord from 'discord.js'
import * as fs from 'fs'
import { suggest, SuggestionTypes } from '../models/suggest';
import { discordUser } from '../models/discordUser';
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { dialogueStep, dialogueHandler } from '../handlers/dialogueHandler';
import { compactDiscordUser } from '../models/compactDiscordUser';
import { suggestionDialogueData, suggestionDialogue } from '../dialogues/suggestionDialogue';
import { ticketDialogueData } from '../dialogues/ticketDialogue';

export default class SuggestCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\?suggest/im

    public getHelp(): IBotCommandHelp {
        return { caption: '?suggest', description: 'Leave a suggestion for our server\'s bot, our website or leave a YouTube video suggestion. Just follow the prompts' }
    }

    public init(bot: IBot, dataPath: string): void { }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg)
    }

    private cbFunc = (response: any, data: any, endEarly: any) => {
        if (data == null) {
            data = new Array<string>(response);
        }
        else {
            data.push(response);
        }
        console.log(data.join(", "))
        return [data, endEarly];
    };
    
    public async process(messageContent: string, answer: IBotMessage, message: discord.Message, client: discord.Client, config: IBotConfig, commands: IBotCommand[]): Promise<void> {

        let collectedInfo:suggestionDialogueData= new suggestionDialogueData();
        let dialogue:suggestionDialogue = new suggestionDialogue(message, config);

        let suggestionCategoryStep: dialogueStep<suggestionDialogueData> = new dialogueStep(
            collectedInfo,
            dialogue.addCategory,
            "Enter the category that best suits your suggestion. Choose from 'Bot', 'Website', 'General' or 'Youtube'.", 
            "Type Successful", 
            "Type Unsuccessful"
            );

        let suggestionStep: dialogueStep<suggestionDialogueData> = new dialogueStep(
            collectedInfo,
            dialogue.addCategory,
            "Enter your suggestion:", 
            "Suggestion Successful", 
            "Suggestion Unsuccessful");
        
        let handler = new dialogueHandler([suggestionCategoryStep, suggestionStep], collectedInfo);

        collectedInfo = await handler.getInput(message.channel as discord.TextChannel, message.member, config as IBotConfig);

        fs.appendFile('../suggestions.txt', "ID: " + message.author + ", Username: " + message.author.username + ", Suggestion: " + collectedInfo[1] + "\n", function(err){
            if(err)
            {
                throw err;
            }
            console.log('Updated!');
        })
        message.delete(0);

        let suggestionEmbed = new discord.RichEmbed()
            .setTitle("Thank You For Leaving A Suggestion")
            .setColor("#ff0000")
            .addField(message.author.username, "Suggested Dapper Dino to: " + collectedInfo[1], false)
            .addField("Your request has been added to Dapper's video ideas list", "Thanks for your contribution", false)
            .setFooter("Sit tight and I might get around to your idea... eventually :D")
            
        message.channel.send(suggestionEmbed);
    }
}