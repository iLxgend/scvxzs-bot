import { discordUser } from "./discordUser";

export interface suggest {
    description: string;
    type: SuggestionTypes;
    discordUser: discordUser
}

export enum SuggestionTypes{
    Bot = 0,
    Website = 1,
    General = 2,
    Youtube = 3,
    Undecided = 4
}

export class suggest implements suggest {

}