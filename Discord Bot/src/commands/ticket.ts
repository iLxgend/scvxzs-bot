import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils'
import * as discord from 'discord.js'
import * as fs from 'fs'
import { ticket } from '../models/ticket/ticket';
import { applicant } from '../models/ticket/applicant';
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { dialogueHandler, dialogueStep } from '../handlers/dialogueHandler';
import { ticketReceive } from '../models/ticket/ticketReceive';
import { channelhandler } from '../handlers/channelHandler';
import { websiteBotService } from '../services/websiteBotService';
import { ticketDialogueData, ticketDialogue } from '../dialogues/ticketDialogue';

export default class TicketCommand implements IBotCommand {
    private readonly CMD_REGEXP = /^\?ticket/im

    private _guild;

    public getHelp(): IBotCommandHelp {
        return { caption: '?ticket', description: 'Creates a ticket for you to fill in via the prompts' }
    }

    public init(bot: IBot, dataPath: string): void { }

    public isValid(msg: string): boolean {
        return this.CMD_REGEXP.test(msg)
    }

    private dMessage: discord.Message | null = null;

    private setMessage(msg: discord.Message) {
        this.dMessage = msg;
    }

    private getMessage(): discord.Message | null {
        return this.dMessage;
    }

    public async process(messageContent: string, answer: IBotMessage, message: discord.Message, client: discord.Client, config: IBotConfig, commands: IBotCommand[], wbs:websiteBotService, guild:discord.Guild): Promise<void> {

        this._guild = guild;

        // Array of collected info
        let collectedInfo = new ticketDialogueData();
        
        // Add message object for later use in apiCall
        this.setMessage(message);
        let d = new ticketDialogue();
        // Create category step
        let titleStep: dialogueStep<ticketDialogueData> = new dialogueStep(
            collectedInfo,
            d.titleStep,
            "Enter a title for your ticket, quickly summarise the problem that you are having:",
            "Title Successful",
            "Title Unsuccessful");

        // Create description step
        let descriptionStep: dialogueStep<ticketDialogueData> = new dialogueStep(
            collectedInfo,
            d.titleStep,
            "Enter a description for your ticket. Please be as descriptive as possible so that whoever is assigned to help you knows in depth what you are struggling with:",
            "Description Successful",
            "Description Unsuccessful",);

        // Create new dialogueHandler with a titleStep and descriptionStep
        let handler = new dialogueHandler([titleStep, descriptionStep], collectedInfo);

        // Collect info from steps
        await handler.getInput(message.channel as discord.TextChannel, message.member, config as IBotConfig)
        .then(data => {

            //API CALL
            this.apiCall(data, message.member, config);

            // Create ticket embed
            let ticketEmbed = new discord.RichEmbed()
            .setTitle("Ticket Created Successfully!")
            .setColor('#ffdd05')
            .addField("Your Title:", data.title, false)
            .addField("Your Description:", data.description, false)
            .setFooter("Thank you for subitting a ticket " + message.author.username + ". We'll try to get around to it as soon as possible, please be patient.")

            // Delete command message
            message.delete(0);

            // Send ticketEmbed 
            message.channel.send(ticketEmbed);
        });
    }

    apiCall = (data: ticketDialogueData, ticketuser: any, config: any) => {

        // Create new ticket object
        let ticketObject: ticket = new ticket();

        // Create new applicant object
        ticketObject.applicant = new applicant()

        // Fill properties of ticket
        ticketObject.subject = data.title;
        ticketObject.description = data.description;

        // Fill properties of applicant
        ticketObject.applicant.username = ticketuser.displayName;
        ticketObject.applicant.discordId = ticketuser.id;

        // Post request to /api/Ticket/ 
        new apiRequestHandler()

            // Create request and fill params
            .requestAPI("POST", ticketObject, 'https://api.dapperdino.co.uk/api/ticket', config)

            // If everything went well, we receive a ticketReceive object
            .then(value => {

                // Parse object
                var ticket = JSON.parse(JSON.stringify(value)) as ticketReceive;

                console.log(ticket);

                // Get message for getting author info
                var message = this.getMessage();

                // Check if message exists
                if (message != null) {
                    
                    // Create new channelHandler
                    new channelhandler(this._guild)

                    // Add author to ticket
                    .createChannelTicketCommand(ticket.id, message);
                }
            });

        return data;
    };
}
