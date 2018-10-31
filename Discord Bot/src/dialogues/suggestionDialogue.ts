import { SuggestionTypes, suggest } from "../models/suggest";
import { discordUser } from "../models/discordUser";
import { apiRequestHandler } from "../handlers/apiRequestHandler";
import * as discord from 'discord.js'; 
import * as api from "../api";

export class suggestionDialogue {

    private _message:discord.Message;
    private _config: api.IBotConfig;

    /**
     *
     */
    constructor(message:discord.Message, config: api.IBotConfig) {
        this._message=message;
        this._config = config;
    }

    /**
     * addCategory
     */
    public addCategory(response: any, data: suggestionDialogueData) {
        return new Promise<suggestionDialogueData>((resolve, reject) => {
            try {
                data.category = response.content;
                return resolve(data);
            } catch (e) {
                return reject(e);
            }
        });
    }

    /**
     * addDescription
     */
    public addDescription(response: string, data: suggestionDialogueData) {
        return new Promise<suggestionDialogueData>((resolve, reject) => {
            try {
                data.description = response;
                return resolve(data);
            } catch (e) {
                return reject(e);
            }
        });
    }

    public handleAPI = (data: suggestionDialogueData) => {

        // Create new suggestion
        let suggestion:suggest = new suggest();

        // Set description
        suggestion.description = data.description;

        // Add discord user information to the suggestion
        suggestion.discordUser = new discordUser();
        suggestion.discordUser.username = this._message.member.displayName;
        suggestion.discordUser.discordId = this._message.member.id;

        // Select suggestion type
        switch(data.category.toLowerCase()){
            case "bot":
                suggestion.type = SuggestionTypes.Bot;
                break;
            case "website":
                suggestion.type = SuggestionTypes.Website;
                break;
            case "general":
                suggestion.type = SuggestionTypes.General;
                break;
            case "youtube":
                suggestion.type = SuggestionTypes.Youtube;
                break;
            default:
                suggestion.type = SuggestionTypes.Undecided;
        }

        new apiRequestHandler().requestAPIWithType<suggest>('POST', suggestion, 'https://api.dapperdino.co.uk/api/suggestion', this._config);

        return data;
    };

}

export class suggestionDialogueData {
    public category: string = "";
    public description: string = "";
}