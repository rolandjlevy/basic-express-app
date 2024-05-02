const express = require("express");
const mongoose = require("mongoose");
const User = require("./User");
require("dotenv").config();

const { MONGODB_URI, PORT = 3000 } = process.env;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => res.send("Home"));

const formatUsersContent = (data) =>
  data.reduce((acc, item) => {
    const { _id, date, username, email } = item;
    acc += `
    <ul>
      <li>id: <a href='/user/${_id}'>${_id}</a></li>
      <li>date: ${date}</li>
      <li>username: ${username}</li>
      <li>email: ${email}</li>
    </ul>`;
    return acc;
  }, "");

app.get("/users", (req, res, next) => {
  User.find({})
    .then((data) => {
      const users = formatUsersContent(data);
      const content = `
      <h3>All users</h3>
      <section>${users}</section>
    `;
      res.status(200).send(content);
    })
    .catch((err) => {
      return next(err);
    });
});

app.get("/user/:id", (req, res, next) => {
  User.findOne({ _id: req.params.id })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      return next(err);
    });
});

mongoose
  .connect(MONGODB_URI, {})
  .then((client) => {
    console.log("Mongoose is connected...");
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(error.stack);
    process.exit(1);
  });
