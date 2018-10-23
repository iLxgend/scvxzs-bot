import * as discord from 'discord.js'
import * as api from '../api'
import { compactDiscordUser } from '../models/compactDiscordUser';
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { email } from '../models/email';
import * as aspnet from '@aspnet/signalr';
import { faqMessage } from '../models/faq/faqMessage';

(<any>global).XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

export class apiBotService {

    private _serverBot: discord.Client
    private _config: api.IBotConfig
    private _server: discord.Guild

    constructor(serverBot: discord.Client, config: api.IBotConfig, server: discord.Guild) {
        this._serverBot = serverBot;
        this._config = config;
        this._server = server;
    }

    startupService = () => {

        const connection = new aspnet.HubConnectionBuilder()
            .withUrl('https://api.dapperdino.co.uk/discordbothub')
            .configureLogging(aspnet.LogLevel.Debug)
            .build();

        connection.start()
            .then(() => console.log("t"))
            .catch(err => console.error(err.toString()));

        connection.on("TicketCreated", async (ticket) => {
            let happyToHelpers = this.GetAllWithRole("Happy To Help");
            for(let i = 0; i < happyToHelpers.length; i++){
                let helpEmbed = new discord.RichEmbed()
                    .setTitle("Ticket: " + ticket.subject + ", has been created")
                    //.setDescription(ticket.applicant.username + " is in need of help!")
                    .setColor('#ffdd05')
                    .addField("Their description:", ticket.description)
                    .addField("Thank you " + happyToHelpers[i].displayName + " for being willing to assist others in our server. If you would like to help with this request then please type:", "?acceptTicket " + ticket.id)
                    .setFooter("Thanks for all your help :)")
                happyToHelpers[i].send(helpEmbed);
            }
        });

        connection.on("TicketReaction", async (reaction) => {

        });
    }

    public GetAllWithRole(requestedRole: string) {

        //Get all members in the server
        let allUsers = this._server.members.array();

        //Create an array to story all the members with the requested role
        let usersWithRole = new Array<discord.GuildMember>();

        //Loop through all the members in the server
        for (let i = 0; i < allUsers.length; i++) {

            //Check if any of their roles has the same name as the requested role
            if (allUsers[i].roles.find((role) => role.name === requestedRole)) {

                //Add that member to the list
                usersWithRole.push(allUsers[i]);
            }
        }

        //Return all the members that have the role
        return usersWithRole;
    }

    public GetServerPopulation() {
        return this._server.members.array().length;
    }

    public GetDiscordUserByUsername(username: string) {
        let allUsers = this._serverBot.users.array();
        let user;
        for (let i = 0; i < allUsers.length; i++) {

            if (allUsers[i].username == username) {
                user = allUsers[i];
                break;
            }
        }
        let userObject = new compactDiscordUser()
        if (user != null) {
            userObject.username = user.username;
            userObject.discordId = user.id;
        }
        return userObject;
    }

    public GetDiscordUserById(id: string) {
        let allUsers = this._serverBot.users.array();
        let user;
        for (let i = 0; i < allUsers.length; i++) {
            if (allUsers[i].id == id) {
                user = allUsers[i];
                break;
            }
        }
        let userObject = new compactDiscordUser()
        userObject.username = user.username;
        userObject.discordId = user.id;

        return userObject;
    }

    public GetDiscordUserByEmail(emailAddress: string) {
        let emailObject = new email();
        emailObject.Email = emailAddress;
        let responseData = new apiRequestHandler().requestAPI("POST", emailObject, "https://dapperdinoapi.azurewebsites.net/api/search/user", this._config);
        console.log(responseData);
    }
}