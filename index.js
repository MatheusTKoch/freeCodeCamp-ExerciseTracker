const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL);

app.use(cors())
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});

const userModel = mongoose.model('user', userSchema);

app.route('/api/users')
.get(function(req, res) {
  var userQuery = userModel.find().exec();
  userQuery.then(function(doc) {
    var userQueryArray = []
    for (let i = 0; i < doc.length; i++) {
      userQueryArray.push({
        username: doc[i].username,
        _id: doc[i]._id
      });
    }
      res.json(userQueryArray);
  });
})
.post(function(req, res) {
  let userName = req.body.username;
  var newUser = new userModel({
    username: userName
  });

  newUser.save();

  res.json({
    username: userName,
    _id: newUser._id
  });
});

const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  }
});

const exerciseModel = mongoose.model('exercise', exerciseSchema);

app.route('/api/users/:_id/exercises')
.post(function(req, res) {
    var userID = req.params._id;

    var userName = userModel.find({_id: userID}).exec();
    userName.then(function(doc) {

      var desc = req.body.description;
      var dur = req.body.duration;
      var user = doc[0].username;

      var dateFinal = '';

        if (!req.body.date) {
          dateFinal = new Date().toDateString();
        } else {
          dateFinal = new Date(req.body.date).toDateString();
        }

      var newExercise = new exerciseModel({
        description: desc,
        duration: dur,
        date: dateFinal
      });

      newExercise.save();
      
      res.json({
        username: user,
        description: desc,
        duration: dur,
        date: dateFinal,
        _id: userID
      });

    });
});

app.route('/api/users/:_id/logs/:from?/:to?/:limit?')
.get(function(req, res) {
  var userId = req.params._id;
  var searchParamsFrom = req.params.from;
  var searchParamsTo = req.params.to;
  var searchParamsLimit = req.params.limit;

  var userName = userModel.find({_id: userId}).exec();
  userName.then(function(doc) {

    var user = doc[0].username;

    var exerciseByUser = exerciseModel.find({username: user}, {
      _id: 0,
      description: 1,
      duration: 1,
      date: 1
    }).exec()
    exerciseByUser.then(function(docExercise) {

      let docExerciseFilter = docExercise;
      let docExerciseFiltered = docExercise;

      if (searchParamsFrom && searchParamsTo) {
         let from = new Date(searchParamsFrom);
         let to = new Date(searchParamsTo)
         docExerciseFiltered = docExerciseFiltered.filter((doc) => doc.date >= from);
         docExerciseFiltered = docExerciseFiltered.filter((doc) => doc.date <= to);
      }

      if (searchParamsLimit) {
         docExerciseFiltered = docExerciseFilter.slice(0, searchParamsLimit);
      }

      var countRes = docExerciseFiltered.length;
      res.json({
        username: user,
        count: countRes,
        _id: userId,
        log: docExerciseFiltered
      });
    });
  })
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
