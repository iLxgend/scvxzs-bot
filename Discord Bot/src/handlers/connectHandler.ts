import * as discord from 'discord.js';
import * as api from '../api';
import { apiRequestHandler } from './apiRequestHandler';
import { postXp } from '../models/xp/postXp';
import { compactDiscordUser } from '../models/compactDiscordUser';
import { receiveXp } from '../models/xp/receiveXp';
import { compactPostXp } from '../models/xp/compactPostXp';
import { registerModel } from '../models/registerModel';

export class connectHandler {
    private _config: api.IBotConfig;

    constructor(config: api.IBotConfig) {
        this._config = config;
    }

    public async registerDiscord(message: discord.Message) {
        return new Promise((resolve,reject)=> {
            let registerDiscordUrl = 'https://api.dapperdino.co.uk/api/Account/RegisterDiscord/';

            let model = new registerModel();
    
            model.Username = message.author.username;
            model.DiscordId = message.author.id;
            model.registrationCode = message.content.replace("?connect ", "");
    
            return new apiRequestHandler()
                .requestAPI("POST", model, registerDiscordUrl, this._config)
                .then(async (discordAccount) => {
                    return await resolve(this.sendOkMessage(message, discordAccount));
                }).catch(reason => {
                    console.error(reason);
                    this.sendRejectMessage(message, reason);
                    return reject(reason);
                });
        });
    }

    public async sendOkMessage(message:discord.Message, model) {
        message.reply("You have successfully connected your discord account");
    }

    public async sendRejectMessage(message:discord.Message, reason) {
        message.reply(reason);
    }
}