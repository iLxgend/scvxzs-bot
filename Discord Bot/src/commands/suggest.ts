import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils'
import * as discord from 'discord.js'
import * as fs from 'fs'
import { suggest, SuggestionTypes } from '../models/suggest';
import { discordUser } from '../models/discordUser';
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { dialogueStep, dialogueHandler } from '../handlers/dialogueHandler';
import { compactDiscordUser } from '../models/compactDiscordUser';

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

    private httpFunc = (response: any, data: any, ticketuser: any, config: any) => {

        // Create new suggestion
        let suggestObject:suggest = new suggest();

        // Set description
        suggestObject.Description = data[1];

        // Add discord user information to the suggestion
        suggestObject.DiscordUser = new discordUser();
        suggestObject.DiscordUser.username = ticketuser.displayName;
        suggestObject.DiscordUser.discordId = ticketuser.id;

        // Select suggestion type
        switch(data[0].toLowerCase()){
            case "bot":
                suggestObject.Type = SuggestionTypes.Bot;
                break;
            case "website":
                suggestObject.Type = SuggestionTypes.Website;
                break;
            case "general":
                suggestObject.Type = SuggestionTypes.General;
                break;
            case "youtube":
                suggestObject.Type = SuggestionTypes.Youtube;
                break;
            default:
                suggestObject.Type = SuggestionTypes.Undecided;
        }

        new apiRequestHandler().requestAPI('POST', suggestObject, 'https://api.dapperdino.co.uk/api/suggestion', config);

        return data;
    };
    
    public async process(messageContent: string, answer: IBotMessage, message: discord.Message, client: discord.Client, config: IBotConfig, commands: IBotCommand[]): Promise<void> {

        let collectedInfo;
        //datacallback

        let suggestionCategoryStep: dialogueStep = new dialogueStep(
            "Enter the category that best suits your suggestion. Choose from 'Bot', 'Website', 'General' or 'Youtube'.", 
            "Type Successful", 
            "Type Unsuccessful",
            this.cbFunc, 
            collectedInfo
            );

        let suggestionStep: dialogueStep = new dialogueStep(
            "Enter your suggestion:", 
            "Suggestion Successful", 
            "Suggestion Unsuccessful",
            this.cbFunc, 
            this.httpFunc, 
            collectedInfo);
        
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