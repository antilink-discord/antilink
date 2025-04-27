import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("servers")
  .setDescription("Отримати список серверів, де є бот");

export async function execute(interaction) {
  if (
    interaction.guild.id === "1350582961904550022" &&
    interaction.user.id === "558945911980556288"
  ) {
    const guilds = interaction.client.guilds.cache
      .map(
        (guild) =>
          `- ${guild.name} (ID: ${guild.id}) - owner: ${guild.ownerId}`,
      )
      .join("\n");

    await interaction.reply({
      content:
        guilds.length > 0
          ? `Бот знаходиться на наступних серверах:\n${guilds}`
          : "Бот не знаходиться на жодному сервері.",
      ephemeral: true,
    });
  } else {
    await interaction.reply({
      content: "У вас немає доступу до цієї команди.",
      ephemeral: true,
    });
  }
}
