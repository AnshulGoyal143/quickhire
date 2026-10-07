const mongoose = require('mongoose');

// alg connection aur ye only developer phase k ley h in real dyanmic conncetion usse hoga
mongoose
.connect(process.env.MONGODB_URL)
.then(function(){
    console.log("connected")
})
.catch(function(err){
    console.log(err);
})

module.exports = mongoose.Connection;