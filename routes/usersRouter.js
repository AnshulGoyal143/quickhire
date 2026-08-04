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

router.get("/userProfile", (req, res) => {
   res.render("users/userProfile");
});

router.post("/register", async (req, res) => {
   let { email, username, password, mobile } = req.body;

   let user = await userModel.findOne({ email });
   if (user) return res.status(500).send("Account already exists");

   bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
         let createdUser = await userModel.create({
            username,
            email,
            mobile,
            password: hash
         });


         let token = jwt.sign({ email: email, userid: createdUser._id }, "shhhh");
         res.cookie("token", token);
         res.redirect("/users/userProfile")
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
        return res.redirect("/users/userProfile");

      }
      res.status(401).send("Something went wrong")
   })
})

module.exports = router;