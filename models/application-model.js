const mongoose = require('mongoose');

const applicationShema = new mongoose.Schema({

    // kis user n apply kra h
    applicant:{
        type: mongoose.Schema.ObjectId,
        ref: "user",
        required: true
    },

    // kis job k ley apply kra h
    job:{
        type:mongoose.Schema.ObjectId,
        ref:"job",
        required:true
    },

    // kis company ki job  h
    company:{
        type:mongoose.Schema.ObjectId,
        ref:"company",
        required:true
    },

    coverLetter:{
        type: String
    },

    status:{
        type:String,
        enum:["Applied","Under Review","Shortlisted","Rejected","Selected"],
        default:"Applied"
    },

    appliedAt:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model("application",applicationShema);