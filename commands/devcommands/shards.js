import 'dotenv/config';
import { SlashCommandBuilder } from "discord.js";
import { shardManager } from '../shardManager.js'; // Імпортуємо менеджер

export const data = new SlashCommandBuilder()
    .setName('shards')
    .setDescription('Показує статус усіх шардів');

export async function execute(interaction) {
    if (interaction.user.id !== '558945911980556288') {
        return await interaction.reply('У вас немає доступу до цієї команди.');
    }

    try {
        if (!shardManager) {
            return await interaction.reply('Менеджер шардів не ініціалізований.');
        }

        // Отримуємо інформацію про всі шарди
        const shardInfo = await shardManager.fetchClientValues('guilds.cache.size');
        
        const statusMessages = shardInfo.map((guildCount, shardId) => {
            const shard = shardManager.shards.get(shardId);
            const status = shard?.status || 'unknown';
            return `Шард ${shardId}: ${statusToText(status)} | Серверів: ${guildCount}`;
        });

        await interaction.reply({
            content: `**Статус шардів:**\n${statusMessages.join('\n')}`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Помилка команди shards:', error);
        await interaction.reply('Сталася помилка при отриманні статусу шардів.');
    }
}

function statusToText(status) {
    const statusMap = {
        'ready': '🟢 Онлайн',
        'disconnected': '🔴 Оффлайн',
        'connecting': '🟡 Підключення',
        'identifying': '🟣 Ідентифікація',
        'resuming': '🔵 Відновлення'
    };
    return statusMap[status] || '❓ Невідомо';
}