import * as discord from 'discord.js';
import * as api from '../api';
import { apiRequestHandler } from './apiRequestHandler';
import { faqMessage } from '../models/faq/faqMessage';
import { resolve } from 'url';
import { faq } from '../models/faq/faq';
import { receiveFaq } from '../models/faq/receiveFaq'

export class faqHandler {
    private _config: api.IBotConfig;

    constructor(config: api.IBotConfig) {
        this._config = config;
    }

    // Create new faq item by using the API
    public async addFaq(faqObject: faq) {

        // Create new promise
        return new Promise<receiveFaq>(async (resolve, reject) => {

            // Return finished request 
            return new apiRequestHandler()
                .requestAPIWithType<receiveFaq>("POST", faqObject, 'https://api.dapperdino.co.uk/api/faq', this._config)
                .then((faqReturnObject) => {
                    return resolve(faqReturnObject);
                })
                .catch(err => { 
                    return reject(err); 
                });
        })
    }
}