const { Events, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const Guild = require('../Schemas/guildSchema')
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID; // Ваш client ID
const guildId = process.env.GUILD_ID; // ID сервера (guild) для реєстрації команд

module.exports = {
    name: Events.GuildDelete,
    once: false,
    async execute(guild) {
        try {
            const client = guild.client
            console.log('Client:'+ client)
            const guildData = await Guild.findOne({ _id: guild.id });
            if (!guildData) {
                console.log('Не знайдено даних про гільдію в базі даних');
                return;
            }

            console.log('Знайшов гільдію в базі даних, видаляю...');
            await guildData.deleteOne();

            // Виклик функції для надсилання логів
            //await sendDevLogs(guild, client);
        } catch (error) {
            console.error('Помилка у GuildDelete:', error);
        }
    }
};

async function sendDevLogs(guild, client) {
    try {
        const supportserverid = process.env.SUPPORT_SERVER_ID;
        const devchannellogs = process.env.DEV_LOGS_ID;

        if (!client || !client.guilds) {
            console.error('Об\'єкт client не переданий або client.guilds не існує!');
            return;
        }

        const support_server = await client.guilds.fetch(supportserverid);
        if (!support_server) {
            console.error(`Не вдалося знайти сервер із ID ${supportserverid}`);
            return;
        }

        const devlogchannel = await support_server.channels.fetch(devchannellogs);
        if (!devlogchannel) {
            console.error(`Не вдалося знайти канал із ID ${devchannellogs}`);
            return;
        }

        const ExampleEmbed = new EmbedBuilder()
            .setColor(0x427bff)
            .setTitle('Вихід з серверу')
            .addFields(
                { name: 'Гільдія', value: `${guild.name} | \`\`${guild.id}\`\``, inline: true }
            )
            .setTimestamp();

        await devlogchannel.send({ embeds: [ExampleEmbed] });
    } catch (error) {
        console.error('Помилка у sendDevLogs:', error);
    }
}
