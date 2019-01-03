import * as discord from 'discord.js';
import { ticketDialogueData } from '../dialogues/ticketDialogue';

export class channelhandler {

    private _guild: discord.Guild;

    constructor(guild: discord.Guild) {
        this._guild = guild;
    }

    /**
     * name: createChannelTicketCommand
     * description: Creates a ticket channel based on the ticket command
     * params:
     * - messageHandler: Function that's fired on each discordMessage
     * - discordMessage: Message by creator
     * - ticketId: Ticket id gotten from POST to API
     */
    public async createChannelTicketCommand(ticketId: number, message: discord.Message) {

        // Return new promise, contains the discord channel if it's resolved
        return new Promise<discord.Channel>(async (resolve, reject) => {

            //Find the role 'Admin'
            var adminRole = message.guild.roles.find((role) => role.name === "Admin");

            //Find the role 'Dapper Bot'
            var dapperRole = message.guild.roles.find((role) => role.name === "Dapper Bot");

            // Find category 'Tickets'
            var category = message.guild.channels.find((role) => role.name === 'Tickets') as discord.CategoryChannel;

            // Add category if not existing
            if (!category) await message.guild.createChannel('Tickets', 'category').then(p => category = p as discord.CategoryChannel);

            // Create channel for ticket
            return await message.guild.createChannel(`ticket${ticketId}`, 'text', [

                // Give ticket creator permissions to the channel
                {
                    id: message.author.id,
                    deny: ['MANAGE_MESSAGES'],
                    allow: ['READ_MESSAGE_HISTORY', "SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS"]
                },

                // Give admins access to the channel
                {
                    id: adminRole.id,
                    deny: [],
                    allow: ['READ_MESSAGE_HISTORY', "SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS", "MANAGE_MESSAGES"]
                },

                // Give Dapper Bot access to the channel
                {
                    id: dapperRole.id,
                    deny: [],
                    allow: ['READ_MESSAGE_HISTORY', "SEND_MESSAGES", "VIEW_CHANNEL", "EMBED_LINKS", "MANAGE_MESSAGES"]
                },
                
                // Deny other users
                {
                    id: message.guild.id,
                    deny: ['MANAGE_MESSAGES','SEND_MESSAGES', "VIEW_CHANNEL"],
                    allow: []
                }])

                // If ticket channel is created
                .then(async channel => {

                    // Set parent to the category channel
                    await channel.setParent(category);

                    let ticketChannelEmbed = new discord.RichEmbed()
                        .setTitle(`Hello ${message.author.username}, welcome to our Ticket managing service!`)
                        .setThumbnail("https://dapperdino.co.uk/images/dapperbot.png")
                        .setDescription("We have received your ticket and have notified all Happy-To-Help members.")
                        .setColor("#2dff2d")
                        .addField("Please be patient whilst waiting for a helper to respond.", "Once you have finished your discussion and your question has been answered please use the command:\n__**?closeTicket**__")
                        .addField("When your ticket is accepted you will be notified here", "Just remember to be patient and well mannered as these members are giving up their own time to help you")
                        .setFooter("In the meantime you can start explaining your problems here as the Happy-To-Help member will be able to read all messages in the channel when they join");

                    (channel as discord.TextChannel).send(ticketChannelEmbed);

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
     * - discordMessage = h2h-er accept discordMessage
     */
    public async addPermissionsToChannelTicketCommand(ticketId: number, message: discord.Message, embed: discord.RichEmbed) {

        // Find channel based on ticketId
        var channel = this._guild.channels.find((channel) => channel.name === `ticket${ticketId}`);

        // If channel is found
        if (channel) {

            // Add premissions to channel for h2h-er 
            channel.overwritePermissions(message.author, {
                "READ_MESSAGE_HISTORY": true,
                "SEND_MESSAGES": true,
                "VIEW_CHANNEL": true,
                "EMBED_LINKS": true,
            });

            (channel as discord.TextChannel).send(embed);

            //Create embed for helpers to know that the ticket is closed
            let inProgressEmbed = new discord.RichEmbed()
                .setTitle(`Ticket ${ticketId} has been accepted by ${message.member.displayName}!`)
                .setColor('#ffdd05')
                .setDescription(`Thank you for your time and efforts :)`)

            //If the user has a profile pic we will set it in the embed
            if (message.author.avatarURL != null) {
                inProgressEmbed.setThumbnail(message.author.avatarURL);
            }

            // Get completed tickets channel
            let inProgressChannel = this._guild.channels.find(channel => channel.name === "tickets-in-progress") as discord.TextChannel;

            if (!inProgressChannel) return ("Channel not found");

            //Send the embed to completed tickets channel
            inProgressChannel.send(inProgressEmbed)
        }
    }
}