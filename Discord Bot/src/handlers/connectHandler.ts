import * as discord from 'discord.js';
import * as api from '../api.js';
import { apiRequestHandler } from './apiRequestHandler.js';
import { postXp } from '../models/postXp.js';
import { compactDiscordUser } from '../models/compactDiscordUser.js';
import { receiveXp } from '../models/receiveXp.js';
import { compactPostXp } from '../models/compactPostXp.js';
import { registerModel } from '../models/registerModel.js';

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
                .RequestAPI("POST", model, registerDiscordUrl, this._config)
                .then(async (discordAccount) => {
                    return await resolve(this.sendOkMessage(message, discordAccount));
                }).catch(reason => {
                    console.error(reason);
                    this.sendRejectMessage(message, reason);
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