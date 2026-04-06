const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ["proximity_connect", "proximity_disconnect", "message_sent"],
    required: true,
  },
  userIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  sessionId: {
    type: String,
    required: true,
  },
  metadata: {
    duration: Number,
    messageCount: Number,
    distance: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

analyticsSchema.index({ eventType: 1, timestamp: -1 });
analyticsSchema.index({ userIds: 1, timestamp: -1 });

module.exports = mongoose.model("Analytics", analyticsSchema);
