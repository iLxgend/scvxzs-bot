import * as discord from 'discord.js'
import * as api from '../api'
import { validationError } from '../errors';

export class dialogueHandler<T> {
    private _steps: dialogueStep<T>[] | dialogueStep<T>;
    private _data: T;
    private _currentStep:dialogueStep<T>;
    private _channel?: discord.TextChannel;

    /**
     *
     */
    constructor(steps: dialogueStep<T>[] | dialogueStep<T>, data: T) {

        this._steps = steps;        
        this._data = data;
        this._currentStep = Array.isArray(steps) ? steps[0] : steps;
    }

    public async getInput(channel: discord.TextChannel, user: discord.GuildMember, config: api.IBotConfig): Promise<T> {

        return new Promise<T>(async (resolve, reject) => {

            this._channel = channel;

           // Create array for single dialogueStep to prevent extra checks + coding
            if (!Array.isArray(this._steps)) {

                // Transform to array
                this._steps = [this._steps];
            }

            // Loop over each step
            for (const step of this._steps) {

                // Set current step
                this._currentStep = step;

                // Filter for current user
                const filter = m => (m.member == user);

                // later used for removing after reply from user
                let beforeM;

                // Send before message
                await channel.send(user + ", " + step.beforeMessage).then(newMsg => {
                    beforeM = newMsg;
                });
                
                // Handle callback + validation
                await this.handleCallback(filter);

                // Remove messages
                beforeM.delete(0);

            }

            return resolve(this._data);
        });
    }

    public async handleCallback(filter) {
        if(this._channel == null)
        {
            return;
        }

        await this._channel.awaitMessages(filter, { max: 1 })
            .then(async collected => {

                // Get message
                let response = collected.array()[0];

                // Try callback
                await this._currentStep.callback(response, this._currentStep.stepData)

                    // Everything went okay
                    .then(e => {

                        // Add step data
                        this._data = e;
                    })

                    // Whoops, error
                    .catch(async e => {

                        // Check for validation errors
                        if (e instanceof validationError) {

                            if(this._channel != null)

                            // Send validation error
                            this._channel.send(e.message);

                            // Retry step
                            await this.handleCallback(filter);
                        }

                        console.error(e)
                    });

                //response.delete(0);
            })
            .catch(collected => {

                // ERROR
                console.log(console.error(collected))
                if(this._channel!= null)
                this._channel.send(this._currentStep.errorMessage);
            });

    }

    private d (){}
}

export class dialogueStep<E> implements dialogueStep<E> {
    /**
     *
     */
    constructor(stepData: E, callback: (response: any, data: E) => Promise<E>, beforeMessage: string, succeedMessage?: string, errorMessage?: string) {
        this.beforeMessage = beforeMessage;
        this.succeedMessage = succeedMessage;
        this.errorMessage = errorMessage;
        this.callback = callback;
        this.stepData = stepData;
    }
}

export interface dialogueStep<E> {
    callback: (response: any, data: E) => Promise<E>;
    stepData: E;
    beforeMessage: string;
    succeedMessage?: string;
    errorMessage?: string;
}
