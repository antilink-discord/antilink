import { Events, AuditLogEvent } from 'discord.js';
import 'dotenv/config';
import { /*guild_channel_create_log,*/ guild_admin_frozen_log } from '../utils/guildLogs.js';
import Logger from '../utils/logs.js';
import { add_channel_create_to_cache, channel_create_cache_check, delete_channel_create_cache } from '../utils/anticrashCaching.js';
import Guild from '../Schemas/guildSchema.js';
import { freezeUser } from './onChannelDelete.js';

const lg = new Logger();
const GuildCache = new Map();
const MemberCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 хвилин
const CREATE_LIMIT = 3; // Ліміт каналів перед покаранням

export default {
    name: Events.ChannelCreate,
    once: false,
    async execute(channel) {
        try {
            const guildId = channel.guild.id;
            let cachedGuildData = GuildCache.get(guildId);

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

            // Отримуємо аудиторні логи швидше
            const fetchedLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 }).catch(() => null);
            if (!fetchedLogs) return;

            const logEntry = fetchedLogs.entries.first();
            if (!logEntry || Date.now() - logEntry.createdTimestamp > 5000) return;

            const executor = logEntry.executor;
            if (!executor) return lg.warn('❌ Не вдалося отримати користувача.');

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
                lg.warn('Канал створив власник гільдії');
                return;
            }

            // Одночасно оновлюємо кеш та записуємо лог
            await Promise.all([
                // guild_channel_create_log(guildId, executor.id, channel.name),
                add_channel_create_to_cache(channel.guild, executor.id)
            ]);

            // Перевіряємо, скільки каналів користувач створив
            const createCount = await channel_create_cache_check(executor.id);

            if (createCount >= CREATE_LIMIT) {
                if (!isTimedOut(member)) {
                    await freezeUser(channel.guild, executor.id);
                }
                await guild_admin_frozen_log(guildId, executor.id, createCount);

                // Очищуємо кеш атакера після покарання
                delete_channel_create_cache(executor.id);
            }

        } catch (error) {
            console.error('❌ Помилка при обробці створення каналу:', error);
        }
    },
};

const isTimedOut = member => member.communicationDisabledUntilTimestamp > Date.now();
