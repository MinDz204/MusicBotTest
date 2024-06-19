const { Client, GatewayIntentBits, Collection, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Niizuki } = require("niizuki");
const { readdirSync } = require("fs");
const path = require("path");

class MusicBot extends Client {
  constructor() {
    super({
      allowedMentions: {
        repliedUser: false,
        parse: ["roles", "users", "everyone"],
      },
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });
    this.config = require("../config");
    this.settings = this.config.botSettings;
    this.embedColor = this.config.botSettings.embedColor;
    this.SlashCommands = new Collection();
    this.PrefixCommands = new Collection(); 
    this.ContextCommands = new Collection(); 

    this.manager = new Niizuki(this, this.config.nodes, {
      send: (payload) => {
        const guild = this.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
      },
      defaultSearchPlatform: "ytmsearch",
      reconnectTimeout: 600000,
      reconnectTries: 100,
    });

    // Load events
    readdirSync("./events/client/").forEach((file) => {
      const event = require(`../events/client/${file}`);
      let eventName = file.split(".")[0];
      this.on(event.name, (...args) => event.run(this, ...args));
    });

    // Load node events
    readdirSync("./events/node/").forEach((file) => {
      const event = require(`../events/node/${file}`);
      let eventName = file.split(".")[0];
      this.manager.on(eventName, event.bind(null, this));
    });

    // Load audio event
    readdirSync("./events/audio/").forEach((file) => {
      const event = require(`../events/audio/${file}`);
      let eventName = file.split(".")[0];
      this.manager.on(eventName, event.bind(null, this));
    });

    // Load slash commands
    readdirSync("./commands/slash/").forEach((dir) => {
      const slashCommandFiles = readdirSync(`./commands/slash/${dir}/`).filter((f) => f.endsWith(".js"));
      for (const file of slashCommandFiles) {
        const command = require(`../commands/slash/${dir}/${file}`);
        this.SlashCommands.set(command.name, command);
      }
    });

    // Load prefix commands
    readdirSync("./commands/prefix/").forEach((dir) => {
      const prefixCommandFiles = readdirSync(`./commands/prefix/${dir}/`).filter((f) => f.endsWith(".js"));
      for (const file of prefixCommandFiles) {
        const command = require(`../commands/prefix/${dir}/${file}`);
        this.PrefixCommands.set(command.name, command);
      }
    });

    // Load context menu commands
    // readdirSync("./commands/context").forEach((dir) => {
    //   const contextMenuFiles = readdirSync(`./commands/context/${dir}/`).filter((f) => f.endsWith(".js"));
    //   for (const file of contextMenuFiles) {
    //     const command = require(`../commands/context/${dir}/${file}`);
    //     this.ContextCommands.set(file.split(".")[0], command);
    //   }
    // });
  }

  async connect() {
    await this.registerSlashCommands(); // Register slash commands before logging in
    return super.login(this.config.bot.token);
  }

  async registerSlashCommands() {
    const rest = new REST({ version: '10' }).setToken(this.config.bot.token);
    
    const slashCommands = this.SlashCommands.map(command => ({
      name: command.name,
      description: command.description,
      options: command.options
    }));

    try {
      console.log('Started refreshing application (/) commands.');

      await rest.put(
        Routes.applicationCommands(this.config.bot.clientId),
        { body: slashCommands }
      );

      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = MusicBot;
