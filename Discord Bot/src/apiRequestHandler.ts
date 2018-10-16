const request = require('request');
import { IBotConfig } from './api'
import * as fs from 'fs'
import { resolve } from 'dns';

export class apiRequestHandler {

    private _headers = {
        'User-Agent': 'DapperBot/0.0.1',
        'Content-Type': 'application/json',
        'Authorization': ``
    }

    public async RequestAPI(httpType: 'POST' | 'DELETE' | 'PUT' | 'PATCH' | 'GET' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE', data: any, requestUrl: string, config: IBotConfig) {

        this._headers.Authorization = `Bearer ${config.apiBearerToken}`;

        var options = {
            url: requestUrl,
            method: httpType,
            headers: this._headers,
            json: data
        }

        return await request(options, (error: any, response: any, body: any) => {
            console.log(response.statusCode);
            if (!error && response.statusCode == 200) {
                return body;
            }
            else if (response.statusCode == 401) {
                console.log(response.statusCode, error)
                return this.GenerateNewToken(options, config);
            }
            else if (response.statusCode == 403) {
                console.log("Unauthorized");
            }
        })
    }
    
    public async GenerateNewToken(first_options: any, config: IBotConfig) {
        return new Promise<apiBody>(async (resolve, reject) => {
            var options = {
                url: "https://api.dapperdino.co.uk/api/account/login",
                method: "POST",
                headers: this._headers,
                json: {
                    "Email": config.apiEmail,
                    "Password": config.apiPassword
                }
            }
            try {

                request(options, async (error: any, response: any, body: any) => {
                    if (!error && response.statusCode == 200) {
                        console.log(body);
                        config.apiBearerToken = body;
                        this.writeToFile(body);


                        this.retry(first_options)
                            .then(async opt => { return resolve(opt as apiBody); }
                            );
                        // Try the request again AFTER letting the bot login

                    } else {
                        // Something is wrong, maybe a wrong password 
                        console.error(`We tried to let the bot login but we got HTTP code:${response.statusCode}`);
                        if (body) {
                            console.log(`With body: ${body}`);
                        }
                    }
                }).then(async (a) => {
                    return resolve();
                });
            } catch (error) {

            }
        });

    }
    public async retry<apiBody>(previousOptions) {
        // Create new Promise
        return new Promise<apiBody>(
            // With a parameter thats a function that has 2 params: resolve,reject => resolve = returns OK, reject = ERROR
            async (resolve, reject) => {

                // Return the request
                return await request(previousOptions, (error: any, response: any, body: string) => {

                    // Refactor to file
                    let errorCodes: Array<Number> = new Array<Number>(404, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510);
                    let authCodes: Array<Number> = new Array<Number>(400, 401, 402, 403, 405, 406);

                    // Check for errors
                    if (!error &&

                        // error codes
                        errorCodes.indexOf(response.statusCode) < 0 &&

                        // auth
                        authCodes.indexOf(response.statusCode) < 0) {
                        
                        // let it resolve in an apiBody 
                        return resolve();
                    }
                    else if (!error && response.statusCode == 401) {
                        console.error("Not authenticated ");
                    }
                })
            })
    }

    public async writeToFile(config) {
        return new Promise(async (resolve, reject) => {
            await fs.writeFile("../bot.prod.json", JSON.stringify(config), (err) => {
                if (err) {
                    console.log(err);
                    return reject(err);
                } else {
                    resolve(true);
                }
            })
        });
    }

}


export interface iApiBody {
    data: any;
}
export class apiBody implements iApiBody {
    data: any;

}