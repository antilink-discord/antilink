import { EmbedBuilder, WebhookClient } from 'discord.js';
import Guild from '../Schemas/guildSchema.js';
import { colors, get_lang } from '../utils/helper.js';
// import { channel_delete_cache_check } from './anticrashCaching.js'
import texts from './texts.js';
import Logger from './logs.js';
const lg = new Logger({ prefix: 'Bot' });

export async function guild_link_delete_log(message, user_id, channel_name) {
    try{
        
        const guildData = await Guild.findOne({ _id: message.guild.id });
        const guild_logchannel = guildData.logchannel;
        if (guild_logchannel) {
            const lang = await get_lang(message.client, message.guild.id);

            const webhook = new WebhookClient({ url: guild_logchannel });
            const IsWebhook = await webhook.fetch()
            lg.debug(IsWebhook)
            const log_embed = new EmbedBuilder()
                .setTitle(texts[lang].banned_link)

                .setColor(colors.WARNING_COLOR)
                .addFields(
                    { name: texts[lang].guild_logs_field_user, value: `<@${user_id}> || \`\`${user_id}\`\``, inline: true },
                    { name: texts[lang].message, value: `\`\`${message}\`\``, inline: false },

                );

            await webhook.send({ embeds: [log_embed] });
        }
    }catch(error) {
        lg.error(error)
    }
	
}

export async function guild_channel_delete_log(guild_id, user_id, channel_name) {
    try {
        const guildData = await Guild.findOne({ _id: guild_id });

        if (!guildData || !guildData.logchannel) return;
        
        const guild_logchannel = guildData.logchannel; // URL вебхука або ID каналу

        const webhook = new WebhookClient({ url: guild_logchannel });

        const log_embed = new EmbedBuilder()
            .setTitle('Підозріла дія')
            .setColor(colors.WARNING_COLOR)
            .addFields(
                { name: 'Тип:', value: `видалення каналу`, inline: true }, 
                { name: 'Видалив', value: `<@${user_id}>`, inline: true }, // Форматуємо ID як згадку
                { name: 'Канал', value: `#${channel_name}`, inline: false }
            )
            .setTimestamp();

        await webhook.send({ embeds: [log_embed] });
    } catch (error) {
        lg.error('Помилка під час надсилання логу про видалення каналу:', error);
    }
}

export async function guild_admin_frozen_log(guild_id, user_id, deleteCount) {
    try {
        const guildData = await Guild.findOne({ _id: guild_id });
        // const deletedChannelsCount = await channel_delete_cache_check(user_id)
        if (!guildData || !guildData.logchannel) return;
        
        const guild_logchannel = guildData.logchannel; // URL вебхука або ID каналу


        const webhook = new WebhookClient({ url: guild_logchannel });

        const log_embed = new EmbedBuilder()
            .setTitle('Звіт про протидію')
            .setColor(colors.ERROR_COLOR)
            .addFields(
                { name: 'Потенційний крашер', value: `<@${user_id}>`, inline: true }, 
                { name: 'Видалено каналів', value: `${deleteCount}` }
            )
            .setTimestamp();

        await webhook.send({ embeds: [log_embed] });
    } catch (error) {
        lg.error('Помилка під час надсилання логу про видалення каналу:', error);
    }
}

export async function guild_channel_create_log(guild_id, user_id, channel_name) {
    try {
        const guildData = await Guild.findOne({ _id: guild_id });
        if (!guildData || !guildData.logchannel) return;
        
        const webhook = new WebhookClient({ url: guildData.logchannel });

        const log_embed = new EmbedBuilder()
            .setTitle('Підозріла дія')
            .setColor(colors.WARNING_COLOR)
            .addFields(
                { name: 'Тип:', value: `створення каналу`, inline: true }, 
                { name: 'Створив', value: `<@${user_id}>`, inline: true }, 
                { name: 'Канал', value: `#${channel_name}`, inline: false }
            )
            .setTimestamp();

        await webhook.send({ embeds: [log_embed] });
    } catch (error) {
        lg.error('Помилка під час надсилання логу про створення каналу:', error);
    }
}


export async function guild_ban_log(message, user_id, channel_name) {
    try{
        const guildData = await Guild.findOne({ _id: message.guild.id });
        const guild_logchannel = guildData.logchannel;
        if (guild_logchannel) {
            const lang = await get_lang(message.client, message.guild.id);
            const webhook = new WebhookClient({ url: guild_logchannel });
            const log_embed = new EmbedBuilder()
                .setTitle(texts[lang].guild_logs_member_banned)
                .setColor(colors.ERROR_COLOR)
                .setDescription(texts[lang].guild_logs_member_banned_description)
                .addFields(
                    { name: texts[lang].guild_logs_field_user, value: `<@${user_id}> || \`\`${user_id}\`\``, inline: true },
                    { name: texts[lang].guild_logs_field_channel, value: `${channel_name}`, inline: true },
                    { name: texts[lang].warns_reason, value: texts[lang].reason_three_warnings, inline: false },

                );

            await webhook.send({ embeds: [log_embed] });
        }
    }catch(error) {
        lg.error(error)
    }
	
}
