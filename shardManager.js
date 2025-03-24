import { ShardingManager } from 'discord.js';
import 'dotenv/config'
import Logger from './utils/logs.js';
const lg = new Logger({ prefix: 'Bot' });

const manager = new ShardingManager('./bot.js', {
  token: process.env.TOKEN,
  totalShards: 'auto', // Discord.js сам вирахує оптимальну кількість
  shardArgs: ['--ansi'], // Додаткові аргументи
});

manager.on('shardCreate', shard => {
  lg.info(`Запущено шард #${shard.id}`);
});

manager.spawn();