import 'dotenv/config'
import { SlashCommandBuilder } from "discord.js";

 
    export const data =  new SlashCommandBuilder()
        .setName('shards')
        .setDescription('Показує статус усіх шардів')

    export async function execute(interaction) {
        // Перевірка, чи користувач має право виконати команду
        if (interaction.user.id === '558945911980556288') {
            try {
                const manager = interaction.client.shardManager; // Отримати менеджер шардів з клієнта
                
                if (!manager) {
                    return await interaction.reply('Не вдалося отримати менеджер шардів.');
                }

                const statusMessages = [];

                // Отримання статусу для кожного шарда
                manager.shards.forEach(shard => {
                    const status = shard.status;
                    const onlineStatus = (status === 'ready') ? 'Онлайн' : 'Оффлайн'; // Оцініть статус
                    statusMessages.push(`Шард ${shard.id}: ${onlineStatus}`);
                });

                // Відправлення статусу у відповідь
                await interaction.reply(`**Статус усіх шардів:**\n${statusMessages.join('\n')}`);
            } catch (error) {
                console.log(error);
                await interaction.reply('Сталася помилка при отриманні статусу шардів.');
            }
        } else {
            await interaction.reply('У вас немає доступу до цієї команди.');
        }
    }