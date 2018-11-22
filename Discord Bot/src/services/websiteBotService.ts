import * as discord from 'discord.js'
import * as api from '../api'
import { compactDiscordUser } from '../models/compactDiscordUser';
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { email } from '../models/email';
import * as aspnet from '@aspnet/signalr';
import { faqMessage } from '../models/faq/faqMessage';
import { faqHandler } from '../handlers/faqHandler';

(<any>global).XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

export class websiteBotService {

    private _serverBot: discord.Client
    private _config: api.IBotConfig
    private _server: discord.Guild;

    constructor(serverBot: discord.Client, config: api.IBotConfig, server: discord.Guild) {
        this._serverBot = serverBot;
        this._config = config;
        this._server = server;
    }

    startupService = () => {

        // Creates connection to our website's SignalR hub
        const connection = new aspnet.HubConnectionBuilder()
            .withUrl('https://dapperdino.co.uk/discordbothub')
            .configureLogging(aspnet.LogLevel.Debug)
            .build();

        // Starts connection
        connection.start()
            .then(() => console.log("t"))
            .catch(err => console.error(err.toString()));

        // On 'ReceiveMessage' -> test method
        connection.on("ReceiveMessage", (user, message) => {
            let testUser = this._serverBot.users.get(this.GetDiscordUserByUsername(user).discordId);
            if (testUser) {
                testUser
                    .send(message)
                    .catch(console.error)
            }
        });

        // On 'SuggestionUpdate' -> fires when suggestion is updated on the website
        connection.on("SuggestionUpdate", (suggestion) => {

            // Get user that suggested this suggestion
            let suggestor = this._serverBot.users.get(suggestion.discordUser.discordId);

            // Check if found
            if (suggestor) {

                // Create suggestion embed
                let suggestionUpdateEmbed = new discord.RichEmbed()
                    .setTitle("Your suggestion has been updated!")
                    .setColor("0xff0000")
                    .addField("Here you will find the information about your updated suggestion:", `https://dapperdino.co.uk/Client/Suggestion/${suggestion.id}`)
                    .addField("Thanks as always for being a part of the community, it means a lot", "")
                    .setFooter("With ❤ By the DapperCoding team");

                // Send embed to suggestor
                suggestor.send(suggestionUpdateEmbed)
                    .catch(console.error)
            }
        });

        // On 'FaqUpdate' -> fires when faq is updated on the website
        connection.on("FaqUpdate", async (faq) => {

            // Get FAQ channel
            let faqChannel = this._serverBot.channels.get("461486560383336458");

            // If FAQ channel is found
            if (faqChannel) {

                // Get as text channel
                let channel = faqChannel as discord.TextChannel;

                // Try to find discordMessage with id of updated faq item
                let message = await channel.fetchMessage(faq.messageId);

                // Try to delete discordMessage, then add the updated version
                message
                    .delete()
                    .then(() => {

                        // Create faq embed
                        let faqEmbed = new discord.RichEmbed()
                            .setTitle("-Q: " + faq.question)
                            .setDescription("-A: " + faq.answer)
                            .setColor("#2dff2d")

                        // Check if resource link is present
                        if (faq.resourceLink != null) {

                            // Add resource link to faq embed
                            faqEmbed.addField("Useful Resource: ", "[" + faq.resourceLink.displayName + "](" + faq.resourceLink.link + ")");
                        }

                        // Send updated version of embed
                        channel
                            .send(faqEmbed)
                            .then((newMsg) => {
                                let handler = new faqHandler(this._config);
                                // Set FAQ discordMessage id in db through api when updated
                                handler.setFaqMessageId((newMsg as discord.Message), faq.id, this._config)
                            });
                    })
                    .catch(console.error);
            }
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
        emailObject.email = emailAddress;

        // Get response from api
        let responseData = new apiRequestHandler().requestAPI("POST", emailObject, "https://dapperdinoapi.azurewebsites.net/api/search/user", this._config);

        // Try to log data
        console.log(responseData);

        /// THIS METHOD NEEDS TO BE REFACTORED
    }
}