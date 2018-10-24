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

        // Creates connection to our API's SignalR hub
        const connection = new aspnet.HubConnectionBuilder()
            .withUrl('https://api.dapperdino.co.uk/discordbothub')
            .configureLogging(aspnet.LogLevel.Debug)
            .build();

        // Start connection
        connection.start()
            .then(() => console.log("t"))
            .catch(err => console.error(err.toString()));

        // On 'TicketCreated' -> fires when ticket is created through API
        connection.on("TicketCreated", async (ticket) => {
            
            // Get all members with happy to help (h2h) role
            let happyToHelpers = this.GetAllWithRole("Happy To Help");

            // Loop over all h2h-ers
            for(let i = 0; i < happyToHelpers.length; i++){

                // Create ticket embed
                let ticketEmbed = new discord.RichEmbed()
                    .setTitle("Ticket: " + ticket.subject + ", has been created")
                    //.setDescription(ticket.applicant.username + " is in need of help!")
                    .setColor('#ffdd05')
                    .addField("Their description:", ticket.description)
                    .addField("Thank you " + happyToHelpers[i].displayName + " for being willing to assist others in our server. If you would like to help with this request then please type:", "?acceptTicket " + ticket.id)
                    .setFooter("Thanks for all your help :)");

                // Send ticket embed to h2h-er
                happyToHelpers[i].send(ticketEmbed);
            }
        });

        // On 'TicketReaction' -> fires when ticket reaction has been added to an existing ticket
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

    // Get server population
    public GetServerPopulation() {

        // Return length of members array
        return this._server.members.array().length;
    }

    // Get discord user by username
    public GetDiscordUserByUsername(username: string) {

        // Try to find user by username
        let user = this._serverBot.users.find(user => user.username === username);

        // Create compact discord user
        let userObject = new compactDiscordUser()

        // Doesn't fill if user couldn't be found
        if (user != null) {

            // Fills userObject if user is found
            userObject.username = user.username;
            userObject.discordId = user.id;
        }

        // Returns compact discord user that's either empty or filled with the information gotten from the server
        return userObject;
    }

    // Get discord user by id
    public GetDiscordUserById(id: string) {

        // Try to find user by id    
        let user = this._serverBot.users.find(user => user.id === id);

        // Create compact discord user
        let userObject = new compactDiscordUser()

        // Doesn't fill if user couldn't be found
        if (user != null) {

            // Fills userObject if user is found
            userObject.username = user.username;
            userObject.discordId = user.id;
        }

        // Returns compact discord user that's either empty or filled with the information gotten from the server
        return userObject;
    }

    // Get discord user by email from API
    public GetDiscordUserByEmail(emailAddress: string) {

        // Create new Email object
        let emailObject = new email();

        // Add email address to it
        emailObject.Email = emailAddress;

        // Get response from api
        let responseData = new apiRequestHandler().requestAPI("POST", emailObject, "https://dapperdinoapi.azurewebsites.net/api/search/user", this._config);

        // Try to log data
        console.log(responseData);

        /// THIS METHOD NEEDS TO BE REFACTORED
    }
}