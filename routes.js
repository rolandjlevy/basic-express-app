const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const path = require("path");
const User = require("./User.js");
const { formatUsersContent } = require("./public/utilsCommonJS.js");

// 422 status code: unable to process the request as it contains invalid data
const unprocessableEntityStatus = 422;

// Home
router.get("/", (req, res) => {
  res.send(`
    <h1>Home</h1>
    <p><a href='/users'>View users</a></p>
    <p><a href='/user/search'>Search user</a></p>
    <p><a href='/user/register'>Register user</a></p>
    <p><a href='/user/login'>Login user</a></p>
  `);
});

// view all users
router.get("/users", (req, res, next) => {
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

// view user by id
router.get("/user/id/:id", (req, res, next) => {
  User.findOne({ _id: req.params.id })
    .then((data) => res.status(200).json(data))
    .catch((err) => next(err));
});

// view user by username
router.get("/user/search/:searchTerm", (req, res, next) => {
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

// search page
router.get("/user/search", (req, res) => {
  const filePath = path.join(__dirname, "./public/search.html");
  res.sendFile(filePath);
});

// search user by username
router.post("/user/search", (req, res, next) => {
  const { username } = req.body;
  User.find({
    username: { $regex: new RegExp(username, "i") },
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

// registration page
router.get("/user/register", (req, res) => {
  const filePath = path.join(__dirname, "./public/register.html");
  res.sendFile(filePath);
});

// register
router.post("/user/register", async (req, res, next) => {
  const { username, email, password } = req.body;
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    let errorMessage =
      "Invalid input: Email must be valid, and the username and password must be 6 - 24 characters long.";
    if (
      validation.errors.length == 1 &&
      validation.errors[0].param === "confirmedpassword"
    ) {
      errorMessage = "Password and confirmation password do not match.";
    }
    const error = new Error(errorMessage);
    error.status = unprocessableEntityStatus;
    return next(error);
  }
  User.findOne({ username })
    .then((user) => {
      if (user) {
        const error = new Error(
          `Sorry, the username ${username} already exists. Please try a different one.`
        );
        error.status = unprocessableEntityStatus;
        return next(error);
      } else {
        const newUser = new User({ username, email, password });
        newUser.save().then((data) => {
          return res.status(200).send({
            data,
            message: `Thank you ${username}, your user account has been set up. You can now login.`,
            error: false,
          });
        });
      }
    })
    .catch((err) => {
      return next(err);
    });
});

// login page
router.get("/user/login", (req, res) => {
  const filePath = path.join(__dirname, "./public/login.html");
  res.sendFile(filePath);
});

// login
router.post("/user/login", (req, res, next) => {
  const { username, password } = req.body;
  const validation = validationResult(req);
  if (!validation.isEmpty()) {
    const error = new Error(
      "Invalid input. The username and password must be completed and be 6 - 24 characters long."
    );
    error.status = unprocessableEntityStatus;
    return next(error);
  }

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        const error = new Error("Username does not exist");
        error.status = unprocessableEntityStatus;
        return next(error);
      } else {
        user.comparePassword(password, function (error, isMatch) {
          if (error) return next(error);
          if (!isMatch) {
            const error = new Error("Incorrect password");
            error.status = unprocessableEntityStatus;
            return next(error);
          } else {
            res.status(200).json({
              error: false,
              data: user,
              message: `Thank you ${username}, you have logged in successfully. Your customer details are shown below.`,
            });
          }
        });
      }
    })
    .catch((err) => {
      next(err);
    });
});

// Page not found
router.get("*", (req, res, next) => {
  var url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  res.status(404).json({
    error: true,
    message: `Error 404! Page not found. Unable to access ${url}`,
  });
});

module.exports = router;
