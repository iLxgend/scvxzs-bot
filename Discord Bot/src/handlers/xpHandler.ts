import * as discord from 'discord.js';
import * as api from '../api';
import { apiRequestHandler } from './apiRequestHandler';
import { postXp } from '../models/xp/postXp';
import { compactDiscordUser } from '../models/compactDiscordUser';
import { receiveXp } from '../models/xp/receiveXp';
import { compactPostXp } from '../models/xp/compactPostXp';

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

        new apiRequestHandler().requestAPI("POST", xpObject, userXpURL, this._config)
    }

    public async IncreaseXp(message: discord.Message, xp: number) {
        let userXpURL = 'https://api.dapperdino.co.uk/api/xp/' + message.author.id;

        let xpObject: postXp = new postXp();
        xpObject.xp = xp;
        xpObject.DiscordId = message.author.id;
        xpObject.Username = message.author.username;

        new apiRequestHandler().requestAPI("POST", xpObject, userXpURL, this._config)
    }

    public async IncreaseXpDefault(discordId:string, xp:number){
        let userXpURL = 'https://api.dapperdino.co.uk/api/xp/' + discordId;

        let xpObject: compactPostXp = new compactPostXp();
        xpObject.xp = xp;

        new apiRequestHandler().requestAPI("POST", xpObject, userXpURL, this._config)
    }

    public async GetLevelData() {
        let xpUrl = 'https://api.dapperdino.co.uk/api/xp'

        new apiRequestHandler().requestAPI("GET", null, xpUrl, this._config)
            .then((xpArray) => {
                console.log(xpArray);
            });
    }

    public async getLevelDataById(discordId: number) {
        return new Promise<receiveXp>(async (resolve, reject) => {
            let xpUrl = `https://api.dapperdino.co.uk/api/xp/${discordId}`

            new apiRequestHandler().requestAPI("GET", null, xpUrl, this._config)
                .then((xpReturnObject) => {
                    let xpReturn = JSON.parse(xpReturnObject.toString())
                    return resolve(xpReturn as receiveXp);
                });
        })
    }
}