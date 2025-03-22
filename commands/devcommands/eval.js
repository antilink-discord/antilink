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
    const allowedUserId = '558945911980556288'; // ⚠️ Введіть свій Discord ID

    if (interaction.user.id !== allowedUserId) {
        return interaction.reply({ content: '⛔ У вас немає доступу до цієї команди!', ephemeral: true });
    }

    const code = interaction.options.getString('code');

    try {
        let result = eval(code);

        // Якщо результат – проміс, очікуємо його виконання
        if (result instanceof Promise) {
            result = await result;
        }

        // Форматуємо результат
        const output = util.inspect(result, { depth: 2 });

        // Відправляємо відповідь
        await interaction.reply(`📥 **Вхідний код:**\n\`\`\`js\n${code}\n\`\`\`\n📤 **Результат:**\n\`\`\`js\n${output}\n\`\`\``);
    } catch (error) {
        await interaction.reply(`❌ **Помилка:**\n\`\`\`js\n${error}\n\`\`\``);
    }
}
