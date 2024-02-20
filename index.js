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
  },
  logs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }]
});

const userModel = mongoose.model('User', userSchema);

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
    type: Date,
    required: true,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const exerciseModel = mongoose.model('Exercise', exerciseSchema);

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

  newUser.save((err) => {
    if (err) {
      console.error("Error creating user:", err);
      return res.status(500).send("Error creating user");
    }

    res.json({
      username: userName,
      _id: newUser._id
    });
  });
});

app.route('/api/users/:_id/exercises')
.post(function(req, res) {
    var userID = req.params._id;

    var userName = userModel.findById(userID).exec();
    userName.then(function(user) {
      var desc = req.body.description;
      var dur =  req.body.duration;

      var dateFinal = req.body.date ? (new Date(req.body.date)).toDateString() : (new Date()).toDateString();

      var newExercise = new exerciseModel({
        description: desc,
        duration: dur,
        date: dateFinal,
        userId: userID
      });

      newExercise.save((err) => {
        if (err) {
          console.error("Error creating exercise:", err);
          return res.status(500).send("Error creating exercise");
        }

        user.logs.push(newExercise);
        user.save((err) => {
          if (err) {
            console.error("Error updating user:", err);
            return res.status(500).send("Error updating user");
          }

          res.json(user);
        });
      });
    });
});

app.route('/api/users/:_id/logs')
.get(function(req, res) {
  var userId = req.params._id;

  var userPromise = userModel.findById(userId).populate('logs').exec();
  userPromise.then(function(user) {
    var log = user.logs.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: (new Date(exercise.date)).toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      log: log
    });
  })
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
