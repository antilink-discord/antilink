import { ShardingManager } from 'discord.js';
import 'dotenv/config';
import Logger from './utils/logs.js';
const lg = new Logger({ prefix: 'ShardManager' });

const manager = new ShardingManager('./bot.js', {
  token: process.env.TOKEN,
  totalShards: 'auto',
  respawn: true,
  shardArgs: ['--color'],
});

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

// Запускаємо шарди
manager.spawn()
  .then(() => lg.success(`Успішно запущено ${manager.totalShards} шард(ів)`))
  .catch(err => {
    lg.error('Помилка запуску шардів:', err);
    process.exit(1);
  });

// Експортуємо менеджер
export default manager;