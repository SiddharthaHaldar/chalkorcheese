var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();

app.use(cookieParser());

//Tweak the maxAge to see what happens to the lifetime of the session
//in this case try refreshing the pages after 30 seconds and see what happens
app.use(session({ secret: 'plata o plomo', cookie: { maxAge: 30000 }}))

// Access the session as req.session
app.get('/', function(req, res,next) {
	console.log(req.session)

  //The if condition checks if at all a session exists or not by checking the presence of the
  // user object. If its true then proceed with how you want to handle the request
  if (req.session.user) {
    res.send(req.session.user)
  } 
  //Or else redirect the user to the login page
  else 
  { 
    res.redirect('/login')
  }
})
//Keep in mind that the checking of the existence of the req.session.user object HAS TO BE DONE
//AT THE BEGINNING OF EVERY app.get or app.post.



app.get('/login',function(req,res){
  res.send("Login please")
  //get the user credentials i.e. the username and password. After getting them search both the 
  //teacher and student tables for the corresponding user(basically run two queries one for the teacher
  //table and the other one for the student table). If the query for the teacher table returns 
  //a result then :
  req.session.user={
    uername:username,
    password:password,
    teacher:true
  }
  //or else if the query for the student table returns a result then:
  req.session.user={
    uername:username,
    password:password,
    teacher:false
  }
  //The above lines of code create the session with a maxAge
  //Now redirect the user to the home or whatever page you want to redirect to....
})
app.listen(3000,function(){
	console.log("server started")
});