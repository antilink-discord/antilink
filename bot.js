import fs from "node:fs";
import path from "node:path";
import Logger from "./utils/logs.js";
import bodyParser from 'body-parser';
import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import express from 'express';
import { send_embed } from './utils/helper.js';
import mongoose from "mongoose";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";
import {
  enable_button,
  disable_button
} from './commands/guildCommands/setup.js';
import {
  verifyApiKey
} from './utils/middware.js';
const app = express();
app.use(bodyParser.json());

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
});


app.post('/send-embed/:guildId/:channelId', verifyApiKey, async (req, res) => {


  const { guildId, channelId } = req.params;
  const { lang, guildData } = req.body;

  try {
    await send_embed(client, lang, guildId, channelId, guildData);
    res.json({ status: 'ok' });
  } catch (err) {

    res.status(500).json({ error: err.message });
  }
});


app.post('/enable-button/:guildId/:channelId/:messageId/:param', verifyApiKey, async (req, res) => {
  const { guildId, channelId, messageId, param } = req.params;

  try {
    const guild = await client.guilds.fetch(guildId);

    if (param === 'true') {

      await enable_button(guild, channelId, messageId);

    } else if (param === 'false') {
      await disable_button(guild, channelId, messageId);

    } else {
      return res.status(400).json({ error: 'param must to be true or false' });
    }

    res.json({ status: 'ok' });
  } catch (err) {

    res.status(500).json({ error: err.message });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mongoURI = process.env.MONGODB_TOKEN;
const lg = new Logger({ prefix: "Bot" });

async function mongodbConnect(mongoURI) {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    lg.success("MongoDB підключено");
  } catch (error) {
    console.error("Помилка підключення до MongoDB:", error);
    process.exit(1);
  }
}

const token = process.env.TOKEN;


const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

async function loadEvents() {
  for (const file of eventFiles) {
    lg.success(`Івент ${file} завантажується`);
    const filePath = path.join(eventsPath, file);
    const fileURL = pathToFileURL(filePath).href;

    try {
      const event = await import(fileURL);
      if (event.default.once) {
        client.once(event.default.name, (...args) =>
          event.default.execute(...args),
        );
      } else {
        client.on(event.default.name, (...args) =>
          event.default.execute(...args),
        );
      }
    } catch (error) {
      lg.error(`Помилка під час імпорту ${file}:`, error);
    }
  }
}


app.listen(3000, () => {
  console.log('API Server running on port 3000');
});

async function start_bot(client, token, mongoURI) {
  try {
    await loadEvents();
    await mongodbConnect(mongoURI);
    await client.login(token);
  } catch (error) {
    lg.error("Виникла помилка при спробі запустити бота(start_bot):", error);
    return;
  }
}

start_bot(client, token, mongoURI);
