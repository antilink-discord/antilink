import Logger from './logs.js';
const lg = new Logger({ prefix: 'Bot' });

const CACHE_TTL = 10 * 60 * 1000; // 10 хвилин кешу

class CacheManager {
    constructor(ttl = CACHE_TTL) {
        this.ttl = ttl;
        this.cache = new Map();

        setInterval(() => this.cleanup(), this.ttl);
    }

    // 🔍 Перевірка кешу
    check(user_id) {
        try {
            const cacheEntry = this.cache.get(user_id);
            if (cacheEntry && (Date.now() - cacheEntry.timestamp) < this.ttl) {
                return cacheEntry.count;
            }
            this.cache.set(user_id, { count: 0, timestamp: Date.now() });
            return 0;
        } catch (error) {
            lg.error(`❌ CacheManager.check: ${error}`);
        }
    }

    // ➕ Додавання в кеш
    async add(guild, user_id, limit, reason) {
        try {
            lg.debug(user_id)
            let cacheEntry = this.cache.get(user_id);
            const updated_count = cacheEntry ? cacheEntry.count + 1 : 1;

            if (updated_count >= limit) {
                await guild.members.kick(user_id, { reason })
                    .catch(err => lg.error('❌ Помилка блокування користувача:', err));

                lg.success(`❌ Користувач <@${user_id}> забанений. Причина: ${reason}`);
                this.cache.delete(user_id);
                return;
            }

            this.cache.set(user_id, { count: updated_count, timestamp: Date.now() });
        } catch (error) {
            lg.error(`❌ CacheManager.add: ${error}`);
        }
    }

    // ❌ Видалення з кешу
    delete(user_id) {
        try {
            if (this.cache.has(user_id)) {
                this.cache.delete(user_id);
                lg.info(`🗑 Видалено користувача ${user_id} з кешу`);
            }
        } catch (error) {
            lg.error(`❌ CacheManager.delete: ${error}`);
        }
    }

    // ⏳ Автоочищення кешу
    cleanup() {
        const now = Date.now();
        for (const [user_id, cacheEntry] of this.cache) {
            if ((now - cacheEntry.timestamp) >= this.ttl) {
                this.delete(user_id);
            }
        }
    }
}

// 🔹 **Використання класу для кешу створення та видалення каналів**
const channelDeleteCache = new CacheManager();
const channelCreateCache = new CacheManager();
const roleUpdateCache = new CacheManager();

// Функції для роботи з кешем (для збереження інтерфейсу)
export const channel_delete_cache_check = (user_id) => channelDeleteCache.check(user_id);
export const add_channel_delete_to_cache = (guild, user_id) => channelDeleteCache.add(guild, user_id, 5, 'Анти-краш: масове видалення каналів');
export const delete_channel_delete_cache = (user_id) => channelDeleteCache.delete(user_id);

export const channel_create_cache_check = (user_id) => channelCreateCache.check(user_id);
export const add_channel_create_to_cache = (guild, user_id) => channelCreateCache.add(guild, user_id, 5, 'Анти-краш: масове створення каналів');
export const delete_channel_create_cache = (user_id) => channelCreateCache.delete(user_id);

export const add_role_update_to_cache = (guild, user_id) => roleUpdateCache.add(guild, user_id, 5, 'Анти-краш: масове створення ролей');
export const check_role_update_cache = (guild, user_id) => roleUpdateCache.check(user_id);
export const delete_role_update_cache = (guild, user_id) => roleUpdateCache.delete(user_id);