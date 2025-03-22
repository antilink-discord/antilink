import { Events } from 'discord.js';
import Logger from '../utils/logs.js';

const lg = new Logger();

export default {
    name: Events.GuildMemberUpdate,
    once: false,
    async execute(oldMember, newMember) {
        try {
            const guild = newMember.guild;
            const userId = newMember.id;

  
            const updatedMember = await guild.members.fetch(userId);
            lg.info(`🔄 Оновлено кеш для користувача: ${updatedMember.user.tag}`);

        } catch (error) {
            lg.error('❌ Помилка при оновленні кешу учасника:', error);
        }
    }
};
