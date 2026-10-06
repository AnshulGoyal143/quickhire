const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const path = require('path');
const adminModel = require('../models/admin-model');
const companyModel = require('../models/company-model');
const userModel = require('../models/user-model');
const jobModel = require('../models/job-model');
const applicationModel = require('../models/application-model');
const notificationModel = require('../models/notification-model');


const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({storage});



//-------------login-------------
router.get("/login", (req, res) => {
   res.render("admin/adminLogin");
});

router.post("/login", async (req, res) => {
   let { adminEmail, password } = req.body;

   let admin = await adminModel.findOne({ adminEmail });
   if (!admin) return res.status(500).send("Something went wrong");

   bcrypt.compare(password, admin.password, function (err, result) {

      if (result) {
         let token = jwt.sign({ adminEmail: adminEmail, adminid: admin._id }, process.env.ADMIN_JWT_SECRET);
         res.cookie("adminToken", token);
         return res.redirect("/admin/adminDashboard");

      }
      res.status(401).send("Something went wrong")
   })
});

//--------------------register----------------------------
router.get("/register", async (req, res) => {

   let adminAvailable = await adminModel.find();
   if (adminAvailable.length > 0) {
      return res.render("admin/adminLogin")
   }
   res.render("admin/adminRegister");
});

router.post("/register", async (req, res) => {
   let { adminEmail, fullName, password, confirmPassword } = req.body;

   let admin = await adminModel.findOne({ adminEmail });
   if (admin) return res.status(500).send("Account already exists");

   if (password !== confirmPassword) {
      return res.status(400).send("Something went wrong")
   }

   bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
         let createdAdmin = await adminModel.create({
            adminEmail,
            fullName,
            password: hash,

         });


         let token = jwt.sign({ adminEmail: adminEmail, adminid: createdAdmin._id }, process.env.ADMIN_JWT_SECRET);
         res.cookie("adminToken", token);
         res.redirect("/admin/adminDashboard")
      })
   })

});


// ---------------------------Dashbord-----------------------
router.get("/adminDashboard", isAdminLoggedIn, async (req, res) => {

    try {

        const admin = await adminModel.findById(req.admin);

        const company = await companyModel.find().sort({ createdAt: -1 }).limit(4);

        const user = await userModel.find().sort({ createdAt: -1 }).limit(4);

        const totalUsers = await userModel.countDocuments();
        const totalCompanies = await companyModel.countDocuments();
        const totalJobs = await jobModel.countDocuments();
        const totalApplications = await applicationModel.countDocuments();

        res.render("admin/adminDashboard", {
            company,
            user,
            admin,
            totalUsers,
            totalCompanies,
            totalJobs,
            totalApplications
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }

});

//------------USER PART -------------
router.get("/adminUserDashboard", isAdminLoggedIn, async (req, res) => {
    try {

        // Total Users
        const totalUsers = await userModel.countDocuments();


        // Active Users
        const activeUsers = await userModel.countDocuments({
            isActive: true
        });


        // Inactive Users
        const inactiveUsers = await userModel.countDocuments({
            isActive: false
        });


        // Recent Users - Last 30 Days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsers = await userModel.countDocuments({
            createdAt: {
                $gte: thirtyDaysAgo
            }
        });


        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;


        const users = await userModel
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);


        const totalPages = Math.ceil(totalUsers / limit);


        res.render("admin/adminUserDashboard", {
            users,
            totalUsers,
            activeUsers,
            inactiveUsers,
            recentUsers,
            currentPage: page,
            totalPages,
            limit
        });

    } catch (error) {

        console.log(error);
        res.status(500).send("Server Error");

    }
});

// ----------USER DETAILS PAGE --------------
// ================= USER DETAILS =================

router.get("/adminUserDetails/:id", isAdminLoggedIn, async (req, res) => {

    try {

        const admin = await adminModel.findById(req.admin);

        const user = await userModel.findById(req.params.id);

        if (!user) {
            return res.status(404).send("User not found");
        }

        res.render("admin/adminUserDetails", {
            admin,
            user
        });

    } catch (error) {

        console.log(error);

        res.status(500).send("Server Error");

    }

});

// --------------USSER DELETE OPTION-------------------
// ================= DELETE USER =================

router.get("/adminDeleteUser/:id", isAdminLoggedIn, async (req, res) => {

    try {

        const user = await userModel.findById(req.params.id);

        if (!user) {
            return res.status(404).send("User not found");
        }

        await userModel.findByIdAndDelete(req.params.id);

        res.redirect("/admin/adminUserDashboard");

    } catch (error) {

        console.log(error);

        res.status(500).send("Server Error");

    }

});

// -------------COMPANY PART ------------------
router.get("/adminCompanyDashboard", isAdminLoggedIn, async (req, res) => {
    try {

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;


        // Total Companies
        const totalCompanies = await companyModel.countDocuments();


        // Verified Companies
        const verifiedCompanies = await companyModel.countDocuments({
            status: "Verified"
        });


        // Pending Companies
        const pendingCompanies = await companyModel.countDocuments({
            status: "Pending"
        });


        // Blocked Companies
        const blockedCompanies = await companyModel.countDocuments({
            status: "Blocked"
        });


        // Companies for current page
        const companies = await companyModel
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);


        const totalPages = Math.ceil(totalCompanies / limit);


        res.render("admin/adminCompanyDashboard", {
            companies,
            totalCompanies,
            verifiedCompanies,
            pendingCompanies,
            blockedCompanies,
            currentPage: page,
            totalPages,
            limit
        });

    } catch (error) {

        console.log(error);
        res.status(500).send("Server Error");

    }
});

// -------------------------COMPANY DETAILS PAGE -----------------
router.get("/adminCompanyDetails/:id", isAdminLoggedIn, async (req, res) => {
    try {

        const company = await companyModel.findById(req.params.id);

        if (!company) {
            return res.status(404).send("Company not found");
        }

        const admin = await adminModel.findById(req.admin);

        res.render("admin/adminCompanyDetails", {
            admin,
            company
        });

    } catch (error) {

        console.log(error);
        res.status(500).send("Something went wrong");

    }
});

// --------------DElete company --------------------

router.get("/adminDeleteCompany/:id", isAdminLoggedIn, async (req, res) => {
    try {

        const company = await companyModel.findById(req.params.id);

        if (!company) {
            return res.status(404).send("Company not found");
        }

        await companyModel.findByIdAndDelete(req.params.id);

        res.redirect("/admin/adminCompanyDashboard");

    } catch (error) {

        console.log(error);
        res.status(500).send("Something went wrong");

    }
});

// -------------------JOB PART ----------------

router.get("/adminJobDashboard", isAdminLoggedIn, async (req, res) => {
    try {

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;


        // Total Jobs
        const totalJobs = await jobModel.countDocuments();


        // Job Status Counts
        const activeJobs = await jobModel.countDocuments({
            status: "Active"
        });

        const expiredJobs = await jobModel.countDocuments({
            status: "Expired"
        });

        const pausedJobs = await jobModel.countDocuments({
            status: "Draft"
        });


        // Jobs + Company Details
        const jobs = await jobModel
            .find()
            .populate("company", "companyName")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);


        // Applicant Count for every job
        for (let job of jobs) {

            job.applicantCount = await applicationModel.countDocuments({
                job: job._id
            });

        }


        // Total Pages
        const totalPages = Math.ceil(totalJobs / limit);


        res.render("admin/adminJobDashboard", {
            jobs,
            totalJobs,
            activeJobs,
            expiredJobs,
            pausedJobs,
            currentPage: page,
            totalPages,
            limit
        });

    } catch (error) {

        console.log(error);
        res.status(500).send("Server Error");

    }
});

// ---------------JOB DELETE ------------
router.get("/delete-job/:id", isAdminLoggedIn, async (req, res) => {
    try {
        const job = await jobModel.findById(req.params.id);

        if (!job) {
            return res.status(404).send("Job not found");
        }

        await jobModel.findByIdAndDelete(req.params.id);

        res.redirect("/admin/adminJobDashboard");

    } catch (error) {
        console.log(error);
        res.status(500).send("Server Error");
    }
});

// --------------------APPLICATION PART----------------------

// -------------------- APPLICATION DASHBOARD --------------------

router.get("/adminApplications", isAdminLoggedIn, async (req, res) => {

    try {

        const admin = req.admin;

        // All Applications
        const applications = await applicationModel.find().populate("applicant")
            .populate({
                path: "job",
                populate: {
                    path: "company"
                }
            })
            .sort({ appliedAt: -1 });


        // All Companies for filter
        const companies = await companyModel
            .find()
            .sort({ companyName: 1 });


        // Application Counts
        const totalApplications = await applicationModel.countDocuments();

        const reviewApplications = await applicationModel.countDocuments({
            status: "Under Review"
        });

        const shortlistedApplication = await applicationModel.countDocuments({
            status: "Shortlisted"
        });

        const rejectedApplications = await applicationModel.countDocuments({
            status: "Rejected"
        });


        res.render("admin/adminApplications", {

            admin,
            applications,
            companies,

            totalApplications,
            reviewApplications,
            shortlistedApplication,
            rejectedApplications

        });

    } catch (error) {

        console.log(error);
        res.status(500).send("Server Error");

    }

});

//---------------------APPLICATION DETAIL PAGE -----------
router.get("/adminApplicationDetails/:id", isAdminLoggedIn, async (req, res) => {
    try {

        const application = await applicationModel
            .findById(req.params.id)
            .populate("applicant")
            .populate("job")
            .populate({
                path: "job",
                populate: {
                    path: "company"
                }
            });

        if (!application) {
            return res.status(404).send("Application not found");
        }

        const admin = await adminModel.findById(req.admin);

        res.render("admin/adminApplicationDetails", {
            admin,
            application
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("Something went wrong");
    }
});

// --------------------delete application ---------------
router.get("/adminDeleteApplication/:id", isAdminLoggedIn, async (req, res) => {
    try {

        const application = await applicationModel.findById(req.params.id);

        if (!application) {
            return res.status(404).send("Application not found");
        }

        await applicationModel.findByIdAndDelete(req.params.id);

        // Delete hone ke baad Job Dashboard
        res.redirect("/admin/adminApplications");

    } catch (error) {

        console.log(error);
        res.status(500).send("Server Error");

    }
});

// ================= ADMIN PROFILE =================

// ---------------------My Profile Page-------------------
router.get("/adminProfilePage",isAdminLoggedIn, async (req, res) => {

   try {

      const admin = await adminModel.findById(req.admin._id);

      if (!admin) {
         return res.status(404).send("Admin not found");
      }

      res.render("admin/adminProfilePage", { admin });

   } catch (error) {

      console.log(error);
      res.status(500).send("Server Error");

   }

});


// ---------------Edit Profile Page--------------
router.get("/adminProfileEdit", isAdminLoggedIn, async (req, res) => {

   try {

      const admin = await adminModel.findById(req.admin._id);

      if (!admin) {
         return res.status(404).send("Admin not found");
      }

      res.render("admin/adminProfileEdit", { admin });

   } catch (error) {

      console.log(error);
      res.status(500).send("Server Error");

   }

});

// ---------------------POST ROUTE FOR EDIT PROFILE ----------------------------------------
router.post("/adminProfileEdit", isAdminLoggedIn,upload.single("profileImage"), async (req, res) => {


        const admin = await adminModel.findById(req.admin._id);

        if (!admin) {
            return res.status(404).send("Admin not found");
        }

        admin.fullName = req.body.fullName;
        admin.adminEmail = req.body.adminEmail;


            if (req.file) {

                admin.profileImage = {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                };

            }

        await admin.save();

        res.redirect("/admin/adminProfilePage");


});

// ---------------------ADMIN PROFILE ROUTE --------------------
router.get("/admin-profile",isAdminLoggedIn, async (req, res) => {

    try {

        const admin = await adminModel.findById(req.admin._id);

        if (!admin || !admin.profileImage || !admin.profileImage.data) {
            return res.status(404).send("Profile image not found");
        }

        res.set(
            "Content-Type",
            admin.profileImage.contentType
        );

        res.send(admin.profileImage.data);

    } catch (error) {

        console.log(error);
        res.status(500).send("Server Error");

    }

});

// --------------notification route ----------
router.get("/adminNotification", isAdminLoggedIn, async (req, res) => {

    try {

        const notifications = await notificationModel
            .find()
            .sort({ createdAt: -1 });

        const totalNotifications = await notificationModel.countDocuments();

        const unreadNotifications = await notificationModel.countDocuments({
            isRead: false
        });

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayNotifications = await notificationModel.countDocuments({
            createdAt: {
                $gte: todayStart
            }
        });

        res.render("admin/adminNotification", {
            notifications,
            totalNotifications,
            unreadNotifications,
            todayNotifications
        });

    } catch (error) {

        console.log(error);

        res.status(500).send("Something went wrong");

    }

});

// -----------------------------------------
router.delete("/deleteAllNotifications", isAdminLoggedIn, async (req, res) => {

    try {

        await notificationModel.deleteMany({});

        res.json({
            success: true
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            success: false
        });

    }

});

// ----------------logout-----------------
router.get("/logout", (req, res) => {
   res.cookie("adminToken", "");
   res.redirect("/admin/login");
});

// *----------------------function-------------
async function isAdminLoggedIn(req, res, next) {

   if (!req.cookies.adminToken) {
      return res.redirect("/admin/login");
   }

   let data = jwt.verify(req.cookies.adminToken, process.env.ADMIN_JWT_SECRET);

   let admin = await adminModel.findById(data.adminid);

   req.admin = admin;
   res.locals.admin = admin;

   next();
}

module.exports = router;