import User from '../Schemas/userSchema.js';
import Logger from './logs.js';
const lg = new Logger({ prefix: 'Bot' });

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

class WarnsCacheManager {
    constructor(ttl = CACHE_TTL) {
        this.ttl = ttl;
        this.cache = new Map();

        setInterval(() => this.cleanup(), this.ttl);
    }

    
    async check(user_id, message) {
        try {
            const cacheEntry = this.cache.get(user_id);
            

            if (cacheEntry && (Date.now() - cacheEntry.timestamp) < this.ttl) {
                lg.debug(`Кеш попереджень для ${user_id} існує і має значення ${cacheEntry.warns}`);
                return cacheEntry.warns;
            }
    
            lg.debug(`Cache entry for ${user_id} is expired or does not exist.`);
            
            
            const userData = await User.findOne({ _id: user_id });
            const warns = userData ? userData.warns : 0;
            
            
            this.cache.set(user_id, { warns, timestamp: Date.now() });
            
            return warns;
        } catch (error) {
            lg.error(`❌ WarnsCacheManager.check: ${error}`);
            throw error;
        }
    }
    
    
    add(user_id) {
        try {
            const cacheEntry = this.cache.get(user_id);
            const updated_warns = cacheEntry ? cacheEntry.warns + 1 : 1;

            this.cache.set(user_id, { warns: updated_warns, timestamp: Date.now() });
            lg.debug(`Лічильник попереджень для ${user_id} оновлено до ${updated_warns}`);
        } catch (error) {
            lg.error(`❌ WarnsCacheManager.add: ${error}`);
        }
    }
    
    
    delete(user_id) {
        try {
            if (this.cache.has(user_id)) {
                this.cache.delete(user_id);
                lg.info(`🗑 Видалено попередження користувача ${user_id} з кешу`);
            } else {
                lg.warn(`🛑 Кеш попереджень для ${user_id} не знайдений.`);
            }
        } catch (error) {
            lg.error(`❌ WarnsCacheManager.delete: ${error}`);
        }
    }

    
    cleanup() {
        const now = Date.now();
        for (const [user_id, cacheEntry] of this.cache) {
            if ((now - cacheEntry.timestamp) >= this.ttl) {
                lg.warn(`Кеш попереджень для ${user_id} застарілий, видаляю.`);
                this.delete(user_id);
            }
        }
    }
}

const warnsCache = new WarnsCacheManager();

export const warning_cache_check = (message) => warnsCache.check(message.author.id, message);
export const add_warns_to_cache = (user_id) => warnsCache.add(user_id);
export const delete_cache = (user_id) => warnsCache.delete(user_id);