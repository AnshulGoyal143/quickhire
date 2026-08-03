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

    skills:[String],
    resume:{
        type:String
    },

    profileImage:String,
    createdAt:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model("user",userSchema);