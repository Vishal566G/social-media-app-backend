const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 20,
  },
  email: {
    type: String
  }
});
