const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullname:String,
    username:String,
    email:String,
    password:String,

    mobile:String,
    dob:Date,
    gender:String,

    address:String,
    city:String,
    state:String,
    pincode:String,

    skills:{
       type: [String],
       default:[]
    },
    resume:{
        data: Buffer,
        contentType: String,
        originalName:String,
    },

      profileImage: {

        data: Buffer,

        contentType: String

    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    aboutme:String
});

module.exports = mongoose.model("user",userSchema);

