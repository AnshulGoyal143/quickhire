const express=require('express');
const router=express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const path=require('path');
const adminModel =  require('../models/admin-model');
const companyModel =  require('../models/company-model');
const userModel =  require('../models/user-model');
const jobModel =  require('../models/job-model');



//-------------login-------------
   router.get("/login",(req,res)=>{
    res.render("admin/adminLogin");
   });

   router.post("/login", async (req, res) => {
      let { adminEmail, password } = req.body;
   
      let admin = await adminModel.findOne({ adminEmail });
      if (!admin) return res.status(500).send("Something went wrong");
   
      bcrypt.compare(password, admin.password, function (err, result) {
   
         if (result) {
            let token = jwt.sign({ adminEmail: adminEmail ,adminid: admin._id}, process.env.ADMIN_JWT_SECRET);
            res.cookie("adminToken", token);
           return res.redirect("/admin/adminDashboard");
   
         }
         res.status(401).send("Something went wrong")
      })
   });

   //--------------------register----------------------------
   router.get("/register", async(req, res) => {

      let adminAvailable = await adminModel.find();
      if(adminAvailable.length>0){
         return res.render("admin/adminLogin")
      }
      res.render("admin/adminRegister");
   });
   
   router.post("/register", async (req, res) => {
      let { adminEmail, fullName, password, confirmPassword } = req.body;
   
      let admin = await adminModel.findOne({ adminEmail });
      if (admin) return res.status(500).send("Account already exists");

      if(password !== confirmPassword){
         return res.status(400).send("Something went wrong")
      }
   
      bcrypt.genSalt(10, (err, salt) => {
         bcrypt.hash(password, salt, async (err, hash) => {
            let createdAdmin = await adminModel.create({
              adminEmail, 
              fullName, 
              password :hash,
               
            });
   
   
            let token = jwt.sign({ adminEmail: adminEmail, adminid: createdAdmin._id }, process.env.ADMIN_JWT_SECRET);
            res.cookie("adminToken", token);
            res.redirect("/admin/adminDashboard")
         })
      })
   
   });


   // ---------------------------Dashbord-----------------------
   router.get("/adminDashboard", async (req,res)=>{

      const company = await companyModel.find().sort({createdAt :-1 }).limit(4)

      const user = await userModel.find().sort({createdAt :-1 }).limit(4)


      res.render("admin/adminDashboard",{company, user});
   })

   //------------USER PART -------------
  router.get("/adminUserDashboard", isAdminLoggedIn,async(req, res) => {

      try{
         const user = await userModel.find().sort({createdAt :-1 })
       
      res.render("admin/adminUserDashboard",{user});
      }
      catch(error){

        console.log(error);
        res.status(500).send("Server Error");
      }
   });


   // -------------COMPANY PART ------------------
   router.get("/adminCompanyDashboard", isAdminLoggedIn,async (req, res) => {
         try{
               const company = await companyModel.find().sort({createdAt :-1 })
       
            res.render("admin/adminCompanyDashboard",{company});

      }
      catch(error){

        console.log(error);
        res.status(500).send("Server Error");
      }
   });


   // -------------------JOB PART ----------------

   router.get("/adminJobDashboard",isAdminLoggedIn,async (req, res) => {
       
      try{
         const jobs = jobModel.find().populate("company").sort({createdAt: -1})
         res.render("admin/adminJobDashboard",{jobs});
      }
      catch(error){
         console.log(error);
        res.status(500).send("Server Error");
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