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

var localStrategy=require("passport-local");

var passport=require("passport");

app.use(require("express-session")({
    secret:"Occupancy Chart",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());


//mongoose.connect("mongodb://localhost/SE_db_v14",{useNewUrlParser: true});
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

app.get("/",(req,res)=>{
   res.render("signup.ejs");
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


app.post("/otp",(req,res)=>{
    var u=req.user.username;
    var otp=((req.body.otp).toString());
    console.log(otp);
    User.find({username:u},(err,usr)=>{
        if(err)
        console.log(err);
        else{
            console.log(usr[0]);
            if(usr[0].otp===otp){
                console.log(usr[0]);
                if(usr[0].admin===true)
                res.send("Admin logged in");
                else
               res.send("User Logged In!!");   
            }
            else{
                console.log(usr);
                usr[0].count+=1;
                usr[0].save();
                if(usr[0].count!=3)
                {
                    req.flash("error","Incorrect OTP!!");
                     res.render("otp.ejs",{username:u,c:usr[0].count});
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
             if(ad.admin==true){
        res.send("Admin Logged In");
    }
    else{
        res.send("User Logged In!");
    }
        }
    });
   
});

app.post('/locklogin',(req,res)=>{
    User.findOne({username:req.body.username},(err,u)=>{
    if(err)
    console.log(err);
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
        //req.flash("error",""+err.message);
        return res.redirect("/signup");
        }
        else
        {
            passport.authenticate("local")(req,res,()=>{
            users.pass=req.body.password;
            users.phoneNumber=req.body.phoneNumber;
            users.name=req.body.name;
            users.rollno=req.body.rollno;
            users.age=req.body.age;
            users.phoneNumber=req.body.phoneNumber;
            users.dept=req.body.dept;
            users.section=req.body.section;
            
            if(users.username==='se.chartgeneration@gmail.com'){
            users.admin=true;
            }
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
   res.redirect("/");
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
    var facD={courseName:req.body.subjectName,section:req.body.section,year:req.body.year,timetable:[0]};
    var fac={name:req.body.facultyAssigned,facDetails:facD};
    var noOfClassesPerWeek=req.body.noOfClassesPerWeek;
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
        
        
        fac11.facDetails.timetable=facTimeArray;//assigning the time to the faculty timetable
        
        
        /////////////************BELOW APRIL 1 code************////////////////
        
       
        
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
});

app.get("/adminNewSubjectNext/:numberOfClass/:id",(req,res)=>{
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
                res.send("all subjects taken in");
            }
        }
    });
});

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

app.listen(process.env.PORT,process.env.IP,function(){
    console.log("Occupancy Chart running");
});

