import 'dotenv/config';
import { SlashCommandBuilder } from "discord.js";
import { manager } from '../../shardManager.js';

export const data = new SlashCommandBuilder()
    .setName('shards')
    .setDescription('Показує статус усіх шардів');

export async function execute(interaction) {
    if (interaction.user.id !== '558945911980556288') {
        return await interaction.reply('У вас немає доступу до цієї команди.');
    }

    try {
        if (!manager) {
            return await interaction.reply('Менеджер шардів не ініціалізований.');
        }

        const statusMessages = [];

        for (const shard of manager.shards.values()) {
            const status = shard.ready ? '🟢 Онлайн' : '🔴 Оффлайн';
            const guilds = await shard.fetchClientValue('guilds.cache.size');
            statusMessages.push(`Шард ${shard.id}: ${status} | Серверів: ${guilds}`);
        }

        await interaction.reply({
            content: `**Статус шардів:**\n${statusMessages.join('\n')}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Помилка команди shards:', error);
        await interaction.reply('Сталася помилка при отриманні статусу шардів.');
    }
}