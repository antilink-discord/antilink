import { Events, AuditLogEvent } from 'discord.js';
import 'dotenv/config'
import Logger from '../utils/logs.js';
import { freezeUser } from './onChannelDelete.js'
const lg = new Logger({ prefix: 'Bot' });

export default {
	name: Events.GuildUpdate,
	once: false,

    async execute(oldGuild, newGuild){
    lg.info('Виклик івенту guildDelete');
		try {
            const fetchedLogs = await newGuild.fetchAuditLogs({
                type: AuditLogEvent.GuildUpdate,
                limit: 1
            }).catch(() => null);

            const logEntry = fetchedLogs?.entries.first();
            if (!logEntry) return console.log('❌ Логи аудиту не знайдені.');

            const { executor } = logEntry;
            if (!executor) return console.log('❌ Виконавець не знайдений.');

            if(executor.id === newGuild.client.user.id) return console.log('✅ Зміна зроблена ботом, ігноруємо.');

            if (oldGuild.icon !== newGuild.icon) {
                console.log(`Аватарку серверу змінили на нову!`);
                console.log(`Стара аватарка: ${oldGuild.iconURL()}`);
                console.log(`Нова аватарка: ${newGuild.iconURL()}`);
                
                await newGuild.setIcon(oldGuild.iconURL()).catch(e => { console.log(e)})
                await freezeUser(newGuild.id, executor.id)
                console.log('Аватарку сервера змінено назад на стару.');
            }
            if (oldGuild.name !== newGuild.name) {
                console.log(`Аватарку серверу змінили на нову!`);
                console.log(`Стара назва: ${oldGuild.name}`);
                console.log(`Нова назва: ${newGuild.name}`);
                await newGuild.setName(oldGuild.name).catch(e => { console.log(e)})  // Змінюємо на стару назву
                console.log('Аватарку сервера змінено назад на стару.');
            }
		}
		catch (error) {
			lg.error('Помилка у GuildDelete:', error);
		}
	}
}