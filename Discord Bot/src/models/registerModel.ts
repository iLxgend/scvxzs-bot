import { compactDiscordUser } from "./compactDiscordUser";

export interface registerModel extends compactDiscordUser {
    registrationCode:string;
}

export class registerModel implements registerModel {

}