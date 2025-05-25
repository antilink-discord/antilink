import { EmbedBuilder, Events } from "discord.js";
import "dotenv/config";
import Guild from "../Schemas/guildSchema.js";
import { sendJoinLogs } from "../utils/devLogs.js";
import Logger from "../utils/logs.js";
import texts from "../utils/texts.js";
import { get_lang } from "../utils/helper.js";
const lg = new Logger({ prefix: "Bot" });

export default {
  name: Events.GuildCreate,
  once: false,
  async execute(guild) {
    try {
      const client = guild.client;
      let guildData = await Guild.findOne({ _id: guild.id });

      if (guildData) {
        await sendJoinLogs(guild, client);
        return;
      }
      if (guild.preferredLocale == "uk") {
        if (guildData) {
          return;
        }
        guildData = new Guild({ _id: guild.id, language: "uk" });
        await guildData.save();
        await sendJoinLogs(guild, client);
        return;
      }

      guildData = new Guild({ _id: guild.id });

      await guildData.save();
      await sendJoinLogs(guild, client);

      const guildOwner = await guild.members.fetch(guild.ownerId);

      const lang = await get_lang(client, guild.id);
      const embed = new EmbedBuilder()
        .setTitle(texts[lang].joinmessage_title)
        .setColor("#4248fc") 
        .setDescription(texts[lang].joinmessage_description)
        .addFields({ name: texts[lang].joinmessage_social, value: `${texts[lang].joinmessage_site} https://antilink.pp.ua \n${texts[lang].joinmessage_support} https://discord.gg/Xx6mJfW5m3` });
      await guildOwner.send({ embeds: [embed] });
    } catch (error) {
      lg.error(error);
    }
  },
};

