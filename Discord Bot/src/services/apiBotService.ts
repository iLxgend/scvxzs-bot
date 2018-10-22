import * as discord from 'discord.js'
import * as api from '../api'
import { compactDiscordUser } from '../models/compactDiscordUser';
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { email } from '../models/email';
import * as aspnet from '@aspnet/signalr';
import { faqMessage } from '../models/faq/faqMessage';

(<any>global).XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

export class apiBotService {

    private _serverBot:discord.Client
    private _config:api.IBotConfig

    constructor(serverBot:discord.Client, config:api.IBotConfig) {
        this._serverBot = serverBot;
        this._config = config;        
    }

    startupService = ()=> {
        
        const connection = new aspnet.HubConnectionBuilder()
            .withUrl('https://api.dapperdino.co.uk/discordbothub')
            .configureLogging(aspnet.LogLevel.Debug)
            .build();

        connection.start()
            .then(() => console.log("t"))
            .catch(err => console.error(err.toString()));    

        connection.on("TicketReaction", async (reaction) => {
            
        });
    }

    public GetServerPopulation(){
        return this._serverBot.users.array().length;
    }

    public GetDiscordUserByUsername(username:string){
        let allUsers = this._serverBot.users.array();
        let user;
        for(let i = 0; i < allUsers.length; i++){

            if(allUsers[i].username == username){            
                user = allUsers[i];
                break;
            }
        }
        let userObject = new compactDiscordUser()
        if(user != null){
            userObject.username = user.username;
            userObject.discordId = user.id;
        }
        return userObject;
    }

    public GetDiscordUserById(id:string){
        let allUsers = this._serverBot.users.array();
        let user;
        for(let i = 0; i < allUsers.length; i++){
            if(allUsers[i].id == id){
                user = allUsers[i];
                break;
            }
        }
        let userObject = new compactDiscordUser()
        userObject.username = user.username;
        userObject.discordId = user.id;

        return userObject;
    }

    public GetDiscordUserByEmail(emailAddress:string){
        let emailObject = new email();
        emailObject.Email = emailAddress;
        let responseData = new apiRequestHandler().requestAPI("POST", emailObject, "https://dapperdinoapi.azurewebsites.net/api/search/user", this._config);
        console.log(responseData);
    }
}