const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const path = require('path');
const userModel = require('../models/user-model');

router.get("/login", (req, res) => {
   res.render("users/userLogin");
});

router.get("/register", (req, res) => {
   res.render("users/userRegister")
});

router.get("/userDashboard",isLoggedIn, async (req,res)=>{
   let user = await userModel.findOne({email:req.user.email});
   res.render("users/userDashboard");
});

router.get("/userProfile",isLoggedIn, (req, res) => {
   res.render("users/userProfile");
});

router.get("/ProfileEdit",isLoggedIn, (req, res) => {
   res.render("users/userProfileEdit");
});

router.post("/ProfileEdit",isLoggedIn,async (req,res)=>{
    
   let{fullname,username,email,mobile,dob,gender,address,city,state,pincode,skills} = req.body;

   await userModel.findByIdAndUpdate(req.user._id,{
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
      skills
   },{new:true});

   res.redirect("/users/userProfile");
})

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


         let token = jwt.sign({ email: email, userid: createdUser._id }, "shhhh");
         res.cookie("token", token);
         res.redirect("/users/userDashboard")
      })
   })

})

router.post("/login", async (req, res) => {
   let { email, password } = req.body;

   let user = await userModel.findOne({ email });
   if (!user) return res.status(500).send("Something went wrong");

   bcrypt.compare(password, user.password, function (err, result) {

      if (result) {
         let token = jwt.sign({ email: email ,userid: user._id}, "shhhh");
         res.cookie("token", token);
        return res.redirect("/users/userDashboard");

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
        return res.redirect("/users/login");
    }

    let data = jwt.verify(req.cookies.token, "shhhh");

    let user = await userModel.findById(data.userid);

    req.user = user;
    res.locals.user = user;

    next();
}

module.exports = router;