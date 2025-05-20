import { get_lang } from "./helper.js";
import texts from "./texts.js";
import Guild from "../Schemas/guildSchema.js";
import Logger from "./logs.js";
import { decrypt } from "../utils/crypting.js";
const lg = new Logger({ prefix: "Bot" });

export async function get_webhook(guildData, interaction) {
  try {
    if (guildData.logchannel) {
      const dectypted = decrypt(guildData.logchannel);
      const webhookId = dectypted.split("/")[5];
      const webhook = await interaction.client.fetchWebhook(webhookId);
      return webhook;
    } else {
      return null;
    }
  } catch (error) {
    lg.error("Помилка при отриманні webhook: " + error);
  }
}
export async function get_emojis_for_message(support_server) {
  try {
    const [
      settings_emoji,
      logs_channel_emoji,
      whitelist_emoji,
      error_emoji,
      hammer_emoji,
      new_member_emoji,
      verifed_member_emoji
    ] = await Promise.all([
      support_server.emojis.cache.get("1266082934872604745"),
      support_server.emojis.cache.get("1266073334030926008"),
      support_server.emojis.cache.get("1266073332152008704"),
      support_server.emojis.cache.get("1338880092633567303"),
      support_server.emojis.cache.get("1374387659513794580"),
      support_server.emojis.cache.get("1374389088366362806"),
      support_server.emojis.cache.get("1374391371947053138")
    ]);

    return {
      settings_emoji,
      logs_channel_emoji,
      whitelist_emoji,
      error_emoji,
      hammer_emoji,
      new_member_emoji,
      verifed_member_emoji
    };
  } catch (error) {
    console.error("Не вдалось отримати емодзі get_emoji_for_message: ", error);
    return {}; 
  }
}

export async function settingsHandler(interaction) {
  const lang = await get_lang(interaction.client, interaction.guild.id);
  lg.debug(lang);
  const support_server = await interaction.client.guilds.cache.get(
    process.env.SUPPORT_SERVER_ID,
  );
  if (!support_server) {
    lg.warn("Не вдалось знайти сервер підтримки");
    return;
  }

  let guildData = await Guild.findOne({ _id: interaction.guild.id });
  if (!guildData) {
    guildData = new Guild({ _id: interaction.guild.id });
  }

  const emoji_pack = await get_emojis_for_message(support_server);
  let userblocking;
  if (guildData.blocking_enabled === true) {
    userblocking = texts[lang].settings_enabled;
  } else if (guildData.blocking_enabled === false) {
    userblocking = texts[lang].settings_disabled;
  }

  let webhook_name, webhook_channel, verifed_role, unverifed_role;
  if (guildData.logchannel) {
    const webhook = await get_webhook(guildData, interaction);
    if (webhook) {
      webhook_name = webhook.name;
      webhook_channel = webhook.channel;
    }
  } else {
    webhook_name = webhook_channel = texts[lang].settings_nodata;
  }
  if(guildData.verificationSystem?.verifedRoleId) {
    const role = await interaction.guild.roles.fetch(guildData.verificationSystem.verifedRoleId);
    if(role) {
      verifed_role = role.id;
    } else return null;
  }

   if(guildData.verificationSystem?.unvefivedRoleID) {
    const role = await interaction.guild.roles.fetch(guildData.verificationSystem.unvefivedRoleID);
    if(role) {
      unverifed_role = role.id;
    } else return null;
  }


  return {
    webhook_name,
    webhook_channel,
    userblocking,
    emoji_pack,
    role_names: await format_whitelist(interaction),
    verifed_role,
    unverifed_role

  };
}

export async function format_whitelist(interaction) {
  try {
    const GuildData = await Guild.findOne({ _id: interaction.guild.id });
    if (
      !GuildData ||
      !GuildData.whitelist ||
      GuildData.whitelist.length === 0
    ) {
      return [];
    }

    const rolesId = GuildData.whitelist;
    let role_mentions = [];

    rolesId.forEach((roleId) => {
      const role = interaction.guild.roles.cache.get(roleId);
      if (role) {
        role_mentions.push(role.toString());
      }
    });

    return role_mentions;
  } catch (error) {
    lg.error("Помилка у форматуванні білого списку:", error);
    return [];
  }
}

export async function check_owner_permission(interaction) {
  try {
    const lang = await get_lang(interaction.client, interaction.guild.id);
    const user = interaction.user;
    const guild = interaction.guild;
    if (user.id != guild.ownerId) {
      const NO_PERMS_MESSAGE = await interaction.reply({
        content: texts[lang].no_perms,
        fetchReply: true,
      });
      return NO_PERMS_MESSAGE;
    } else {
      return true;
    }
  } catch (error) {
    lg.error("check_owner error:" + error);
  }
}
