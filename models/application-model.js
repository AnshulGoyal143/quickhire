const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({

    // kis user n apply kra h
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },

    // kis job k ley apply kra h
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "job",
        required: true
    },

    // kis company m apply krah
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
        required: true
    },

    linkedin: {
        type: String,
        trim: true
    },

    experienceLevel: {
        type: String
    },

    totalExperience: {
        type: String
    },

    previousJobTitle: {
        type: String
    },

    previousCompany: {
        type: String
    },

    employmentType: {
        type: String
    },

    coverLetter: {
        type: String
    },

    status: {
        type: String,
        enum: [
            "Applied",
            "Under Review",
            "Shortlisted",
            "Rejected",
            "Selected"
        ],
        default: "Applied"
    },

    appliedAt: {
        type: Date,
        default: Date.now
    },

    expectedSalary: {
    type: String
},

noticePeriod: {
    type: String
},

relocate: {
    type: Boolean
},

availability: {
    type: String
},

portfolio: {
    type: String
},

 resume:{
        data: Buffer,
        contentType: String,
        originalName:String,
    },



});

module.exports = mongoose.model("application",applicationSchema);