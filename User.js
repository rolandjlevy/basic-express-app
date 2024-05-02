const mongoose = require('mongoose');
const moment = require('moment');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: { unique: true }
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: moment().format('DD/MM/YYYY, hh:mm:ss A')
  }
});

module.exports = mongoose.model('User', UserSchema);