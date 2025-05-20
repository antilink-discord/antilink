import { SlashCommandBuilder, ActionRowBuilder } from "@discordjs/builders";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { settingsHandler } from "../../utils/settingsHandler.js";
import texts from "../../utils/texts.js";
import { get_lang } from "../../utils/helper.js";
import Logger from "../../utils/logs.js";
const lg = new Logger({ prefix: "Bot" });

export const data = new SlashCommandBuilder()
  .setName("settings")
  .setDescription("Відкриває налаштування вашої гільдії")
  .setDescriptionLocalizations({ EnglishUS: `Open your guild's settings` });

export async function execute(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    const lang = await get_lang(interaction.client, interaction.guild.id);
    
    if (interaction.guild.ownerId === interaction.member.id) {
      const {
        webhook_name,
        webhook_channel,
        userblocking,
        role_names,
        emoji_pack,
        verifed_role,
        unverifed_role
      } = await settingsHandler(interaction);
      
      const linkButton = new ButtonBuilder()
        .setURL("https://antilink.pp.ua/")
        .setLabel(texts[lang].dashboard_button)
        .setStyle(ButtonStyle.Link);

      const row = new ActionRowBuilder().addComponents(linkButton);

      const ExampleEmbed = new EmbedBuilder()
        .setColor(0x5e66ff)
        .setTitle(`${emoji_pack.settings_emoji}${texts[lang].settings_title}`)
        .setDescription(texts[lang].settings_description)
        .addFields(
          {
            name: `${emoji_pack.logs_channel_emoji}${texts[lang].settings_logchannel}`,
            value:
              webhook_name && webhook_channel
                ? `${webhook_name} | ${webhook_channel}`
                : `${texts[lang].settings_didnt_setup}`,
            inline: true,
          },
          {
            name: `${emoji_pack.whitelist_emoji}${texts[lang].settings_whitelist}`,
            value:
              role_names.join(", ") ?? `${texts[lang].settings_didnt_setup}`,
            inline: true,
          },
          {
            name: `${emoji_pack.hammer_emoji}${texts[lang].settings_blocking}`,
            value: userblocking,
            inline: false,
          },
          {
            name: `${emoji_pack.new_member_emoji}${texts[lang].settings_joinrole_title}`,
            value: unverifed_role ? `<@&${unverifed_role}>` : `${texts[lang].settings_didnt_setup}`,
            inline: true,
          },
               {
            name: `${emoji_pack.verifed_member_emoji}${texts[lang].settings_verifedrole_title}`,
            value: verifed_role ? `<@&${verifed_role}>` : `${texts[lang].settings_didnt_setup}`,
            inline: true,
          },
        )
        .setFooter({ text: texts[lang].settings_footer });

      await interaction.editReply({
        embeds: [ExampleEmbed],
        components: [row],
        ephemeral: true
      });
    } else {
      await interaction.editReply({
        content: `${texts[lang].no_perms}`,
        ephemeral: true
      });

      return;
    }
  } catch (error) {
    lg.error("Помилка settings.js: " + error);
  }
}
