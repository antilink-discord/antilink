import { Events, AuditLogEvent } from 'discord.js';
import 'dotenv/config';
import { guild_channel_delete_log, guild_admin_frozen_log } from '../utils/guildLogs.js';
import Logger from '../utils/logs.js';
import { 
    add_channel_create_to_cache, 
    channel_create_cache_check
} from '../utils/antinuke.js';
import Guild from '../Schemas/guildSchema.js';

const lg = new Logger();

const GuildCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 хвилин
const DELETE_LIMIT = 3; // Ліміт видалень перед покаранням

export default {
    name: Events.ChannelCreate,
    once: false,
    async execute(channel) {
        setImmediate(async () => {
            try {
                const guildId = channel.guild.id;
                let cachedGuildData = GuildCache.get(guildId);

                // Перевіряємо кеш гільдії
                if (!cachedGuildData || (Date.now() - cachedGuildData.timestamp) > CACHE_TTL) {
                    const guildData = await Guild.findOne({ _id: guildId }).lean();
                    lg.debug('Звернення до бази даних, немає даних про гільдію');
                    if (guildData) {
                        cachedGuildData = { guildData, timestamp: Date.now() };
                        GuildCache.set(guildId, cachedGuildData);
                    } else {
                        return lg.error('Немає даних для цієї гільдії.');
                    }
                }

                lg.debug(cachedGuildData)
                if (!cachedGuildData?.guildData?.antiCrashMode) {
                     return lg.error('Немає даних для антикрашу.');
                 }

                // Отримуємо логи видалення каналу
                const fetchedLogs = await channel.guild.fetchAuditLogs({
                    type: AuditLogEvent.ChannelCreate,
                    limit: 1
                }).catch(() => null);

                if (!fetchedLogs) {
                    lg.warn('Немає логів аудиту для цього видалення каналу.');
                    return;
                }

                const logEntry = fetchedLogs.entries.first();
                if (!logEntry || Date.now() - logEntry.createdTimestamp > 5000) {
                    lg.warn('Лог не знайдений або занадто старий.');
                    return;
                }

                // Отримуємо executor (користувача, який видалив канал)
                const executor = logEntry.executor;
                if (!executor) {
                    lg.warn('❌ Не вдалося отримати користувача з логів.');
                    return;
                }

                // Отримуємо учасника, який виконав дію
                let member = channel.guild.members.cache.get(executor.id) || await channel.guild.members.fetch(executor.id).catch(() => null);

                lg.debug(`member:`, member)
                if (!member) {
                    lg.warn('Не вдалося отримати учасника.');
                    return;
                }

                // Перевірка на дозволену роль
                const memberRoles = member.roles.cache; // Отримуємо ролі користувача
                const guildData = await Guild.findOne({ _id: channel.guild.id });
                const whitelist_data = guildData?.antinuke_whitelist ?? [];
                
                lg.info(whitelist_data)
                lg.info(`user_roles:`, memberRoles)
                
                const hasWhitelistedRole = memberRoles.some(role => whitelist_data.includes(role.id)) || member.id == channel.guild.ownerId;
                lg.info('hasWhitelistedRole?', hasWhitelistedRole)

                if (hasWhitelistedRole) {
                    lg.info('Користувач має дозволену роль, пропускаємо перевірку.');
                    return; // Якщо має дозволену роль, пропускаємо виконання подальших дій
                } else {
                    lg.warn('Користувач не має дозволеної ролі.');
                }

                // Оновлюємо кеш видалень + лог
                await Promise.all([ 
                    guild_channel_delete_log(guildId, executor.id, channel.name),
                    add_channel_delete_to_cache(channel.guild, executor.id)
                ]);

                // Перевіряємо скільки каналів він видалив
                const deleteCount = await channel_create_cache_check(executor.id);

                // Покарання тільки якщо перевищено ліміт
                if (deleteCount >= DELETE_LIMIT) {
                    if (!isTimedOut(member)) {
                        await freezeUser(channel.guild, executor.id);
                    }
                    await guild_admin_frozen_log(guildId, executor.id, deleteCount);

                    
                    await delete_channel_create_cache(executor.id);
                }

            } catch (error) {
                console.error('❌ Помилка при обробці видалення каналу:', error);
            }
        });
    }
};

// Функція для блокування порушника (timeout або ban замість кіка)
export async function freezeUser(guild, userId) {
    try {
        const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
        if (!member) {
            lg.info('Користувач не знайдений.');
            return;
        }

        // Якщо бот має право — даємо timeout на 10 хвилин
        if (member.moderatable) {
            await member.timeout(10 * 60 * 1000, 'Антикраш: занадто багато видалень каналів')
                .catch(e => lg.error('❌ Помилка при таймауті:', e));

            lg.success(`❄️ Користувач ${member.user.tag} отримав таймаут!`);
        }
        // Якщо бот має право банити
        else if (guild.members.me.permissions.has('KICK_MEMBERS')) {
            await member.kick({ reason: 'Антикраш: занадто багато видалень каналів' })
                .catch(e => lg.error('❌ Помилка при бані:', e));

            lg.success(`🚨 Користувач ${member.user.tag} забанений!`);
        }
        // Якщо бот не може нічого зробити
        else {
            lg.warn('❌ Бот не має прав для покарання користувача.');
        }

    } catch (error) {
        lg.error('❌ Помилка при замороженні користувача:', error);
    }
}

// Перевіряємо, чи користувач у тайм-ауті
const isTimedOut = member => member.communicationDisabledUntilTimestamp > Date.now();
