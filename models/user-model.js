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
    aboutme:String,

    skills:{
       type: [String],
       default:[]
    },
   

      profileImage: {

        data: Buffer,

        contentType: String

    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    

    isActive: {
    type: Boolean,
    default: true
},
});

module.exports = mongoose.model("user",userSchema);

