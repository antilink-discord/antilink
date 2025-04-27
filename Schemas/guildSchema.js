import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema({
	_id: {
		type: String,
		required: true,
		unique: true,
	},
	whitelist: {
		type: [String],
		default: [],
	},
	logchannel: {
		type: String,
		default: null,
	},
	blocking_enabled: {
		type: Boolean,
		default: false,
	},
	language: {
		type: String,
		default: 'en',
	},
    antiCrashMode: {
        type: Boolean,
        default: false
    }

}, { collection: 'collguilds' }); // Вказуємо колекцію вручну

const Guild = mongoose.model('Guild', guildSchema);

export default Guild
