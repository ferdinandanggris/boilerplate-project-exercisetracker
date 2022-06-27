const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//bodyParser for post data
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Database
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//Schema
let userSchema = new mongoose.Schema({
  "username" : {type:String,required:true},
})

let exerciseSchema = new mongoose.Schema({
  "user_id" : {type:String}, 
  "description" : {type:String},
  "duration" : {type:Number},
  "date" : {type:Date},
})


//Model
let User = new mongoose.model('User',userSchema);
let Exercise = new mongoose.model('Exercise',exerciseSchema);
let Log = new mongoose.model('Log',userSchema);


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//user route
app.route("/api/users")
  .post(function(req,res){
  let data = new User({
    username : req.body.username
  });
  data.save(function(err,data){
    if(err) return console.error(err);
    res.send(data);
  })
})
  .get(async function(req,res){
    let result =await User.find();
    if((typeof result === "undefined") || (result == null)){
      return console.error("Error while get Data User");
      
    }else{
      res.send(result);
    }
  })

//exercise route
app.post("/api/users/:_id/exercises",async function(req,res){
  
  let data = new Exercise({
    user_id : req.params._id,
    description : req.body.description,
    duration : req.body.duration,
    date : new Date(req.body.date || Date.now()).toDateString()
  });

  let userData =await User.findById({_id : req.params._id}).exec();

  
  
  data.save(function(err,data){
    if(err) return console.error(err);
      res.send({_id: userData._id,username : userData.username,description : data.description, duration : Number(data.duration), date : new  Date(data.date).toDateString()})

    })
  })

app.get("/api/users/:_id/logs?",async function(req,res){

let query = Exercise.find({user_id:req.params._id});

if(req.query.from){
  query = query.find({date:{
    '$gte' : new Date(req.query.from).toISOString()}});
}

if(req.query.to){
  query = query.find({date:{
    '$lt' : new Date(req.query.to).toISOString()}});
}

if(req.query.limit){
    query = query.limit(Number(req.query.limit));
}
  
  let data = await query.exec();
  if(data.length <1){
    return res.send({error : "No data found!"})
  }

  let userData =await User.findById({_id : req.params._id}).exec();

  let log = [];
  data.forEach(function(el,i){ log.push({description:el.description,duration:el.duration,date : new Date(el.date).toDateString()});
  })
  
  let dataLog = {
    _id : data[0].user_id,
    username : userData.username,
    count : data.length,
    log : log
  }
  res.send(dataLog);
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
