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
  username: {
    type: String,
    required: true
  },
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
  },
  _id: {
    required: true
  }
});

const exerciseModel = mongoose.model('exercise', exerciseSchema);

app.route('/api/users/:_id/exercises')
.post(function(req, res) {

});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
