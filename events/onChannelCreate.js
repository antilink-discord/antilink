import { Events, AuditLogEvent, PermissionFlagsBits } from 'discord.js';
import 'dotenv/config';
import { guild_channel_delete_log, guild_admin_frozen_log } from '../utils/guildLogs.js';
import Logger from '../utils/logs.js';
import { add_channel_delete_to_cache, channel_delete_cache_check } from '../utils/anticrashCaching.js';
import Guild from '../Schemas/guildSchema.js';

const lg = new Logger();
const GuildCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 хвилин

export default {
    name: Events.ChannelCreate,
    once: false,
    async execute(channel) {
        try {
            let cachedGuildData = GuildCache.get(channel.guild.id);

            if (!cachedGuildData || (Date.now() - cachedGuildData.timestamp) > CACHE_TTL) {
                const guildData = await Guild.findOne({ _id: channel.guild.id });
                if (guildData) {
                    cachedGuildData = { guildData, timestamp: Date.now() };
                    GuildCache.set(channel.guild.id, cachedGuildData);
                } else {
                    return;
                }
            }

            if (!cachedGuildData?.guildData?.antiCrashMode) return;

            let fetchedLogs;
            try {
                fetchedLogs = await channel.guild.fetchAuditLogs({
                    type: AuditLogEvent.ChannelCreate,
                    limit: 1,
                });
            } catch (error) {
                return lg.error('Помилка отримання логів аудиту', error);
            }

            const logEntry = fetchedLogs.entries.first();
            if (!logEntry || Date.now() - logEntry.createdTimestamp > 10_000) return;

            const executor = logEntry.executor;
            if (!executor) return console.log('❌ Не вдалося отримати користувача.');

            let member = channel.guild.members.cache.get(executor.id) || await channel.guild.members.fetch(executor.id).catch(() => null);
            if (!member) return;

            await guild_channel_delete_log(channel.guild.id, executor.id, channel.name);
            await add_channel_delete_to_cache(channel.guild, executor.id);

            const createCount = await channel_delete_cache_check(executor.id);
            if (createCount >= 3) {
                try {
                    await freezeUser(channel.guild, executor.id);
                } catch (error) {
                    lg.error('Помилка при спробі заморозити користувача', error);
                }

                if (!isTimedOut(member)) {
                    member.timeout(60_000).catch(() => {});
                }

                try {
                    await guild_admin_frozen_log(channel.guild.id, executor.id, createCount);
                } catch (error) {
                    lg.error('❌ Помилка відправлення вебхуку', error);
                }
            }

        } catch (error) {
            console.error('Помилка при обробці видалення каналу:', error);
        }
    },
};

function isTimedOut(member) {
    return !!(member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now());
}

async function freezeUser(guild, userId) {
    try {
        const member = await guild.members.fetch(userId);
        if (!member) {
            lg.info('Користувач не знайдений.');
            return;
        }

        // Отримуємо всі ролі, які мають адмінські права
        const adminRoles = member.roles.cache.filter(role => 
            role.permissions.has(PermissionFlagsBits.Administrator)
        );

        if (adminRoles.size === 0) {
            lg.warn(`⚠️ Користувач ${member.user.tag} не має адмінських ролей.`);
            return;
        }

        lg.info(`⏳ Заморожую ${member.user.tag}...`);

        // Видаляємо всі ролі з адмінськими правами
        try{
            if(adminRoles) {
                await member.roles.remove(adminRoles);
            }
            
        }catch(error) {
            try{
                if(member) {
                    await member.ban()
                }
            }catch(error) {
                lg.error('Не вдалось заблокувати користувача.')
            }
            
        }
        

        lg.success(`Користувач ${member.user.tag} успішно заморожений!`);

    } catch (error) {
        lg.error('❌ Помилка при замороженні користувача:', error);
    }
}
