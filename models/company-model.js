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
    

    companyProfile:{
        
        data: Buffer,

        contentType: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    profileViews: {
        type : [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user"
            }
        ],
        default: []
    }
    

});

module.exports = mongoose.model("company", companySchema);