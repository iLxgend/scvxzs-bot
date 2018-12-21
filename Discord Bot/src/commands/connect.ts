import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils'
import * as discord from 'discord.js'
import { xpHandler } from '../handlers/xpHandler';
import { connectHandler } from '../handlers/connectHandler';
import { connectDialogue } from '../dialogues/connectDialogue';
import { dialogueStep, dialogueHandler } from '../handlers/dialogueHandler';

export default class RegisterCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\?connect/im

    public getHelp(): IBotCommandHelp {
        return { caption: '?connect codehere', description: 'Connect your discord to your website account. You can find your code on your profile page.' }
    }

    public init(bot: IBot, dataPath: string): void { }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg)
    }

    public canUseInChannel(channel:discord.TextChannel): boolean {
        return !channel.name.toLowerCase().startsWith("ticket");
    }

    public canUseCommand(roles: discord.Role[]) {
        let helpObj: IBotCommandHelp = this.getHelp();
        let canUseCommand = true;

        if (helpObj.roles != null && helpObj.roles.length > 0) {
            canUseCommand = false;

            for (var cmdRole in helpObj.roles) {
                if (roles.find(role => role.name.toLowerCase() == cmdRole.toLowerCase()))
                    canUseCommand = true;
            }
        }

        return canUseCommand;
    }

    public async process(msg: string, answer: IBotMessage, msgObj: discord.Message, client: discord.Client, config: IBotConfig, commands: IBotCommand[]): Promise<void> {
        
        if (msg.toLowerCase().trim() !== "?connect") {
            let model = false;
            let dialogue = new connectDialogue(config, msgObj.channel as discord.TextChannel, msgObj.member, client);

            let connectStep: dialogueStep<boolean> = new dialogueStep<boolean>(
                model,
                dialogue.getConnectCode,
                "Enter your connect code:",
                "",
                "");
    
            let handler = new dialogueHandler([connectStep], model);
    
            await handler
            .getInput(msgObj.channel as discord.TextChannel, msgObj.member, config as IBotConfig)
            .then((connected) => {
                
            });
        } else {
            new connectHandler(client, config)
            .registerDiscord(msgObj)
            .then()
        }
    }
}