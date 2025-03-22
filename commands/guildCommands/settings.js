import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import Guild from '../../Schemas/guildSchema.js';
import { settingsHandler } from '../../utils/settingsHandler.js';
import texts from '../../utils/texts.js';
import { get_lang } from '../../utils/helper.js';
import Logger from '../../utils/logs.js';
const lg = new Logger({ prefix: 'Bot' });


	export const data = new SlashCommandBuilder()
		.setName('settings')
		.setDescription('Відкриває налаштування вашої гільдії')

	export async function execute(interaction) {
		try {
            const lang = await get_lang(interaction.client, interaction.guild.id);
			const guildData = await Guild.findOne({ _id: interaction.guild.id });
            await interaction.deferReply({ephemeral: true})
			if (interaction.guild.ownerId === interaction.member.id) {
                
				const { webhook_name, webhook_channel, userblocking, role_names, emoji_pack, antinuke_enabled } = await settingsHandler(interaction);

				const ExampleEmbed = new EmbedBuilder()
					.setColor(0x5e66ff)
					.setTitle(`${emoji_pack.settings_emoji}${texts[lang].settings_title}`)
					.setDescription(texts[lang].settings_description)
					.addFields(
						{ name: `${emoji_pack.logs_channel_emoji}${texts[lang].settings_logchannel}`, value: `${webhook_name} | ${webhook_channel}` || `${texts[lang].settings_didnt_setup}`, inline: true },
						{ name: `${emoji_pack.whitelist_emoji}${texts[lang].settings_whitelist}`, value: role_names.join(', ') || `${texts[lang].settings_didnt_setup}`, inline: true },
						{ name: `${texts[lang].settings_blocking}`, value: userblocking, inline: false },
                        { name: `${texts[lang].settings_antinuke}`, value: antinuke_enabled, inline: false },
					)
					.setFooter({ text: texts[lang].settings_footer });

				await interaction.editReply({ embeds: [ExampleEmbed], flags: MessageFlags.Ephemeral });
			}
			else {
				await interaction.editReply({ content: `${texts[lang].no_perms}`, flags: MessageFlags.Ephemeral });

				return;
			}
		}
		catch (error) {
			lg.error('Помилка settings.js: ' + error);
		}
	}