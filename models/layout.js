var mongoose=require("mongoose");

var LayoutSchema=new mongoose.Schema({
    imageURL:String
});

module.exports=mongoose.model("Layout",LayoutSchema);