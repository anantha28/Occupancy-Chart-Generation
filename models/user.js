var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");

var UserSchema=new mongoose.Schema({
    username:String,
    password:String,
    otp:{
        type:String
    },
    phoneNumber:Number,
    year:Number,
    age:Number,
    name:String,
    dept:String,
    section:String,
    rollno:String,
    count:{
        type:Number,
        default:0
    },
    admin:{
        type:Boolean,
        default:false
    },
    pass:String,
    loginAttempt:{
        default:0,
        type:Number
    },
    lockTime:{
        default:0,
        type:Number
    },
    faculty:String
});

UserSchema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User",UserSchema);