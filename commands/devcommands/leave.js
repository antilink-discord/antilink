import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("leave")
  .setDescription("Вийти з поточного сервера")
  .addStringOption((option) =>
    option
      .setName("guild_id")
      .setDescription("ID гільдії з якої потрібно вийти")
      .setRequired(true),
  );

export async function execute(interaction) {
  try {
    const guild = interaction.client.guilds.cache.get(
      interaction.options.getString("guild_id"),
    );

    await interaction.reply({
      content: `Бот виходить з сервера: ${guild.name}`,
      ephemeral: true,
    });
    await guild.leave();
  } catch (error) {
    console.log(error);
  }
}
