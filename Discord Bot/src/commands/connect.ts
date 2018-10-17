import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils'
import * as discord from 'discord.js'
import { xpHandler } from '../handlers/xpHandler';

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
        
    }
    private createLevelEmbed(msgObj, config) {
        return new Promise<discord.RichEmbed>(async (resolve, reject) => {

            new xpHandler(config)
            .GetLevelDataById(msgObj.author.id)
            .then(levelData => {

                let xpEmbed = new discord.RichEmbed()
                    .setTitle(msgObj.author.username)
                    .setColor("#ff00ff")
                    .addField("Level", levelData.Level, true)
                    .addField("XP", levelData.xp, true)
                return resolve(xpEmbed);
            })
        })
    }

    private createRtfmEmbed(rtfmUser:discord.GuildMember, message:discord.Message): discord.RichEmbed {
        
        let matches = message.content.match(/\bhttps?:\/\/\S+/gi);
        let url = 'https://discord.js.org/#/docs/main/stable/general/welcome/';
        
        if (matches != null) {
            url = matches[0];
        }

        return new discord.RichEmbed()
            .setColor("#ff0000")
            .setTitle("The Holy Book of Discord Bots")
            .setURL(url)
            .addField("There's no need to fear " + rtfmUser.displayName + ".", message.author + " is here to save you. They have bestowed upon you the holy book of Discord Bots. If you read this book each day you will by no doubt develop something great.")
            .setFooter("Always refer to this book before becoming an annoyance to the members of the 'Happy To Help' role")
    }
}