import * as discord from 'discord.js'
import * as api from '../api'
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { ticketReaction } from '../models/ticket/ticketReaction';

export class messageService {

    private _serverBot:discord.Client
    private _config:api.IBotConfig

    constructor(serverBot:discord.Client, config:api.IBotConfig) {
        this._serverBot = serverBot;
        this._config = config;        
    }

    public HandleMessageInTicketCategory(message: discord.Message) {

        let ticketChannelId = ((message.channel as discord.TextChannel).name.toString().replace("ticket", "")).toString();
        let ticketChannelUser;
        new apiRequestHandler().requestAPI('GET', null, `https://api.dapperdino.co.uk/api/ticket/${ticketChannelId}`, this._config)
        .then(ticketReceive => {
            
        })
        if(message.content == "?closeTicket")
        {
            //Add applicant check for deletion
            message.channel.delete();
            new apiRequestHandler().requestAPI('POST', null, `https://api.dapperdino.co.uk/api/ticket/${ticketChannelId}/close`, this._config);
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