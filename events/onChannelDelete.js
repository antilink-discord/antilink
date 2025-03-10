import { Events, AuditLogEvent } from 'discord.js';
import 'dotenv/config';
import { guild_channel_delete_log, guild_admin_frozen_log } from '../utils/guildLogs.js';
import Logger from '../utils/logs.js';
import { 
    add_channel_delete_to_cache, 
    channel_delete_cache_check
} from '../utils/anticrashCaching.js';
import Guild from '../Schemas/guildSchema.js';

const lg = new Logger();
const GuildCache = new Map();
const MemberCache = new Map();
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
                    if (guildData) {
                        cachedGuildData = { guildData, timestamp: Date.now() };
                        GuildCache.set(guildId, cachedGuildData);
                    } else {
                        return;
                    }
                }

                if (!cachedGuildData?.guildData?.antiCrashMode) return;

                // Отримуємо останній лог аудиту (видалення каналу)
                const fetchedLogs = await channel.guild.fetchAuditLogs({
                    type: AuditLogEvent.ChannelDelete,
                    limit: 1
                }).catch(() => null);

                if (!fetchedLogs) return;
                const logEntry = fetchedLogs.entries.first();
                if (!logEntry || Date.now() - logEntry.createdTimestamp > 5000) return;

                const executor = logEntry.executor;
                if (!executor) return lg.warn('❌ Не вдалося отримати користувача.');

                // Отримуємо учасника з кешу або Discord API
                let member = MemberCache.get(executor.id) || channel.guild.members.cache.get(executor.id);
                if (!member) {
                    member = await channel.guild.members.fetch(executor.id).catch(() => null);
                    if (member) MemberCache.set(executor.id, member);
                }

                if (!member) {
                    lg.warn('Немає учасника');
                    return;
                }
                if (channel.guild.ownerId === executor.id) {
                    lg.warn('Канал видалив власник гільдії');
                    return;
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

                    // Очищаємо кеш атакера після покарання
                    delete_channel_delete_cache(executor.id);
                }

            } catch (error) {
                console.error('❌ Помилка при обробці видалення каналу:', error);
            }
        });
    },
};

// Функція для блокування порушника (timeout або ban замість кіка)
export async function freezeUser(guild, userId) {
    try {
        const member = MemberCache.get(userId) || guild.members.cache.get(userId);
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
