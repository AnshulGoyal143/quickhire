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
    confirmPassword:{
        type: String,
        require: true
    },
     profileImage: {
        data: Buffer,
        contentType: String
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