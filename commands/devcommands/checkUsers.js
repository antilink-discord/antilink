import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../Schemas/userSchema.js';

export const data = new SlashCommandBuilder()
    .setName('check')
    .setDescription('Перевірити учасників гільдії на наявність попереджень')
    .addStringOption(option =>
        option.setName('guild_id')
            .setDescription('Айді гільдії')
            .setRequired(true),
    );

    export async function execute(interaction) {
        try {
          
            console.log('Guild ID:', interaction.guild.id);
            console.log('User ID:', interaction.user.id);
            if (interaction.guild.id !== '1350582961904550022' || interaction.user.id !== '558945911980556288') {
                return await interaction.reply({ 
                    content: 'У вас немає доступу до цієї команди.', 
                    ephemeral: true 
                });
            }
            
            const guildId = interaction.options.getString('guild_id');
            const guild = await interaction.client.guilds.fetch(guildId);
            const guildMembers = await guild.members.fetch();
    

            const warnedUsers = await User.find({ warns: { $gt: 0 } });
            console.log('Warned Users:', JSON.stringify(warnedUsers, null, 2));
    

            const warnedMembers = warnedUsers.filter(user => {
                console.log(`Checking user ID: ${user._id}`); 
                return guildMembers.has(user._id); 
            });
            console.log('Warned Members:', warnedMembers);
    
            if (warnedMembers.length === 0) {
                return await interaction.reply({ 
                    content: 'У цій гільдії немає учасників із попередженнями.', 
                    ephemeral: true 
                });
            }
    
            const embed = new EmbedBuilder()
                .setTitle('📋 Список учасників з попередженнями')
                .setColor('#ff0000')
                .setDescription(
                    warnedMembers.map(user => `👤 <@${user._id}> - ⚠️ Попереджень: ${user.warns}`).join('\n')
                )
                .setFooter({ text: `Гільдія: ${guild.name}` });
    
            await interaction.deferReply(); 
            await interaction.editReply({ embeds: [embed] }); 
    
        } catch (error) {
            console.error('Помилка при виконанні команди /check:', error);
            await interaction.reply({ 
                content: 'Сталася помилка при перевірці учасників.', 
                ephemeral: true 
            });
        }
    }
    