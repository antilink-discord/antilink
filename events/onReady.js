import { Events, Collection, REST, Routes } from 'discord.js';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { cacheGuildsLanguages } from '../utils/helper.js';
import Logger from '../utils/logs.js';

const lg = new Logger({ prefix: 'Bot' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        const guilds = await client.guilds.fetch();

        client.guildLanguages = new Map();
        client.commands = new Collection();
        client.devCommands = new Collection();

        const commandsPath = path.join(__dirname, '..', 'commands');
        const folders = fs.readdirSync(commandsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        await cacheGuildsLanguages(client, guilds);

        client.user.setPresence({ activities: [{ name: '/help' }] });

        async function loadCommands(folderPath, collection) {
            const entries = fs.readdirSync(folderPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(folderPath, entry.name);

                if (entry.isDirectory()) {
                    await loadCommands(fullPath, collection);
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                    const fileURL = pathToFileURL(fullPath).href;

                    await import(fileURL)
                        .then(command => {
                            if ('data' in command && 'execute' in command) {
                                collection.set(command.data.name, command);
                                lg.success(`Команда ${command.data.name} завантажена з ${fullPath}`);
                            } else {
                                lg.error(`Команда ${fullPath} не має "data" або "execute".`);
                            }
                        })
                        .catch(error => lg.error(`Помилка завантаження команди ${fullPath}:`, error));
                }
            }
        }


        for (const folder of folders) {
            const folderPath = path.join(commandsPath, folder);

            if (folder === 'devcommands') {
                await loadCommands(folderPath, client.devCommands);
            } else {
                await loadCommands(folderPath, client.commands);
            }
        }

        lg.success('Усі команди успішно завантажені!');


        const globalCommands = client.commands.map(command => command.data.toJSON());
        const devCommands = client.devCommands.map(command => command.data.toJSON());

        const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

        try {
            lg.info(`Реєстрація глобальних команд: ${globalCommands.map(c => c.name).join(', ')}`);
            await rest.put(Routes.applicationCommands(clientId), { body: globalCommands });
            lg.success('Глобальні команди успішно зареєстровані!');
            lg.info('Завантажені глобальні команди:', [...client.commands.keys()]);
        } catch (error) {
            lg.error('Помилка реєстрації глобальних команд:', error);
        }

        try {
            lg.info(`Реєстрація dev-команд для ${guildId}: ${devCommands.map(c => c.name).join(', ')}`);
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: devCommands });
            lg.success(`Dev-команди для ${guildId} успішно зареєстровані!`);
            lg.info('Завантажені dev-команди:', [...client.devCommands.keys()]);
        } catch (error) {
            lg.error(`Помилка реєстрації dev-команд для ${guildId}:`, error);
        }
    },
};
