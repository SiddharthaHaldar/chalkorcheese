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

app.set('view engine',"ejs")
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use(session({
	secret:'poiuytrewq',
	resave:false,
	saveUninitialized:false
}))

app.use(passport.initialize())
app.use(passport.session());

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
	contender1:{name:String,
				details:String,
				links:[String]},
	contender2:{name:String,
				details:String,
				links:[String]},
	vc1:Number,
	vc2:Number
})

var topicData=mongoose.model('topic',topicSchema)

var userSchema = new Schema({
  username :  String,
  password : String,
  requests :[{uID:String,topicID:String}],
  topics :[{
            type:Schema.Types.ObjectId, ref:'machine'
        }]
})

userSchema.plugin(passportLocalMongoose);

var userData=mongoose.model('user',userSchema);

passport.serializeUser(userData.serializeUser())
passport.deserializeUser(userData.deserializeUser())

app.get('/',function(req,res){
	//res.send("welcome to chalk or cheese")
	res.render("home");
	console.log("request to home page received from:"+req.ip)
})

app.post("/createTopic",function(req,res){
	var uID=req.body.uID
	var topicName=req.body.topicName;
	var lc1=(req.body.c1links).split(",");
	var lc2=(req.body.c2links).split(",");
	var contender1={name:req.body.c1name,
					details:req.body.c1details,
					links:lc1};
	var contender2={name:req.body.c2name,
					details:req.body.c2details,
					links:lc2};
	topicData.create({
		uID:uID,
		topicName:topicName,
		contender1:contender1,
		contender2:contender2,
		vc1:0,
		vc2:0
	},function(err,m){
		if(err)
			console.log(err)
		else
			{console.log(m)
			userData.update({_id:mongoose.Types.ObjectId(uID)},
							{$push:{topics:mongoose.Types.ObjectId(m._id)}},
							function(err,mm){
								if(err)
									console.log(err)
								else
									console.log("topic added")
							})
			res.send("New topic created")}
	})
})

app.get("/signup",function(req,res){
	res.render("signup");
})

app.post("/signup",function(req,res){
	console.log("post received")
	var un=req.body.username;
	var pwd=req.body.password;
	console.log(un);
	
	console.log(pwd)
	/*userData.create({username:un,
				password:pwd,
				topics:[],
				requests:[]},function(err,m)
				{
					if(err)
						console.log(err)
					else
						{console.log("created")
						 console.log(m)
						 res.send("user added")}
				})*/
	userData.register(new userData({username:un}, pwd,function(err,user){
		if(err){
			console.log(err)
			res.send(err)
		}
		passport.authenticate("local")(req,res,function(){
			res.send('user registered');
		})
	}))
})

app.get("/topic/:topic",function(req,res){
	console.log(req.body)
		var topic=req.params.topic
		console.log(topic)
		//res.send(topics[topic-1])
})

app.post("/vote",function(req,resp){
  var topic=req.body.topic;
  var user=req.body.uid;
  //topics[topic-1].users[user].vote+=1;
})

app.post("/accept",function(req,res){

})

app.listen(8000,function(){
	console.log("server started")
})