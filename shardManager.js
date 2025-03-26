import { ShardingManager } from 'discord.js';
import 'dotenv/config';
import Logger from './utils/logs.js';
const lg = new Logger({ prefix: 'ShardManager' });

// Конфігурація з явним вказівкою кількості шардів
const manager = new ShardingManager('./bot.js', {
  token: process.env.TOKEN,
  totalShards: 2, // Фіксована кількість
  respawn: false, // Вимкнути авто-перезапуск
  shardArgs: ['--color'],
});

let isSpawning = false;
const spawnedShards = new Set();

manager.on('shardCreate', shard => {
  if (spawnedShards.has(shard.id)) {
    lg.warn(`[Shard #${shard.id}] Вже був запущений раніше!`);
    return;
  }

  spawnedShards.add(shard.id);
  lg.info(`[Shard #${shard.id}] Початок ініціалізації`);

  shard.on('ready', () => {
    lg.success(`[Shard #${shard.id}] Успішно запущений`);
  });

  shard.on('disconnect', () => {
    lg.warn(`[Shard #${shard.id}] Відключений`);
  });

  shard.on('death', () => {
    lg.error(`[Shard #${shard.id}] Завершив роботу`);
    spawnedShards.delete(shard.id);
  });
});

// Запобігаємо подвійному запуску
if (!isSpawning) {
  isSpawning = true;
  manager.spawn()
    .then(shards => {
      lg.success(`Успішно запущено ${shards.size} шардів. Очікування подій...`);
    })
    .catch(error => {
      lg.error('Помилка запуску:', error);
      process.exit(1);
    });
}

// Обробка завершення роботи
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    lg.info(`Отримано ${signal}. Завершення роботи...`);
    manager.destroy().finally(() => process.exit(0));
  });
});

export default manager;