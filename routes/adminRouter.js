const express=require('express');
const router=express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const path=require('path');
const adminModel =  require('../models/admin-model');


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