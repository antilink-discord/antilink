import { Events, MessageFlags, Collection } from 'discord.js';
import 'dotenv/config';
import Logger from '../utils/logs.js';

const lg = new Logger({ prefix: 'Bot' });

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isAutocomplete()) {
            try {
                const command = interaction.client.commands.get(interaction.commandName)
                    || interaction.client.devCommands.get(interaction.commandName);


                if (!command) return;

                await command.autocomplete(interaction);
                return;
            } catch (error) {
                lg.error(error);
            }
        }

        if (interaction.isChatInputCommand()) {
            if (!interaction.inGuild()) return;
            const command = interaction.client.commands.get(interaction.commandName)
                || interaction.client.devCommands.get(interaction.commandName);



            if (!command) {
                lg.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            if (!interaction.client.cooldowns) {
                interaction.client.cooldowns = new Collection();
            }
            const cooldowns = interaction.client.cooldowns;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                if (now < expirationTime) {
                    await interaction.reply({
                        content: `Зачекайте ${(expirationTime - now) / 1000} секунд перед повторним використанням цієї команди.`,
                        ephemeral: true,
                    });
                    return;
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            try {
                await command.execute(interaction);
            } catch (error) {
                lg.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
                }
            }
        }
    },
};
