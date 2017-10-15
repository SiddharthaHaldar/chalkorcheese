var express=require("express")
var app=express()
var bodyparser=require("body-parser");
var mongoose=require("mongoose")
var morgan=require("morgan")
var session=require("express-session")
var cookieParser=require("cookie-parser")
var passport=require("passport")
var LocalStrategy=require("passport-local")
var passportLocalMongoose=require("passport-local-mongoose")
var flash=require("express-flash")

var ProgressBar = require('progressbar.js')
app.set('view engine',"ejs")
app.use(express.static('public'))
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use(session({
	secret:'poiuytrewq',
	resave:false,
	saveUninitialized:false/*,
	cookie: { maxAge: 120*1000 }*/
}))
app.use(flash());
app.use(passport.initialize())
app.use(passport.session());


app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   
   next();
});

app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
        next();
    });

mongoose.connect("mongodb://sidhaldar:sidchalkorcheese@ds129144.mlab.com:29144/chalkorcheese");

var db = mongoose.connection;

db.on('error',function(error){
 console.log(error);
});

db.once('open',function(){
 console.log("connected to database");
});

var Schema = mongoose.Schema;



/*var topicSchema=new Schema({
			start:Boolean,
			name:String,
			users:[{uid:String,
			 		bio:String,
					links:[String],
					votes:Number,
					ready:Boolean
				}],
					startDateTime:String,
					duration:String
					})*/

var topicSchema=new Schema({
	uID:String,
	topicName:String,
	topicDetails:String,
	contender1:{name:String,
				details:String,
				links:[String]},
	contender2:{name:String,
				details:String,
				links:[String]},
	vc1:Number,
	vc2:Number,
	voters:[String]
})

var topicData=mongoose.model('topic',topicSchema)

var userSchema = new Schema({
  username :  String,
  password : String,
  requests :[{uID:String,topicID:String}],
  topics :[{
            id:{type:Schema.Types.ObjectId, ref:'topic'},
            date: Date,
            name:String
            }]
})


var userData=mongoose.model('user',userSchema);

passport.serializeUser(function(user,done){
	console.log("inside serializeUser")
	done(null,user._id)
})
passport.deserializeUser(function(uID,done){
	console.log("inside deserializeUser")
	userData.findById(uID,function(err,user){
		done(err,user);
	})
	
})

passport.use('login',new LocalStrategy({passReqToCallback:true},function(req,username,password,done){
	console.log(username)
	console.log(password)
	if(req.session.passport)
	{
		userData.findById({_id:req.session.passport.user},function(err,user){
			if(err)
				return done(err)
			else
			{
				return done(null,user)
			}
		})
	}
	else{
	userData.findOne({username:username},function(err,user)
	{
		if(err)
			return done(err)
		else{
			console.log("inside login")
			if(!user){
				console.log("no such user")
				return done(null,false,req.flash('message','User not found'))
			}
			if(password!==user.password){
				console.log("incorrect password")
				return done(null,false,req.flash('message','Incorrect Password'))
			}
			return done(null,user)
		}
	})
	}
}))

passport.use('signup',new LocalStrategy({passReqToCallback:true},function(req,username,password,done){
	console.log(username)
	console.log(password)
	userData.create({username:username,
				password:password,
				topics:[],
				requests:[]},function(err,user)
				{
					if(err)
						return done(err)
					else
						{
						 	return done(null,user)
						 }
				})
}))

/*app.get('/',function(req,res){
	//res.send("welcome to chalk or cheese")
	res.render("home");
	console.log("request to home page received from:"+req.ip)
	console.log(req.session)
})*/

app.get('/' ,isAuthenticatedLogin,function(req,res){
	res.render('login')
})

function rand(req,res,next)
{return next;}
app.post('/login',passport.authenticate('login', {
	 	failureRedirect:'/'
	 }),function(req,res){
	if(req.session.tID)
	   					{
	   						console.log("voter")
	   						var temp=req.session.tID
	   						var result=delete req.session.tID
	   						res.redirect("/voter/"+temp)
	   					}
	else
	 	res.redirect('/dashboard/'+req.session.passport.user)
	 })

app.get("/signup",isAuthenticated, function(req,res){
	res.render("signup");
})

app.post("/signup",passport.authenticate('signup',{
	failureRedirect:'/signup'
}),function(req,res){
	if(req.session.tID)
	   					{
	   						console.log("voter")
	   						var temp=req.session.tID
	   						var result=delete req.session.tID
	   						res.redirect("/voter/"+temp)
	   					}
	else
			res.redirect('/dashboard/'+req.session.passport.user)
})

app.get("/about",function(req,res){
	res.render("about")
})

app.get("/createTopic",isAuthenticated, function(req,res){
		res.render("createTopic",{userId:req.session.passport.user})
})

app.post("/createTopic",isAuthenticated, function(req,res){
	console.log(req.body)
	var uID=req.session.passport.user
	var topicName=req.body.topicName;
	var topicDetails=req.body.topicDetails;
	if(req.body.c1links==="")
	{
		var lc1=[]
	}
	else
	{
		var lc1=(req.body.c1links).split(",");	
	}
	if(req.body.c2links==="")
	{
		var lc2=[]
	}
	else
	{
		var lc2=(req.body.c2links).split(",");
	}
	
	var contender1={name:req.body.c1name,
					details:req.body.c1details,
					links:lc1};
	var contender2={name:req.body.c2name,
					details:req.body.c2details,
					links:lc2};
	topicData.create({
		uID:uID,
		topicName:topicName,
		topicDetails:topicDetails,
		contender1:contender1,
		contender2:contender2,
		vc1:0,
		vc2:0
	},function(err,m){
		if(err)
			console.log(err)
		else
			{console.log(m)
			var topic={
				id:mongoose.Types.ObjectId(m._id),
				date:Date(),
				name:m.topicName
			}
			userData.update({_id:mongoose.Types.ObjectId(uID)},
							{$push:{topics:topic
								}},
							function(err,mm){
								if(err)
									console.log(err)
								else
									console.log("topic added")
							})
			res.redirect("/topicUrl/"+m._id)}
	})
})

app.get("/topicUrl/:tID",isAuthenticated, function(req,res)
{
	topicData.find({_id:mongoose.Types.ObjectId(req.params.tID)},function(err,m){
		if(err)
			console.log(err)
		else
		{
			if(m[0].uID===req.session.passport.user)
			{
				res.render("topicUrl",{tID:req.params.tID,uID:req.session.passport.user})	
			}
			else
			{
				res.redirect('/dashboard/'+req.session.passport.user)
			}
		}
	})
		
})



app.get("/dashboard/:userid",isAuthenticated, function(req,res){
	
		var uID=req.params.userid;
		console.log(uID)
		userData.find({_id:mongoose.Types.ObjectId(uID)},function(err,m){
			if(err)
				console.log(err)
			else
			{
				console.log(m)
				res.render('dashboard',{user:m[0]})
			}
		})
	
})

app.get("/topic/:topic",isAuthenticated, function(req,res){
	console.log(req.body)
		var topicID=req.params.topic
		console.log(topicID)
		topicData.find({_id:mongoose.Types.ObjectId(topicID)},function(err,m){
			if(err)
				console.log(err)
			else
				res.send(m[0])
		})
})

app.get("/topicStats/:topic",isAuthenticated, function(req,res){
	console.log(req.body)
		var topicID=req.params.topic
		console.log(topicID)
		topicData.find({_id:mongoose.Types.ObjectId(topicID)},function(err,m){
			if(err)
				console.log(err)
			else
				res.render("topicStats",{topic:m[0]})
		})
})

app.get("/voter/:tID",isAuthenticatedVoter, function(req,res){
	
	var tID=req.params.tID
	//console.log(tID)
	topicData.find({_id:mongoose.Types.ObjectId(tID)},function(err,m){
		if(err)
			console.log(err)
		else{
			console.log(m)
			if(req.session.passport.user===m[0].uID)
			{
				
				res.render("sorry",{message:"Sorry, you created this topic, so u cant vote :(",
									uID:req.session.passport.user})
			}
			else if(m[0].voters.indexOf(req.session.passport.user)===-1)
				res.render("vote",{topic:m,user:req.session.passport.user})
			else
				{
				res.render("sorry",{message:"Sorry pal, you have already voted!",
									uID:req.session.passport.user})}
		}
	})
	
})

app.post("/vote",isAuthenticated, function(req,res){
 
  var data=req.body.vote;
  console.log(data)
  var s=data.split("|")
  console.log(s)
  if(s[1]==='vc1')
  {
  	topicData.update(
  		{_id:mongoose.Types.ObjectId(s[0])},
  		{$inc  : {vc1: 1},$push :{voters:req.session.passport.user}},function(err,m){
  		if(err)
  			console.log(err)
  		else
  			console.log("vc1 updated")
  			res.redirect('/dashboard/'+req.session.passport.user)}
  		)
	}
	else
	{
	topicData.update(
		{_id:mongoose.Types.ObjectId(s[0])},
  		{$inc  : {vc2: 1},$push :{voters:req.session.passport.user}},function(err,m){
  		if(err)
  			console.log(err)
  		else
  			console.log("vc2 updated")
  			res.redirect('/dashboard/'+req.session.passport.user)}
  		)
	}
  
})

function isAuthenticated(req,res,next){
	if(req.isAuthenticated())
		return next();
	res.redirect('/')
}

function isAuthenticatedLogin(req,res,next){
	if(req.isAuthenticated())
		res.redirect("/dashboard/"+req.session.passport.user)
	else{
		res.render("login")
	}
}

function isAuthenticatedVoter(req,res,next){
	if(req.isAuthenticated())
		return next();
	else{
		req.session.tID=req.params.tID;
		console.log(req.session)
		res.redirect("/")
	}
}

app.post("/accept",function(req,res){

})

app.get('/logout',function(req,res){
	req.session.destroy();
	res.redirect('/')
})

app.listen(8000,function(){
	console.log("server started")
})