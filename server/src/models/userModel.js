const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    color: {
      type: String,
      required: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    totalConnections: {
      type: Number,
      default: 0,
    },
    messagesSent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
