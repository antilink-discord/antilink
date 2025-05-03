import mongoose from "mongoose";

const guildSchema = new mongoose.Schema(
  {
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
      default: "en",
    },
    antiCrashMode: {
      type: Boolean,
      default: false,
    },
    verificationSystem: {
      captcha_channel_id: {
        type: String,
      },
      captcha_embed_message_id: {
        type: String,
      },
      isEnabled: {
        type: Boolean,
        default: true,
      },
      verifedRoleId: {
        type: String,
      },
      unvefivedRoleID: {
        type: String,
      },
    }, 
  },
  { collection: "collguilds" },
);

const Guild = mongoose.model("Guild", guildSchema);

export default Guild;