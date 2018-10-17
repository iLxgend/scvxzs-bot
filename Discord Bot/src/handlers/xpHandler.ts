import * as discord from 'discord.js';
import * as api from '../api.js';
import { apiRequestHandler } from './apiRequestHandler.js';
import { postXp } from '../models/postXp.js';
import { compactDiscordUser } from '../models/compactDiscordUser.js';
import { receiveXp } from '../models/receiveXp.js';
import { compactPostXp } from '../models/compactPostXp.js';

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

    public async IncreaseXpDefault(discordId:string, xp:number){
        let userXpURL = 'https://api.dapperdino.co.uk/api/xp/' + discordId;

        let xpObject: compactPostXp = new compactPostXp();
        xpObject.xp = xp;

        new apiRequestHandler().RequestAPI("POST", xpObject, userXpURL, this._config)
    }

    public async GetLevelData() {
        let xpUrl = 'https://api.dapperdino.co.uk/api/xp'

        new apiRequestHandler().RequestAPI("GET", null, xpUrl, this._config)
            .then((xpArray) => {
                console.log(xpArray);
            });
    }

    public async GetLevelDataById(discordId: number) {
        return new Promise<receiveXp>(async (resolve, reject) => {
            let xpUrl = `https://api.dapperdino.co.uk/api/xp/${discordId}`

            new apiRequestHandler().RequestAPI("GET", null, xpUrl, this._config)
                .then((xpReturnObject) => {
                    let xpReturn = JSON.parse(xpReturnObject.toString())
                    return resolve(xpReturn as receiveXp);
                });
        })
    }
}