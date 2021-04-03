var mongoose=require("mongoose");

var OverallTimeTableSchema=new mongoose.Schema({
    times:[],
    rooms:[]
});

module.exports=mongoose.model("OverallTimeTable",OverallTimeTableSchema);