import { faq } from "../models/faq/faq";
import { resourceLink } from "../models/faq/resourceLink";
import { dialogueStep, dialogueHandler } from "../handlers/dialogueHandler";
import * as discord from "discord.js";
import { faqHandler } from "../handlers/faqHandler";
import * as api from "../api";
import { faqMessage } from "../models/faq/faqMessage";
import { apiRequestHandler } from "../handlers/apiRequestHandler";

export class faqDialogue {


    
    private _config: api.IBotConfig;
    private _channel: discord.TextChannel;
    private _user: discord.GuildMember;

    /**
     * Create dialogue for faq
     */
    constructor(config: api.IBotConfig, channel:discord.TextChannel, user:discord.GuildMember) {
        this._config = config;
        this._channel=channel;
        this._user = user;
    }
    
    
    public addQuestion = (response: string, data: faq): Promise<faq> => {

        return new Promise<faq>((resolve, reject) => {

            try {

                data.question = response;

                return resolve(data);

            } catch (e) {

                return reject(e);
            }

        });
    };

    public addAnswer = (response: string, data: faq): Promise<faq> => {
        return new Promise<faq>((resolve, reject) => {

            try {

                data.answer = response;

                return resolve(data);

            } catch (e) {

                return reject(e);
            }
        });
    };

    public addFaqUrl = (response: string, data: faq): Promise<faq> => {
        return new Promise<faq>((resolve, reject) => {

            try {

                if (data.resourceLink == null) {
                    data.resourceLink = new resourceLink();
                }

                data.resourceLink.link = response;

                return resolve(data);

            } catch (e) {

                return reject(e);
            }
        });

    };

    public addFaqUrlMask = (response: string, data: faq): Promise<faq> => {
        return new Promise<faq>((resolve, reject) => {

            try {

                data.resourceLink.displayName = response;

                return resolve(data);

            } catch (e) {

                return reject(e);
            }
        });
    };

    public startUsefulResource = (response: string, data:faq ): Promise<faq> => {
        return new Promise<faq>(async (resolve, reject) => {
            let yeses = ["yes", "yea", "yeah", "ye", "y"];

            if (yeses.find(yes => response.toString().toLowerCase() == yes)) {

                let faqUrlStep: dialogueStep<faq> = new dialogueStep(data, this.addFaqUrl, "Enter URL:", "URL Successful", "URL Unsuccessful");
                let faqUrlMaskStep: dialogueStep<faq> = new dialogueStep(data, this.addFaqUrlMask, "Enter URL Mask:", "URL Mask Successful", "URL Mask Unsuccessful");
                let handler: dialogueHandler<faq> = new dialogueHandler<faq>([faqUrlStep, faqUrlMaskStep], data);

                return await handler.getInput(this._channel, this._user, this._config)
                    .then(d => { return resolve(d);})
                    .catch(reject);
            }
        });
    }

    public finalizeSteps = (data: faq, ticketuser: any) => {
        
        let faqEmbed = new discord.RichEmbed()
            .setTitle("-Q: " + data.question)
            .setDescription("-A: " + data.answer)
            .setColor("#2dff2d")

            if (data.resourceLink != null && data.resourceLink.link != null && data.resourceLink.displayName != null)
            faqEmbed.addField("Useful Resource: ", `["${data.resourceLink.displayName}"]("${data.resourceLink.link}")`);
            new faqHandler(this._config)
            .addFaq(data)
                .then(faqData => {
                    ((ticketuser as discord.GuildMember).guild.channels.get("461486560383336458") as discord.TextChannel)
                        .send(faqEmbed)
                        .then(newMsg => {
                            this.setFaqMessageId((newMsg as discord.Message).id, faqData.id);
                        });
                })
        

        return data;
    };

    private setFaqMessageId(messageId: string, faqId: number) {
        let faqMessageObject = new faqMessage();
        faqMessageObject.id = faqId;
        faqMessageObject.messageId = messageId;

        new apiRequestHandler().requestAPI("POST", faqMessageObject, 'https://api.dapperdino.co.uk/api/faq/AddMessageId', this._config)
    }
}