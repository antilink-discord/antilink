const { Events, Collection, REST, Routes, PresenceUpdateStatus, Activity, ActivityType } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { memoryUsage } = require('process');
const { type } = require('os');
require('dotenv').config();
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const Logger = require('../utils/logs');
lg = new Logger('Bot');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		client.commands = new Collection();
		const foldersPath = path.join(__dirname, '..', 'commands');

		await client.user.setActivity('/help', { type: ActivityType.Listening });

		async function loadCommands(folderPath) {
			const entries = fs.readdirSync(folderPath, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(folderPath, entry.name);

				if (entry.isDirectory()) {
					await loadCommands(fullPath);
				}
				else if (entry.isFile() && entry.name.endsWith('.js')) {
					const command = require(fullPath);
					if ('data' in command && 'execute' in command) {
						client.commands.set(command.data.name, command);
						lg.info(`Команда ${command.data.name} завантажена з файлу ${fullPath}`);
					}
					else {
						lg.warn(`[WARNING] The command at ${fullPath} is missing a required "data" or "execute" property.`);
					}
				}
			}
		};

		await loadCommands(foldersPath);

		lg.success('Усі команди успішно завантажені!');

		const commands = client.commands.map(command => command.data.toJSON());

		const rest = new REST({ version: '10' }).setToken(token);

		try {
			lg.info('Реєстрація команд...');

			await rest.put(
				Routes.applicationCommands(clientId),
				{ body: commands },
			);
			lg.success('Локальні команди успішно зареєстровані!');

		}
		catch (error) {
			lg.error('Помилка при реєстрації команд:', error);
		}
	},
};
