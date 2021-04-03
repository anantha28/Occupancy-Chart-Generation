var mongoose=require("mongoose");

var TimeTableSchema=new mongoose.Schema({
    section:String,
    year:Number,
    numberOfSubjects:Number,
    timeAlloted:[],
    roomAlloted:[],
    checkSubjects:Number
});

module.exports=mongoose.model("TimeTable",TimeTableSchema);