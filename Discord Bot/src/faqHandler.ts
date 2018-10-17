import * as discord from 'discord.js';
import * as api from './api.js';
import { apiRequestHandler } from './apiRequestHandler';
import { faqMessage } from './models/faqMessage.js';
import { resolve } from 'url';
import { faq } from './models/faq.js';
import { receiveFaq } from './models/receiveFaq'

export class faqHandler {
    private _config: api.IBotConfig;

    constructor(config: api.IBotConfig) {
        this._config = config;
    }

    public async AddFaq(faqObject: faq){
        return new Promise<receiveFaq>(async(resolve, reject) => {
            
            return new apiRequestHandler().RequestAPI("POST", faqObject, 'https://api.dapperdino.co.uk/api/faq', this._config)
                .then((faqReturnObject) => {
                    let faqReturn = JSON.parse(JSON.stringify(faqReturnObject));
                    return resolve(faqReturn as receiveFaq);
                });
        })
    }
}