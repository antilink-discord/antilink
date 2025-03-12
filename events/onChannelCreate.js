import { Events } from 'discord.js';
import 'dotenv/config';
import Logger from '../utils/logs.js';
import { add_channel_create_to_cache, channel_create_cache_check } from '../utils/anticrashCaching.js';
import Guild from '../Schemas/guildSchema.js';

const lg = new Logger();

const GuildCache = new Map();
const MemberCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 хвилин
const CREATE_LIMIT = 3; // Ліміт створень перед покаранням

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
                    if (guildData) {
                        cachedGuildData = { guildData, timestamp: Date.now() };
                        GuildCache.set(guildId, cachedGuildData);
                    } else {
                        return;
                    }
                }

                // if (!cachedGuildData?.guildData?.antiCrashMode) return;

                // Оновлюємо кеш створень + лог
                await Promise.all([
                    // guild_channel_create_log(guildId, channel.id, channel.name),
                    add_channel_create_to_cache(channel.guild, channel.id)
                ]);

                // Перевіряємо скільки каналів він створив
                const createCount = await channel_create_cache_check(channel.id);

                // Покарання тільки якщо перевищено ліміт
                if (createCount >= CREATE_LIMIT) {
                    await freezeUser(channel.guild, channel.id);
                    // await guild_channel_create_log(guildId, channel.id, createCount);
                }

            } catch (error) {
                console.error('❌ Помилка при обробці створення каналу:', error);
            }
        });
    },
};

// Функція для блокування порушника (timeout або ban замість кіка)
export async function freezeUser(guild, channelId) {
    try {
        const channel = guild.channels.cache.get(channelId);
        if (!channel) {
            lg.info('Канал не знайдений.');
            return;
        }

        // Якщо бот має право — даємо timeout на 10 хвилин
        if (channel.deletable) {
            await channel.delete('Антикраш: занадто багато створених каналів')
                .catch(e => lg.error('❌ Помилка при видаленні каналу:', e));

            lg.success(`❄️ Канал ${channel.name} був видалений!`);
        }
        // Якщо бот має право банити
        else if (guild.members.me.permissions.has('KICK_MEMBERS')) {
            await channel.delete({ reason: 'Антикраш: занадто багато створених каналів' })
                .catch(e => lg.error('❌ Помилка при бані:', e));

            lg.success(`🚨 Канал ${channel.name} забанений!`);
        }
        // Якщо бот не може нічого зробити
        else {
            lg.warn('❌ Бот не має прав для покарання каналу.');
        }

    } catch (error) {
        lg.error('❌ Помилка при замороженні каналу:', error);
    }
}
