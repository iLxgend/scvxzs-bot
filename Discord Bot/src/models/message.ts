export interface message {
    messageId: string;
    channelId: string;
    guildId: string;
    timeStamp: Date;
    isEmbed: boolean;
}

export class message implements message {
    
}