var mongoose=require("mongoose");

var FacultySchema=new mongoose.Schema({
    name:String,
    facDetails:{
        courseName:[],
        section:[],
        year:[],
        roomNumber:[],
        timetable:[]
        }
        
});

module.exports=mongoose.model("Faculty",FacultySchema);