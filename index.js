const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const User = require("./User");
require("dotenv").config();

const { MONGODB_URI, PORT = 3000 } = process.env;
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send(`
    <h1>Home</h1>
    <p><a href='/users'>View users</a></p>
    <p><a href='/user/add'>Add user</a></p>
  `);
});

const formatUsersContent = (data) =>
  data.reduce((acc, item) => {
    const { _id, date, username, email } = item;
    acc += `
    <ul>
      <li>id: <a href='/user/id/${_id}'>${_id}</a></li>
      <li>username: <a href='/user/search/${username}'>${username}</a></li>
      <li>date: ${date}</li>
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

app.get("/user/id/:id", (req, res, next) => {
  User.findOne({ _id: req.params.id })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      return next(err);
    });
});

app.get("/user/search/:searchTerm", (req, res, next) => {
  const { searchTerm } = req.params;
  User.find({
    username: { $regex: new RegExp(searchTerm, "i") },
  })
    .then((data) => {
      if (data.length === 0) {
        return res.status(404).json({ message: "Users not found" });
      }
      res.status(200).json(data);
    })
    .catch((err) => {
      return next(err);
    });
});

app.get("/user/add", (req, res) => {
  const filePath = path.join(__dirname, "add-user.html");
  res.sendFile(filePath);
});

app.post("/user/add", (req, res, next) => {
  const { username, email, password } = req.body;
  const newUser = new User({ username, email, password });
  newUser
    .save()
    .then((data) => {
      return res.status(200).send({
        data,
        message: `Thank you ${username}, your user account has been set up. You can now login.`,
        error: false,
      });
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
