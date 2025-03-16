import { Events, AuditLogEvent } from 'discord.js';
import 'dotenv/config';
import { guild_channel_delete_log, guild_admin_frozen_log } from '../utils/guildLogs.js';
import Logger from '../utils/logs.js';
import { 
    add_channel_delete_to_cache, 
    channel_delete_cache_check,
    delete_channel_delete_cache
} from '../utils/antinuke.js';
import { check_guild_cache } from '../utils/guildCache.js'
import Guild from '../Schemas/guildSchema.js';

const lg = new Logger();
const DELETE_LIMIT = 1; // Ліміт видалень перед покаранням
export default {
    name: Events.ChannelDelete,
    once: false,
    async execute(channel) {
        setImmediate(async () => {
            try {
                const guildId = channel.guild.id;

                const [cachedGuildData, guildData, fetchedLogs] = await Promise.all([
                    check_guild_cache(guildId),
                    Guild.findOne({ _id: guildId }),
                    channel.guild.fetchAuditLogs({
                        type: AuditLogEvent.ChannelDelete,
                        limit: 1
                    }).catch(() => null)
                ]);

                if (!cachedGuildData?.antiCrashMode) {
                    return lg.error('Немає даних для антикрашу.');
                }

                if (!fetchedLogs) {
                    lg.warn('Немає логів аудиту для цього видалення каналу.');
                    return;
                }

                const logEntry = fetchedLogs.entries.first();
                if (!logEntry || Date.now() - logEntry.createdTimestamp > 5000) {
                    lg.warn('Лог не знайдений або занадто старий.');
                    return;
                }

                const executor = logEntry.executor;
                if (!executor) {
                    lg.warn('❌ Не вдалося отримати користувача з логів.');
                    return;
                }

                let member = channel.guild.members.cache.get(executor.id) || await channel.guild.members.fetch(executor.id).catch(() => null);
                if (!member) {
                    lg.warn('Не вдалося отримати учасника.');
                    return;
                }

                const memberRoles = member.roles.cache;
                const whitelist_data = guildData?.antinuke_whitelist ?? [];
                
                const hasWhitelistedRole = memberRoles.some(role => whitelist_data.includes(role.id)) || member.id == channel.guild.ownerId;
                if (hasWhitelistedRole) {
                    lg.info('Користувач має дозволену роль, пропускаємо перевірку.');
                    return;
                }

                // Оновлюємо кеш видалень + лог
                await Promise.all([ 
                    guild_channel_delete_log(guildId, executor.id, channel.name),
                    add_channel_delete_to_cache(channel.guild, executor.id)
                ]);

                const deleteCount = await channel_delete_cache_check(executor.id);
                if (deleteCount > DELETE_LIMIT) {
                    if (!isTimedOut(member)) {
                        await freezeUser(channel.guild, executor.id);
                    }
                    await guild_admin_frozen_log(guildId, executor.id, deleteCount);
                    await delete_channel_delete_cache(executor.id);
                }

            } catch (error) {
                lg.error('❌ Помилка при обробці видалення каналу:', error);
            }
        });
    }
};

// Перевіряємо, чи користувач у тайм-ауті
const isTimedOut = member => member.communicationDisabledUntilTimestamp > Date.now();

// Функція для блокування порушника (timeout або ban замість кіка)
export async function freezeUser(guild, userId) {
    try {
        const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            lg.warn('Користувач не знайдений або вже покинув сервер.');
            return;
        }

        const timeoutDate = new Date();
        timeoutDate.setDate(timeoutDate.getDate() + 2);  // додаємо 2 дні
        if (!guild.members.me.permissions.has('KICK_MEMBERS')) {
            lg.warn('❌ Бот не має права кікати користувачів.');
            return;
        }

        if (member.roles.highest.position >= guild.members.me.roles.highest.position) {
            lg.warn('❌ Бот не може кікнути цього користувача, оскільки його роль вища або рівна.');
            return;
        }

        try {
            await member.ban({ reason: 'Антикраш: занадто багато видалень каналів' });
            console.log(`✅ ${member.user.tag} був забанений.`);
        } catch (error) {
            console.error(`❌ Помилка при бані:`, error);
            
            if (error.code === 50013) {
                console.log('❌ Бот не має достатніх прав для бана.');
            } else if (error.code === 10007) {
                console.log('❌ Користувач вже покинув сервер.');
            } else if (error.code === 500) {
                console.log('❌ Внутрішня помилка Discord API. Спробуйте пізніше.');
            }
        }
    } catch (error) {
        lg.error('❌ Помилка при замороженні користувача:', error);
    }
}
