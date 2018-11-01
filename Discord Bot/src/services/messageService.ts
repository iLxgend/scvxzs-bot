import * as discord from 'discord.js'
import * as api from '../api'
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { ticketReaction } from '../models/ticket/ticketReaction';
import { ticketReceive } from '../models/ticket/ticketReceive';

export class messageService {

    private _serverBot: discord.Client
    private _config: api.IBotConfig

    constructor(serverBot: discord.Client, config: api.IBotConfig) {
        this._serverBot = serverBot;
        this._config = config;
    }

    public handleMessageInTicketCategory(message: discord.Message) {

        // Get ticket channel id from channel name
        let ticketChannelId = ((message.channel as discord.TextChannel).name.toString().replace("ticket", "")).toString();

        // Check if content is equal to ?closeTicket
        if (message.content.toString().toLowerCase() === "?closeticket") {

            // Request API
            new apiRequestHandler()

                // Request with type so in our .then method we'll have intellisense
                .requestAPIWithType<ticketReceive>('GET', null, `https://api.dapperdino.co.uk/api/ticket/${ticketChannelId}`, this._config)

                // All went okay
                .then(ticketReceive => {

                    // Get ticket channel creator
                    let creatorId = ticketReceive.applicant.discordId;

                    // Check if current user is creator
                    if (message.author.id == creatorId) {

                        // Delete message
                        message.channel.delete();

                        // Close ticket through API
                        new apiRequestHandler().requestAPI('POST', null, `https://api.dapperdino.co.uk/api/ticket/${ticketChannelId}/close`, this._config);

                        // Get current guild
                        let guild = this._serverBot.guilds.get(this._config.serverId);

                        if (!guild) return ("Server not found");

                        //Create embed for helpers to know that the ticket is closed
                        let completedTicketEmbed = new discord.RichEmbed()
                            .setTitle(`Ticket ${ticketChannelId} has been completed!`)
                            .setColor("#ff0000")
                            .setDescription(`${ticketReceive.applicant.username}'s problem has now been resolved, good job`)


                        // Get completed tickets channel
                        let completedTicketsChannel = guild.channels.find(channel => channel.name === "completed-tickets") as discord.TextChannel;

                        if (!completedTicketsChannel) return ("Channel not found");

                        //Send the embed to completed tickets channel
                        completedTicketsChannel.send(completedTicketEmbed)
                    }
                    else {
                        // Delete message if it's not the creator
                        message.delete(0);

                        // Create embed that tells the creator to close the ticket
                        let endTicketEmbed = new discord.RichEmbed()
                            .setTitle(`${message.author.username} thinks that this ticket can be closed now`)
                            .setThumbnail(message.author.avatarURL)
                            .setColor("#2dff2d")
                            .setDescription("If you agree that this ticket should be closed then please type the following command:\n__**?closeTicket**__")

                        // Send embed to ticket channel
                        message.channel.send(endTicketEmbed);
                    }
                });

            return;
        } else if (message.content.toString().toLowerCase() === '?forceclose') {

            // Check if user has permissions
            if (message.member.roles.find((e) => e.name == "Happy To Help" || e.name == "Admin") == null) return;

            // Delete message
            message.channel.delete();

            // Close ticket through API
            new apiRequestHandler().requestAPI('POST', null, `https://api.dapperdino.co.uk/api/ticket/${ticketChannelId}/close`, this._config);

            // Get current guild
            let guild = this._serverBot.guilds.get(this._config.serverId);

            if (!guild) return ("Server not found");

            //Create embed for helpers to know that the ticket is closed
            let completedTicketEmbed = new discord.RichEmbed()
                .setTitle(`Ticket ${ticketChannelId} has been completed!`)
                .setColor("#ff0000")
                .setDescription(`This ticket was close forced by ${message.member.displayName}`)

            // Get completed tickets channel
            let completedTicketsChannel = guild.channels.find(channel => channel.name === "completed-tickets") as discord.TextChannel;

            if (!completedTicketsChannel) return ("Channel not found");

            //Send the embed to completed tickets channel
            completedTicketsChannel.send(completedTicketEmbed)
        }

        // Create new ticket reaction if no commands were used
        let reaction = new ticketReaction();

        // Fill ticket reaction model
        reaction.ticketId = parseInt(ticketChannelId);
        reaction.fromId = message.author.id;
        reaction.message = message.content;
        reaction.messageId = message.id;

        // Request API and add our reaction to the database.
        new apiRequestHandler().requestAPI('POST', reaction, 'https://api.dapperdino.co.uk/api/ticket/reaction', this._config);
    }


    /**
     * Updates the embed, removes the old one, sends a new one to a new channel
     * @param oldChannelId Used for getting oldMessage
     * @param oldMessageId Id of current oldMessage
     * @param newChannelId Channel id where we'll send the new oldMessage to
     * @param message New oldMessage to be placed in some channel
     */
    public updateEmbedToNewChannel(oldChannelId: string, oldMessageId: string, newChannelId: string, message: discord.Message | discord.RichEmbed) {

        //Return new promise, resolves if the new message is sent
        return new Promise<string>(async (resolve, reject) => {

            // Get current guild
            let guild = this._serverBot.guilds.get(this._config.serverId);

            if (!guild) return reject("Server not found");

            // Get old channel
            let channel = guild.channels.get(oldChannelId) as discord.TextChannel;

            if (!channel) return reject("Old channel not found");

            // Get old oldMessage
            let oldMessage = await channel.fetchMessage(oldMessageId);

            if (!oldMessage) return reject("Old message not found");

            // Get new channel
            let newChannel = guild.channels.get(newChannelId) as discord.TextChannel;

            if (!newChannel) return reject("New channel not found");

            // Delete old oldMessage
            oldMessage.delete(0);

            // Send new message & resolve with id
            return newChannel
                .send(message)
                .then(msg => { return resolve((msg as discord.Message).id) })
                .catch(reject);
        });
    }
}