import { EmbedBuilder, WebhookClient } from "discord.js";
import Guild from "../Schemas/guildSchema.js";
import { get_lang } from "../utils/helper.js";
import texts from "./texts.js";
import { decrypt } from "./crypting.js";
import Logger from "./logs.js";
const lg = new Logger({ prefix: "Bot" });

export async function guild_link_delete_log(message, user_id) {
  try {
    const guildData = await Guild.findOne({ _id: message.guild.id });
    const guild_logchannel = guildData.logchannel;
    if (guild_logchannel) {
      const lang = await get_lang(message.client, message.guild.id);

      const dectypted_url = decrypt(guildData.logchannel);
      const webhook = new WebhookClient({ url: dectypted_url });
      const log_embed = new EmbedBuilder()
        .setTitle(texts[lang].banned_link)

        .setColor(0x5e66ff)
        .addFields(
          {
            name: texts[lang].guild_logs_field_user,
            value: `<@${user_id}> || \`\`${user_id}\`\``,
            inline: true,
          },
          {
            name: texts[lang].message,
            value: `\`\`${message}\`\``,
            inline: false,
          },
        );

      await webhook.send({ embeds: [log_embed] });
    }
  } catch (error) {
    lg.error(error);
  }
}

export async function guild_ban_log(message, user_id, channel_name) {
  try {
    const guildData = await Guild.findOne({ _id: message.guild.id });
    const guild_logchannel = guildData.logchannel;
    if (guild_logchannel) {
      const lang = await get_lang(message.client, message.guild.id);
      const dectypted_url = decrypt(guildData.logchannel);
      const webhook = new WebhookClient({ url: dectypted_url });
      const log_embed = new EmbedBuilder()
        .setTitle(texts[lang].guild_logs_member_banned)
        .setColor(0x5e66ff)
        .setDescription(texts[lang].guild_logs_member_banned_description)
        .addFields(
          {
            name: texts[lang].guild_logs_field_user,
            value: `<@${user_id}> || \`\`${user_id}\`\``,
            inline: true,
          },
          {
            name: texts[lang].guild_logs_field_channel,
            value: `${channel_name}`,
            inline: true,
          },
          {
            name: texts[lang].warns_reason,
            value: texts[lang].reason_three_warnings,
            inline: false,
          },
        );

      await webhook.send({ embeds: [log_embed] });
    }
  } catch (error) {
    lg.error(error);
  }
}

export async function user_failed_captcha(user, guild, correctAnswer, response) {
  try {
    const guildData = await Guild.findOne({ _id: guild.id });
    const guild_logchannel = guildData.logchannel;
    if (guild_logchannel) {
      const lang = await get_lang(guild.client, guild.id);
      const dectypted_url = decrypt(guildData.logchannel);
      const webhook = new WebhookClient({ url: dectypted_url });
      const log_embed = new EmbedBuilder()

          .setColor('#ff0000')
          .setTitle(texts[lang].guild_logs_member_failed_captcha_title)
          .addFields(
              { name: texts[lang].guild_logs_member_failed_captcha_title, value: `${user} | \`\`${user.id}\`\``, inline: false},
              { name: texts[lang].guild_logs_sent_captcha, value: `**${correctAnswer}**`, inline: true},
              { name: texts[lang.guild_logs_got_answer], value: `**${response}**`}

          );
          await webhook.send({ embeds: [log_embed] });
        }
      
    } catch (error) {
    lg.error(error);
  }
  }

  export async function user_solved_captcha(user, guild, correctAnswer, response) {
  try {
    const guildData = await Guild.findOne({ _id: guild.id });
    const guild_logchannel = guildData.logchannel;
    if (guild_logchannel) {
      const lang = await get_lang(guild.client, guild.id);

      const dectypted_url = decrypt(guildData.logchannel);
      const webhook = new WebhookClient({ url: dectypted_url });
      const log_embed = new EmbedBuilder()

        .setColor(0x7dd321)
        .setTitle(texts[lang].guild_logs_member_solved_captcha_title)
        .addFields(
          { name: texts[lang].guild_logs_field_user, value: `${user} | \`\`${user.id}\`\``, inline: false },
          { name: texts[lang].guild_logs_got_answer, value: `**${response}**` }
        );
      await webhook.send({ embeds: [log_embed] });
    } 
  }catch (error) {
    lg.error(error);
  }
}

