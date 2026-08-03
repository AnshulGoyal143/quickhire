const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const path = require('path');
const router = express.Router();
const db = require("./config/mongoose-connection");
const adminRouter = require("./routes/adminRouter");
const companyRouter = require("./routes/companyRouter");
const usersRouter = require("./routes/usersRouter");


app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());

//******setting routes********* */
app.use("/admin",adminRouter);
app.use("/users",usersRouter);
app.use("/company",companyRouter);

app.get("/",function(req,res){
    res.render("index");
})

app.listen(3000);
