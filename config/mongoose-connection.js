const mongoose = require('mongoose');

// alg connection aur ye only developer phase k ley h in real dyanmic conncetion usse hoga
mongoose
.connect("mongodb://127.0.0.1:27017/quickhire")
.then(function(){
    console.log("connected")
})
.catch(function(err){
    console.log(err);
})

module.exports = mongoose.Connection;