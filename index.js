const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const { MONGODB_URI, PORT = 3000 } = process.env;
const routes = require("./routes");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use("/", routes);

app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
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
