import Guild from "../Schemas/guildSchema.js";
import Logger from "./logs.js";
import texts from "./texts.js";
import { EmbedBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { ButtonBuilder } from '@discordjs/builders';
const lg = new Logger({ prefix: "Bot" });

export async function get_lang(client, guildId) {
  if (client.guildLanguages.has(guildId)) {
    return client.guildLanguages.get(guildId);
  } else
    try {
      let guildData = await Guild.findOne({ _id: guildId });
      if (!guildData || !guildData.language) {
        lg.info("Не знайдено мову для гільдії. Встановлюємо за замовчуванням.");
        guildData = new Guild({ _id: guildId });
        await guildData.save();
      }

      const language = guildData.language;
      client.guildLanguages.set(guildId, language);
      return language;
    } catch (error) {
      lg.error(`Помилка отримання мови для гільдії ${guildId}:`, error);
      return "en";
    }
}

export async function cacheGuildsLanguages(client, guilds) {
  console.warn("Виклик функції!");

  for (const guild of guilds.values()) {
    try {
      const guildData = await Guild.findOne({ _id: guild.id });
      if (guildData) {
        client.guildLanguages.set(guild.id, guildData.language);
      } else {
        lg.warn(`Гільдія ${guild.id} не знайдена в базі.`);
      }
    } catch (error) {
      lg.error(`Помилка при кешуванні мови для ${guild.id}:`, error);
    }
  }
}

export async function clear_guild_language_cache(client, guildId) {
  if (client.guildLanguages.get(guildId)) {
    client.guildLanguages.delete(guildId);
  }
}

export async function can_give_role(interaction) {
  const botMember = await interaction.guild.members.fetch(interaction.client.user.id); 
  const targetRole = interaction.options.getRole('role'); 
  const hasPermissions = botMember.permissions.has('ManageRoles');
  const canManage = botMember.roles.highest.comparePositionTo(targetRole) > 0;

  const isNotSystemRole = targetRole.id !== interaction.guild.id;


  if (!canManage || !isNotSystemRole || !hasPermissions) {
  const lang = await get_lang(interaction.client, interaction.guild.id);
  await interaction.reply({
    content: `${texts[lang].setup_role_cant_setup_content}\n` +
      `${!canManage ? texts[lang].setup_role_canManage : ''}\n` +
      `${!isNotSystemRole ? texts[lang].setup_role_systemRole : ''}\n` +
      `${!hasPermissions ? texts[lang].setup_no_perms : ''}`,
    ephemeral: true
  });
  return;
}
}

export async function send_embed(client, lang, guildId, channelId, guildData) {
  const guild = await client.guilds.fetch(guildId);
  const verifyChannel = await guild.channels.fetch(channelId);

  let btnRow;
  if (guildData.verificationSystem?.isEnabled === false) {
    btnRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verifyBtn')
        .setLabel('❌Disabled')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );
  } else {
    btnRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("verifyBtn")
        .setLabel("✔️ Verify")
        .setStyle(ButtonStyle.Success)
    );
  }

  const embed = new EmbedBuilder()
    .setColor("#4248fc")
    .setAuthor({
      name: texts[lang].verification_embed_author,
      iconURL: guild.iconURL(),
    })
    .setTitle(texts[lang].verification_title)
    .setDescription(texts[lang].verification_description)
    .setFooter({
      text: "powered by AntiLink",
      iconURL: client.user.avatarURL()
    });

  const sentMessage = await verifyChannel.send({
    embeds: [embed],
    components: [btnRow],
  });

  const result = await Guild.updateOne(
    { _id: guildId, "verificationSystem": { $exists: true } }, // виправлено
    {
      $set: {
        "verificationSystem.captcha_channel_id": verifyChannel.id,
        "verificationSystem.captcha_embed_message_id": sentMessage.id
      }
    }
  );

  if (result.matchedCount === 0) {
    await Guild.updateOne(
      { _id: guildId },
      {
        $set: {
          "verificationSystem": {
            ...guildData.verificationSystem, // зберігаємо повністю
            captcha_channel_id: verifyChannel.id,
            captcha_embed_message_id: sentMessage.id
          }
        }
      },
      
    );
  }

  
}

export const colors = {
  SUCCESSFUL_COLOR: "#86fa50",
  ERROR_COLOR: "#fa7850",
};
