require("dotenv").config();

const { REST } = require("@discordjs/rest")
const {GatewayIntentBits, Routes} = require("discord-api-types/v10")
const { Client, Intents, Collection} = require("discord.js");
const { Player } = require("discord-player");

const fs = require("node:fs");
const path = require("node:path");

const client = new Client({
  intents: [GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildVoiceStates]
});

//Loading commands
const commands = [];
client.commands = new Collection();

//Pulling command files from commands folder
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));


//Applying these commands to the client (discord bot)
for (const file of commandFiles){
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  console.log(file);
  console.log(filePath);
  console.log(command.data.name);

  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

client.player = new Player(client, {
  ytdlOptions: {
    quality: "highestaudio",
    highWaterMark: 1 << 25
  }
});

client.on("ready", () => {
  const guild_ids = client.guilds.cache.map(guild => guild.id);

  const rest = new REST({version: "9"}).setToken(process.env.TOKEN);
  for (const guildID of guild_ids){
    rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildID), {
      body: commands
    })
    .then(() => console.log(`Added commands to ${guildID}`)).catch(console.error);
  }

  console.log("Client is ready.");
});

client.on("interactionCreate", async interaction => {
  if(!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if(!command) return;

  try{
    await command.execute({client, interaction});
  }
  catch(err){
    console.log(err);
    await interaction.reply("An error occuring while executing that command.");
  }
});

client.login(process.env.TOKEN);
