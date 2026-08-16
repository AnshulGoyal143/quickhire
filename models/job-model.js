const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    company :{
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
        required : true
    },

    jobTitle: String,
    jobCategory:String,
    jobType: String,
    experience: String,
    salary: String,
    companyLocation: String,
    jobDescription : String,
    addSkills : [String],
    vacancies : Number,
    deadline : Date,
    workMode : String,
    education : String,
    Gender : String,
    status: {
    type: String,
    enum: ["Draft", "Active", "Expired"],
    default: "Draft"
}
},{timestamps : true});

 module.exports = mongoose.model("job",jobSchema);