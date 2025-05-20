import { SlashCommandBuilder } from "@discordjs/builders";
import { EmbedBuilder, version } from "discord.js";
import moment from "moment";
import { get_lang } from "../../utils/helper.js";
import texts from "../../utils/texts.js";
import Logger from "../../utils/logs.js";
const lg = new Logger({ prefix: "Bot" });

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Переглянути статистику бота")
  .setDescriptionLocalizations({
    "en-US": 'Check bot statistic',
    "en-GB": 'Check bot statistic'
  });

export async function execute(interaction) {
  try {
    if (!interaction.client.uptime) {
      return interaction.reply(
        "На жаль, не вдалося отримати аптайм бота. Спробуйте ще раз.",
      );
    }

    const lang = await get_lang(interaction.client, interaction.guild.id);

    const duration = moment.duration(interaction.client.uptime);
    const uptime = `${duration.days()}d ${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`;
    const ping = interaction.client.ws.ping;

    const embed = new EmbedBuilder()
      .setColor(0x427bff)
      .setTitle(texts[lang].test)
      .addFields(
        { name: texts[lang].ping_field1, value: `${ping}`, inline: true },
        { name: texts[lang].ping_field2, value: `${uptime}`, inline: true },
        {
          name: texts[lang].ping_field3,
          value: `\`\`discord.js v${version}\`\``,
          inline: false,
        },
      )
      .setTimestamp();
    await interaction.reply({ content: "", embeds: [embed] });
  } catch (error) {
    lg.error("Помилка у виконанні команди /ping:", error);
  }
}
