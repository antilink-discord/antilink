import { SlashCommandBuilder } from 'discord.js';
import util from 'util';

export const data = new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Виконати JavaScript-код')
    .addStringOption(option =>
        option.setName('code')
            .setDescription('Код для виконання')
            .setRequired(true)
    );

export async function execute(interaction) {
    const allowedUserId = '558945911980556288';

    if (interaction.user.id !== allowedUserId) {
        return interaction.reply({ content: '⛔ У вас немає доступу до цієї команди!', ephemeral: true });
    }

    const code = interaction.options.getString('code');

    try {
        // Додаємо `db` до контексту eval, якщо MongoDB підключено
        const db = interaction.client.db || null;
        const result = await (async () => eval(code))();
        const output = util.inspect(result, { depth: 2 });

        await interaction.reply(`📥 **Вхідний код:**\n\`\`\`js\n${code}\n\`\`\`\n📤 **Результат:**\n\`\`\`js\n${output}\n\`\`\``);
    } catch (error) {
        await interaction.reply(`❌ **Помилка:**\n\`\`\`js\n${error}\n\`\`\``);
    }
}
