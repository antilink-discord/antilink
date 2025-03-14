import { Events, AuditLogEvent } from 'discord.js';
import Guild from '../Schemas/guildSchema.js';
import Logger from '../utils/logs.js';
import { add_role_update_to_cache, check_role_update_cache, delete_role_update_cache } from '../utils/antinuke.js';
import { freezeUser } from './onChannelCreate.js';

const lg = new Logger();
const CREATE_LIMIT = 3; // Ліміт створень перед покаранням

export default {
    name: Events.GuildRoleCreate,
    once: false,
    async execute(role) {
        console.log(`🔥 Роль створена: ${role.name}`);
        await handleRoleAction(role, 'RoleCreate', CREATE_LIMIT, 'Антикраш: масове створення ролей');
    }
};

// 🔹 **Обробка дії (створення ролі)**
async function handleRoleAction(role, type, limit, reason) {
    setImmediate(async () => {
        try {
            const guild = role.guild;
            const guildId = guild.id;
            const guildData = await Guild.findOne({ _id: guildId }).lean();

            if (!guildData || !guildData.antiCrashMode) return;

            const fetchedLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 }).catch(() => null);
            if (!fetchedLogs) return lg.warn(`Немає логів аудиту для події ${type}.`);

            const logEntry = fetchedLogs.entries.first();
            if (!logEntry || Date.now() - logEntry.createdTimestamp > 5000) return;

            const executor = logEntry.executor;
            if (!executor) return lg.warn('❌ Не вдалося отримати користувача з логів.');

            let member = guild.members.cache.get(executor.id) || await guild.members.fetch(executor.id).catch(() => null);
            if (!member) return;

            const whitelist_data = guildData?.antinuke_whitelist ?? [];
            if (member.roles.cache.some(role => whitelist_data.includes(role.id)) || member.id == guild.ownerId) return;

            await add_role_update_to_cache(type, guild, executor.id, limit, reason);
            const actionCount = await check_role_update_cache(type, executor.id);

            if (actionCount >= limit) {
                if (!isTimedOut(member)) await freezeUser(guild, executor.id);
                await delete_role_update_cache(type, executor.id);
            }

        } catch (error) {
            console.error(`❌ Помилка при обробці ${type}:`, error);
        }
    });
}

const isTimedOut = member => member.communicationDisabledUntilTimestamp > Date.now();
