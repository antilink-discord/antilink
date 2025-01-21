const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, MessageFlags, Message } = require('discord.js');
const moment = require("moment");
require("moment-duration-format");
const { version } = require('discord.js');
const Guild = require('../../Schemas/guildSchema')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Відкриває налаштування вашої гільдії'),

    // Визначення execute з параметром client
    async execute(interaction) {
        try{
            const guildData = await Guild.findOne({_id: interaction.guild.id})
            // Перевіряємо, чи доступне uptime через переданий client
            if(interaction.guild.ownerId == interaction.member.id) {
                const support_server = await interaction.client.guilds.cache.get(process.env.SUPPORT_SERVER_ID)
                
                if(!support_server && support_server==null) {
                    console.log('Не вдалось знайти сервер підтримки')
                }
                let userblocking;
                if(!guildData) {
                    console.log('Не знайдено налаштувань')
                    

                }
                console.log(guildData)
                const emoji_park = await get_emojis_for_message(support_server)
                if(guildData.userblocking==true) {
                    userblocking = 'Увімкнено'
                }else if(guildData.userblocking==false) {
                    userblocking ='Вимкнено'
                } 
                if(!guildData.logchannel && guildData.logchannel == null){guildData.logchannel="Немає"}
                if(!guildData.whitelist && guildData.whitelist == null){guildData.logchannel="Немає даних"}
                
                // Створюємо ембед
                const ExampleEmbed = new EmbedBuilder()

                .setColor(0x5e66ff)
                .setTitle(`${emoji_park.settings_emoji}Налаштування спільноти`)
                .setDescription('Ознайомтесь із командами та параметрами нижче.\n**Переглядати та змінювати налаштування може лише __власник серверу__.**')
                .addFields(
                    { name: `${emoji_park.logs_channel_emoji}Канал логів`, value: `${guildData.logchannel}` || "Немає", inline: true },
                    { name: `${emoji_park.whitelist_emoji}Білий список`, value: `${guildData.whitelist}` || "Немає даних", inline: true },
                    { name: 'Блокування запрошень та користувачів', value: userblocking || "Немає даних", inline: false },
                    // { name: 'Розробник', value: `Maksym_Tyvoniuk`, inline: false }
                )
                .setTimestamp();

        // Якщо вже є відповідь, редагуємо її

                await interaction.reply({ embeds: [ExampleEmbed], flags: MessageFlags.Ephemeral});
        
            } else {
                await interaction.reply({ content: 'У вас немає прав на використання цієї команди', flags: MessageFlags.Ephemeral})
                console.log('Немає прав власника серверу, неможна використовувати команду')
                return
            }
        }catch(error) {
            console.log('Помилка settings.js: '+error)
        }
        
        
    },
};

async function get_emojis_for_message(support_server) {
    try{
    return{
        settings_emoji: await support_server.emojis.cache.get('1266082934872604745'),
        logs_channel_emoji: await support_server.emojis.cache.get('1266073334030926008'),
        whitelist_emoji: await support_server.emojis.cache.get('1266073332152008704'),
    }
    }catch(error) {
        console.log('Не вдалось отримати емодзі get_emoji_for_message: '+ error)
        
    }
}