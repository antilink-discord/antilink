import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Events,
} from "discord.js";
import {
  colors,
  get_lang,
} from "../utils/helper.js";
import {
  user_failed_captcha,
  user_solved_captcha
}from "../utils/guildLogs.js";
import dotenv from "dotenv";
import "dotenv/config";
import svgCaptcha from "svg-captcha";
import fs from "fs";
import sharp from "sharp";
import Logger from "../utils/logs.js";
const lg = new Logger("Bot");
import Guild from "../Schemas/guildSchema.js";
import texts from "../utils/texts.js";


dotenv.config();
const CAPTCHA_STORAGE = new Map();

const generateCaptchaImage = () => {
  const captcha = svgCaptcha.create({
    size: 4,
    noise: 3,
    width: 350,
    height: 100,
    color: true,
    background: "#1a1a1a",
    fontSize: 70,
    ignoreChars:
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-={}[]|;:\"'<>,.?/",
  });

  return captcha;
};

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      const lang = await get_lang(interaction.client, interaction.guild.id);
      let guildData = await Guild.findOne({ _id: interaction.guild.id });
      
      if (interaction.isButton()) {
        if (interaction.customId === "verifyBtn") {
          if(!guildData.verificationSystem?.verifedRoleId) return 0;
          const verifyRole = await interaction.guild.roles.fetch(guildData?.verificationSystem?.verifedRoleId);
          
          if (interaction.member.roles.cache.has(verifyRole.id) || interaction.user.id === interaction.guild.ownerId) {
            return interaction.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor("#ffffff")
                  .setTitle(texts[lang].verification_already_verifed),
              ],
              ephemeral: true,
            });
          }

          const { text, data: captchaImage } = generateCaptchaImage();
          CAPTCHA_STORAGE.set(interaction.user.id, text);

          const filePath = `captcha_${interaction.user.id}.png`;
          await sharp(Buffer.from(captchaImage)).png().toFile(filePath);

          let enterBtnRow = new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setCustomId("openModal")
              .setLabel("Ввести")
              .setStyle(3),
          ]);

          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#ffffff")
                .setTitle(texts[lang].verification_embed_author)
                .setDescription(texts[lang].verification_answer_description)
                .setFooter({ text: texts[lang].verification_answer_footer })
                .setImage(`attachment://${filePath}`),
            ],
            components: [enterBtnRow],
            files: [{ attachment: filePath, name: filePath }],
            ephemeral: true,
          });

          setTimeout(() => {
            fs.unlinkSync(filePath);
          }, 5000);
        }

        if (interaction.customId === "openModal") {
          const modal = new ModalBuilder()
            .setCustomId("captcha-modal")
            .setTitle(texts[lang].verification_embed_author)
            .addComponents([
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("captcha-input")
                  .setLabel(texts[lang].verification_put_captcha)
                  .setStyle(1)
                  .setMaxLength(4)
                  .setPlaceholder("1234")
                  .setRequired(true),
              ),
            ]);

          await interaction.showModal(modal);
        }
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId === "captcha-modal") {
          const response = interaction.fields
            .getTextInputValue("captcha-input")
            .trim();
          const correctAnswer = CAPTCHA_STORAGE.get(interaction.user.id)?.trim();

          if (!correctAnswer) {
            return interaction.reply({
              content: texts[lang].verification_old_captcha,
              ephemeral: true,
            });
          }

          let captchaMessage;

          if (response === correctAnswer) {
            captchaMessage = new EmbedBuilder()
              .setColor("#ffffff")
              .setTitle(texts[lang].verification_successful_title)
              .setDescription(texts[lang].verification_successful_description);

              
            const [verifyRole, unverifedRole] = await Promise.all([
              interaction.guild.roles.fetch(guildData?.verificationSystem?.verifedRoleId),
              interaction.guild.roles.fetch(guildData?.verificationSystem.unvefivedRoleID)
            ]).catch(error => {
              lg.error(error);
            });
  

            if (unverifedRole) {
              await interaction.member.roles
                .remove(unverifedRole)
                .catch((e) => lg.error(e));
            }

            if (verifyRole) {
              
              await interaction.member.roles
                .add(verifyRole)
                .catch((e) => lg.error('Виникла помилка при спробі видати роль:', e));
            }

            CAPTCHA_STORAGE.delete(interaction.user.id);

            await user_solved_captcha(interaction.user, interaction.guild, correctAnswer, response);
            await interaction.reply({
              embeds: [captchaMessage],
              ephemeral: true,
            });
          } else {
            captchaMessage = new EmbedBuilder()
              .setColor(colors.ERROR_COLOR)
              .setTitle(texts[lang].verification_failed_title)
              .setDescription(
                texts[lang].verification_failed_description,
              );

            await Promise.all([
              interaction
                .reply({ embeds: [captchaMessage], ephemeral: true })
                .catch((error) => {
                  lg.error(error);
                }),
              user_failed_captcha(interaction.user, interaction.guild, correctAnswer, response),
            ]);
          }
        }
      }
    } catch (error) {
      lg.error("Error in interaction create event:", error);
    }
  },
};
