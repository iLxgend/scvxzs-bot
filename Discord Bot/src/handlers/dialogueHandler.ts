import * as discord from 'discord.js'
import * as api from '../api'

export class dialogueHandler<T> {
    private _steps: dialogueStep<T>[] | dialogueStep<T>;
    private _data: T;

    /**
     *
     */
    constructor(steps: dialogueStep<T>[] | dialogueStep<T>, data: T) {
        this._steps = steps;
        this._data = data;
    }

    public async getInput(channel: discord.TextChannel, user: discord.GuildMember, config: api.IBotConfig): Promise<T> {

        return new Promise<T>(async (resolve, reject) => {

            // Create array for single dialogueStep to prevent extra checks + coding
            if (!Array.isArray(this._steps)) {

                // Transform to array
                this._steps = [this._steps];
            }

            // Loop over each step
            for (const step of this._steps) {

                // Filter for current user
                const filter = m => (m.member == user);


                let response, beforeM;

                channel.send(user + ", " + step.beforeMessage).then(newMsg => {
                    beforeM = newMsg;
                });

                channel.awaitMessages(filter, { max: 1 })
                    .then(collected => {
                        response = collected.array()[0];

                        step.callback(response, step.stepData)
                        .then(e => {
                            console.log(e);
                        })
                            .catch(e => {
                                console.error(e)
                            });
                        beforeM.delete(0);
                        response.delete(0);
                    })
                    .catch(collected => {
                        console.log(console.error(collected))
                        channel.send(step.errorMessage);
                    });
            }

            return this._data;
        });
    }
}

export class dialogueStep<E> implements dialogueStep<E> {
    /**
     *
     */
    constructor(stepData: E, callback: (response: string, data: E) => Promise<E>, beforeMessage: string, succeedMessage?: string, errorMessage?: string) {
        this.beforeMessage = beforeMessage;
        this.succeedMessage = succeedMessage;
        this.errorMessage = errorMessage;
        this.callback = callback;
        this.stepData = stepData;
    }
}

export interface dialogueStep<E> {
    callback: (response: string, data: E) => Promise<E>;
    stepData: E;
    beforeMessage: string;
    succeedMessage?: string;
    errorMessage?: string;
}
