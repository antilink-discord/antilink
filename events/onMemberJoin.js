import { Events } from 'discord.js';
import 'dotenv/config';
import Logger from '../utils/logs.js';
import Guild from '../Schemas/guildSchema.js';
import User from '../Schemas/userSchema.js'; 

const lg = new Logger();

export default {
    name: Events.GuildMemberAdd,
    once: false,
    async execute(member) {
        try {

            const [userData, guildData] = await Promise.all([
                await Guild.findOne({ _id: member.guild.id }),
                await User.findOne({ _id: member.id })
            ])
           
            
            if (!guildData || !userData) return;
            
            lg.debug(`User ${member.id} has ${userData.warns} warnings.`);

            if (userData.warns >= 3 && guildData.blockOnJoin) {
                lg.info(`User ${member.id} has been blocked due to excessive warnings.`);
                await member.ban().catch(e => lg.error(e))
            }
        } catch (error) {
            lg.error(`Error handling GuildMemberAdd: ${error}`);
        }
    }
};