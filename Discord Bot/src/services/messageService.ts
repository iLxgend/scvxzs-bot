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

    public HandleMessageInTicketCategory(message: discord.Message) {

        // Get ticket channel id from channel name
        let ticketChannelId = ((message.channel as discord.TextChannel).name.toString().replace("ticket", "")).toString();

        // Check if content is equal to ?closeTicket
        if (message.content === "?closeTicket") {

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
                    }
                    else 
                    {
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
}