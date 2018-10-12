export interface IMissingChannelIdError {
    channelName:string,
    log:Function;
}

export class MissingChannelIdError implements IMissingChannelIdError {
    
    channelName:string

    constructor(channelName: string) {
        this.channelName = channelName;
    }

    public log() {
        console.error(`Please input ${this.channelName} channel id to bot.prod.json`)
    }
}

export default MissingChannelIdError; 