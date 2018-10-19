import * as discord from 'discord.js';

export class channelhandler {

    /**
     * name: createChannelTicketCommand
     * description: Creates a ticket channel based on the ticket command
     * params:
     * - messageHandler: Function that's fired on each message
     * - message: Message by creator
     * - ticketId: Ticket id gotten from POST to API
     */
    public async createChannelTicketCommand(ticketId: number, message: discord.Message) {

        // Return new promise, contains the discord channel if it's resolved
        return new Promise<discord.Channel>(async (resolve, reject) => {

            // Find category 'Tickets'
            var category = message.guild.channels.find('name', 'Tickets') as discord.CategoryChannel

            // Add category if not existing
            if (!category) await message.guild.createChannel('Tickets', 'category').then(p => category = p as discord.CategoryChannel);

            // Create channel for ticket
            return await message.guild.createChannel(`ticket${ticketId}`, 'text')
            
            // If ticket channel is created
            .then(async channel => {

                // Set parent to the category channel
                await channel.setParent(category);

                // Add permissions for creator
                channel.overwritePermissions(message.author, {
                    "READ_MESSAGE_HISTORY": true,
                    "SEND_MESSAGES": true,
                    "VIEW_CHANNEL": true,
                    "EMBED_LINKS": true,
                });

                // Add permissions for admins
                channel.overwritePermissions("admin", {
                    "READ_MESSAGE_HISTORY": true,
                    "SEND_MESSAGES": true,
                    "VIEW_CHANNEL": true,
                    "EMBED_LINKS": true,
                });


                // Remove permissions for everyone else
                channel.overwritePermissions(message.guild.id, {
                    "READ_MESSAGE_HISTORY": false,
                    "SEND_MESSAGES": false,
                    "VIEW_CHANNEL": false,
                });

                return resolve(channel);
            })
            
            // Catch errors for creating channel
            .catch((err) => {

                // Log and reject
                console.error(err); 
                return reject(err);
            });
        });
    }

    /**
     * name: addPermissionsToChannelTicketCommand
     * description: add permissions for this channel to the h2h-er that used ?acceptTicket {ticketId} 
     * params:
     * - ticketId = ticket id got from api/signalR
     * - message = h2h-er accept message
     */
    public async addPermissionsToChannelTicketCommand(ticketId: number, message: discord.Message) {

        // Find channel based on ticketId
        var channel = message.guild.channels.find('name', `ticket${ticketId}`);

        // If channel is found
        if (channel) {

            // Add premissions to channel for h2h-er 
            channel.overwritePermissions(message.author, {
                "READ_MESSAGE_HISTORY": true,
                "SEND_MESSAGES": true,
                "VIEW_CHANNEL": true,
                "EMBED_LINKS": true,
            });
        }
    }
}