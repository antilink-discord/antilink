import { Events, AuditLogEvent } from 'discord.js';
import 'dotenv/config';
import { guild_channel_delete_log, guild_admin_frozen_log } from '../utils/guildLogs.js';
import Logger from '../utils/logs.js';
import { 
    add_channel_delete_to_cache, 
    channel_delete_cache_check,
    delete_channel_delete_cache
} from '../utils/antinuke.js';
import Guild from '../Schemas/guildSchema.js';

const lg = new Logger();

const GuildCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 хвилин
const DELETE_LIMIT = 3; // Ліміт видалень перед покаранням

export default {
    name: Events.ChannelDelete,
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

                // Якщо гільдія має antiCrashMode увімкнений, здійснюємо додаткові дії
                if (!cachedGuildData?.guildData?.antiCrashMode) {
                    return lg.error('Немає даних для антикрашу.');
                }

                // Отримуємо логи видалення каналу
                const fetchedLogs = await channel.guild.fetchAuditLogs({
                    type: AuditLogEvent.ChannelDelete,
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
                const deleteCount = await channel_delete_cache_check(executor.id);

                // Покарання тільки якщо перевищено ліміт
                if (deleteCount >= DELETE_LIMIT) {
                    if (!isTimedOut(member)) {
                        await freezeUser(channel.guild, executor.id);
                    }
                    await guild_admin_frozen_log(guildId, executor.id, deleteCount);

                    await delete_channel_delete_cache(executor.id);
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
            lg.warn('Користувач не знайдений або вже покинув сервер.');
            return;
        }

        if (!guild.members.me.permissions.has('KICK_MEMBERS')) {
            lg.warn('❌ Бот не має права кікати користувачів.');
            return;
        }

        if (member.roles.highest.position >= guild.members.me.roles.highest.position) {
            lg.warn('❌ Бот не може кікнути цього користувача, оскільки його роль вища або рівна.');
            return;
        }

        await member.kick({ reason: 'Антикраш: занадто багато видалень каналів' })
            .then(() => lg.success(`🚨 Користувач ${member.user.tag} забанений!`))
            .catch(err => lg.error('❌ Помилка при бані:', err));

    } catch (error) {
        lg.error('❌ Помилка при замороженні користувача:', error);
    }
}