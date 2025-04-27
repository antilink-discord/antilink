import { SlashCommandBuilder } from "@discordjs/builders";
import {
  EmbedBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import "moment-duration-format";
import Guild from "../../Schemas/guildSchema.js";
import {
  clear_guild_language_cache,
  get_lang,
  colors,
} from "../../utils/helper.js";
import texts from "../../utils/texts.js";
import { check_owner_permission } from "../../utils/settingsHandler.js";
import Logger from "../../utils/logs.js";
const lg = new Logger({ prefix: "Bot" });

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Змінює налаштування певного параметру у вашій гільдії")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("log_channel")
      .setDescription("Призначити канал логів на вашій гільдії")
      .addStringOption((option) =>
        option
          .setName("webhook")
          .setDescription("Виберіть вебхук для логування")
          .setRequired(true)
          .setAutocomplete(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("whitelist")
      .setDescription("Додає вказану роль в білий список")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Вибрана роль буде додана в білий список")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("captcha_channel")
      .setDescription("Призначає канал капчі на вашому сервері")
      .addChannelOption((option) =>
        option
          .setName("destination")
          .setDescription(
            "У вибраний канал буде надсилатись embed для верифікації",
          )
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("ban_users")
      .setDescription(
        "Вмикає на сервері функцію блокування користувачів та запрошень",
      )
      .addStringOption((option) =>
        option
          .setName("ban_users_option")
          .setDescription("Виберіть параметр")
          .setRequired(true)
          .addChoices(
            { name: "увімкнути", value: "true" },
            { name: "вимкнути", value: "false" },
          ),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("language")
      .setDescription("Змінює мову на вашій гільдії")
      .addStringOption((option) =>
        option
          .setName("set_language_option")
          .setDescription("Виберіть параметр")
          .setRequired(true)
          .addChoices(
            { name: "українська", value: "uk" },
            { name: "english", value: "en" },
          ),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("logchannel_delete")
      .setDescription("Видаляє канал логів на вашій гільдії"),
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("whitelist_remove")
      .setDescription("Видаляє вказану роль з білого списку")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Вибрана роль буде видалена з білого списку")
          .setRequired(true),
      ),
  );

export async function autocomplete(interaction) {
  try {
    const webhooks = await interaction.guild.fetchWebhooks();
    const focusedValue = interaction.options.getFocused();

    const filtered = Array.from(webhooks.values())
      .filter((wh) =>
        wh.name.toLowerCase().startsWith(focusedValue.toLowerCase()),
      )
      .slice(0, 25);

    const choices = filtered.map((wh) => {
      return {
        name: wh.name,
        value: wh.id,
      };
    });

    await interaction.respond(choices);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
  }
}

export async function execute(interaction) {
  if (interaction.options.getSubcommand() === "log_channel") {
    const lang = await get_lang(interaction.client, interaction.guild.id);

    const isOwner = await check_owner_permission(interaction);

    if (isOwner === true) {
      try {
        const guildData = await Guild.findOne({ _id: interaction.guild.id });
        const webhookId = interaction.options.getString("webhook");
        const webhooks = await interaction.guild.fetchWebhooks();
        const webhook = webhooks.get(webhookId);

        if (!webhook) {
          return await interaction.reply({
            content: "❌ Вебхук не знайдено!",
            ephemeral: true,
          });
        }
        const webhookUrl = `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`;

        if (webhookId === guildData.logchannel) {
          await interaction.reply({
            content: texts[lang].setup_logchannel_webhoook_isthesame,
            ephemeral: true,
          });
          return;
        }

        await Guild.updateOne(
          { _id: interaction.guild.id },
          { $set: { logchannel: webhookUrl } },
        );

        const SuccessfullEmbed = new EmbedBuilder()
          .setColor(colors.SUCCESSFUL_COLOR)
          .setThumbnail(
            interaction.guild.iconURL({ dynamic: true, size: 1024 }),
          )
          .setTitle(texts[lang].setup_successful)
          .setDescription(texts[lang].setup_logchannel_changed);

        await interaction.reply({
          embeds: [SuccessfullEmbed],
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        await interaction.reply(texts[lang].main_error_message);
      }
    }
  }

  if (interaction.options.getSubcommand() === "captcha_channel") {
    const lang = await get_lang(interaction.client, interaction.guild.id);
    const isOwner = await check_owner_permission(interaction);
    if (isOwner === true) {
      try {
        const verifyChannel = interaction.options.getChannel("destination");

        if (!verifyChannel) {
          return interaction.reply({
            content: `verifyChannel is not found`,
            ephemeral: true,
          });
        } else {
          let embed = new EmbedBuilder()
            .setColor("#9400FF")
            .setAuthor({
              name: "Captcha verification" /*iconURL: 'https://i.imgur.com/dEpXhnr.jpeg'*/,
            })
            .setTitle(`Ласкаво просимо на сервер! 👋`)
            .setDescription(
              "Щоб отримати доступ до каналів, підтвердіть,\n" +
                "що Ви не бот, виконавши звичайну капчу.\n" +
                "\n" +
                "✅  **Для верифікації потрібно:**\n" +
                "\n```" +
                "１. Натисніть кнопку “✔️ Верифікація”;\n" +
                "２. Введіть капчу у поле, що з’явиться;\n" +
                "３. Отримайте доступ до каналів.\n" +
                "```\n\n",
            )
            .setFooter({
              text: "З повагою, Адміністрація сервера. ❤️",
            });

          let btnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("verifyBtn")
              .setLabel("✔️ Верифікація")
              .setStyle(3),
          );

          await verifyChannel.send({
            embeds: [embed],
            components: [btnRow],
          });

          interaction.reply({
            content: `Система верифікації призначена в ${verifyChannel}.`,
            ephemeral: true,
          });
        }
      } catch (error) {
        await interaction.reply(texts[lang].main_error_message);
        lg.error(error);
        return;
      }
    }
  }

  if (interaction.options.getSubcommand() === "logchannel_delete") {
    const lang = await get_lang(interaction.client, interaction.guild.id);
    const isOwner = await check_owner_permission(interaction);
    if (isOwner === true) {
      try {
        let guildData = await Guild.findOne({ _id: interaction.guild.id });

        const SuccessfullEmbed = new EmbedBuilder()
          .setColor(0xaeffd8)
          .setThumbnail(
            interaction.guild.iconURL({ dynamic: true, size: 1024 }),
          )
          .setTitle(texts[lang].setup_successful)
          .setDescription(texts[lang].setup_logchannel_changed);

        if (!guildData) {
          guildData = new Guild({ _id: interaction.guild.id });
          await interaction.reply({
            embeds: [SuccessfullEmbed],
            flags: MessageFlags.Ephemeral,
          });
        }
        if (guildData) {
          await Guild.updateOne(
            { _id: interaction.guild.id },
            { $set: { logchannel: null } },
          );

          await interaction.reply({
            embeds: [SuccessfullEmbed],
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (error) {
        await interaction.reply(texts[lang].main_error_message);
        lg.error(error);
        return;
      }
    }
  }
  if (interaction.options.getSubcommand() === "whitelist") {
    const lang = await get_lang(interaction.client, interaction.guild.id);
    try {
      const role = interaction.options.getRole("role");

      let guildData = await Guild.findOne({ _id: interaction.guild.id });
      if (!guildData) {
        guildData = new Guild({ _id: interaction.guild.id });
        await guildData.save();
      }
      if (!guildData.whitelist.includes(role.id)) {
        guildData.whitelist.push(role.id);
        await guildData.save();
        const SuccessfullEmbed = new EmbedBuilder()
          .setColor(colors.SUCCESSFUL_COLOR)
          .setThumbnail(
            interaction.guild.iconURL({ dynamic: true, size: 1024 }),
          )
          .setTitle(texts[lang].setup_successful)
          .setDescription(
            texts[lang].setup_whitelist_changed.replace("${role}", role),
          );
        await interaction.reply({
          embeds: [SuccessfullEmbed],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: texts[lang].setup_whitelist_already_is,
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      await interaction.reply(texts[lang].main_error_message);
      lg.error("setup_whitelist error" + error);
      return;
    }
  }
  if (interaction.options.getSubcommand() === "language") {
    const isOwner = await check_owner_permission(interaction);
    const lang = await get_lang(interaction.client, interaction.guild.id);
    if (isOwner === true) {
      try {
        const language = interaction.options.getString("set_language_option");
        let guildData = await Guild.findOne({ _id: interaction.guild.id });

        if (!guildData) {
          guildData = new Guild({ _id: interaction.guild.id });
          await guildData.save();
        }
        await Guild.updateOne(
          { _id: interaction.guild.id },
          { $set: { language: language } },
        );
        await clear_guild_language_cache(
          interaction.client,
          interaction.guild.id,
        );

        const SuccessfullEmbed = new EmbedBuilder()
          .setColor(colors.SUCCESSFUL_COLOR)
          .setThumbnail(
            interaction.guild.iconURL({ dynamic: true, size: 1024 }),
          )
          .setTitle(texts[language].setup_successful)
          .setDescription(
            texts[language].setup_language_changed.replace("${lang}", language),
          );

        await interaction.reply({
          embeds: [SuccessfullEmbed],
          ephemeral: true,
        });
      } catch (error) {
        lg.error(error);
        await interaction.reply(texts[lang].main_error_message);
        return;
      }
    }
  }

  if (interaction.options.getSubcommand() === "ban_users") {
    const lang = await get_lang(interaction.client, interaction.guild.id);
    const isOwner = await check_owner_permission(interaction);
    if (isOwner === true) {
      try {
        const choice = interaction.options.getString("ban_users_option");
        let guildData = await Guild.findOne({ _id: interaction.guild.id });
        const isChoiceTrue = choice === "true";

        if (!guildData) {
          guildData = new Guild({ _id: interaction.guild.id });
          await guildData.save();
        }
        if (guildData.blocking_enabled === isChoiceTrue) {
          await interaction.reply(texts[lang].setup_banusers_isthesame);
          return;
        }
        if (choice === "true") {
          try {
            await Guild.updateOne(
              { _id: interaction.guild.id },
              { $set: { blocking_enabled: true } },
            );
            const SuccessfullEmbed = new EmbedBuilder()
              .setColor(colors.SUCCESSFUL_COLOR)
              .setThumbnail(
                interaction.guild.iconURL({ dynamic: true, size: 1024 }),
              )
              .setTitle(texts[lang].setup_successful)
              .setDescription(texts[lang].setup_banusers_enabled);
            await interaction.reply({
              embeds: [SuccessfullEmbed],
              flags: MessageFlags.Ephemeral,
            });
          } catch (error) {
            lg.error(error);
          }
        } else if (choice === "false") {
          try {
            await Guild.updateOne(
              { _id: interaction.guild.id },
              { $set: { blocking_enabled: false } },
            );
            const SuccessfullEmbed = new EmbedBuilder()
              .setColor(colors.SUCCESSFUL_COLOR)
              .setThumbnail(
                interaction.guild.iconURL({ dynamic: true, size: 1024 }),
              )
              .setTitle(texts[lang].setup_successful)
              .setDescription(texts[lang].setup_banusers_disabled);
            await interaction.reply({
              embeds: [SuccessfullEmbed],
              flags: MessageFlags.Ephemeral,
            });
          } catch (error) {
            lg.error(error);
          }
        }
      } catch (error) {
        lg.error(error);
      }
    }
  }

  if (interaction.options.getSubcommand() === "whitelist_remove") {
    const lang = await get_lang(interaction.client, interaction.guild.id);
    const isOwner = await check_owner_permission(interaction);
    if (isOwner === true) {
      try {
        const roleId = interaction.options.getRole("role").id;
        const role = await Guild.findOne({
          _id: interaction.guild.id,
          whitelist: { $in: [roleId] },
        });

        const SuccessfullEmbed = new EmbedBuilder()
          .setColor(colors.SUCCESSFUL_COLOR)
          .setThumbnail(
            interaction.guild.iconURL({ dynamic: true, size: 1024 }),
          )
          .setTitle(texts[lang].setup_successful)
          .setDescription(
            texts[lang].setup_role_removed.replace("${role}", roleId),
          );
        if (!role) {
          await interaction.reply({
            content: texts[lang].setup_role_not_found,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await Guild.updateOne(
            { _id: interaction.guild.id },
            { $pull: { whitelist: roleId } },
          );
          await interaction.reply({
            embeds: [SuccessfullEmbed],
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (error) {
        console.error(error);
        await interaction.reply(texts[lang].main_error_message);
      }
    }
  }
}
