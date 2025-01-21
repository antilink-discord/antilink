const { Events, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const Guild = require('../Schemas/guildSchema')
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID; // Ваш client ID
const guildId = process.env.GUILD_ID; // ID сервера (guild) для реєстрації команд

module.exports = {
    name: Events.GuildCreate,
    once: false,
    async execute(guild) {
        const client = guild.client
        let guildData = await Guild.findOne({ _id: guild.id})
        if(guildData) {
            console.log('Дані гільдії вже присутні в базі даних')
            await sendJoinLogs(guild, clien)
            return
        } else {
            guildData = new Guild({ _id: guild.id})
            console.log('Не знайшов гільдію в базі даних, додаю...')
            await guildData.save()
            await sendJoinLogs(guild, client)
        }
    }
}
async function sendJoinLogs(guild, client) {
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
            .setTitle('Вхід на сервер')
            .addFields(
                { name: 'Гільдія', value: `${guild.name} | \`\`${guild.id}\`\``, inline: true }
            )
            .setTimestamp();

        await devlogchannel.send({ embeds: [ExampleEmbed] });
    } catch (error) {
        console.error('Помилка у sendDevLogs:', error);
    }
}
