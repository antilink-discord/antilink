const { Events, MessageFlags, EmbedBuilder, Embed, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionOverwriteManager, PermissionOverwrites, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, flatten } = require('discord.js');
require('dotenv').config();
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isChatInputCommand()) {

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			// if(interaction.user.id !="558945911980556288" && interaction.user.id !="614784992362496020") {
			// 	console.log('Вимкнено використання команд для всіх(events/onInteractionCreate.js)')
			// 	interaction.reply({content: 'Команда вимкнена.', flags: MessageFlags.Ephemeral})
			// 	return
			// }
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
			}
		}
	}
}
}