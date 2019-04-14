import * as discord from "discord.js";
import { RichEmbed } from "discord.js";
import * as path from "path";
import { IBot, IBotCommand, IBotConfig, ILogger } from "./api";
import { BotMessage } from "./message";
import { websiteBotService } from "./services/websiteBotService";
import { xpHandler } from "./handlers/xpHandler";
import * as fs from "fs";
import { MissingChannelIdError } from "./errors";
import { messageService } from "./services/messageService";
import { apiBotService } from "./services/apiBotService";
import { channelhandler } from "./handlers/channelHandler";
import { inDialogue } from "./models/inDialogue";

export class Bot implements IBot {
  public get commands(): IBotCommand[] {
    return this._commands;
  }

  public get logger() {
    return this._logger;
  }

  public get allUsers() {
    return this._client
      ? this._client.users.array().filter(i => i.id !== "1")
      : [];
  }

  public get onlineUsers() {
    return this.allUsers.filter(i => i.presence.status !== "offline");
  }

  private readonly _commands: IBotCommand[] = [];
  private _client!: discord.Client;
  private _config!: IBotConfig;
  private _logger!: ILogger;
  private _botId!: string;
  private _server!: discord.Guild;
  private _welcomeChannel!: discord.TextChannel;
  private _reportChannel!: discord.TextChannel;
  private _kicksAndBansChannel!: discord.TextChannel;
  private _faqChannel!: discord.TextChannel;
  private _ticketsToAcceptChannel!: discord.TextChannel;
  private _ticketsInProgressChannel!: discord.TextChannel;
  private _completedTicketsChannel!: discord.TextChannel;
  private _websiteBotService!: websiteBotService;
  private _apiBotService!: apiBotService;
  private _messageService!: messageService;
  private _xpHandler!: xpHandler;
  private _hasApiConnection: boolean = false;

  public getServer() {
    return this._server;
  }

  public start(
    logger: ILogger,
    config: IBotConfig,
    commandsPath: string,
    dataPath: string
  ) {
    this._logger = logger;
    this._config = config;
    this._server;
    this._welcomeChannel;
    this._reportChannel;
    this._kicksAndBansChannel;
    this._faqChannel;

    // Load all commands
    this.loadCommands(commandsPath, dataPath);

    // Missing discord token
    if (!this._config.token) {
      throw new Error("invalid discord token");
    }

    // Create new instance of discord client
    this._client = new discord.Client();

    let getClient = () => {
      return this._client;
    };

    let getConfig = () => {
      return this._config;
    };

    // Automatically reconnect if the bot disconnects due to inactivity
    this._client.on("disconnect", function(erMsg, code) {
      console.log(
        "----- Bot disconnected from Discord with code",
        code,
        "for reason:",
        erMsg,
        "-----"
      );

      let client = getClient();
      let config = getConfig();

      client.login(config.token);
    });

    // Automatically reconnect if the bot errors
    this._client.on("error", function(error) {
      console.log(`----- Bot errored ${error} -----`);

      let client = getClient();
      let config = getConfig();

      client.login(config.token);
    });

    // On ready event from bot
    this._client.on("ready", () => {
      // Bot is now ready
      this._logger.info("started...");

      // Add bot id to main logic
      this._botId = this._client.user.id;

      // If game variable is set in config files(bot.json/bot.prod.json)
      if (this._config.game) {
        // Set game status of bot
        this._client.user.setGame(this._config.game);
      } else {
        // Default
        this._client.user.setActivity("?commands | With Dapper Dino", {
          type: "PLAYING"
        });
      }

      // Check if username is set in config files
      if (
        this._config.username &&
        this._client.user.username !== this._config.username
      ) {
        // Set username of bot
        this._client.user.setUsername(this._config.username);
      }

      // Set status to online
      this._client.user.setStatus("online");

      // Get server by id, from config files
      this._server = this._client.guilds.find(
        guild => guild.id === this._config.serverId
      );

      // Get commonly used channels from server
      this._welcomeChannel = this._server.channels.find(
        channel => channel.name === "welcome"
      ) as discord.TextChannel;
      this._faqChannel = this._server.channels.find(
        channel => channel.name === "f-a-q"
      ) as discord.TextChannel;
      this._reportChannel = this._server.channels.find(
        channel => channel.name === "reports"
      ) as discord.TextChannel;
      this._kicksAndBansChannel = this._server.channels.find(
        channel => channel.name === "kicks-and-bans"
      ) as discord.TextChannel;
      this._ticketsToAcceptChannel = this._server.channels.find(
        channel => channel.name === "tickets-to-accept"
      ) as discord.TextChannel;
      this._ticketsInProgressChannel = this._server.channels.find(
        channel => channel.name === "tickets-in-progress"
      ) as discord.TextChannel;
      this._completedTicketsChannel = this._server.channels.find(
        channel => channel.name === "completed-tickets"
      ) as discord.TextChannel;

      /*
            this._ticketsToAcceptChannel.send("Test accept channel");
            this._ticketsInProgressChannel.send("Test progress channel");
            this._completedTicketsChannel.send("Test completed channel");*/

      if (!this._hasApiConnection) {
        // Create new website bot service & startup
        this._websiteBotService = new websiteBotService(
          this._client,
          this._config,
          this._server
        );
        this._websiteBotService.startupService();

        // Create new api bot service & startup
        this._apiBotService = new apiBotService(
          this._client,
          this._config,
          this._server
        );
        this._apiBotService.startupService();

        this._hasApiConnection = true;
      }

      // Create new discordMessage service
      this._messageService = new messageService(this._client, this._config);

      // Create new xp handler
      this._xpHandler = new xpHandler(this._config);
    });

    // Fired when a user joins the server
    this._client.on("guildMemberAdd", async member => {
      // Check if we found the welcome channel
      if (this._welcomeChannel != null) {
        // Create welcome rules
        let welcomeEmbed = new discord.RichEmbed()
          .setTitle("Welcome " + member.user.username + "!")
          .setColor("#ff0000")
          .addField(
            "Information",
            "I've just sent you a PM with some details about the server, it would mean a lot if you were to give them a quick read."
          )
          .addField(
            "Thanks For Joining The Other " +
              member.guild.memberCount.toString() +
              " Of Us!",
            "Sincerely, your friend, DapperBot."
          );

        // Add image if user has avatar
        if (member.user.avatarURL != null) {
          welcomeEmbed.setImage(member.user.avatarURL);
        } else {
          welcomeEmbed.setImage(this._client.user.displayAvatarURL);
        }

        // Send welcome rules
        this._welcomeChannel.send(welcomeEmbed);
      } else {
        // Log new missing channel id error for the welcome channel
        let err = new MissingChannelIdError("welcome");
        err.log();
      }

      // Send rules intro text
      member.send(
        `Hello ${
          member.displayName
        }. Thanks for joining the server. If you wish to use our bot then simply use the command '?commands' in any channel and you'll recieve a pm with a list about all our commands. Anyway, here are the server rules:`
      );

      // Create & send rules embed
      let rules = new discord.RichEmbed()
        .addField(
          "Rule 1",
          "Keep the chat topics relevant to the channel you're using"
        )
        .addField(
          "Rule 2",
          "No harassing others (we're all here to help and to learn)"
        )
        .addField(
          "Rule 3",
          "No spam advertising (if there's anything you're proud of and you want it to be seen then put it in the showcase channel, but only once)"
        )
        .addField(
          "Rule 4",
          "Don't go around sharing other people's work claiming it to be your own"
        )
        .addField(
          "Rule 5",
          "You must only use ?report command for rule breaking and negative behaviour. Abusing this command will result if you being the one who is banned"
        )
        .addField(
          "Rule 6",
          "Don't private message Dapper Dino for help, you're not more privileged than the other hundreds of people here. Simply ask once in the relevant help channel and wait patiently"
        )
        .addField(
          "Rule 7",
          "Read the documentation before asking something that it tells you right there in the documentation. That's why someone wrote it all!"
        )
        .addField(
          "Rule 8",
          "Understand that Dapper Dino and the other helping members still have lives of their own and aren't obliged to help you just because they are online"
        )
        .addField(
          "Rule 9",
          "Be polite, there's nothing ruder than people joining and demanding help"
        )
        .addField(
          "Rule 10",
          "Finally, we are here to teach, not to copy and paste code for you to use. If we see you have a problem that isn't too difficult to need help with then we will expect you to figure it out on your own so you actually learn whilst possibly giving you some hints if needed"
        )
        .setThumbnail(this._client.user.displayAvatarURL)
        .setColor("0xff0000")
        .setFooter(
          "If these rules are broken then don't be surprised by a ban"
        );
      member.send(rules);

      // Send extra info
      member.send(
        "If you are happy with these rules then feel free to use the server as much as you like. The more members the merrier :D"
      );
      member.send(
        "Use the command '?commands' to recieve a PM with all my commands and how to use them"
      );
      member.send(
        "(I am currently being tested on by my creators so if something goes wrong with me, don't panic, i'll be fixed. That's it from me. I'll see you around :)"
      );

      // Add member to Member role
      member.addRole(member.guild.roles.find(role => role.name === "Member"));
    });

    // Fires when member leaves the server
    this._client.on("guildMemberRemove", async member => {
      // Check if welcome channel is found
      if (this._welcomeChannel != null)
        // Send discordMessage to welcome channel
        this._welcomeChannel.send(
          `${
            member.displayName
          }, it's a shame you had to leave us. We'll miss you :(`
        );
      else {
        // Send missing channel id error for welcome channel
        let err = new MissingChannelIdError("welcome");
        err.log();
      }
    });

    // Fires every time a member says something in a channel
    this._client.on("message", async message => {
      // Make sure that the bot isn't responding to itself
      if (message.author.id === this._botId) {
        return;
      }
      let a = Bot.isInDialogue(message.channel.id, message.author.id);
      if (a) return;

      // Message as clean text
      const text = message.cleanContent;

      // Log to console
      this._logger.debug(`[${message.author.tag}] ${text}`);

      // Check if discordMessage is NOT sent in dm
      if (message.channel.type !== "dm") {
        // Add xp
        this._xpHandler.IncreaseXpOnMessage(message);

        // Get ticket category
        let ticketCategory = message.guild.channels.find(
          category => category.name === "Tickets"
        ) as discord.CategoryChannel;

        // Check if discordMessage is sent in ticket category
        if ((message.channel as discord.TextChannel).parent == ticketCategory) {
          // Handle messages for tickets
          this._messageService.handleMessageInTicketCategory(message);
        }
      }

      // Handle commands
      this.handleCommands(text, message);
    });

    this._client.login(this._config.token);
  }

  private static dialogueUsers = new Array<inDialogue>();

  public static setIsInDialogue(
    channelId: string,
    userId: string,
    timestamp: Date
  ) {
    let ind = new inDialogue();

    ind.channelId = channelId;
    ind.userId = userId;
    ind.timestamp = timestamp;

    this.dialogueUsers.push(ind);
  }

  public static isInDialogue(channelId: string, userId: string) {
    let ind = this.dialogueUsers.find(
      x => x.userId == userId && x.channelId == channelId
    );
    return (
      ind != null &&
      new Date().getTime() - ind.timestamp.getTime() < 5 * 60 * 1000
    );
  }

  public static async removeIsInDialogue(channelId: string, userId: string) {
    return new Promise((resolve, reject) => {
      // Try to find in dialogue user
      let inDialogueUser = this.dialogueUsers.find(
        x => x.userId == userId && x.channelId == channelId
      );

      // Check if user is found
      if (inDialogueUser != null) {
        // Get index of user
        var index = this.dialogueUsers.indexOf(inDialogueUser);

        // Check if user is found
        if (index > -1) {
          // Remove user from list
          this.dialogueUsers.splice(index, 1);
        }

        // Reject the promise because we can't find the user
      } else return reject("");
    });
  }

  private async handleCommands(text: string, message: discord.Message) {
    // Check if discordMessage is a command
    for (const cmd of this._commands) {
      try {
        // Validate cmd regex, if not valid, go to the next cmd
        if (!cmd.isValid(text)) {
          continue;
        }

        // Validate roles
        if (!cmd.canUseCommand(message.member.roles.array())) {
          continue;
        }

        // Validate channel
        if (!cmd.canUseInChannel(message.channel as discord.TextChannel)) {
          continue;
        }

        // Create new bot discordMessage for our response
        const answer = new BotMessage(message.author);

        // Await processing of cmd
        await cmd.process(
          text,
          answer,
          message,
          this._client,
          this._config,
          this._commands,
          this._websiteBotService,
          this._server
        );

        // Check if response is valid
        if (answer.isValid()) {
          // Send text or embed
          message.channel
            .send(answer.text || { embed: answer.richText })
            .then(console.log)
            .catch(console.error);
        }
      } catch (ex) {
        // Log errors
        this._logger.error(ex);
      }
    }
  }

  // Loads all commands that have been registered
  private loadCommands(commandsPath: string, dataPath: string) {
    // Check if commands are existing in config files
    if (
      !this._config.commands ||
      !Array.isArray(this._config.commands) ||
      this._config.commands.length === 0
    ) {
      // If not, throw new error
      throw new Error("Invalid / empty commands list");
    }

    // Loop over all command names registerd in config files
    for (const commandName of this._config.commands) {
      // Require the command
      const commandClass = require(`${commandsPath}/${commandName}`).default;

      // Create new commandClass
      const command = new commandClass() as IBotCommand;

      // Initialize command
      command.init(this, path.resolve(`${dataPath}/${commandName}`));

      // Add to commands list
      this._commands.push(command);

      // Inform that command has been loaded
      this._logger.info(`command "${commandName}" loaded...`);
    }
  }
}
