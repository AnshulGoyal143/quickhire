const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const path = require('path');
const userModel = require('../models/user-model');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage});

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

// user s edit page k infooooo
router.post("/ProfileEdit", isLoggedIn, upload.fields([{name:"profileImage",maxCount:1},{name:"resume",maxCount:1}]), async (req, res) => {

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
    // Skills ko array me convert karna
    if (req.body.skills !== undefined) {
    updateData.skills = req.body.skills
        .split(",")
        .map(skill => skill.trim())
        .filter(skill => skill !== "");
    }
      // Profile Image
        if (req.files?.profileImage) {

            let file = req.files.profileImage[0];

            updateData.profileImage = {
                data: file.buffer,
                contentType: file.mimetype
            };
        }

        // Resume
        if (req.files?.resume) {

            let file = req.files.resume[0];

            // Sirf PDF allow
            if (file.mimetype !== "application/pdf") {
                return res.status(400).send("Only PDF resume is allowed");
            }

            updateData.resume = {
                data: file.buffer,
                contentType: file.mimetype,
                originalName: file.originalname
            };
        }

    await userModel.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true }
    );
    
    res.redirect("/users/userProfile");
});

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

// profile image route multer wla
router.get("/resume", isLoggedIn, async (req, res) => {
    let user = await userModel.findById(req.user._id);

 
    
    if (!user.resume || !user.resume.data) {
        return res.status(404).send("Resume not found");
    }

    res.set("Content-Type", user.resume.contentType);
    res.set("Content-Disposition",`inline; filename="${user.resume.originalName|| "resume.pdf"}`)
    res.send(user.resume.data);
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

// **********************************************
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