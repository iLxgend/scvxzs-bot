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

        let ticketChannelId = ((message.channel as discord.TextChannel).name.toString().replace("ticket", "")).toString();
        if (message.content == "?closeTicket") {

            new apiRequestHandler().requestAPIWithType<ticketReceive>('GET', null, `https://api.dapperdino.co.uk/api/ticket/${ticketChannelId}`, this._config)
                .then(ticketReceive => {
                    let ticketChannelUser = ticketReceive.applicant.discordId;

                    if(message.author.id == ticketChannelUser){
                        message.channel.delete();
                        new apiRequestHandler().requestAPI('POST', null, `https://api.dapperdino.co.uk/api/ticket/${ticketChannelId}/close`, this._config);
                    }
                    else{
                        message.delete(0);
                        let endTicketEmbed = new discord.RichEmbed()
                            .setTitle(`${message.author.username} thinks that this ticket can be closed now`)
                            .setThumbnail(message.author.avatarURL)
                            .setColor("#2dff2d")
                            .setDescription("If you agree that this ticket should be closed then please type the following command:\n__**?closeTicket**__")
                        message.channel.send(endTicketEmbed);
                    }
                })
                return;
        }
        let reaction = new ticketReaction();
        reaction.ticketId = parseInt(ticketChannelId);
        reaction.fromId = message.author.id;
        reaction.message = message.content;
        reaction.messageId = message.id;

        new apiRequestHandler().requestAPI('POST', reaction, 'https://api.dapperdino.co.uk/api/ticket/reaction', this._config);
    }
}