import { ShardingManager } from 'discord.js';
import 'dotenv/config';
import Logger from './utils/logs.js';
const lg = new Logger({ prefix: 'ShardManager' });

// Конфігурація з вимкненим авто-перезапуском
const manager = new ShardingManager('./bot.js', {
  token: process.env.TOKEN,
  totalShards: 2, // Фіксована кількість для тестування
  respawn: false, // Вимкнути автоматичний перезапуск
  shardArgs: ['--color'],
});

let activeShards = new Set();

manager.on('shardCreate', shard => {
  if (activeShards.has(shard.id)) {
    lg.warn(`[Shard #${shard.id}] Спроба повторного запуску`);
    return;
  }

  activeShards.add(shard.id);
  lg.info(`[Shard #${shard.id}] Перший запуск`);

  shard.on('ready', () => {
    lg.success(`[Shard #${shard.id}] Готовий`);
  });

  shard.on('death', () => {
    lg.warn(`[Shard #${shard.id}] Завершив роботу`);
    activeShards.delete(shard.id);
  });

  shard.on('disconnect', () => {
    lg.warn(`[Shard #${shard.id}] Відключений`);
  });

  shard.on('error', error => {
    lg.error(`[Shard #${shard.id}] Помилка:`, error);
  });
});

// Обробка сигналів завершення
const handleExit = async () => {
  lg.info('Отримано сигнал завершення. Зупинка шардів...');
  await manager.destroy();
  process.exit(0);
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

// Запуск шардів
manager.spawn()
  .then(shards => {
    lg.success(`Успішно запущено ${shards.size} шардів`);
  })
  .catch(error => {
    lg.error('Помилка запуску шардів:', error);
    process.exit(1);
  });

// Експорт для використання в командах
export default manager;