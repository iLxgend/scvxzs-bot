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

    public async addFaq(faqObject: faq) {
        return new Promise<receiveFaq>(async (resolve, reject) => {

            return new apiRequestHandler().requestAPI("POST", faqObject, 'https://api.dapperdino.co.uk/api/faq', this._config)
                .then((faqReturnObject) => {
                    let faqReturn = JSON.parse(JSON.stringify(faqReturnObject));
                    return resolve(faqReturn as receiveFaq);
                })
                .catch(err => { return reject(err); });
        })
    }
}