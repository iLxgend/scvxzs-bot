import { IBot, IBotCommand, IBotCommandHelp, IBotMessage, IBotConfig } from '../api'
import { getRandomInt } from '../utils'
import * as discord from 'discord.js'
import BaseCommand from '../baseCommand';
import snekfetch from 'snekfetch';

export default class MemeCommand extends BaseCommand {

    /**
     *
     */
    constructor() {
        super(/^\?meme/im);
        
    }

    public getHelp(): IBotCommandHelp {
        return { caption: '?meme', description: 'Sends a meme, can only be used in the #memes channel' }
    }

    public init(bot: IBot, dataPath: string): void { }


    public canUseInChannel(channel:discord.TextChannel): boolean {
        return channel.name.toLowerCase() === "memes";
    }
    
    public async process(msg: string, answer: IBotMessage, message: discord.Message, client: discord.Client, config: IBotConfig, commands: IBotCommand[]): Promise<void> {
        snekfetch.get('https://www.reddit.com/u/kerdaloo/m/dankmemer/top/.json?sort=top&t=day&limit=350').then(res => {
            // 1k later on?
            const post = res.body.data.children
                .filter(post => post.data.preview)[Math.floor(Math.random() * res.body.data.children.length)] // :v
            let memeEmbed = new discord.RichEmbed()
                //msg.channel.send({ embed: {
                .setTitle('memememememe')
                .setColor(this.colors[Math.floor(Math.random() * this.colors.length)])
                .setImage(post.data.url )
                .setTimestamp()
                .setFooter(`posted by ${post.data.author}`)
            message.channel.send(memeEmbed)
        
        })
    }

    private colors = [0x7d5bbe, 0xa3d3fe, 0x333333, 0x007acc, 0xf56154, 0xdc3522];
}