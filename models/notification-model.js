const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["User", "Company", "Job", "Application", "Alert"],
        required: true
    },

    icon: {
        type: String,
        default: "ri-notification-3-line"
    },

    isRead: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("notification", notificationSchema);