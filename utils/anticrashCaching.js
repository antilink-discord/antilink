import Logger from './logs.js';
const lg = new Logger({ prefix: 'Bot' });

const CACHE_TTL = 10 * 60 * 1000; // 10 хвилин кешу
const DELETE_LIMIT = 5; // Ліміт дій перед покаранням

const Cache = {
    ChannelDelete: new Map(),
    ChannelCreate: new Map()
};

// 🔍 **Перевірка кешу**
export async function check_cache(type, user_id) {
    try {
        const cache = Cache[type];
        const cacheEntry = cache.get(user_id);

        if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL) {
            return cacheEntry.count;
        }

        cache.set(user_id, { count: 0, timestamp: Date.now() });
        return 0;
    } catch (error) {
        lg.error(`❌ check_cache (${type}): ` + error);
    }
}


export async function add_to_cache(type, guild, user_id, limit, reason) {
    try {
        const cache = Cache[type];
        let cacheEntry = cache.get(user_id);


        const updated_count = cacheEntry ? cacheEntry.count + 1 : 1;
        
      
        if (updated_count >= limit) {
            try {
                
                guild.members.kick(user_id, { reason }).catch(err => lg.error('❌ Помилка блокування користувача:', err));

                lg.success(`❌ Користувач <@${user_id}> забанений. Причина: ${reason}`);

              
                cache.delete(user_id);
            } catch (err) {
                lg.error('❌ Помилка при обробці покарання:', err);
            }

            return;
        }

        cache.set(user_id, { count: updated_count, timestamp: Date.now() });

    } catch (error) {
        lg.error(`❌ add_to_cache (${type}): ` + error);
    }
}


// ⏳ **Автоочищення кешу**
setInterval(() => {
    const now = Date.now();
    for (const type in Cache) {
        const keysToDelete = [];
        for (const [user_id, cacheEntry] of Cache[type]) {
            if ((now - cacheEntry.timestamp) >= CACHE_TTL) {
                keysToDelete.push(user_id);
            }
        }
        keysToDelete.forEach(user_id => delete_from_cache(type, user_id));
    }
}, CACHE_TTL);

// ❌ **Видалення з кешу**
export function delete_from_cache(type, user_id) {
    try {
        if (Cache[type].has(user_id)) {
            Cache[type].delete(user_id);
            lg.info(`🗑 Видалено користувача ${user_id} з кешу (${type})`);
        }
    } catch (error) {
        lg.error(`❌ delete_from_cache (${type}): ` + error);
    }
}

// 🔄 **Функції для конкретних дій**
export async function channel_delete_cache_check(user_id) {
    return check_cache('ChannelDelete', user_id);
}

export async function add_channel_delete_to_cache(guild, user_id) {
    return add_to_cache('ChannelDelete', guild, user_id, DELETE_LIMIT, 'Анти-краш: масове видалення каналів');
}

export async function channel_create_cache_check(user_id) {
    return check_cache('ChannelCreate', user_id);
}

export async function add_channel_create_to_cache(guild, user_id) {
    return add_to_cache('ChannelCreate', guild, user_id, DELETE_LIMIT, 'Анти-краш: масове створення каналів');
}

// 🆕 **Видалення кешу створення каналів**
export async function delete_channel_create_cache(user_id) {
    delete_from_cache('ChannelCreate', user_id);
}
