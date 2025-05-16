import { SlashCommandBuilder } from "@discordjs/builders";
import {
  EmbedBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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
      .setName("unverifed_role")
      .setDescription("Призначити роль до верифікації")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Вибрана роль буде призначатись після приєднання користувача")
          .setRequired(true),
      ),
  )

  .addSubcommand((subcommand) =>
    subcommand
      .setName("verifed_role")
      .setDescription("Призначити роль після верифікації")
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("Вибрана роль буде призначатись після верифікації")
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
      .setName("captcha_system")
      .setDescription(
        "Вмикає на сервері верифікацію користувачів при приєднанні",
      )
      .addStringOption((option) =>
        option
          .setName("captcha_option")
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
        await interaction.deferReply({ ephemeral: true});
        const verifyChannel = interaction.options.getChannel("destination");

        if (!verifyChannel) {
          return interaction.editReply({
            content: `verifyChannel is not found`,
            ephemeral: true,
          });
        } else {
          let embed = new EmbedBuilder()
            .setColor("#9400FF")
            .setAuthor({
              name: texts[lang].verification_embed_author, iconURL: interaction.guild.iconURL(),
            })
            .setTitle(texts[lang].verification_title)
            .setDescription(texts[lang].verification_description)
            .setFooter({
              text: "Powered by AntiLink",
            });

          let btnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('verifyBtn')
              .setLabel('❌Disabled')
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
          );
          const guildData = await Guild.findOne({ _id: interaction.guild.id});

          if(guildData?.verificationSystem?.captcha_channel_id && guildData?.verificationSystem?.captcha_embed_message_id) {
            const verificationChannel = await interaction.guild.channels.fetch(guildData.verificationSystem.captcha_channel_id);
            console.log(verificationChannel)
            const message = await verificationChannel.messages.fetch(guildData.verificationSystem.captcha_embed_message_id).catch(e => {
              lg.error(e);
              return
            });
            if(message) {
              await message.delete().catch(error => {
                lg.error(error)
              }) 
            }
            
            
          }
          const sentMessage = await verifyChannel.send({
            embeds: [embed],
            components: [btnRow],
          });


          await Promise.all([
            Guild.updateOne(
              { _id: interaction.guild.id, "verificationSystem.0": { $exists: true } },
              {
                $set: {
                  "verificationSystem.captcha_channel_id": verifyChannel.id,
                  "verificationSystem.captcha_embed_message_id": sentMessage.id
                }
              }
            ).then(async (result) => {
              if (result.matchedCount === 0) {
  
                await Guild.updateOne(
                  { _id: interaction.guild.id },
                  {
                    $set: {
                      "verificationSystem.captcha_channel_id": verifyChannel.id,
                      "verificationSystem.captcha_embed_message_id": sentMessage.id
                    }
                  },
                  { upsert: true }
                );
  
              }
            }),

            interaction.editReply({
              content: `Система верифікації призначена в ${verifyChannel}.`,
              ephemeral: true,
            })
          ])
        }
      } catch (error) {
        await interaction.editReply(texts[lang].main_error_message);
        lg.error(error);
        return;
      }
    }
  }

  if (interaction.options.getSubcommand() === "captcha_system") {
    const lang = await get_lang(interaction.client, interaction.guild.id);
    const isOwner = await check_owner_permission(interaction);
    if (isOwner === true) {
      try {
        const choice = interaction.options.getString("captcha_option");
        let guildData = await Guild.findOne({ _id: interaction.guild.id });
        const isChoiceTrue = choice === "true";

        if (!guildData) {
          guildData = new Guild({ _id: interaction.guild.id });
          await guildData.save();
        }
        if (guildData.verificationSystem.isEnabled === isChoiceTrue) {
          await interaction.reply(texts[lang].setup_banusers_isthesame);
          return;
        }
        if (choice === "true") {
          try {
            await Guild.updateOne(
              { _id: interaction.guild.id },
              { $set: { 'verificationSystem.isEnabled': true } },
            );

            const newButton = new ButtonBuilder()
              .setCustomId("verifyBtn")
              .setLabel("✔️ Verify")
              .setStyle(3)

            const row = new ActionRowBuilder().addComponents(newButton);
            const messageChannel = await interaction.guild.channels.fetch(guildData?.verificationSystem.captcha_channel_id).catch(e => lg.error(`Помилка при пошуку каналу:`, e))

            await messageChannel.messages.fetch(guildData?.verificationSystem.captcha_embed_message_id)
              .then(messageToEdit => messageToEdit.edit({ components: [row] }))
              .catch(error => console.error('Помилка при редагуванні повідомлення:', error));

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
              { $set: { 'verificationSystem.isEnabled': false } },
            );

            const newButton = new ButtonBuilder()
              .setCustomId("verifyBtn")
              .setLabel("❌Disabled")
              .setStyle(ButtonStyle.Danger)
              .setDisabled(true)
            const row = new ActionRowBuilder().addComponents(newButton);
            const messageChannel = await interaction.guild.channels.fetch(guildData?.verificationSystem.captcha_channel_id).catch(e => lg.error(`Помилка при пошуку каналу:`, e))
            lg.debug(messageChannel)
            await messageChannel.messages.fetch(guildData?.verificationSystem.captcha_embed_message_id)
              .then(messageToEdit => messageToEdit.edit({ components: [row] }))
              .catch(error => console.error('Помилка при редагуванні повідомлення:', error));


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

  if (interaction.options.getSubcommand() === "verifed_role") {
    const lang = await get_lang(interaction.client, interaction.guild.id);
    try {
      const role = interaction.options.getRole("role");

      let guildData = await Guild.findOne({ _id: interaction.guild.id });
      if (!guildData) {
        guildData = new Guild({ _id: interaction.guild.id });
        await guildData.save();
      }
      if (guildData.verificationSystem?.verifedRoleId !== role.id) {
        guildData.verificationSystem.verifedRoleId = (role.id);
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
      lg.error("verifedRoleId error" + error);
      return;
    }
  }

  if (interaction.options.getSubcommand() === "unverifed_role") {
    const lang = await get_lang(interaction.client, interaction.guild.id);
    try {
      const role = interaction.options.getRole("role");

      let guildData = await Guild.findOne({ _id: interaction.guild.id });
      if (!guildData) {
        guildData = new Guild({ _id: interaction.guild.id });
        await guildData.save();
      }
      if (guildData.verificationSystem?.unvefivedRoleID !== role.id) {
        guildData.verificationSystem.unvefivedRoleID = (role.id);
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
      lg.error("unverifed_role error" + error);
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
