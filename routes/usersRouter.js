const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
// const cookieParser = require('cookie-parser');

// const path = require('path');
const userModel = require('../models/user-model');
const applicationModel = require('../models/application-model');
const jobModel = require('../models/job-model');
const companyModel = require('../models/company-model');
const notificationModel = require('../models/notification-model');

const multer = require('multer');
// const jobModel = require('../models/job-model');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// -----------------login--------
router.get("/login", (req, res) => {
    res.render("users/userLogin");
});


router.post("/login", async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("Something went wrong");

    bcrypt.compare(password, user.password, function (err, result) {

        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, process.env.USER_JWT_SECRET);
            res.cookie("token", token);
            return res.redirect("/users/userDashboard");

        }
        res.status(401).send("Something went wrong")
    })
});

// ----------register--------------
router.get("/register", (req, res) => {
    res.render("users/userRegister")
});

router.post("/register", async (req, res) => {
    let { email, fullname, password, mobile } = req.body;

    let user = await userModel.findOne({ email });
    if (user) return res.status(500).send("Account already exists");

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let createdUser = await userModel.create({
                fullname,
                email,
                mobile,
                password: hash
            });

            await notificationModel.create({
                title: "New User Registered",
                message: `${ createdUser.fullname} has registered on Quick Hire.`,
                type: "User",
                icon: "ri-user-add-line",
                isRead: false
            });

            let token = jwt.sign({ email: email, userid: createdUser._id }, process.env.USER_JWT_SECRET);
            res.cookie("token", token);
            res.redirect("/users/userDashboard")
        })
    })

})

// -------------- USER DASHBOARD -------------------------
router.get("/userDashboard", isLoggedIn, async (req, res) => {
    res.render("users/userDashboard");
});

//---------------userprofile -------------------
router.get("/userProfile", isLoggedIn, (req, res) => {
    res.render("users/userProfile");
});

// ----------------edit profile -------------------------
router.get("/ProfileEdit", isLoggedIn, (req, res) => {
    res.render("users/userProfileEdit");
});

// user s edit page k infooooo
router.post("/ProfileEdit", isLoggedIn, upload.single("profileImage"), async (req, res) => {

    let {
        fullname,
        username,
        email,
        mobile,
        dob,
        gender,
        address,
        city,
        state,
        pincode,
        skills,
        aboutme
    } = req.body;


    let updateData = {
        fullname,
        username,
        email,
        mobile,
        dob,
        gender,
        address,
        city,
        state,
        pincode,
        aboutme
    };


    // ================= SKILLS =================

    if (req.body.skills !== undefined) {

        updateData.skills = req.body.skills
            .split(",")
            .map(skill => skill.trim())
            .filter(skill => skill !== "");

    }


    // ================= PROFILE IMAGE =================

    if (req.file) {

        updateData.profileImage = {
            data: req.file.buffer,
            contentType: req.file.mimetype
        };

    }


    // ================= UPDATE USER =================

    await userModel.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true }
    );


    res.redirect("/users/userProfile");

}
);

// profile image route multer wla
router.get("/profile-image", isLoggedIn, async (req, res) => {
    let user = await userModel.findById(req.user._id);

    //      console.log("USER:", user);
    //  console.log("PROFILE IMAGE:", user.profileImage);
    //  console.log("IMAGE TYPE:", user.profileImage?.contentType);
    //  console.log("IMAGE DATA EXISTS:", !!user.profileImage?.data);

    if (!user.profileImage || !user.profileImage.data) {
        return res.status(404).send("Image not found");
    }

    res.set("Content-Type", user.profileImage.contentType);
    res.send(user.profileImage.data);
});


//_------------------ BROWSE JOBS---------------------------------------
router.get("/userBrowseJobs", isLoggedIn, async (req, res) => {

    const { type } = req.query;
    let filter = { status: "Active" };

    // if(type){
    //     filter.jobType = type;
    // }

    // job type 
    if (type === "Full Time" || type === "Part Time" || type === "Internship") {
        filter.jobType = type;
    }

    // Worrk modde 
    if (type === "Remote" || type === "Hybrid" || type === "On Site") {
        filter.workMode = type;
    }

    const jobs = await jobModel.find(filter)
        .populate("company")
        .sort({ createdAt: -1 });
    res.render("users/userBrowseJobs", { jobs, selectedType: type || "All" });
});

//-----------------MY APPLICATIONS---------------------------
router.get("/userMyApplications", isLoggedIn, async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const skip = (page - 1) * limit;

    const totalApplications = await applicationModel.countDocuments({
        applicant: req.user._id
    });

    const totalPages = Math.ceil(totalApplications / limit);

    const applications = await applicationModel
        .find({ applicant: req.user._id })
        .populate("job")
        .populate("company")
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit);

    res.render("users/userMyApplications", {
        applications,
        currentPage: page,
        totalPages
    });
});


// ================= JOB DETAILS ROUTE =================
// :id ke through particular job ki ID receive hogi
router.get("/userJobDetails/:id", isLoggedIn, async (req, res) => {

    // URL se job ki ID lekar MongoDB se job find kar rahe hain
    // populate("company") se us job ki company ki complete information bhi milegi
    const job = await jobModel
        .findById(req.params.id)
        .populate("company");


    // Agar given ID ki koi job nahi mili
    // to user ko "Job not found" message dikha denge
    if (!job) {
        return res.send("Job not found");
    }


    // ================= APPLICANTS COUNT =================
    // Is particular job par kitne users ne apply kiya hai
    // uska count nikal rahe hain
    const applicants = await applicationModel.countDocuments({
        job: job._id
    });


    // ================= POSTED TIME =================
    // Abhi ka current date aur time
    const now = new Date();

    // Job kis date/time par create hui thi
    const createdAt = new Date(job.createdAt);

    // Current time aur job creation time ka difference
    // milliseconds ko seconds me convert kar rahe hain
    const diffInSeconds = Math.floor((now - createdAt) / 1000);


    // Is variable me final text store hoga
    // jaise "2 hours ago", "3 days ago", etc.
    let postedTime;


    // Agar job 1 minute se kam purani hai
    if (diffInSeconds < 60) {

        postedTime = "Just now";


        // Agar job 1 hour se kam purani hai
    } else if (diffInSeconds < 3600) {

        // Seconds ko minutes me convert kar rahe hain
        const minutes = Math.floor(diffInSeconds / 60);

        // 1 minute ke liye "minute"
        // aur baaki ke liye "minutes"
        postedTime = `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;


        // Agar job 24 hours se kam purani hai
    } else if (diffInSeconds < 86400) {

        // Seconds ko hours me convert kar rahe hain
        const hours = Math.floor(diffInSeconds / 3600);

        // 1 hour ke liye "hour"
        // aur baaki ke liye "hours"
        postedTime = `${hours} ${hours === 1 ? "hour" : "hours"} ago`;


        // Agar job 30 days se kam purani hai
    } else if (diffInSeconds < 2592000) {

        // Seconds ko days me convert kar rahe hain
        const days = Math.floor(diffInSeconds / 86400);

        // 1 day ke liye "day"
        // aur baaki ke liye "days"
        postedTime = `${days} ${days === 1 ? "day" : "days"} ago`;


        // Agar job 30 days se bhi purani hai
    } else {

        // Exact date show karenge
        // Example: 24 Aug 2026
        postedTime = createdAt.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

    }


    // ================= RENDER PAGE =================
    // Job details page ko render kar rahe hain
    // Aur EJS ko job, applicants aur postedTime data bhej rahe hain
    res.render("users/userJobDetails", {

        // Complete job information
        job,

        // Is job ke total applicants
        applicants,

        // Job kitni purani hai
        postedTime

    });

});

//*********************APPLY FOR JOB************************* */
router.get("/userApplyJobs/:id", isLoggedIn, async (req, res) => {

    // URL se particular job ki ID lekar job find kar rahe hain
    const job = await jobModel
        .findById(req.params.id)
        .populate("company");

    // Agar job nahi mili
    if (!job) {
        return res.status(404).send("Job not found");
    }

    // Particular job ko Apply page par bhej rahe hain
    res.render("users/userApplyJobs", {
        job
    });

});

router.post("/userApplyJobs", isLoggedIn, upload.single("resume"), async (req, res) => {
    const job = await jobModel.findById(req.body.jobId);

    if (!job) {
        // return res.status(404).send("Job not found");
        return res.status(404).json({ success: false, message: "job not found" });

    }

    const alreadyApplied = await applicationModel.findOne({ applicant: req.user._id, job: job._id });
    if (alreadyApplied) {
        // return res.send("You have already applied for this job");
        return res.status(400).json({
            success: false,
            message: "You have already applied for this job"
        });
    }

    let {

        linkedin,
        experienceLevel,
        totalExperience,
        previousJobTitle,
        previousCompany,
        employmentType,
        coverLetter,
        expectedSalary,
        noticePeriod,
        relocate,
        availability,
        portfolio


    } = req.body;

    let application = new applicationModel({

        applicant: req.user._id,
        job: job._id,
        company: job.company,

        linkedin,
        experienceLevel,
        totalExperience,
        previousJobTitle,
        previousCompany,
        employmentType,
        coverLetter,
        expectedSalary,
        noticePeriod,
        relocate,
        availability,
        portfolio,
        appliedAt: new Date()


    });

    if (!req.file) {
        // return res.status(400).send("Please upload your resume")
        return res.status(400).json({
            success: false,
            message: "Please upload your resume"
        });
    }
    let file = req.file;

    if (file.mimetype !== "application/pdf") {
        // return res.status(400).send("Only PDF resume is allowed");
        return res.status(400).json({
            success: false,
            message: "Only PDF resume is allowed"
        });
    }

    application.resume = {
        data: file.buffer,
        contentType: file.mimetype,
        originalName: file.originalname
    };


    await application.save();

      // Create admin notification
        await notificationModel.create({
            title: "New Application Received",
            message: `A new application has been received for ${job.jobTitle}.`,
            type: "Application",
            icon: "ri-file-list-3-line",
            isRead: false
        });
        
    res.json({
        success: true,
        message: "Application submitted successfully"
    });

});

// application m resume show k ley
router.get("/application/:id/resume", isLoggedIn, async (req, res) => {

    const application = await applicationModel.findOne({
        _id: req.params.id,
        applicant: req.user._id
    });

    if (!application || !application.resume || !application.resume.data) {
        return res.status(404).send("Resume not found");
    }

    res.set("Content-Type", application.resume.contentType);

    res.set(
        "Content-Disposition",
        `inline; filename="${application.resume.originalName || "resume.pdf"}"`
    );

    res.send(application.resume.data);
});

//--------------Company profile k ley aur count k ley bhi----------

router.get("/companyProfile/:companyId", isLoggedIn, async (req, res) => {

    const company = await companyModel.findById(req.params.companyId);

    if (!company) {
        return res.status(404).send("Company not found");
    }

    if (!company.profileViews) {
        company.profileViews = [];
    }

    const alreadyViewed = company.profileViews.some(
        id => id.toString() === req.user._id.toString()
    );

    if (!alreadyViewed) {

        company.profileViews.push(req.user._id);

        await company.save();
    }

    res.render("users/userCompanyProfile", {
        company
    });
});

//-------------company prfile pic-----------
router.get("/company-profile/:companyId", isLoggedIn, async (req, res) => {

    const company = await companyModel.findById(req.params.companyId);

    if (!company || !company.companyProfile || !company.companyProfile.data) {
        return res.status(404).send("Company image not found");
    }

    res.set("Content-Type", company.companyProfile.contentType);

    res.send(company.companyProfile.data);
});

// ------------logout------------
router.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
})

// *****************FUNCTION *****************************
async function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect("/users/login");
    }

    let data = jwt.verify(req.cookies.token, process.env.USER_JWT_SECRET);

    let user = await userModel.findById(data.userid);

    req.user = user;
    res.locals.user = user;

    // User ki applications fetch
    const applications = await applicationModel
        .find({ applicant: user._id })
        .populate("job")
        .populate("company");

    res.locals.applications = applications;

    next();
}

module.exports = router;