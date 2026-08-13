const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    fullName:{
        type:String,
        required:true
    },
    adminEmail:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    profileImage:{
        type:String,
        default:"default-admin.png"
    },
    role:{
        type:String,
        default:"admin"
    },
    isActive:{
        type:Boolean,
        default:true
    },

},{timestamps:true});

module.exports = mongoose.model("admin",adminSchema);