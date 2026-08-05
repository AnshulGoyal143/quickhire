const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    companyName: String,
    industry: String,
    companyEmail: String,
    password: String,

    phone: String,
    companySize: String,
    foundedYear: Number,

    website: String,
    location: String,
    about: String,
    

    companyProfile: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("company", companySchema);