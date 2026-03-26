const express = require("express");
const app = express();
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen("5000", () => {
  console.log("Server running on port 5000");
});
