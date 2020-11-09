// requiring all dependinces
require("dotenv").config();

const express = require("express");

const ejs = require("ejs");

const mongoose = require("mongoose");

const bodyparser = require("body-parser");

const session = require("express-session");

const passpotLocalMongoose = require("passport-local-mongoose");

const passport = require("passport");

const e = require("express");

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const findOrCreate = require('mongoose-findorcreate');
//-----------------------------------------------------------------------------

//setting up all the dependinces
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));

//------------------------------------------------------------------------------
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// connecting mongoose and linking to local database
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);
// Creating a new schema for user input

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});

userSchema.plugin(passpotLocalMongoose);
userSchema.plugin(findOrCreate);

// created a encryption setup through mongoose

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// Serializing and deserializing the users using passport
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//--------------------------------------------------------------------------
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRETS,
  callbackURL: "http://localhost:8000/auth/google/secrets",
 // userProfileURL:"https://googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));
//--------------------------------------------------------------------------

// Rendering somepages

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));
  
app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/submit", function (req, res) {
  res.render("submit");
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
})
//---------------------------------------------------------------------

// Post method for register page to store user data

app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

//------------------------------------------------------------------------------

//post method for loginging users
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      })
    }
  })

});

//------------------------------------------------------------------

app.listen(8000, function (req, res) {
  console.log("server started sucessfully");
});
