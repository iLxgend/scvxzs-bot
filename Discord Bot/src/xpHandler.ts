import * as discord from 'discord.js';
import * as api from './api.js';
import { apiRequestHandler } from './apiRequestHandler';
import { postXp } from './models/postXp';
import { compactDiscordUser } from './models/compactDiscordUser.js';
import { receiveXp } from './models/receiveXp.js';

export class xpHandler {
    private _config: api.IBotConfig;

    constructor(config: api.IBotConfig) {
        this._config = config;
    }

    public async IncreaseXpOnMessage(message: discord.Message) {
        let userXpURL = 'https://api.dapperdino.co.uk/api/xp/' + message.author.id;

        let xpObject: postXp = new postXp();
        let xpValue = Math.floor(Math.random() * 10) + 5;
        xpObject.xp = xpValue;
        xpObject.DiscordId = message.author.id;
        xpObject.Username = message.author.username;

        new apiRequestHandler().RequestAPI("POST", xpObject, userXpURL, this._config)
    }

    public async IncreaseXp(message: discord.Message, xp: number) {
        let userXpURL = 'https://api.dapperdino.co.uk/api/xp/' + message.author.id;

        let xpObject: postXp = new postXp();
        xpObject.xp = xp;
        xpObject.DiscordId = message.author.id;
        xpObject.Username = message.author.username;

        new apiRequestHandler().RequestAPI("POST", xpObject, userXpURL, this._config)
    }

    private LevelUp() {
        
    }

    public async GetXp() {
        let xpUrl = 'https://api.dapperdino.co.uk/api/xp'

        new apiRequestHandler().RequestAPI("GET", null, xpUrl, this._config)
            .then((xpArray) => {
                console.log(xpArray);
            });
    }

    public async GetXpById(discordId: number) {
        return new Promise<number>(async (resolve, reject) => {
            let xpUrl = `https://api.dapperdino.co.uk/api/xp/${discordId}`

            new apiRequestHandler().RequestAPI("GET", null, xpUrl, this._config)
                .then((xpReturnObject) => {
                    return resolve(xpReturnObject.data.xp);
                });
        })
    }
}