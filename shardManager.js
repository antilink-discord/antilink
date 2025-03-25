import { ShardingManager } from 'discord.js';
import 'dotenv/config';
import Logger from './utils/logs.js';
const lg = new Logger({ prefix: 'ShardManager' });

// Конфігурація шардів
const SHARD_CONFIG = {
  token: process.env.TOKEN,
  totalShards: 'auto', // Автовизначення кількості шардів
  respawn: true, // Автоматичний перезапуск шардів при падінні
  shardArgs: ['--color'], // Аргументи для шардів
  execArgv: process.env.NODE_ENV === 'development' 
    ? ['-r', 'dotenv/config'] 
    : [] // Додаткові аргументи Node.js
};

// Ініціалізація менеджера
const manager = new ShardingManager('./bot.js', SHARD_CONFIG);

// Обробник подій шардів
manager.on('shardCreate', shard => {
  lg.info(`[Shard #${shard.id}] Запускається...`);
  
  shard.on('ready', () => {
    lg.success(`[Shard #${shard.id}] Успішно запущений`);
  });
  
  shard.on('death', () => {
    lg.warn(`[Shard #${shard.id}] Зупинився`);
  });
  
  shard.on('error', err => {
    lg.error(`[Shard #${shard.id}] Помилка:`, err);
  });
});

// Запуск шардингу з обробкою помилок
(async () => {
  try {
    lg.info('Початок запуску шардів...');
    await manager.spawn();
    lg.success(`Успішно запущено ${manager.totalShards} шард(ів)`);
  } catch (err) {
    lg.error('Критична помилка при запуску шардів:', err);
    process.exit(1);
  }
})();

// Обробка глобальних помилок
process
  .on('unhandledRejection', err => {
    lg.error('Необроблений rejection:', err);
  })
  .on('uncaughtException', err => {
    lg.error('Необроблена exception:', err);
    process.exit(1);
  });