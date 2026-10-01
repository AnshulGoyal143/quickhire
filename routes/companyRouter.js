const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const path = require('path');
const companyModel = require('../models/company-model');
const jobModel = require('../models/job-model');
const applicationModel = require('../models/application-model');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage});


//---------------------------login--------------------
router.get("/login", (req, res) => {
   res.render("company/companyLogin");
});

router.post("/login", async (req, res) => {
   let { companyEmail, password } = req.body;

   let company = await companyModel.findOne({ companyEmail });
   if (!company) return res.status(500).send("Something went wrong");

   bcrypt.compare(password, company.password, function (err, result) {

      if (result) {
         let token = jwt.sign({ companyEmail: companyEmail ,companyid: company._id}, process.env.COMPANY_JWT_SECRET);
         res.cookie("companyToken", token);
        return res.redirect("/company/companyDashboard");

      }
      res.status(401).send("Something went wrong")
   })
});

//--------------------register----------------------------
router.get("/register", (req, res) => {
   res.render("company/companyRegister")
});

router.post("/register", async (req, res) => {
   let { companyEmail, companyName, password, phone } = req.body;

   let company = await companyModel.findOne({ companyEmail });
   if (company) return res.status(500).send("Account already exists");

   bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
         let createdCompany = await companyModel.create({
           companyEmail, 
           companyName, 
           password :hash,
            phone
         });


         let token = jwt.sign({ companyEmail: companyEmail, companyid: createdCompany._id }, process.env.COMPANY_JWT_SECRET);
         res.cookie("companyToken", token);
         res.redirect("/company/companyDashboard")
      })
   })

});

// --------------------logout------------------
router.get("/logout", (req, res) => {
    res.cookie("companyToken", "");
    res.redirect("/company/login");
});
//  ----------------------  company dashboard ----------------------------

router.get("/companyDashboard", isCompanyLoggedIn, async (req, res) => {

    const applications = await applicationModel
        .find({ company: req.company._id })
        .populate("applicant")
        .populate("job")
        .sort({ appliedAt: -1 })
        .limit(5);

        // total applicants
     const totalApplicants = await applicationModel.countDocuments({
        company: req.company._id
    });

    // active jobs 
    const activeJobs = await jobModel.countDocuments({
        company: req.company._id,
        deadline: { $gte: new Date() }
    });

    // shortlisted
    const shortlistedApplication = await applicationModel.countDocuments({
        company: req.company._id,
        status: "Shortlisted"
    });

    // Profile view
   const profileViews = req.company.profileViews
    ? req.company.profileViews.length
    : 0;

    res.render("company/companyDashboard", {
        applications,
        shortlistedApplication,
        activeJobs,
        totalApplicants,
        profileViews
        
    });

});

// ------------------- Company profile --------------

router.get("/companyMyProfile",isCompanyLoggedIn, (req, res) => {
   res.render("company/companyMyProfile");
});


//---------------application -----------
router.get("/companyApplications",isCompanyLoggedIn, async (req, res) => {

     const applications = await applicationModel
        .find({ company: req.company._id })
        .populate("applicant")
        .populate("job")
        .sort({ appliedAt: -1 })

         // Total Applications
    const totalApplications = await applicationModel.countDocuments({
        company: req.company._id
    });



    // Under Review
    const reviewApplications = await applicationModel.countDocuments({
        company: req.company._id,
        status: "Under Review"
    });


    // In Progress
    const inProgressApplications = await applicationModel.countDocuments({
        company: req.company._id,
        status: { $in: ["Shortlisted", "Selected"] }
    });


    // Rejected
    const rejectedApplications = await applicationModel.countDocuments({
        company: req.company._id,
        status: "Rejected"
    });

    // shortlisted
    const shortlistedApplication = await applicationModel.countDocuments({
        company: req.company._id,
        status: "Shortlisted"
    });

   res.render("company/companyApplications",{
        applications,
        totalApplications,
        reviewApplications,
        inProgressApplications,
        rejectedApplications,
    shortlistedApplication});
});

// ------------------APPLICATION DETAILS-------
router.get("/companyApplicationDetails/:id",isCompanyLoggedIn, async (req, res) => {

     const application = await applicationModel
        .findOne({ _id: req.params.id,company: req.company._id })
        .populate("applicant")
        .populate("job")
        if(!application){
            return res.status(404).send("Application not found");
        }
   res.render("company/companyApplicationDetails",{application});
});

// -------------TO FETCH RESUME----------
router.get("/application-resume/:id", isCompanyLoggedIn, async (req, res) => {

    const application = await applicationModel.findOne({
        _id: req.params.id,
        company: req.company._id
    });

    if (!application || !application.resume || !application.resume.data) {
        return res.status(404).send("Resume not found");
    }

    res.set({"Content-Type": application.resume.contentType, "Content-Disposition":`attachment; filename ="${application.resume.filename || "Resume.pdf"}"`});
    res.send(application.resume.data);
});
//-------------applicants ---------

router.get("/companyApplicant",isCompanyLoggedIn,async (req, res) => {

    const applications = await applicationModel
        .find({ company: req.company._id })
        .populate("applicant")
        .populate("job")
        .sort({ appliedAt: -1 })

          // Total Applications
    const totalApplications = await applicationModel.countDocuments({
        company: req.company._id
    });


    // Under Review
    const reviewApplications = await applicationModel.countDocuments({
        company: req.company._id,
        status: "Under Review"
    });


    // In Progress
    const inProgressApplications = await applicationModel.countDocuments({
        company: req.company._id,
        status: { $in: ["Shortlisted", "Selected"] }
    });


    // Rejected
    const rejectedApplications = await applicationModel.countDocuments({
        company: req.company._id,
        status: "Rejected"
    });

   res.render("company/companyApplicant",{
   applications,
        totalApplications,
        reviewApplications,
        inProgressApplications,
        rejectedApplications 
    });
});

//--------------------edit profile-------------------------------------
router.get("/EditProfile",isCompanyLoggedIn, (req, res) => {
   res.render("company/companyEditProfile");
});

router.post( "/EditProfile", isCompanyLoggedIn, upload.single("companyProfile"), async (req, res) => {

        let {
            companyName,
            industry,
            companyEmail,
            phone,
            companySize,
            foundedYear,
            website,
            location,
            about
        } = req.body;

        let updateDetails = {
            companyName,
            industry,
            companyEmail,
            phone,
            companySize,
            foundedYear,
            website,
            location,
            about
        };

        // Company Profile Image
        if (req.file) {
            updateDetails.companyProfile = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        await companyModel.findByIdAndUpdate(
            req.company._id,
            updateDetails,
            { new: true }
        );

        res.redirect("/company/companyMyProfile");
    }
);

//-------------------- profile image of company route multer wla-----------------
router.get("/company-profile", isCompanyLoggedIn, async (req, res) => {
    let company = await companyModel.findById(req.company._id);
    
    if (!company.companyProfile || !company.companyProfile.data) {
        return res.status(404).send("No Profile Pic");
    }

    res.set("Content-Type", company.companyProfile.contentType);
    res.send(company.companyProfile.data);
});

//--------------POSTED JOBS which are posted by company-----------

 router.get("/companyJobPosted",isCompanyLoggedIn, (req,res)=>{
    res.render("company/companyJobPosted");
 })

// -------------post a job----------------
 router.get("/PostJob",isCompanyLoggedIn,(req,res)=>{
    res.render("company/companyPostJob")
 })

router.post("/PostJob",isCompanyLoggedIn,async (req,res)=>{
    
    let {

            jobTitle,
    jobCategory ,
    jobType ,
    experience ,
    salary ,
    companyLocation ,
    jobDescription ,
    addSkills,
    vacancies,
    deadline,
    workMode ,
    education ,
    Gender
    
    } = req.body;

    let job = new jobModel({

        company: req.company._id,

    jobTitle,
    jobCategory ,
    jobType ,
    experience ,
    salary ,
    companyLocation ,
    jobDescription ,
    addSkills,
    vacancies,
    deadline,
    workMode ,
    education,
        Gender,
    // new job directly active
    status: "Active"
    });

    await job.save();

    res.redirect("/company/companyJobPosted")
 });

//  -----------TO UPDATE THE STATUS OF APPLICATION-----------
 router.post("/updateApplicationStatus/:id", isCompanyLoggedIn, async (req,res)=>{
    const application = await applicationModel.findById(req.params.id);

    if(!application){
        return res.status(404).json({
            success : false,
            message: "Application not found"
        });

    }

    application.status= req.body.status;

    await application.save();
    res.json({
        success: true,
        message: "Application status updated"
    });
 })
 
//------------CONFIRMATION BEFORE DELETE----------------

router.get("/companyDeleteConfirmation/:id", async (req, res) => {

    const application = await applicationModel.findById(req.params.id);

    if (!application) {
        return res.status(404).send("Application not found");
    }

    res.render("company/companyDeleteConfirmation", {
        application
    });

});

//--------------DELETE ROUTE-------------
router.delete("/delete/:id", async (req, res) => {

    try {

        await applicationModel.findByIdAndDelete(req.params.id);

        res.json({
            success: true
        });

    } catch (error) {

        console.log(error);

        res.json({
            success: false
        });

    }

});
//  router.get("/test-fetch", (req, res) => {
//     res.send("Fetch successfully working!");
// });
// *----------------------function-------------
async function isCompanyLoggedIn(req, res, next) {

    // 🔐 Check if company login token exists
    if (!req.cookies.companyToken) {
        return res.redirect("/company/login");
    }

    // 🔑 Verify JWT token and get company ID
    let data = jwt.verify(
        req.cookies.companyToken,
        process.env.COMPANY_JWT_SECRET
    );

    // 🏢 Find logged-in company from database
    let company = await companyModel.findById(data.companyid);

    if (!company) {
        return res.redirect("/company/login");
    }

    // 📌 Store company data in request
    req.company = company;
    res.locals.company = company;


    // =========================================================
    // 🔄 AUTOMATICALLY MARK EXPIRED JOBS
    // =========================================================

    await jobModel.updateMany(
        {
            company: company._id,
            status: "Active",
            deadline: { $lt: new Date() }
        },
        {
            $set: {
                status: "Expired"
            }
        }
    );


    // =========================================================
    // 📋 RECENT JOBS
    // =========================================================

    const jobs = await jobModel.find({
        company: company._id
    })
    .sort({ createdAt: -1 })
    .limit(3);

    // Make recent jobs available in EJS
    res.locals.jobs = jobs;


    // =========================================================
    // 📊 JOB COUNTS
    // =========================================================

    // 🔢 Total Jobs
    const totalJobs = await jobModel.countDocuments({
        company: company._id
    });


    // 🟢 Active Jobs
    const activeJobs = await jobModel.countDocuments({
        company: company._id,
        status: "Active",
        deadline: { $gte: new Date() }
    });


    // 🔴 Expired Jobs
    const expiredJobs = await jobModel.countDocuments({
        company: company._id,
        status: "Expired"
    });


    // 📝 Draft Jobs
    const draftJobs = await jobModel.countDocuments({
        company: company._id,
        status: "Draft"
    });


    // =========================================================
    // 📤 SEND DATA TO EJS
    // =========================================================

    res.locals.totalJobs = totalJobs;
    res.locals.activeJobs = activeJobs;
    res.locals.expiredJobs = expiredJobs;
    res.locals.draftJobs = draftJobs;


    // ➡️ Continue to requested route
    next();
}

module.exports = router;