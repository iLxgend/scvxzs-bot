const request = require('request');
import { IBotConfig } from './api'
import * as fs from 'fs'

export class apiRequestHandler {

    private _headers = {
        'User-Agent':        'DapperBot/0.0.1',
        'Content-Type':        'application/json',
        'Authorization':        ``
    }

    public async RequestAPI(httpType: 'POST'|'DELETE'|'PUT'|'PATCH'|'GET'|'HEAD'|'OPTIONS'|'CONNECT'|'TRACE', data: any, requestUrl: string, config: IBotConfig) {

        this._headers.Authorization = `Bearer ${config.apiBearerToken}`;

        var options = {
            url: requestUrl,
            method: httpType,
            headers: this._headers,
            json: data
        }
    
        await request(options, (error:any, response:any, body:any) => {
            console.log(response.statusCode);
            if (!error && response.statusCode == 200) {
                return body;
            }
            else if(response.statusCode == 401){
                console.log(response.statusCode, error)
                return this.GenerateNewToken(options, config);
            }
            else if(response.statusCode == 403){
                console.log("Unauthorized");
            }
        })
    }

    public async GenerateNewToken(first_options: any, config: IBotConfig) {

        var options = {
            url: "https://api.dapperdino.co.uk/api/account/login",
            method: "POST",
            headers: this._headers,
            json: {
                "Email": config.apiEmail,
                "Password": config.apiPassword
            }
        }

        await request(options, async (error:any, response:any, body:any) => {
            if (!error && response.statusCode == 200) {
                console.log(body);
                config.apiBearerToken = body;

                await fs.writeFile("../bot.prod.json", JSON.stringify(config), (err) =>{
                    if(err)
                    {
                        console.log(err);
                    }
                })

                // Try the request again AFTER letting the bot login
                await request(first_options, (error:any, response:any, body:any) =>{
                    if (!error && response.statusCode == 200) {
                        return body;
                    }
                    else if (!error && response.statusCode == 401) {
                        console.error("Not authenticated ");
                    }
                });
            } else {
                // Something is wrong, maybe a wrong password 
                console.error(`We tried to let the bot login but we got HTTP code:${response.statusCode}`);
                if (body) {
                    console.log(`With body: ${body}`);
                }
            }
        });
    }
}