import { Events } from "discord.js";
import "dotenv/config";
import Guild from "../Schemas/guildSchema.js";
import { sendLeaveLogs } from "../utils/devLogs.js";
import Logger from "../utils/logs.js";
const lg = new Logger({ prefix: "Bot" });

export default {
  name: Events.GuildDelete,
  once: false,

  async execute(guild) {
    lg.info("Виклик івенту guildDelete");
    try {
      const guildData = await Guild.findOne({ _id: guild.id });
      await sendLeaveLogs(guild);
      if (!guildData) {
        return;
      }

      await guildData.deleteOne();
    } catch (error) {
      lg.error("Помилка у GuildDelete:", error);
    }
  },
};
