const express=require('express');
const router=express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');

const path=require('path');

   router.get("/login",(req,res)=>{
    res.render("company/companyLogin");
   });

   router.get("/register",(req,res)=>{
    res.render("company/companyRegister")
   })

module.exports = router;