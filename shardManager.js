import { ShardingManager } from 'discord.js';
import 'dotenv/config';
import Logger from './utils/logs.js';
const lg = new Logger({ prefix: 'ShardManager' });

// Вимкнути авто-перезапуск
const manager = new ShardingManager('./bot.js', {
  token: process.env.TOKEN,
  totalShards: 2, // Фіксована кількість
  respawn: false, // Вимкнути перезапуск
  shardArgs: ['--color'],
});

// Відстежуємо запущені шарди
const activeShards = new Set();

manager.on('shardCreate', shard => {
  if (activeShards.has(shard.id)) {
    lg.warn(`[Shard #${shard.id}] Спроба повторного запуску`);
    return;
  }

  activeShards.add(shard.id);
  lg.info(`[Shard #${shard.id}] Ініціалізація`);

  shard.on('ready', () => {
    lg.success(`[Shard #${shard.id}] Готовий`);
  });

  shard.on('death', () => {
    lg.error(`[Shard #${shard.id}] Завершив роботу`);
    activeShards.delete(shard.id);
  });

  shard.on('disconnect', () => {
    lg.warn(`[Shard #${shard.id}] Відключений`);
  });
});

// Обробка завершення роботи
process.on('SIGINT', () => {
  lg.info('Отримано SIGINT. Завершення роботи...');
  manager.destroy().finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  lg.info('Отримано SIGTERM. Завершення роботи...');
  manager.destroy().finally(() => process.exit(0));
});

// Запуск шардів
manager.spawn()
  .then(shards => {
    lg.success(`Успішно запущено ${shards.size} шардів`);
  })
  .catch(error => {
    lg.error('Помилка запуску шардів:', error);
    process.exit(1);
  });

// Експортуємо для використання в командах
export const shardManager = manager;