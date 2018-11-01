import * as discord from 'discord.js';
import * as api from '../api';
import { apiRequestHandler } from './apiRequestHandler';
import { registerModel } from '../models/registerModel';

export class connectHandler {

    // Config used for api
    private _config: api.IBotConfig;

    constructor(config: api.IBotConfig) {
        
        // Register config
        this._config = config;
    }

    
    public async registerDiscord(message: discord.Message) {

        // Return new promise
        return new Promise((resolve,reject)=> {

            // Register url
            let registerDiscordUrl = 'https://api.dapperdino.co.uk/api/Account/RegisterDiscord/';

            // Create new registerModel
            let model = new registerModel();
    
            // Add user information
            model.username = message.author.username;
            model.discordId = message.author.id;

            // Add connect code
            model.registrationCode = message.content.replace("?connect ", "");
    
            // Request API
            return new apiRequestHandler()
                .requestAPI("POST", model, registerDiscordUrl, this._config)

                // Everything went okay
                .then((discordAccount) => {

                    // Send okay message
                    this.sendOkMessage(message, discordAccount)

                    // Resolve
                    return resolve();
                })
                
                // Whoops, error
                .catch(reason => {

                    // Log & send reason
                    console.error(reason);
                    this.sendRejectMessage(message, reason);

                    // Reject
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