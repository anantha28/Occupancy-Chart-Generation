var mongoose=require("mongoose");

var FacultySchema=new mongoose.Schema({
    name:String,
    facDetails:{
        courseName:[],
        section:String,
        year:Number,
        roomNumber:[],
        timetable:[]
        }
        
});

module.exports=mongoose.model("Faculty",FacultySchema);