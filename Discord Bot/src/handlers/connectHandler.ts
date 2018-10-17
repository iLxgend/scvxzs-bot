import * as discord from 'discord.js';
import * as api from '../api.js';
import { apiRequestHandler } from '../apiRequestHandler.js';
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
        let registerDiscordUrl = 'https://api.dapperdino.co.uk/api/RegisterDiscord/';

        let model = new registerModel();

        model.Username = message.author.username;
        model.DiscordId = message.author.id;
        model.registrationCode = message.content;

        new apiRequestHandler()
            .RequestAPI("POST", model, registerDiscordUrl, this._config)
            .then(async (discordAccount) => {
                let obj = JSON.parse(discordAccount.toString());
                await this.sendOkMessage(message, obj);
            })
    }

    public async sendOkMessage(message:discord.Message, model) {

    }
}