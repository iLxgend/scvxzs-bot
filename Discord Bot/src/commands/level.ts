import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils'
import * as discord from 'discord.js'
import { createSecurePair } from 'tls';
import * as fs from "fs"
import { xpHandler } from '../handlers/xpHandler';
import { postXp } from '../models/xp/postXp';

const xp = require("../../xp.json");

export default class LevelCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\?level/im

    public getHelp(): IBotCommandHelp {
        return { caption: '?level', description: 'Lets you know your level and exp in the server' }
    }

    public init(bot: IBot, dataPath: string): void { }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg)
    }

    public async process(msg: string, answer: IBotMessage, msgObj: discord.Message, client: discord.Client, config: IBotConfig, commands: IBotCommand[]): Promise<void> {

        this.createLevelEmbed(msgObj, config)
        .then(xpEmbed =>{
            msgObj.channel.send(xpEmbed).then(newMsg => {
                msgObj.delete(0);
                (newMsg as discord.Message).delete(5000);
            })
        })
    }

    private createLevelEmbed(msgObj, config) {
        return new Promise<discord.RichEmbed>(async (resolve, reject) => {

            new xpHandler(config)
            .getLevelDataById(msgObj.author.id)
            .then(levelData => {

                let xpEmbed = new discord.RichEmbed()
                    .setTitle(msgObj.author.username)
                    .setColor("#ff00ff")
                    .addField("Level", levelData.level, true)
                    .addField("XP", levelData.xp, true)
                return resolve(xpEmbed);
            })
        })
    }
}