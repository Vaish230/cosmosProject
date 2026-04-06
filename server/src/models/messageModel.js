const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fromUserName: {
    type: String,
    required: true,
  },
  fromUserColor: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, "Message cannot exceed 500 characters"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 7 * 24 * 60 * 60,
  },
});

messageSchema.index({ roomId: 1, timestamp: -1 });

module.exports = mongoose.model("Message", messageSchema);
