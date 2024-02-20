const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
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
    userModel.find({}, (err, users) => {
      if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(users.map(user => ({
        username: user.username,
        _id: user._id
      })));
    });
  })
  .post(function(req, res) {
    const { username } = req.body;
    const newUser = new userModel({ username });

    newUser.save((err, savedUser) => {
      if (err) {
        console.error("Error creating user:", err);
        return res.status(400).json({ error: "Could not create user" });
      }
      res.json({ username: savedUser.username, _id: savedUser._id });
    });
  });

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String
});

const exerciseModel = mongoose.model('exercise', exerciseSchema);

app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration, date } = req.body;
  const { _id } = req.params;

  userModel.findById(_id, (err, user) => {
    if (err || !user) {
      console.error("Error finding user:", err);
      return res.status(404).json({ error: "User not found" });
    }

    const newExercise = new exerciseModel({
      username: user.username,
      description,
      duration,
      date: date ? new Date(date).toDateString() : new Date().toDateString()
    });

    newExercise.save((err, savedExercise) => {
      if (err) {
        console.error("Error creating exercise:", err);
        return res.status(400).json({ error: "Could not create exercise" });
      }

      res.json({
        _id: user._id,
        username: user.username,
        description: savedExercise.description,
        duration: savedExercise.duration,
        date: savedExercise.date
      });
    });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  userModel.findById(_id, (err, user) => {
    if (err || !user) {
      console.error("Error finding user:", err);
      return res.status(404).json({ error: "User not found" });
    }

    exerciseModel.find({ username: user.username }, (err, exercises) => {
      if (err) {
        console.error("Error fetching exercises:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      let log = exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date
      }));

      if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        log = log.filter(exercise => {
          const exerciseDate = new Date(exercise.date);
          return exerciseDate >= fromDate && exerciseDate <= toDate;
        });
      }

      if (limit) {
        log = log.slice(0, limit);
      }

      res.json({
        _id: user._id,
        username: user.username,
        count: log.length,
        log
      });
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
