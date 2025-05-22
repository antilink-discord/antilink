import { Events } from "discord.js";
import "dotenv/config";
import Guild from "../Schemas/guildSchema.js";
import Logger from "../utils/logs.js";
const lg = new Logger({ prefix: "Bot" });

export default {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    lg.info("Виклик івенту GuildMemberAdd");
    try {
      const guildData = await Guild.findOne({ _id: member.guild.id });
      if (guildData?.verificationSystem?.isEnabled === true){
        const role = await member.guild.roles.fetch(guildData.verificationSystem.unvefivedRoleID);
        if (role) {
          await member.roles.add(role).catch(error => {
            lg.error(error);
          });
        }
      }
    } catch (error) {
      lg.error("Помилка у GuildDelete:", error);
    }
  },
};
