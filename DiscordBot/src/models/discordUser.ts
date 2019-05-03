import { compactDiscordUser } from "./compactDiscordUser";

export interface discordUser extends compactDiscordUser{
    name: string;
}

export class discordUser implements discordUser {
    
}