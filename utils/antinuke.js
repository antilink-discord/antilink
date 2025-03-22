import Logger from './logs.js';
const lg = new Logger({ prefix: 'Bot' });

const CACHE_TTL = 10 * 1000;//

class CacheManager {
    constructor(ttl = CACHE_TTL) {
        this.ttl = ttl;
        this.cache = new Map();

        setInterval(() => this.cleanup(), this.ttl);
    }

    // 🔍 Перевірка кешу
    check(guildId, user_id) {
        try {
            const cacheKey = `${guildId}-${user_id}`;
            const cacheEntry = this.cache.get(cacheKey);
            
            // Якщо кеш існує і не вийшов термін TTL
            if (cacheEntry && (Date.now() - cacheEntry.timestamp) < this.ttl) {
                lg.debug(`Кеш для ${cacheKey} існує і має значення ${cacheEntry.count}`);
                return cacheEntry.count;
            }
    
            lg.debug(`Cache entry for ${cacheKey} is expired or does not exist.`);
            
            // Видалення кешу, якщо він застарілий
            this.cache.delete(cacheKey);
            
            return 0; // Якщо кеш відсутній або застарілий, повертаємо 0
        } catch (error) {
            lg.error(`❌ CacheManager.check: ${error}`);
        }
    }
    
    
    
    
    
    // ➕ Додавання в кеш
    add(guildId, user_id, limit, reason) {
        try {
            const cacheKey = `${guildId}-${user_id}`;
            let cacheEntry = this.cache.get(cacheKey);
    
            // Якщо кешу немає — створюємо новий запис
            if (!cacheEntry) {
                cacheEntry = { count: 0, timestamp: Date.now() };
                lg.debug(`Створено новий кеш для ${cacheKey}`);
            }
    
            // Оновлюємо лічильник
            const updated_count = cacheEntry.count + 1;
    
            // Якщо ліміт перевищено — видаляємо кеш
            if (updated_count >= limit) {
                lg.warn(`Ліміт досягнуто для ${cacheKey}, видаляю кеш`);
                this.cache.delete(cacheKey); // Якщо ліміт досягнуто, видаляємо кеш
                return;
            }
    
            // Оновлюємо кеш з новим лічильником та часовим міткою
            this.cache.set(cacheKey, { count: updated_count, timestamp: Date.now() });
            lg.debug(`Лічильник для ${cacheKey} оновлено до ${updated_count}`);
        } catch (error) {
            lg.error(`❌ CacheManager.add: ${error}`);
        }
    }
    
    
    
    

    // ❌ Видалення з кешу

    delete(guildId, user_id) {
        try {
            const cacheKey = `${guildId}-${user_id}`; // комбінуємо guildId та user_id
            if (this.cache.has(cacheKey)) {
                this.cache.delete(cacheKey);
                lg.info(`🗑 Видалено користувача ${user_id} з кешу гільдії ${guildId}`);
            } else {
                lg.warn(`🛑 Кеш для ${cacheKey} не знайдений.`);
            }
        } catch (error) {
            lg.error(`❌ CacheManager.delete: ${error}`);
        }
    }



    // ⏳ Автоочищення кешу
    cleanup() {
        const now = Date.now();
        for (const [cacheKey, cacheEntry] of this.cache) {
            lg.warn(`Перевірка кешу для ${cacheKey} з timestamp: ${cacheEntry.timestamp}`);
            
            const [guildId, user_id] = cacheKey.split('-');
            if (!guildId || !user_id) {
                lg.error(`❌ Некоректний формат cacheKey: ${cacheKey}`);
                continue; // Якщо формат ключа некоректний, пропустити його
            }
    
            // Перевірка терміну придатності кешу
            if ((now - cacheEntry.timestamp) >= this.ttl) {
                lg.warn(`Кеш для ${cacheKey} застарілий, видаляю.`);
                if (this.cache.has(cacheKey)) {
                    this.delete(guildId, user_id);  // Видаляємо кеш, якщо він ще не був видалений
                }
            }
        }
    }
    
    

}

// 🔹 **Використання класу для кешу створення та видалення каналів**
const channelDeleteCache = new CacheManager();
const channelCreateCache = new CacheManager();
const roleCreateCache = new CacheManager();
const roleDeleteCache = new CacheManager();

// Функції для роботи з кешем (для збереження інтерфейсу)
export const channel_delete_cache_check = (guildId, user_id) => channelDeleteCache.check(guildId, user_id);
export const add_channel_delete_to_cache = (guildId, user_id) => channelDeleteCache.add(guildId, user_id, 5, 'Анти-краш: масове видалення каналів');
export const delete_channel_delete_cache = (guildId, user_id) => channelDeleteCache.delete(guildId, user_id);

export const channel_create_cache_check = (guildId, user_id) => channelCreateCache.check(guildId, user_id);
export const add_channel_create_to_cache = (guildId, user_id) => channelCreateCache.add(guildId, user_id, 5, 'Анти-краш: масове створення каналів');
export const delete_channel_create_cache = (guildId, user_id) => channelCreateCache.delete(guildId, user_id);

export const add_role_delete_to_cache = (guildId, user_id) => roleDeleteCache.add(guildId, user_id, 5, 'Анти-краш: масове створення ролей');
export const check_role_delete_cache = (guildId, user_id) => roleDeleteCache.check(guildId, user_id);
export const delete_role_delete_cache = (guildId, user_id) => roleDeleteCache.delete(guildId, user_id);

export const add_role_create_to_cache = (guildId, user_id) => roleCreateCache.add(guildId, user_id, 5, 'Анти-краш: масове створення ролей');
export const check_role_create_cache = (guildId, user_id) => roleCreateCache.check(guildId, user_id);
export const delete_role_create_cache = (guildId, user_id) => roleCreateCache.delete(guildId, user_id);