import { Events, AuditLogEvent } from 'discord.js';
import 'dotenv/config';
import { guild_admin_frozen_log } from '../utils/guildLogs.js';
import Logger from '../utils/logs.js';
import { 
    add_role_create_to_cache, 
    check_role_create_cache
} from '../utils/antinuke.js';
import { check_guild_cache } from '../utils/guildCache.js';
import Guild from '../Schemas/guildSchema.js';
import { freezeUser } from './onChannelDelete.js'

const lg = new Logger();
const DELETE_LIMIT = 1; // Ліміт видалень перед покаранням

export default {
    name: Events.GuildRoleCreate,
    once: false,
    async execute(role) {
        lg.warn('Бачу створення ролі')
        setImmediate(async () => {
            try {
                const guildId = role.guild.id;

                const [cachedGuildData, guildData, fetchedLogs] = await Promise.all([
                    check_guild_cache(guildId),
                    Guild.findOne({ _id: guildId }),
                    role.guild.fetchAuditLogs({
                        type: AuditLogEvent.RoleCreate,
                        limit: 1
                    }).catch(() => null)
                ]);

                if (!cachedGuildData?.antiCrashMode) {
                    return lg.error('Немає даних для антикрашу.');
                }

                if (!fetchedLogs) {
                    lg.warn('Немає логів аудиту для цього видалення ролі.');
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

                let member = role.guild.members.cache.get(executor.id) || await role.guild.members.fetch(executor.id).catch(() => null);
                if (!member) {
                    lg.warn('Не вдалося отримати учасника.');
                    return;
                }

                const memberRoles = member.roles.cache;
                const whitelist_data = guildData?.antinuke_whitelist ?? [];
                
                const hasWhitelistedRole = memberRoles.some(role => whitelist_data.includes(role.id)) || member.id == role.guild.ownerId;
                if (hasWhitelistedRole) {
                    lg.info('Користувач має дозволену роль, пропускаємо перевірку.');
                    return;
                }

                // Оновлюємо кеш видалень + лог
                await Promise.all([ 
                    // role_delete_log(guildId, executor.id, role.name),
                    add_role_create_to_cache(guildId, executor.id)
                ]);

                const deleteCount = await check_role_create_cache(guildId, executor.id);
                lg.debug(deleteCount)
                if (deleteCount > DELETE_LIMIT) {
                    await freezeUser(role.guild, executor.id);
                    await guild_admin_frozen_log(guildId, executor.id, deleteCount);
                }

            } catch (error) {
                lg.error('❌ Помилка при обробці видалення ролі:', error);
            }
        });
    }
};