import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils'
import * as discord from 'discord.js'
import { xpHandler } from '../handlers/xpHandler';
import { connectHandler } from '../handlers/connectHandler';

export default class RegisterCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\?connect/im

    public getHelp(): IBotCommandHelp {
        return { caption: '?connect', description: 'Connect your discord to your website account.' }
    }

    public init(bot: IBot, dataPath: string): void { }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg)
    }

    public async process(msg: string, answer: IBotMessage, msgObj: discord.Message, client: discord.Client, config: IBotConfig, commands: IBotCommand[]): Promise<void> {
        new connectHandler(config)
        .registerDiscord(msgObj)
        .then()
    }
}