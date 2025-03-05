import Logger from './logs.js';
const lg = new Logger('Bot');

const ChannelDeleteCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 хв збереження кешу
const DELETE_LIMIT = 5; // Ліміт видалень каналів перед покаранням

export async function channel_delete_cache_check(user_id) {
	try {
		const cacheEntry = ChannelDeleteCache.get(user_id);

		if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL) {
			return cacheEntry.count;
		}

		ChannelDeleteCache.set(user_id, { count: 0, timestamp: Date.now() });
		return 0;
	} catch (error) {
		lg.error('channel_delete_cache_check: ' + error);
	}
}

export async function add_channel_delete_to_cache(guild, user_id) {
	try {
		const cacheEntry = ChannelDeleteCache.get(user_id);
		const updated_count = cacheEntry ? cacheEntry.count + 1 : 1;

		ChannelDeleteCache.set(user_id, { count: updated_count, timestamp: Date.now() });

		if (updated_count >= DELETE_LIMIT) {
			try {
				await guild.members.ban(user_id, { reason: 'Анти-краш: масове видалення каналів' });
				console.log(`❌ Користувач <@${user_id}> був забанений за масове видалення каналів.`);
			} catch (err) {
				console.error('❌ Помилка під час блокування користувача:', err);
			}

			delete_channel_delete_cache(user_id);
		}
	} catch (error) {
		lg.error('add_channel_delete_to_cache: ' + error);
	}
}

// Очищення кешу кожні CACHE_TTL хвилин
setInterval(() => {
	const now = Date.now();
	for (const [user_id, cacheEntry] of ChannelDeleteCache) {
		if ((now - cacheEntry.timestamp) >= CACHE_TTL) {
			delete_channel_delete_cache(user_id);
		}
	}
}, CACHE_TTL);

export function delete_channel_delete_cache(user_id) {
	try {
		if (ChannelDeleteCache.has(user_id)) {
			ChannelDeleteCache.delete(user_id);
		}
	} catch (error) {
		lg.error('delete_channel_delete_cache: ' + error);
	}
}
