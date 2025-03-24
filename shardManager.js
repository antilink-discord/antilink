import { ShardingManager } from 'discord.js';
import 'dotenv/config'
import Logger from './utils/logs.js';
const lg = new Logger({ prefix: 'Bot' });

const manager = new ShardingManager('./bot.js', {
  token: process.env.TOKEN,
  totalShards: 2,
  shardArgs: ['--ansi'], // Додаткові аргументи
});

manager.on('shardCreate', shard => {
    lg.info(`Запущено шард #${shard.id}`);
    shard.on('error', err => lg.error(`Помилка шарда #${shard.id}:`, err));
  });
  
  manager.spawn()
    .then(() => {
        lg.success('Усі шарди запущено!'); // Важливо для Railway!
    })
  .catch(err => lg.error('Помилка запуску шардів:', err));

process.on('unhandledRejection', err => {
    lg.error('Необроблена помилка:', err);
    process.exit(1);
});