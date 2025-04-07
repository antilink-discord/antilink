import { SlashCommandBuilder } from 'discord.js';
import util from 'util';
import Guild from '../../Schemas/guildSchema.js';
import User from '../../Schemas/userSchema.js'
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
    await interaction.deferReply({ ephemeral: true });

    try {
        // Створюємо контекст для виконання коду
        const context = {
            // Моделі
            Guild,
            User,
            
            // Об'єкти Discord
            interaction,
            client: interaction.client,
            channel: interaction.channel,
            guild: interaction.guild,
            
            // Утиліти
            util,
            
            // Додаткові змінні
            db: interaction.client.db || null,
            
            // Додайте інші необхідні змінні
        };

        // Створюємо асинхронну функцію з контекстом
        const asyncFunc = async (context) => {
            const { Guild, interaction, client, db, ...rest } = context;
            try {
                return await eval(code);
            } catch (e) {
                return Promise.reject(e);
            }
        };

        // Виконуємо код
        const result = await asyncFunc(context);

        // Форматуємо вивід
        const output = util.inspect(result, { 
            depth: 2,
            maxStringLength: 500,
            colors: false
        });

        await interaction.editReply({
            content: `📥 **Код:**\n\`\`\`js\n${code}\n\`\`\`\n📤 **Результат:**\n\`\`\`js\n${output.slice(0, 1900)}\n\`\`\``
        });
    } catch (error) {
        await interaction.editReply({
            content: `❌ **Помилка:**\n\`\`\`js\n${error.stack || error}\n\`\`\``
        });
    }
}