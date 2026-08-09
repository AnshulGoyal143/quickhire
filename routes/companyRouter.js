const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const path = require('path');
const companyModel = require('../models/company-model')

router.get("/login", (req, res) => {
   res.render("company/companyLogin");
});

router.get("/register", (req, res) => {
   res.render("company/companyRegister")
});

router.get("/companyDashboard",isLoggedIn, async (req,res)=>{
   // let company = await companyModel.findOne({companyEmail:req.company.companyEmail});
   res.render("company/companyDashboard");
});

router.get("/companyMyProfile",isLoggedIn, (req, res) => {
   res.render("company/companyMyProfile");
});

router.get("/EditProfile",isLoggedIn, (req, res) => {
   res.render("company/companyEditProfile");
});

router.post("/EditProfile",isLoggedIn,async (req,res)=>{
    
   let{
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

   await companyModel.findByIdAndUpdate(req.company._id,{
     companyName,
      industry,
      companyEmail,
       phone,
       companySize,
        foundedYear,
        website,
        location,
        about
   },{new:true});

   res.redirect("/company/companyMyProfile");
})

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


         let token = jwt.sign({ companyEmail: companyEmail, companyid: createdCompany._id }, "shhhh");
         res.cookie("companyToken", token);
         res.redirect("/company/companyDashboard")
      })
   })

})

router.post("/login", async (req, res) => {
   let { companyEmail, password } = req.body;

   let company = await companyModel.findOne({ companyEmail });
   if (!company) return res.status(500).send("Something went wrong");

   bcrypt.compare(password, company.password, function (err, result) {

      if (result) {
         let token = jwt.sign({ companyEmail: companyEmail ,companyid: company._id}, "shhhh");
         res.cookie("companyToken", token);
        return res.redirect("/company/companyDashboard");

      }
      res.status(401).send("Something went wrong")
   })
});

router.get("/logout",(req,res)=>{
   res.cookie("token","");
   res.redirect("/login");
})


async function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect("/company/login");
    }

    let data = jwt.verify(req.cookies.token, "shhhh");

    let company = await companyModel.findById(data.companyid);
   //  console.log(company)
    req.company = company;
    res.locals.company = company;

    next();
}

module.exports = router;