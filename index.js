const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }]
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
  },
  date_log: {
    type: Date,
    default: Date.now
  }
});

const userModel = mongoose.model('User', userSchema);
const exerciseModel = mongoose.model('Exercise', exerciseSchema);

app.get('/api/users', (req, res) => {
  userModel.find({}, '_id username', (err, users) => {
    if (err) {
      console.error("Error finding users:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(users);
  });
});

app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const newUser = new userModel({ username });

  newUser.save((err, savedUser) => {
    if (err) {
      console.error("Error creating user:", err);
      return res.status(400).json({ error: "Could not create user" });
    }
    res.json(savedUser);
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration, date } = req.body;
  const { _id } = req.params;

  userModel.findById(_id, (err, user) => {
    if (err || !user) {
      console.error("Error finding user:", err);
      return res.status(404).json({ error: "User not found" });
    }

    const newExercise = new exerciseModel({
      description,
      duration,
      date: date ? new Date(date).toDateString() : new Date().toDateString()
    });

    newExercise.save((err, savedExercise) => {
      if (err) {
        console.error("Error creating exercise:", err);
        return res.status(400).json({ error: "Could not create exercise" });
      }

      user.exercises.push(savedExercise);
      user.save((err, savedUser) => {
        if (err) {
          console.error("Error saving user:", err);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        // Populate the exercise fields
        savedUser.populate('exercises', (err, userWithExercises) => {
          if (err) {
            console.error("Error populating exercises:", err);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          res.json(userWithExercises);
        });
      });
    });
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + process.env.PORT || 3000);
});
