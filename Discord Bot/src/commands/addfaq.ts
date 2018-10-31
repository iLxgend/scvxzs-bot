import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils';
import * as discord from 'discord.js';
import { faq } from '../models/faq/faq';
import { resourceLink } from '../models/faq/resourceLink';
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { dialogueHandler, dialogueStep } from '../handlers/dialogueHandler';
import { faqMessage } from '../models/faq/faqMessage';
import { faqHandler } from '../handlers/faqHandler';
import * as api from '../api'
import { faqDialogue } from "../dialogues/faqDialogue";

export default class AddFaqCommand implements IBotCommand {

    private readonly CMD_REGEXP = /^\?addfaq/im

    public getHelp(): IBotCommandHelp {
        return { caption: '?addfaq', description: 'ADMIN ONLY - Creates a new entry to the FAQ channel, follow the prompts' }
    }

    public init(bot: IBot, dataPath: string): void {
     }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg)
    }

    public async process(messageContent: string, answer: IBotMessage, message: discord.Message, client: discord.Client, config: IBotConfig, commands: IBotCommand[]): Promise<void> {
        if (!message.member.hasPermission("MANAGE_MESSAGES")) {
            message.channel.send("You don't have the privileges to add to the FAQ channel!"); //Makes sure the user has the correct permissions to be able to use this command
            return;
        }

        let faqModel = new faq();
        let dialogue = new faqDialogue(config, message.channel as discord.TextChannel, message.member, client);

        let questionStep: dialogueStep<faq> = new dialogueStep<faq>(
            faqModel,
            dialogue.addQuestion,
            "Enter Question:",
            "Question Successful",
            "Question Unsuccessful");

        let answerStep: dialogueStep<faq> = new dialogueStep<faq>(
            faqModel,
            dialogue.addAnswer,
            "Enter Answer:",
            "Answer Successful",
            "Answer Unsuccessful");

        let faqUrlVerifyStep: dialogueStep<faq> = new dialogueStep(
            faqModel,
            dialogue.startUsefulResource,
            "Would you like to add a resourceful URL related to the FAQ? (Enter 'Yes' if so, otherwise enter 'No')",
            "URL Choice Successful",
            "URL Choice Unsuccessful");


        let handler = new dialogueHandler([questionStep, answerStep, faqUrlVerifyStep], faqModel);

        await handler
        .getInput(message.channel as discord.TextChannel, message.member, config as IBotConfig)
        .then((faq) => {
            
            dialogue.finalizeSteps(faq)
        });

        message.delete(0);
    }


}