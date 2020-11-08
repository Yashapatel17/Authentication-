// requiring all dependinces
require('dotenv').config()

const express = require("express");

const ejs = require("ejs");

const mongoose = require("mongoose");

const bodyparser = require("body-parser");

const md5 = require('md5');

const bcrypt = require ('bcrypt');
//-----------------------------------------------------------------------------

//setting up all the dependinces
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({ extended: true }));

//------------------------------------------------------------------------------


const saltRounds = 10;


// connecting mongoose and linking to local database
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

// Creating a new schema for user input

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

// created a encryption setup through mongoose

const User = new mongoose.model("User", userSchema);

//--------------------------------------------------------------------------

// Rendering somepages

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/submit", function(req,res){
    res.render("submit")
})
//---------------------------------------------------------------------

// Post method for register page to store user data

app.post("/register", function (req, res) {

  bcrypt.genSalt(saltRounds, function(err, salt) {
    bcrypt.hash(req.body.password, salt, function(err, hash) {
      const newUser = new User({
        email: req.body.username,
        password: hash,
      });
    
      newUser.save(function (err) {
        if (!err) {
          res.render("secrets");
        } else {
          console.log(err);
        }
      });
    });
    });
});


//------------------------------------------------------------------------------

//post method for loginging users
app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({ email: username }, function (err, founduser) {
    if (err) {
      console.log(err);
    } else {
      if (founduser) {
          bcrypt.compare(password, founduser.password, function(err, result) {
           if(result === true){
            res.render("secrets");
           }
        });
          
        
      }
    }
  });
});

//------------------------------------------------------------------

app.listen(8000, function (req, res) {
  console.log("server started sucessfully");
});
