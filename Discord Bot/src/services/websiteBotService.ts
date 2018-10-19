import * as discord from 'discord.js'
import * as api from '../api'
import { compactDiscordUser } from '../models/compactDiscordUser';
import { apiRequestHandler } from '../handlers/apiRequestHandler';
import { email } from '../models/email';
import * as aspnet from '@aspnet/signalr';
import { faqMessage } from '../models/faq/faqMessage';

(<any>global).XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

export class websiteBotService {

    private _serverBot:discord.Client
    private _config:api.IBotConfig

    constructor(serverBot:discord.Client, config:api.IBotConfig) {
        this._serverBot = serverBot;
        this._config = config;        
    }

    startupService = ()=> {
        
        const connection = new aspnet.HubConnectionBuilder()
            .withUrl('https://dapperdino.co.uk/discordbothub')
            .configureLogging(aspnet.LogLevel.Debug)
            .build();

        connection.start()
            .then(() => console.log("t"))
            .catch(err => console.error(err.toString()));    

        connection.on("ReceiveMessage", (user, message) => {
            let testUser = this._serverBot.users.get(this.GetDiscordUserByUsername(user).DiscordId);
            if(testUser){
                testUser
                    .send(message)
                    .catch(console.error)
            }
        });

        connection.on("SuggestionUpdate", (suggestion) => {
            let testUser = this._serverBot.users.get(suggestion.discordUser.discordId);
            if(testUser){
                let suggestionUpdateEmbed = new discord.RichEmbed()
                    .setTitle("Your suggestion has been updated!")
                    .setColor("0xff0000")
                    .addField("Here you will find the information about your updated suggestion:", `https://dapperdino.co.uk/Client/Suggestion/${suggestion.id}`)
                    .addField("Thanks as always for being a part of the community, it means a lot", "")
                    .setFooter("With ❤ By the DapperCoding team")
                testUser.send(suggestionUpdateEmbed)
                    .catch(console.error)
            }
        });

        connection.on("FaqUpdate", async (faq) => {
            let faqChannel = this._serverBot.channels.get("461486560383336458");

            if(faqChannel ) {
                let channel = faqChannel as discord.TextChannel;
                let message = await channel.fetchMessage(faq.messageId) ;
                message
                .delete()
                .then(()=>{
                    let faqEmbed = new discord.RichEmbed()
                    .setTitle("-Q: " + faq.question)
                    .setDescription("-A: " + faq.answer)
                    .setColor("#2dff2d")
                    if(faq.resourceLink != null){
                        faqEmbed.addField("Useful Resource: ","[" + faq.resourceLink.displayName + "](" + faq.resourceLink.link + ")");
                    }
                    channel.send(faqEmbed).then((newMsg)=>this.SetFaqMessageId((newMsg as discord.Message).id, faq.id, this._config));
                })
                .catch(console.error);
            }
        });
    }

    private SetFaqMessageId(messageId: string, faqId: number, config: api.IBotConfig)
    {
        let faqMessageObject = new faqMessage();
        faqMessageObject.id = faqId;
        faqMessageObject.messageId = messageId;

        new apiRequestHandler().requestAPI("POST", faqMessageObject, 'https://api.dapperdino.co.uk/api/faq/AddMessageId', config)
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
            userObject.Username = user.username;
            userObject.DiscordId = user.id;
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
        userObject.Username = user.username;
        userObject.DiscordId = user.id;

        return userObject;
    }

    public GetDiscordUserByEmail(emailAddress:string){
        let emailObject = new email();
        emailObject.Email = emailAddress;
        let responseData = new apiRequestHandler().requestAPI("POST", emailObject, "https://dapperdinoapi.azurewebsites.net/api/search/user", this._config);
        console.log(responseData);
    }
}