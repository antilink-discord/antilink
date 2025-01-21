const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const moment = require("moment");
require("moment-duration-format");
const { version } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),

    // Визначення execute з параметром client
    async execute(interaction) {
        // Перевіряємо, чи доступне uptime через переданий client
        const client = interaction.client
        if (!client.uptime) {
            return interaction.reply("На жаль, не вдалося отримати аптайм бота. Спробуйте ще раз.");
        }

        // Відправляємо повідомлення "Pinging..." і отримуємо його
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

        // Форматуємо uptime з переданого client
        const duration = moment.duration(client.uptime).format(" D [days], H [hrs], m [mins], s [secs]");

        // Створюємо ембед
        const ExampleEmbed = new EmbedBuilder()
            .setColor(0x427bff)
            .setTitle('⚙Статистика бота:')
            .addFields(
                { name: 'Пінг бота', value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`, inline: true },
                { name: 'Аптайм', value: `${duration}`, inline: true },
				{ name: 'Бібліотека', value: `\`\`discord.js v${version}\`\``, inline: false },
				{ name: 'Розробник', value: `Maksym_Tyvoniuk`, inline: false }
            )
            .setTimestamp();

        // Якщо вже є відповідь, редагуємо її
        if (interaction.replied) {
            await interaction.editReply({ content: '', embeds: [ExampleEmbed] });
        } else {
            await interaction.reply({ content: '', embeds: [ExampleEmbed] });
        }
    },
};
