const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); 
const app = express();
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const users = [];
const exercises = {};

const formatDate = (date) => {
  return date ? new Date(date).toDateString() : new Date().toDateString();
};

app.post('/api/users', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const user = { username, _id: uuidv4() };
  users.push(user);
  res.json(user);
});

app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const user = users.find((user) => user._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const exercise = {
    description,
    duration: Number(duration),
    date: formatDate(date),
  };

  if (!exercises[_id]) {
    exercises[_id] = [];
  }

  exercises[_id].push(exercise);

  res.json({
    username: user.username,
    ...exercise,
    _id,
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = users.find((user) => user._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let log = exercises[_id] || [];

  if (from) {
    const fromDate = new Date(from);
    log = log.filter((entry) => new Date(entry.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter((entry) => new Date(entry.date) <= toDate);
  }

  if (limit) {
    log = log.slice(0, Number(limit));
  }

  res.json({
    username: user.username,
    count: log.length,
    _id,
    log,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
