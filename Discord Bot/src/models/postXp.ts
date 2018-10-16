import { compactDiscordUser } from './compactDiscordUser';

export interface postXp extends compactDiscordUser {
    xp: number;
}

export class postXp implements postXp {

}