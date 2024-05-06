const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const { check, validationResult } = require('express-validator');
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

// 422 status code: unable to process the request as it contains invalid data
const unprocessableEntityStatus = 422;

// Registration
app.post('/user/register', async (req, res, next) => {
  const { username, email, password } = req.body;
  if (password) {
    await check('confirmedpassword').equals(password).withMessage('passwords do not match').run(req);
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let errorMessage = 'Invalid input: Email must be valid, and the username and password must be 6 - 24 characters long.';
    if (errors.errors.length == 1 && errors.errors[0].param === 'confirmedpassword') {
      errorMessage = 'The password and confirmation password do not match.';
    }
    const error = new Error(errorMessage);
    error.status = unprocessableEntityStatus;
    return next(error);
  }
  User.findOne({ username })
    .then(user => {
      if (user) {
        const error = new Error(`Sorry, the username ${username} already exists. Please try a different one.`);
        error.status = unprocessableEntityStatus;
        return next(error);
      } else {
        const newUser = new User({ username, email, password });
        newUser.save()
        .then(newUserData => {
          return res.status(200).send({
            error: false,
            data: newUserData,
            message: `Thank you ${username}, your user account has been set up. You can now login.`
          });
        })
      }
    })
    .catch(err => {
      return next(err);
    });
});

// Login
router.post('/user/login', (req, res, next) => {
  const { username, password } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Invalid input. The username and password must be completed and be 6 - 24 characters long.');
    error.status = unprocessableEntityStatus;
    return next(error);
  }
  User.findOne({ username })
    .then(user => {
      if (!user) {
        const error = new Error('Username does not exist');
        error.status = unprocessableEntityStatus;
        return next(error);
      } else {
        user.comparePassword(password, function(error, isMatch) {
          if (error) return next(error);
          if (!isMatch) {
            const error = new Error('Incorrect password');
            error.status = unprocessableEntityStatus;
            return next(error);
          } else {
            res.status(200).json({
              error: false,
              data: user,
              message: `Thank you ${username}, you have logged in successfully. Your customer details are shown below.`
            });
          }
        });
      }
    })
    .catch(err => {
      next(err);
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
