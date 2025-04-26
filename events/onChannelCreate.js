import { Events, AuditLogEvent } from 'discord.js';
import 'dotenv/config';
import { guild_channel_create_log, guild_admin_frozen_log } from '../utils/guildLogs.js';
import Logger from '../utils/logs.js';
import { 
    add_channel_create_to_cache, 
    channel_create_cache_check
} from '../utils/antinuke.js';

import { freezeUser } from './onChannelDelete.js'
import Guild from '../Schemas/guildSchema.js';
import { check_guild_cache } from '../utils/guildCache.js'
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

                const cachedGuildData = await check_guild_cache(guildId)

                // lg.debug(cachedGuildData)
                if (!cachedGuildData?.antiCrashMode) {
                    return lg.error('Немає даних для антикрашу.');
                }

                // Отримуємо логи видалення каналу
                const [guildData, fetchedLogs] = await Promise.all([
                    Guild.findOne({ _id: channel.guild.id }),
                    channel.guild.fetchAuditLogs({
                      type: AuditLogEvent.ChannelCreate,
                      limit: 1
                    }).catch(() => null)
                  ]);

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

                // lg.debug(`member:`, member)
                if (!member) {
                    lg.warn('Не вдалося отримати учасника.');
                    return;
                }

                // Перевірка на дозволену роль
                const memberRoles = member.roles.cache; // Отримуємо ролі користувача

                const whitelist_data = guildData?.antinuke_whitelist ?? [];
                
                // lg.info(whitelist_data)
                // lg.info(`user_roles:`, memberRoles)
                
                const hasWhitelistedRole = memberRoles.some(role => whitelist_data.includes(role.id)) || member.id == channel.guild.ownerId;
                // lg.info('hasWhitelistedRole?', hasWhitelistedRole)

                if (hasWhitelistedRole) {
                    lg.info('Користувач має дозволену роль, пропускаємо перевірку.');
                    return; // Якщо має дозволену роль, пропускаємо виконання подальших дій
                } else {
                    lg.warn('Користувач не має дозволеної ролі.');
                }

                // Оновлюємо кеш видалень + лог
                await Promise.all([ 
                    guild_channel_create_log(guildId, executor.id, channel.name),
                    add_channel_create_to_cache(guildId, executor.id)
                ]);

                // Перевіряємо скільки каналів він видалив
                const deleteCount = await channel_create_cache_check(guildId, executor.id);
                lg.debug(deleteCount)
                // Покарання тільки якщо перевищено ліміт
                if (deleteCount > DELETE_LIMIT) {
                    if (!isTimedOut(member)) {
                        await freezeUser(channel.guild, executor.id);
                    }
                    await guild_admin_frozen_log(guildId, executor.id, deleteCount);

                }

            } catch (error) {
                console.error('❌ Помилка при обробці видалення каналу:', error);
            }
        });
    }
};

// Перевіряємо, чи користувач у тайм-ауті
const isTimedOut = member => member.communicationDisabledUntilTimestamp > Date.now();
