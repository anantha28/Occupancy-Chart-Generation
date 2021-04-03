var mongoose=require("mongoose");

var RoomSchema=new mongoose.Schema({
    roomNumber:String,
    floor:Number,
    reservedtime:[]
});

module.exports=mongoose.model("Room",RoomSchema);