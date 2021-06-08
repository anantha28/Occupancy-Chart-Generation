var express=require("express");
var app=express=express();
var bodyParser=require("body-parser");
var mongoose=require("mongoose");
var User=require("./models/user");
var TimeTable=require("./models/timetable");
var Faculty=require("./models/faculty");
var Room=require("./models/room");
app.use(bodyParser.urlencoded({limit: '50mb',extended:true}));
var nodemailer = require('nodemailer');
var flash=require("connect-flash");
var OverallTimeTable=require("./models/overallTimeTable");
var Layout=require("./models/layout");

var localStrategy=require("passport-local");

var passport=require("passport");

app.use(require("express-session")({
    secret:"Occupancy Chart",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


//mongoose.connect("mongodb://localhost/SEdb_v5",{useNewUrlParser: true});
mongoose.connect("mongodb+srv://anantha28:anantha28pass@se.xpqcc.mongodb.net/SE_DB?retryWrites=true&w=majority",{useNewUrlParser: true});

var methodOverride=require("method-override");
app.use(methodOverride("_method"));


 passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

app.use(function(req,res,next)
{
    res.locals.currentUser=req.user;
  res.locals.error=req.flash("error");
   res.locals.success=req.flash("success");
    next();
});

//***********************IMAGE UPLOAD***********************//

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter});

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'duozkjp1p', 
  api_key: '722167338195677', 
  api_secret: 'E9riFMymF0Ue7tNh4dzjWJK_IXE'
});

//*****//////////////////////*********************

app.get("/",(req,res)=>{
   res.render("login.ejs");
});
app.get("/signup",(req,res)=>{
   res.render("signup.ejs");
});
app.get("/login",(req,res)=>{
    res.render("login.ejs");
});
app.get("/otp",(req,res)=>{
    res.render("otp.ejs");
});
app.get("/forgotpassword",(req,res)=>{
    res.render("forgotpassword.ejs");
});
app.get("/frgtpassEmail",(req,res)=>{
    res.render("frgtpassEmail.ejs");
});

///*****************Layout image upload routes******////
app.get("/layout",isLoggedIn,(req,res)=>{
    res.render("layout.ejs");
});

app.post("/layout",isLoggedIn,upload.single('image'),(req,res)=>{
    Layout.find({},(err,n)=>{
        if(err) console.log(err);
        else{
            if(n.length===0){
                cloudinary.uploader.upload(req.file.path, function(result) {
                Layout.create({imageURL:result.secure_url},(err,img)=>{
                    if(err) console.log(err);
                    else{
                      // console.log(img);
                       req.flash("success","Image Uploaded successfully");
                       res.redirect("/layout");
                }
                });
                });
            }
            else{
                cloudinary.uploader.upload(req.file.path, function(result) {
                    n[0].imageURL=result.secure_url;
                    n[0].save();
                    req.flash("success","Image Updated Successfully");
                    res.redirect("/adminDashboard");
                });
            }
        }
    });
    
});

app.get("/viewLayout",isLoggedIn,(req,res)=>{
    Layout.findOne({},(err,lay)=>{
        if(err) console.log(err);
        else{
        res.render("viewLayout.ejs",{img:lay}); 
        }
    });
});


///*************************Admin Dashboard Timetable********************************

app.get("/adminDashboard",isLoggedIn,(req,res)=>{
    res.render("adminDashboard.ejs");
});
app.get("/userList",isLoggedIn,(req,res)=>{
    User.find({},(err,allTime)=>{
        if(err) console.log(err);
        else{
            res.render("userList.ejs",{allTime:allTime});
        }
    });
});

///*************************Student Dashboard Timetable********************************
app.get("/studentDashboard",isLoggedIn,(req,res)=>{
    res.render("studentDashboard.ejs");
});

app.get("/studentTimetable",isLoggedIn,(req,res)=>{
    
    TimeTable.findOne({section:req.user.section,year:req.user.year},(err,tim)=>{
        if(err) console.log(err);
        else{
            if(tim===null || tim.length===0){
                req.flash("error","No timetable assigned still,Please Wait!");
                res.redirect("/studentDashboard");
            }
            else{
                console.log(tim);
                //res.render("testDownload.ejs",{tim:tim});
                res.render("specificClassTimeTable.ejs",{tim:tim});
            }
        }
    });
});


app.post("/otp",(req,res)=>{
    var u=req.body.username;
    var otp=((req.body.otp).toString());
    console.log(otp);
    User.find({username:u},(err,usr)=>{
        if(err)
        console.log(err);
        else{
            console.log(usr[0]);
            if(usr[0].otp===otp){
                console.log(usr[0]);
                    var u=req.user.username;
                    User.findOne({username:u},(err,ad)=>{
                        if(err)
                        console.log(err);
                        else{
                    if(ad.admin===true){
                        res.redirect("/adminDashboard");
                    }
                    if(ad.faculty==='yes'){
                        res.redirect("/facultyDashboard");
                    }
                    else if(ad.faculty!=='yes' && ad.admin!==true) {
                        res.redirect("/studentDashboard");
                    }
                        }
                    });
            }
            else{
                console.log(usr);
                usr[0].count+=1;
                usr[0].save();
                if(usr[0].count!=3)
                {
                    req.flash("error","Incorrect OTP!!");
                    console.log(req.body.username);
                     res.render("otp.ejs",{username:req.body.username,c:usr[0].count});
                }
                else{
                    User.remove({username:u},(err,rem)=>{
                        if(err)
                        console.log(err);
                        else{
                             req.flash("error","3 Unsuccessful atttempts done, Please Register again!!");
                             console.log(rem);
                            res.redirect("/signup");
                        }
                    });
                }
                
            }
           
        }
    });
   
});

app.post("/frgtpassEmail",(req,res)=>{
    
    var username=req.body.username;
    User.find({username:username},(err,users)=>{
        if(err)
        console.log(err);
        else{
            var transporter = nodemailer.createTransport({
             service: 'gmail',
             auth: {
                    user: 'se.chartgeneration@gmail.com',			//email ID
            	    pass: 'admin.se123'				//Password 
                }
            });
            
        function sendMail(username , otp){
    	var details = {
    		from: 'se.chartgeneration@gmail.com', // sender address same as above
    		to:username, 					// Receiver's email id
    		subject: 'Change your Password,Here is your OTP: ', // Subject of the mail.
    		html: otp					// Sending OTP 
    	};


	transporter.sendMail(details, function (error, data) {
		if(error)
			console.log(error);
		else
			console.log(data);
		});
	}
	
    	var email = req.body.username;
    	var otp =(Math.floor(Math.random() * 100000)).toString();
    	users[0].otp=otp;
    	users[0].count=0;
    	users[0].save();
    	//console.log(users[0].otp);
    	sendMail(email,otp);
    	 res.render("forgotpassword.ejs",{username:users[0].username,c:0});
    
        }
    });
    
});

app.post("/frgtpassotp",(req,res)=>{
    var u=req.body.username;
    var otp=((req.body.otp).toString());
    //console.log(otp);
    User.find({username:u},(err,usr)=>{
        if(err)
        console.log(err);
        else{
            console.log(usr[0]);
            if(usr[0].otp===otp){
                //console.log(usr[0]);
       res.render("newpass.ejs",{username:u});   
            }
            else{
                //console.log(usr);
                usr[0].count+=1;
                usr[0].save();
                if(usr[0].count!=3)
                {
                    req.flash("error","Incorrect OTP!!");
                     res.render("forgotpassword.ejs",{username:u,c:usr[0].count});
                }
                else{
                    User.find({username:u},(err,rem)=>{
                        if(err)
                        console.log(err);
                        else{
                            rem[0].otp=0;
                             req.flash("error","3 Unsuccessful atttempts done, Please Try again!!");
                             //console.log(rem);
                             res.redirect("/login");
                        }
                    });
                }
                
            }
           
        }
    });
   
});

app.post("/newpass",(req,res)=>{
    var username=req.body.username;
    User.findOne({username:username},(err,newUs)=>{
        if(err)
        console.log(err);
        else{
            newUs.setPassword(req.body.password,(err, newuser) => {
        if (err) 
        console.log(err);
                else{
            newuser.pass=req.body.password;
             newuser.save();
            req.flash("success","Password changed! Login with new credentials");
            res.redirect("/login");
                }
            });
        }
    });
});

app.get("/checklog",(req,res)=>{
    var u=req.user.username;
    User.findOne({username:u},(err,ad)=>{
        if(err)
        console.log(err);
        else{
             if(ad.admin===true){
        res.redirect("/adminDashboard");
    }
    if(ad.faculty==='yes'){
     res.redirect("/facultyDashboard");
    }
    else if(ad.faculty!=='yes' && ad.admin!==true) {
                        res.redirect("/studentDashboard");
                    }
   
        }
    });
   
});

app.post('/locklogin',(req,res)=>{
    console.log("locklog");
    User.findOne({username:req.body.username},(err,u)=>{
    if(err)
    console.log(err);
    else{
        console.log(err);
    if(u===null){
        req.flash("error","Please SignUp, Your Account doesn't exists!");
        res.redirect("/");
    }
    else{
            if(u.pass===req.body.password && u.loginAttempt!=3){
        var d=new Date();
      var n=d.getTime();
      console.log(u.lockTime,n);
      if(u.lockTime===0)
      {     
          console.log("in1");
          u.loginAttempt=0;
          u.save();
          res.redirect(307, '/login');
      }
      else{
        if((u.lockTime+60000)<n && u.lockTime!=0){
        console.log("in2");
        u.lockTime=0;
        u.loginAttempt=0;
        u.save();
        res.redirect(307, '/login');
        }
        else{
        console.log("in3");
        req.flash("error","Account locked! Wait for 60 seconds before trying again");
        res.redirect("/login");
        }
      }
    }
    else{
      u.loginAttempt+=1;
      if(u.loginAttempt>=3){
      u.loginAttempt=0;
      
      d=new Date();
      n=d.getTime();
      u.lockTime=n;
      
      u.save();
      req.flash("error","Account locked 3 unsuccessful attempt made!!");
      res.redirect("/login");
      }
      else{
      u.save();
      req.flash("error",`Login Attempts left: ${3-u.loginAttempt}`);
      res.redirect("/login");
      }
    }  
    }
    }
});
});

app.post("/login",passport.authenticate("local",
{
  successRedirect:"/checklog",
  failureRedirect:"/login",
  failureFlash:true,
  successFlash:true
}),function(req, res) {
   
});

app.post("/signup",function(req,res)
{
    var newUser=new User({username:req.body.username});
    User.register(newUser,req.body.password,function(err,users)
    {
        if(err){
        console.log(err);
        req.flash("error",""+err.message);
        return res.redirect("/signup");
        }
        else
        {
            passport.authenticate("local")(req,res,()=>{
            users.pass=req.body.password;
            users.phoneNumber=req.body.phoneNumber;
            users.name=req.body.name;
            users.faculty=req.body.facOrUse;
            users.rollno=req.body.rollno;
            users.age=req.body.age;
            users.phoneNumber=req.body.phoneNumber;
            users.dept=req.body.dept;
            users.section=req.body.section;
            users.year=req.body.year;
            
            if(users.username==='se.chartgeneration@gmail.com'){
            users.admin=true;
            }
            console.log(users);
            var transporter = nodemailer.createTransport({
             service: 'gmail',
             auth: {
                    user: 'se.chartgeneration@gmail.com',			//email ID
            	    pass: 'admin.se123'				//Password 
                }
            });
        function sendMail(username , otp){
    	var details = {
    		from: 'se.chartgeneration@gmail.com', // sender address same as above
    		to:username, 					// Receiver's email id
    		subject: 'Thank you for registering with Our Website,Here is your OTP: ', // Subject of the mail.
    		html: otp					// Sending OTP 
    	};


	transporter.sendMail(details, function (error, data) {
		if(error)
			console.log(error);
		else
			console.log(data);
		});
	}
	
    	var email = req.body.username;
    	var otp =(Math.floor(Math.random() * 100000)).toString();
    	users.otp=otp;
    	
    	sendMail(email,otp);
            
            users.save();
            console.log(users.otp);
           //req.flash("success","Welcome "+users.name);
           res.render("otp.ejs",{username:users.username,c:0});
       });
        }
    });
});

app.get("/logout",function(req,res){
   req.logout();
   req.flash("success","Successfully logged you out");
   res.redirect("/login");
});
app.get("/AdminnumberOfSub",(req,res)=>{
    res.render("AdminnumberOfSub.ejs");
});
app.post("/AdminnumberOfSub",(req,res)=>{
    var d = new Date();
    var n = d.getTime();
    var t=[n];
    var timetable={section:req.body.section,year:req.body.year,numberOfSubjects:req.body.subjects,checkSubjects:0,timeAlloted:[]};//changed from t array to 0
    TimeTable.create(timetable,(err,result)=>{
        if(err)
        console.log(err);
        else{
            result.save();
            console.log(result);
            res.render("adminNewSubject.ejs",{newT:result});
        }
    });
});

app.get("/adminNewSubject",(req,res)=>{
    res.render("adminNewSubject.ejs");
});




app.post("/adminNewSubject/:id",(req,res)=>{
    var rms=[];
    var id=req.params.id;
    var section=req.body.section;
    var year=req.body.year;
    var facD={section:[],year:[],timetable:[0]};
    var fac={name:req.body.facultyAssigned,facDetails:facD};
    var noOfClassesPerWeek=req.body.noOfClassesPerWeek;
    
    Faculty.find({name:req.body.facultyAssigned},(err,facDet)=>{
        if(err) console.log(err);
        else{
            if(facDet.length===0){ //faculty doesn't already exists 
                
                Faculty.create(fac,(err,fac11)=>{
        if(err)
        console.log(err);
        else{
            
          var arr=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
          
        var result=new Array(noOfClassesPerWeek);
        var n=noOfClassesPerWeek;
        var len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    //console.log(result);
    
    
     var repetition=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
    var facTimeArray=[];
    TimeTable.findById(id,(err,tim)=>{
        if(err)
        console.log(err);
        else{
            tim.checkSubjects+=1;
            var i;
            var checkIter=0;
            
        for(i=0;i<result.length;i++){
            //console.log(tim.timeAlloted.includes(result[i]));
            if(!(tim.timeAlloted.includes(result[i]))){
                //console.log('in1');
            tim.timeAlloted.push(result[i]);
            facTimeArray.push(result[i]);
            checkIter+=1;
            }
        }
        if(checkIter!==result.length){
            //console.log('in3');
          while(checkIter!==result.length){
              for(i=0;i<repetition.length;i++){
                  //console.log('in4');
                  if(!(tim.timeAlloted.includes(repetition[i]))){
                      tim.timeAlloted.push(repetition[i]);
                      facTimeArray.push(repetition[i]);
                      checkIter+=1;
                      //console.log('in5');
                      break;
                  }
              }
          }  
        }
        
        
            fac11.facDetails.year=(new Array(facTimeArray.length).fill(year));
            fac11.facDetails.section=(new Array(facTimeArray.length).fill(section));
        fac11.facDetails.courseName=(new Array(facTimeArray.length).fill(req.body.subjectName));
        fac11.facDetails.timetable=facTimeArray;//assigning the time to the faculty timetable
        for(var t=0;t<facTimeArray.length;t++){
            tim.courseName.push(req.body.subjectName);
        }
        //tim.courseName=(new Array(facTimeArray.length).fill(req.body.subjectName));
        console.log(tim);
        
        
        
       
        
        var roomNumber=['A-101','A-102','A-103','B-104','B-105','B-106','A-107','B-108','C-109','C-110'];
        //console.log('facTimeArray',facTimeArray);
        
        
        OverallTimeTable.find({},(err,isThere)=>{
            if(err) console.log(err);
            else{
                
                if(isThere.length===0){ ////initial creation of timetable logic
                  OverallTimeTable.create({rooms:[],times:[]},(err,newTime)=>{
                      if(err) console.log(err);
                      else{
                          for(var e=0;e<facTimeArray.length;e++){
                              newTime.times.push(facTimeArray[e]);
                              var item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                              newTime.rooms.push(item);
                              
                              rms.push(item);
                              tim.roomAlloted.push(item);
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                          }
                          newTime.save();
                          
                           fac11.facDetails.roomNumber=rms;
                            
            
                            fac11.save();
                            console.log(fac11);
                        
                            tim.save();
                            console.log(tim);
                      }
                  });
                }
                
                else{
                    OverallTimeTable.findOne({},(err,allTime)=>{
                        if(err) console.log(err);
                        else{
                            for(var e=0;e<facTimeArray.length;e++){
                                var item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                                var rooms=getAllValuesFromRoom(allTime.times,facTimeArray[e],allTime.rooms);
                                if(rooms.includes(item)){
                                    while(!(rooms.includes(item))){
                                        item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                                    }
                                    allTime.times.push(facTimeArray[e]);
                                    allTime.rooms.push(item);
                                    
                                    rms.push(item);
                                    tim.roomAlloted.push(item);
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                                }
                                else{
                                    allTime.times.push(facTimeArray[e]);
                                    allTime.rooms.push(item);
                                    
                                    rms.push(item);
                                    tim.roomAlloted.push(item);
                                    
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                                }
                                
                            }
                        }
                        allTime.save();
                        console.log(allTime);
                         fac11.facDetails.roomNumber=rms;
                        
                        
                        fac11.save();
                        console.log(fac11);
                    
                        tim.save();
                        console.log(tim);
                    });
                }
            }
        });
        
        
        var numberOfSubjects=tim.numberOfSubjects.toString();
        res.redirect("/adminNewSubjectNext/"+numberOfSubjects+"/"+id); 
        }
     });
    }
    });
                
            }
            else{ //*******************faculty already exists*********************************
            
            console.log(facDet);
                
                var arr=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
                
                //var facTimes=[];
                
                var result=new Array(noOfClassesPerWeek);
                var n=noOfClassesPerWeek;
                var len = arr.length,
                taken = new Array(len);
                if (n > len)
                    throw new RangeError("getRandom: more elements taken than available");
                while (n--) {
                        var x = Math.floor(Math.random() * len);
                        result[n] = arr[x in taken ? taken[x] : x];
                        taken[x] = --len in taken ? taken[len] : len;
                            }
                //console.log(result);
                
               /* var checkI=0;
                for(var k=0;k<result.length;k++){
                    if(!(facDet.timetable.includes(result[k]))){
                        facTimes.push(result[k]);
                        checkI+=1;
                    }
                }
                var rm=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
                while(checkI!==result.length){
                    var item = rm[Math.floor(Math.random() * rm.length)];
                    if(!(facDet.timetable.includes(item))){
                        facTimes.push(item);
                        checkI+=1;
                    }
                }
                
                for (var e;e<facTimes.length;e++){
                    facDet.push(facTimes[e]);
                }
                console.log(facDet);*/
                

                
                 var repetition=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
        var facTimeArray=[];
        TimeTable.findById(id,(err,tim)=>{
            if(err)
            console.log(err);
            else{
                tim.checkSubjects+=1;
                var i;
                var checkIter=0;
                
            for(i=0;i<result.length;i++){
                //console.log(tim.timeAlloted.includes(result[i]));
                if((!(tim.timeAlloted.includes(result[i]))) && (!(facDet[0].facDetails.timetable.includes(result[i])))){
                    //console.log('in1');
                tim.timeAlloted.push(result[i]);
                facTimeArray.push(result[i]);
                checkIter+=1;
                }
            }
            if(checkIter!==result.length){
                //console.log('in3');
              while(checkIter!==result.length){
                  for(i=0;i<repetition.length;i++){
                      //console.log('in4');
                      if((!(tim.timeAlloted.includes(repetition[i]))) && (!(facDet[0].facDetails.timetable.includes(repetition[i])))){  ///////////////////changed
                          tim.timeAlloted.push(repetition[i]);
                          facTimeArray.push(repetition[i]);
                          checkIter+=1;
                          //console.log('in5');
                          break;
                      }
                  }
              }  
            }
            
            
            for(var e=0;e<facTimeArray.length;e++){//**********pushing timeslots into already existing time slots of that faculty*******///
                facDet[0].facDetails.timetable.push(facTimeArray[e]);
                facDet[0].facDetails.courseName.push(req.body.subjectName);
                facDet[0].facDetails.section.push(req.body.section);
                facDet[0].facDetails.year.push(req.body.year);
                tim.courseName.push(req.body.subjectName);
                console.log('actually in111');
            }
            console.log(tim);
            //fac11.facDetails.timetable=facTimeArray
               console.log(facDet[0]);    
               
               
    //*********ROOM ALLOTMENT STRATEGY**********************///////////////////////////
    
        var roomNumber=['A-101','A-102','A-103','B-104','B-105','B-106','A-107','B-108','C-109','C-110'];
        //console.log('facTimeArray',facTimeArray);
        
        
        OverallTimeTable.find({},(err,isThere)=>{
            if(err) console.log(err);
            else{
                
                if(isThere.length===0){ ////initial creation of timetable logic
                  OverallTimeTable.create({rooms:[],times:[]},(err,newTime)=>{
                      if(err) console.log(err);
                      else{
                          for(var e=0;e<facTimeArray.length;e++){
                              newTime.times.push(facTimeArray[e]);
                              var item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                              newTime.rooms.push(item);
                              
                              rms.push(item);
                              tim.roomAlloted.push(item);
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                          }
                          newTime.save();
                          
                          for(e=0;e<rms.length;e++){//**********pushing roomNumber into already existing roomNumber array of that faculty*******///
                            facDet[0].facDetails.roomNumber.push(rms[e]);
                             }
            
                            facDet[0].save();
                            console.log(facDet[0]);
                        
                            tim.save();
                            console.log(tim);
                      }
                  });
                }
                
                else{
                    OverallTimeTable.findOne({},(err,allTime)=>{
                        if(err) console.log(err);
                        else{
                            for(var e=0;e<facTimeArray.length;e++){
                                var item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                                var rooms=getAllValuesFromRoom(allTime.times,facTimeArray[e],allTime.rooms);
                                if(rooms.includes(item)){
                                    while(!(rooms.includes(item))){
                                        item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                                    }
                                    allTime.times.push(facTimeArray[e]);
                                    allTime.rooms.push(item);
                                    
                                    rms.push(item);
                                    tim.roomAlloted.push(item);
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                                }
                                else{
                                    allTime.times.push(facTimeArray[e]);
                                    allTime.rooms.push(item);
                                    
                                    rms.push(item);
                                    tim.roomAlloted.push(item);
                                    
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                                }
                                
                            }
                        }
                        allTime.save();
                        console.log(allTime);
                        
                        for(e=0;e<rms.length;e++){//**********pushing roomNumber into already existing roomNumber array of that faculty*******///
                            facDet[0].facDetails.roomNumber.push(rms[e]);
                             }
            
                            facDet[0].save();
                            console.log(facDet[0]);
                    
                        tim.save();
                        console.log(tim);
                    });
                }
            }
        });
        
        var numberOfSubjects=tim.numberOfSubjects.toString();
        res.redirect("/adminSecondNewSubjectNext/"+numberOfSubjects+"/"+id); //****redirecting to second next subject route****///
        }
               
            });
        }
    }
});
});

//
app.get("/adminNewSubjectNext/:numberOfClass/:id",(req,res)=>{
    var id=req.params.id;
    var numberOfClass=parseInt(req.params.numberOfClass);//*********number of subjects stored************
    TimeTable.findById(id,(err,nxtres)=>{
        if(err) console.log(err);
        else{
            if(nxtres.checkSubjects!=numberOfClass){
                console.log("checkSubjects",nxtres.checkSubjects,numberOfClass);
                res.render("adminNewSubject.ejs",{newT:nxtres});
            }
            else{
                console.log(nxtres);
                 console.log("checkSubjects111",nxtres.checkSubjects,numberOfClass);
                req.flash("success","Timetable has been generated by the Algorithm!");
                res.redirect("/adminDashboard");
            }
        }
    });
});

//********Second or nth time faculty or room allocation,checking no clash in allocation also***********////

app.get("/adminSecondNewYearAndSec",(req,res)=>{
    res.render("adminSecondNewYearAndSec.ejs");
});
app.post("/adminSecondNewYearAndSec",(req,res)=>{
    var year=req.body.year;
    var section=req.body.section;
    
    var search={year:year,section:section};
    TimeTable.find(search,(err,l)=>{
        if(err) console.log(err);
        else{
            if(l.length===0){
                TimeTable.create({year:year,section:section,numberOfSubjects:req.body.subjects,checkSubjects:0},(err,newT)=>{
                    if(err) console.log(err);
                    else{
                        req.flash("success","Enter new class time table");
                        res.render("adminSecondSubject.ejs",{newT:newT});
                    }
                });

            }
            else{
                req.flash("error","TimeTable for the class Already Exists,Please go to Updation page for changing!");
                res.redirect("/adminDashboard");
            }
        }
    });
});

app.get("/adminSecondSubject",(req,res)=>{
    res.render("adminSecondSubject.ejs");
});

app.get("/adminSecondNewSubjectNext/:numberOfClass/:id",(req,res)=>{
    var id=req.params.id;
    var numberOfClass=parseInt(req.params.numberOfClass);//*********actually it is number of subjects stored************
    TimeTable.findById(id,(err,nxtres)=>{
        if(err) console.log(err);
        else{
            if(nxtres.checkSubjects!=numberOfClass){
                console.log("checkSubjects",nxtres.checkSubjects,numberOfClass);
                res.render("adminNewSubject.ejs",{newT:nxtres});
            }
            else{
                console.log(nxtres);
                 console.log("checkSubjects111",nxtres.checkSubjects,numberOfClass);
                 req.flash("success","Timetable has been generated by the Algorithm!");
                res.redirect("/adminDashboard");
            }
        }
    });
});

//////////////////////////*********SHOW TIMETABLE in the front-end******************//////////

app.get("/ViewFacultytimetable",isLoggedIn,(req,res)=>{
    var u=req.user;
    var nme=(u.name);
    Faculty.findOne({name:nme},(err,fac)=>{
        if(err) console.log(err);
        else{
            if(fac===null){
                req.flash("error","Right Now Faculty is not assigned any Class");
                res.redirect("/classTimeTable");
            }
            else{
             console.log(fac);
            res.render("searchFaculty.ejs",{fac:fac,c:1});   
            }
        }
    });
});

app.get("/Facultytimetable",isLoggedIn,(req,res)=>{
    var u=req.user;
    var nme=(u.name);
    Faculty.findOne({name:nme},(err,fac)=>{
        if(err) console.log(err);
        else{
            if(fac===null){
                req.flash("error","Right Now Faculty is not assigned any Class");
                res.redirect("/classTimeTable");
            }
            else{
             console.log(fac);
             //res.render("testDownload.ejs",{fac:fac});
            res.render("FacultytimeTable.ejs",{fac:fac});   
            }
        }
    });
});

app.get("/classTimeTable",isLoggedIn,(req,res)=>{
    res.render("classTimeTable.ejs");
});
app.post("/classTimeTable",isLoggedIn,(req,res)=>{
    console.log(req.body.section);
    console.log(req.body.year);
    TimeTable.findOne({section:req.body.section,year:req.body.year},(err,tim)=>{
        if(err) console.log(err);
        else{
            if( tim===null){
                req.flash("error","Entered Year and Section doesn't exist!");
                res.redirect("/classTimeTable");
            }
            else{
                console.log(tim);
                res.render("specificClassTimeTable.ejs",{tim:tim});
            }
        }
    });
});

app.post("/deleteFacPeriod",isLoggedIn,(req,res)=>{
    var nme=(req.body.name);
     Faculty.findOne({name:nme},(err,fac)=>{
        if(err) console.log(err);
        else{
        
        req.flash("success","click on the cell to cancel the class!");//
        res.render("deleteFacPeriod.ejs",{fac:fac});
        }
    });
});

app.get("/deleteFacPeriod/:time/:facID",isLoggedIn,(req,res)=>{
    var time=parseInt(req.params.time);
    var facID=req.params.facID;
    Faculty.findById(facID,(err,fac)=>{
        if(err) console.log(err);
        else{
          
         // var roomNumber=fac.facDetails.roomNumber[fac.facDetails.timetable.indexOf(time)];
         
          //fac.save();
          //console.log(fac);
          
          //console.log(fac.facDetails.timetable.indexOf(time));
          
          var section=fac.facDetails.section[fac.facDetails.timetable.indexOf(time)];
          var year=fac.facDetails.year[fac.facDetails.timetable.indexOf(time)];
          console.log("section",section,year);
          
          TimeTable.findOne({section:section,year:year},(err,tim)=>{
              if(err) console.log(err);
              else{
                  
                  var roomN=tim.roomAlloted[tim.timeAlloted.indexOf(time)];
                  console.log("room Number",roomN,tim.timeAlloted.indexOf(time),time);
                  
                  tim.roomAlloted.splice(tim.timeAlloted.indexOf(time),1);
                  tim.courseName.splice(tim.timeAlloted.indexOf(time),1);
                  tim.timeAlloted.splice(tim.timeAlloted.indexOf(time),1);
                  console.log('tims before',tim);
                  tim.save();
                  console.log('tims after is',tim);
                  
                  
                  OverallTimeTable.findOne({},(err,ovt)=>{
                      if(err) console.log(err);
                      else{
                        for(var j=0;j<ovt.times.length;j++){
                            console.log(ovt.times[j],time,ovt.rooms[j],roomN);
                            if(ovt.times[j]===time && ovt.rooms[j]===roomN){
                                console.log('in');
                                ovt.times.splice(j,1);
                                ovt.rooms.splice(j,1);
                                break;
                            }
                        }
                    ovt.save();
                    console.log("All timetable is",ovt);
                    
                      fac.facDetails.timetable.splice(fac.facDetails.timetable.indexOf(time),1); 
                      fac.facDetails.roomNumber.splice(fac.facDetails.timetable.indexOf(time),1); 
                      fac.facDetails.courseName.splice(fac.facDetails.timetable.indexOf(time),1); 
                      fac.facDetails.section.splice(fac.facDetails.timetable.indexOf(time),1); 
                      fac.facDetails.year.splice(fac.facDetails.timetable.indexOf(time),1); 
                      
                      fac.save();
                      console.log('fac is',fac);
                  req.flash("success","Class cancelled and Updated in timetable");
                  res.redirect("/facultydashboard");
                      }
                  });
              }
          });
         
        }
    });
});

//**********UPDATE or add subjects to already exiting class**************



app.get("/newSubject/:year/:section",(req,res)=>{ ///************add new subjects to existing class**********////
    TimeTable.findOne({year:req.params.year,section:req.params.section},(err,newT)=>{
        if(err) console.log(err);
        else{
            res.render("newSubAdd.ejs",{newT:newT});
        }
    });
});

app.post("/newSubject/:id",(req,res)=>{ ///************add new subjects to existing class**********////POST METHOD
    
     var rms=[];
    var id=req.params.id;
    var facD={section:[],year:[],timetable:[0]};
    var fac={name:req.body.facultyAssigned,facDetails:facD};
    var noOfClassesPerWeek=req.body.noOfClassesPerWeek;
    
    Faculty.find({name:req.body.facultyAssigned},(err,facDet)=>{
        if(err) console.log(err);
        else{
            if(facDet.length===0){ //faculty doesn't already exists
                
                Faculty.create(fac,(err,fac11)=>{
        if(err)
        console.log(err);
        else{
            
          var arr=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
          
        var result=new Array(noOfClassesPerWeek);
        var n=noOfClassesPerWeek;
        var len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    //console.log(result);
    
    
     var repetition=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
    var facTimeArray=[];
    TimeTable.findById(id,(err,tim)=>{
        if(err)
        console.log(err);
        else{
            tim.checkSubjects+=1;
            tim.numberOfSubjects+=1;
            var i;
            var checkIter=0;
            
        for(i=0;i<result.length;i++){
            //console.log(tim.timeAlloted.includes(result[i]));
            if(!(tim.timeAlloted.includes(result[i]))){
                console.log('in1');
            tim.timeAlloted.push(result[i]);
            facTimeArray.push(result[i]);
            checkIter+=1;
            }
        }
        if(checkIter!==result.length){
            console.log('in3');
          while(checkIter!==result.length){
              for(i=0;i<repetition.length;i++){
                  console.log('in4');
                  if(!(tim.timeAlloted.includes(repetition[i]))){
                      tim.timeAlloted.push(repetition[i]);
                      facTimeArray.push(repetition[i]);
                      checkIter+=1;
                      console.log('in5');
                      break;
                  }
              }
          }  
        }
        
        fac11.facDetails.year=(new Array(facTimeArray.length).fill(req.body.year));
        fac11.facDetails.section=(new Array(facTimeArray.length).fill(req.body.section));
        fac11.facDetails.courseName=(new Array(facTimeArray.length).fill(req.body.subjectName));
        fac11.facDetails.timetable=facTimeArray;//assigning the time to the faculty timetable
        for(var t=0;t<facTimeArray.length;t++){
            tim.courseName.push(req.body.subjectName);
        }
        //tim.courseName=(new Array(facTimeArray.length).fill(req.body.subjectName));
        console.log(tim);
        
        
        
       
        
        var roomNumber=['A-101','A-102','A-103','B-104','B-105','B-106','A-107','B-108','C-109','C-110'];
        //console.log('facTimeArray',facTimeArray);
        
        
        OverallTimeTable.find({},(err,isThere)=>{
            if(err) console.log(err);
            else{
                
                if(isThere.length===0){ ////initial creation of timetable logic
                  OverallTimeTable.create({rooms:[],times:[]},(err,newTime)=>{
                      if(err) console.log(err);
                      else{
                          for(var e=0;e<facTimeArray.length;e++){
                              newTime.times.push(facTimeArray[e]);
                              var item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                              newTime.rooms.push(item);
                              
                              rms.push(item);
                              tim.roomAlloted.push(item);
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                          }
                          newTime.save();
                          
                           fac11.facDetails.roomNumber=rms;
                            
            
                            fac11.save();
                            console.log(fac11);
                        
                            tim.save();
                            console.log(tim);
                      }
                  });
                }
                
                else{
                    OverallTimeTable.findOne({},(err,allTime)=>{
                        if(err) console.log(err);
                        else{
                            for(var e=0;e<facTimeArray.length;e++){
                                var item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                                var rooms=getAllValuesFromRoom(allTime.times,facTimeArray[e],allTime.rooms);
                                if(rooms.includes(item)){
                                    while(!(rooms.includes(item))){
                                        item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                                    }
                                    allTime.times.push(facTimeArray[e]);
                                    allTime.rooms.push(item);
                                    
                                    rms.push(item);
                                    tim.roomAlloted.push(item);
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                                }
                                else{
                                    allTime.times.push(facTimeArray[e]);
                                    allTime.rooms.push(item);
                                    
                                    rms.push(item);
                                    tim.roomAlloted.push(item);
                                    
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                                }
                                
                            }
                        }
                        allTime.save();
                        console.log(allTime);
                         fac11.facDetails.roomNumber=rms;
                        
                        
                        fac11.save();
                        console.log(fac11);
                    
                        tim.save();
                        console.log(tim);
                    });
                }
            }
        });
        
        
       // var numberOfSubjects=tim.numberOfSubjects.toString();
        req.flash("success","New Subject added");
        res.redirect("/seeAllTimetable");
        }
     });
    }
    });
                
            }
            else{ //*******************faculty already exists*********************************
            
            console.log(facDet);
                
                var arr=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
                
                //var facTimes=[];
                
                var result=new Array(noOfClassesPerWeek);
                var n=noOfClassesPerWeek;
                var len = arr.length,
                taken = new Array(len);
                if (n > len)
                    throw new RangeError("getRandom: more elements taken than available");
                while (n--) {
                        var x = Math.floor(Math.random() * len);
                        result[n] = arr[x in taken ? taken[x] : x];
                        taken[x] = --len in taken ? taken[len] : len;
                            }
                //console.log(result);
                
               /* var checkI=0;
                for(var k=0;k<result.length;k++){
                    if(!(facDet.timetable.includes(result[k]))){
                        facTimes.push(result[k]);
                        checkI+=1;
                    }
                }
                var rm=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
                while(checkI!==result.length){
                    var item = rm[Math.floor(Math.random() * rm.length)];
                    if(!(facDet.timetable.includes(item))){
                        facTimes.push(item);
                        checkI+=1;
                    }
                }
                
                for (var e;e<facTimes.length;e++){
                    facDet.push(facTimes[e]);
                }
                console.log(facDet);*/
                
                
                ////new copied from if block code**********
                
                 var repetition=[29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58];
        var facTimeArray=[];
        TimeTable.findById(id,(err,tim)=>{
            if(err)
            console.log(err);
            else{
                tim.checkSubjects+=1;
                tim.numberOfSubjects+=1;
                var i;
                var checkIter=0;
                
            for(i=0;i<result.length;i++){
                //console.log(tim.timeAlloted.includes(result[i]));
                if((!(tim.timeAlloted.includes(result[i]))) && (!(facDet[0].facDetails.timetable.includes(result[i])))){
                    console.log('fin1');
                tim.timeAlloted.push(result[i]);
                facTimeArray.push(result[i]);
                checkIter+=1;
                }
            }
            if(checkIter!==result.length){
                console.log('fin3');
              while(checkIter!==result.length){
                  for(i=0;i<repetition.length;i++){
                      console.log('fin4');
                      if((!(tim.timeAlloted.includes(repetition[i]))) && (!(facDet[0].facDetails.timetable.includes(repetition[i])))){
                          tim.timeAlloted.push(repetition[i]);
                          facTimeArray.push(repetition[i]);
                          checkIter+=1;
                          console.log('fin5');
                          break;
                      }
                  }
              }  
            }
            
            
            for(var e=0;e<facTimeArray.length;e++){//**********pushing timeslots into already existing time slots of that faculty*******///
                facDet[0].facDetails.timetable.push(facTimeArray[e]);
                facDet[0].facDetails.courseName.push(req.body.subjectName);
                facDet[0].facDetails.section.push(req.body.section);
                facDet[0].facDetails.year.push(req.body.year);
                tim.courseName.push(req.body.subjectName);
                console.log('ffff actually in111');
            }
            console.log(tim);
            //fac11.facDetails.timetable=facTimeArray
               console.log(facDet[0]);    
               
               
    //*********ROOM ALLOTMENT STRATEGY**********************///////////////////////////
    
        var roomNumber=['A-101','A-102','A-103','B-104','B-105','B-106','A-107','B-108','C-109','C-110'];
        //console.log('facTimeArray',facTimeArray);
        
        
        OverallTimeTable.find({},(err,isThere)=>{
            if(err) console.log(err);
            else{
                
                if(isThere.length===0){ ////initial creation of timetable logic
                  OverallTimeTable.create({rooms:[],times:[]},(err,newTime)=>{
                      if(err) console.log(err);
                      else{
                          for(var e=0;e<facTimeArray.length;e++){
                              newTime.times.push(facTimeArray[e]);
                              var item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                              newTime.rooms.push(item);
                              
                              rms.push(item);
                              tim.roomAlloted.push(item);
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                          }
                          newTime.save();
                          
                          for(e=0;e<rms.length;e++){//**********pushing roomNumber into already existing roomNumber array of that faculty*******///
                            facDet[0].facDetails.roomNumber.push(rms[e]);
                             }
            
                            facDet[0].save();
                            console.log(facDet[0]);
                        
                            tim.save();
                            console.log(tim);
                      }
                  });
                }
                
                else{
                    OverallTimeTable.findOne({},(err,allTime)=>{
                        if(err) console.log(err);
                        else{
                            for(var e=0;e<facTimeArray.length;e++){
                                var item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                                var rooms=getAllValuesFromRoom(allTime.times,facTimeArray[e],allTime.rooms);
                                if(rooms.includes(item)){
                                    while(!(rooms.includes(item))){
                                        item =roomNumber[Math.floor(Math.random() * roomNumber.length)];
                                    }
                                    allTime.times.push(facTimeArray[e]);
                                    allTime.rooms.push(item);
                                    
                                    rms.push(item);
                                    tim.roomAlloted.push(item);
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                                }
                                else{
                                    allTime.times.push(facTimeArray[e]);
                                    allTime.rooms.push(item);
                                    
                                    rms.push(item);
                                    tim.roomAlloted.push(item);
                                    
                              /*fac11.facDetails.roomNumber.push(item);
                              tim.roomAlloted.push(item);*/
                                }
                                
                            }
                        }
                        allTime.save();
                        console.log(allTime);
                        
                        for(e=0;e<rms.length;e++){//**********pushing roomNumber into already existing roomNumber array of that faculty*******///
                            facDet[0].facDetails.roomNumber.push(rms[e]);
                             }
            
                            facDet[0].save();
                            console.log(facDet[0]);
                    
                        tim.save();
                        console.log(tim);
                    });
                }
            }
        });
        
        req.flash("success","New Subject added");
        res.redirect("/seeAllTimetable"); //****redirecting to second next subject route****///
        }
            });
        }
    }
});
    
});

//********Table to see any class timetable******///////////*********ADMIN SIDE************////////

app.get("/seeAllTimeTable",isLoggedIn,(req,res)=>{
    TimeTable.find({},(err,allTime)=>{
        if(err) console.log(err);
        else{
            res.render("seeAllTimeTable.ejs",{allTime:allTime});
        }
    });
});

app.get("/seeAllTimeTable/:year/:section",isLoggedIn,(req,res)=>{
    
    TimeTable.findOne({section:req.params.section,year:req.params.year},(err,tim)=>{
        if(err) console.log(err);
        else{
            if(tim.length===0){
                req.flash("error","TimeTable doesn't exist!");
                res.redirect("/classTimeTable");
            }
            else{
                console.log(tim);
                res.render("specificClassTimeTable.ejs",{tim:tim});
            }
        }
    });
});

//************Sprint 2 Coding**************************/////

app.get("/facultyDashboard",(req,res)=>{
    res.render("facultyDashboard.ejs");
});

app.get("/replaceClass",isLoggedIn,(req,res)=>{
    var nme=req.user.name;
    Faculty.findOne({name:nme},(err,fac)=>{
        if(err) console.log(err);
        else{
            if(fac===null){
                req.flash("error","Right Now Faculty is not assigned any Class");
                res.redirect("/facultyDashboard");
            }
            else{
             console.log(fac);
            res.render("replaceClass.ejs",{c:0});   
            }
        }
    });
});
app.post("/replaceClass",isLoggedIn,(req,res)=>{
    var roomNumber=['A-101','A-102','A-103','B-104','B-105','B-106','A-107','B-108','C-109','C-110'];
    var availableClass=[];
    var bookedClass=[];
    var day=parseInt(req.body.day);
    var time=parseInt(req.body.time);
    var calc=day+time;
    OverallTimeTable.findOne({},(err,ovt)=>{
        if(err) console.log(err);
        else{
            //console.log(ovt.times);
             for(var q=0;q<ovt.times.length;q++){
                 if(ovt.times[q]===calc){
                     bookedClass.push(ovt.rooms[q]);
                 }
             }
            
                for(var f=0;f<roomNumber.length;f++){
                    if(!(bookedClass.includes(roomNumber[f]))){
                        //console.log(roomNumber[f]);
                        availableClass.push(roomNumber[f]);
                    }
                }
                //console.log(availableClass);
            //}
            res.render("replaceClass.ejs",{c:1,availableClass:availableClass,calc:calc});
        }
    });
});

app.get("/replaceClass/:roomNumber/:time",(req,res)=>{
    var room=req.params.roomNumber;
    var u=req.user.name;
    var calc=parseInt(req.params.time);
    Faculty.find({name:u},(err,fac)=>{
        if(err) console.log(err);
        else{
            var chckRoom=fac[0].facDetails.roomNumber[fac[0].facDetails.timetable.indexOf(calc)];
            var chckSection=fac[0].facDetails.section[fac[0].facDetails.timetable.indexOf(calc)];
            var chckYear=parseInt(fac[0].facDetails.year[fac[0].facDetails.timetable.indexOf(calc)]);
            fac[0].facDetails.roomNumber.splice(fac[0].facDetails.timetable.indexOf(calc),1,room);
            fac[0].save();
            OverallTimeTable.findOne({},(err,ovt)=>{
                if(err) console.log(err);
                else{
                    for(var i=0;i<ovt.times.length;i++){
                        if(ovt.times[i]===calc && ovt.rooms[i]===chckRoom){
                            ovt.rooms.splice(i,1,room);
                            break;
                        }
                    }
                    //ovt.rooms[i]=room;
                    //
                    
                    TimeTable.findOne({year:chckYear,section:chckSection},(err,tim)=>{
                        if(err) console.log(err);
                        else{
                            tim.roomAlloted.splice(tim.timeAlloted.indexOf(calc),1,room);
                            tim.save();
                            ovt.save();
                            console.log(fac[0]);
                             console.log(tim);
                             console.log(ovt);
                             var dict={29:'Monday 9AM',30:'Monday 10AM',31:'Monday 11:15AM',32:'Monday 12:15PM',33:'Monday 2PM',34:'Monday 3PM',
                                        35:'Tuesday 9AM',36:'Tuesday 10AM',37:'Tuesday 11:15AM',38:'Tuesday 12:15PM',39:'Tuesday 2PM',40:'Tuesday 3PM',
                                        41:'Wednesday 9AM',42:'Wednesday 10AM',43:'Wednesday 11:15AM',44:'Wednesday 12:15PM',45:'Wednesday 2PM',46:'Wednesday 3PM',
                                        47:'Thursday 9AM',48:'Thursday 10AM',49:'Thursday 11:15AM',50:'Thursday 12:15PM',51:'Thursday 2PM',52:'Thursday 3PM',
                                        53:'Friday 9AM',54:'Friday 10AM',55:'Friday 11:15AM',56:'Friday 12:15PM',57:'Friday 2PM',58:'Friday 3PM'};
                             User.find({year:chckYear,section:chckSection},(err,users)=>{
                                if(err) console.log(err);
                                else{
                                    if(users.length!==0){
                                        for(var v=0;v<users.length;v++){
                                            users[v].classChange.time.push(dict[calc]);
                                            users[v].classChange.from.push(chckRoom);
                                            users[v].classChange.to.push(room);
                                            users[v].save();
                                        }
                                    }
                                    
                                }
                            });
                             
                            req.flash("success","Room replaced with the new one!");
                            res.redirect("/facultyDashboard");
                        }
                    });
                }
            });
        }
    });
});

app.get("/changeClassTimings",(req,res)=>{
    Faculty.findOne({name:req.user.name},(err,fac)=>{
        if(err) console.log(err);
        else{
            if(fac===null || fac.length===0){
                req.flash("error","Faculty is not assigned TimeTable yet");
                res.redirect("/facultyDashboard");
            }
            else{
             req.flash("success","select a cell to change its class timings");
             res.render("changeClassTimings.ejs",{fac:fac});
            }
        }
    });
});

app.get("/changeClassTimings/:time/:room",(req,res)=>{
    res.render("selectNewClassTime.ejs",{time:req.params.time,room:req.params.room});
});

app.post("/changeClassTimings",(req,res)=>{
     var roomNumber=['A-101','A-102','A-103','B-104','B-105','B-106','A-107','B-108','C-109','C-110'];
    var timeChangeTo=(parseInt(req.body.time1)+parseInt(req.body.day));
    var fromTime=parseInt(req.body.time);
    console.log(fromTime,timeChangeTo,req.body.room);
    var room=req.body.room;
    console.log('in1');
    Faculty.findOne({name:req.user.name},(err,fac)=>{
        if(err) console.log(err);
        else{
            var yr=fac.facDetails.year[fac.facDetails.timetable.indexOf(fromTime)];
            var sec=fac.facDetails.section[fac.facDetails.timetable.indexOf(fromTime)];
            OverallTimeTable.findOne({},(err,ovt)=>{
                if(err) console.log(err);
                else{
                    var roomBooked = [], i = -1;
                    var roomAvailable=[];
                    while ((i = ovt.times.indexOf(timeChangeTo, i+1)) != -1){
                        roomBooked.push(ovt.rooms[i]);
                    }
                    for(var k=0;k<roomNumber.length;k++){
                     if(!(roomBooked.includes(roomNumber[k]))){
                         roomAvailable.push(roomNumber[k]);
                     }
                    }
                    console.log('in2');
                    var newRoom = roomAvailable[Math.floor(Math.random() * roomAvailable.length)];
                    console.log("newRoom",newRoom);
                    for(var t=0;t<ovt.rooms.length;t++){
                        if(ovt.rooms[t]===req.body.room && ovt.times[t]===fromTime){
                            ovt.rooms.splice(t,1,newRoom);
                            ovt.times.splice(t,1,timeChangeTo);
                        }
                    }
                    ovt.save();
                    fac.facDetails.roomNumber.splice(fac.facDetails.timetable.indexOf(fromTime),1,newRoom);
                    fac.facDetails.timetable.splice(fac.facDetails.timetable.indexOf(fromTime),1,timeChangeTo);
                    fac.save();
                    console.log('in3');
                    TimeTable.findOne({year:yr,section:sec},(err,tim)=>{
                        if(err) console.log(err);
                        else{
                            tim.roomAlloted.splice(tim.timeAlloted.indexOf(fromTime),1,newRoom);
                            tim.timeAlloted.splice(tim.timeAlloted.indexOf(fromTime),1,timeChangeTo);
                            tim.save();
                            
                            var dict={29:'Monday 9AM',30:'Monday 10AM',31:'Monday 11:15AM',32:'Monday 12:15PM',33:'Monday 2PM',34:'Monday 3PM',
                                        35:'Tuesday 9AM',36:'Tuesday 10AM',37:'Tuesday 11:15AM',38:'Tuesday 12:15PM',39:'Tuesday 2PM',40:'Tuesday 3PM',
                                        41:'Wednesday 9AM',42:'Wednesday 10AM',43:'Wednesday 11:15AM',44:'Wednesday 12:15PM',45:'Wednesday 2PM',46:'Wednesday 3PM',
                                        47:'Thursday 9AM',48:'Thursday 10AM',49:'Thursday 11:15AM',50:'Thursday 12:15PM',51:'Thursday 2PM',52:'Thursday 3PM',
                                        53:'Friday 9AM',54:'Friday 10AM',55:'Friday 11:15AM',56:'Friday 12:15PM',57:'Friday 2PM',58:'Friday 3PM'};
                            User.find({year:yr,section:sec},(err,users)=>{
                                if(err) console.log(err);
                                else{
                                    if(users.length!==0){
                                        for(var v=0;v<users.length;v++){
                                            users[v].timeChange.fromTime.push(dict[fromTime]);
                                            users[v].timeChange.toTime.push(dict[timeChangeTo]);
                                            users[v].save();
                                        }
                                    }
                                    
                                }
                            });
                            
                            req.flash("success","Class timings changed, please view the timetable for the new slot and room");
                            res.redirect("/facultyDashboard");
                        }
                    });
                }
            });
        }
    });
});

app.get("/searchFaculty",(req,res)=>{
   res.render("searchFaculty.ejs",{c:0}); 
});
app.post("/searchFaculty",(req,res)=>{
    var faculty=req.body.faculty;
    Faculty.findOne({name:faculty},(err,fac)=>{
        if(err) console.log(err);
        else{
            if(fac===null || fac.length===0){
                req.flash("error","No Faculty Found");
                res.redirect("/facultyDashboard");
            }
            else{
                res.render("searchFaculty.ejs",{fac:fac,c:1});
            }
        }
    });
});

app.get("/scanQR",(req,res)=>{
    res.render("scanQR.ejs");
});
app.get("/aboutus",(req,res)=>{
    res.render("aboutus.ejs");
});
app.get("/helpguide",(req,res)=>{
    res.render("helpguide.ejs");
});
app.get("/FAQ",(req,res)=>{
    res.render("FAQ.ejs");
});
app.get("/reportissue",(req,res)=>{
    res.render("reportissue.ejs");
});
app.get("/suggestions",(req,res)=>{
    res.render("suggestions.ejs");
});
app.post("/suggestions",(req,res)=>{
    req.flash("success","You Suggestion is Submitted Successfully");
    res.redirect("/suggestions");
});
app.post("/reportissue",(req,res)=>{
    req.flash("success","Bug Report Submitted");
    res.redirect("/reportissue");
});
//

///****************creating and deleting room lists*************************************

app.get("/createroomlist",(req,res)=>{
    var room={'A-101':0,'A-102':0,'A-103':0,'B-104':1,'B:105':1,'B-106':1,'A-107':2,'B-108':2,'C-109':2,'C-110':2};
    for(var i in room){
        var roomNumber=i;
        var floor=room[i];
        var newroom={roomNumber:roomNumber,floor:floor};
        Room.create(newroom,(err,rooms)=>{
            if(err) console.log(err);
            else{
                console.log(rooms);
            }
        });
    }
});

app.get("/deleteroomlist",(req,res)=>{
    Room.remove({},(err,delt)=>{
        if(err) console.log(err);
        else{
        console.log(delt);
        res.redirect("/");
        }
    });
});

app.get("/deleteoverallTimeTable",(req,res)=>{
    OverallTimeTable.remove({},(err,delt)=>{
        if(err) console.log(err);
        else{
        console.log(delt);
        res.redirect("/");
        }
    });
});

 function getAllValuesFromRoom(arr, val,rooms) {
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(rooms[i]);
    return indexes;
    }

function isLoggedIn(req,res,next){
    if(req.isAuthenticated())
    {   
        return next();
    }
     req.flash("error","Please login,Don't have an account? Please Sign Up");
    res.redirect("/login");
   
}

app.listen(process.env.PORT,process.env.IP,function(){
    console.log("Occupancy Chart running");
});

