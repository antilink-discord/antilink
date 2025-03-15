import Logger from './logs.js';
import Guild from '../Schemas/guildSchema.js';
const lg = new Logger({ prefix: 'Bot' });

const CACHE_TTL = 10 * 60 * 1000; // 10 хвилин кешу

class GuildCacheManager {
    constructor(ttl = CACHE_TTL) {
        this.ttl = ttl;
        this.cache = new Map();

        setInterval(() => this.cleanup(), this.ttl);
    }

    // 🔍 Отримання даних з кешу або додавання, якщо його немає
    async check(guildId) {
        try {
            const cacheEntry = this.cache.get(guildId);
            if (cacheEntry && (Date.now() - cacheEntry.timestamp) < this.ttl) {
                return cacheEntry.guildData;
            }
            
            // Отримання даних з бази (або іншого джерела)
            const guildData = await fetchGuildData(guildId);
            if (guildData) {
                await this.add(guildId, guildData);
                return guildData;
            }
            
            return null;
        } catch (error) {
            lg.error(`❌ GuildCacheManager.check: ${error}`);
        }
    }

    // ➕ Додавання в кеш
    async add(guildId, guildData) {
        try {
            this.cache.set(guildId, { guildData, timestamp: Date.now() });
            lg.info(`✅ Додано в кеш гільдію ${guildId}`);
        } catch (error) {
            lg.error(`❌ GuildCacheManager.add: ${error}`);
        }
    }

    // ❌ Видалення з кешу
    delete(guildId) {
        try {
            if (this.cache.has(guildId)) {
                this.cache.delete(guildId);
                lg.info(`🗑 Видалено гільдію ${guildId} з кешу`);
            }
        } catch (error) {
            lg.error(`❌ GuildCacheManager.delete: ${error}`);
        }
    }

    // ⏳ Автоочищення кешу
    cleanup() {
        const now = Date.now();
        for (const [guildId, cacheEntry] of this.cache) {
            if ((now - cacheEntry.timestamp) >= this.ttl) {
                this.delete(guildId);
            }
        }
    }
}

// 🔹 **Створення екземпляра кешу для гільдій**
const guildCache = new GuildCacheManager();

// Функції для роботи з кешем
export const check_guild_cache = (guildId, fetchGuildData) => guildCache.check(guildId, fetchGuildData);
export const add_guild_to_cache = (guildId, guildData) => guildCache.add(guildId, guildData);
export const delete_guild_cache = (guildId) => guildCache.delete(guildId);

async function fetchGuildData(guildId) {
    return await Guild.findOne({ _id: guildId }).lean().catch(() => null);
}

export default fetchGuildData;
