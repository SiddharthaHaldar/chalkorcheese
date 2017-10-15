var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();

app.use(cookieParser());

app.use(session({ secret: 'plata o plomo', cookie: { maxAge: 30000 }}))

// Access the session as req.session
app.get('/', function(req, res,next) {
  console.log(req)
	console.log(req.session)
  if (req.session.views) {
    req.session.views++
    res.setHeader('Content-Type', 'text/html')
    res.write('<p>views: ' + req.session.views + '</p>')
    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
    res.end()
  } 
  else 
  {
    res.redirect('/login')
  }
})
app.get('/login',function(req,res){
  req.session.views=1;
  console.log(req)
  console.log(req.session)
  res.send("Login please")
})

app.get('/logout',function(req,res){
  req.session.destroy();
  res.send('logged out')
})

app.listen(3000,function(){
	console.log("server started")
});