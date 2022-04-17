const express = require("express");
var cors = require("cors");
const morgan = require("morgan");

const rootRoute = require("./routes/root");
const authRoutes = require("./routes/authRoutes");

const appError = require("./utils/appError");


const app = express();
const { reverseMap } = require("./reverseMap");
app.use((req, res, next) => {
  req.reverseMap = reverseMap;
  next();
});
app.use(morgan("dev"));
app.use(cors());

app.use(express.json());
// Root routes; mainly used for Elastic Beanstalk health report

app.use("/", rootRoute);
app.use("/api/v1/auth", authRoutes);
app.all("*", (req, res, next) => {
  next(new appError(`can not find ${req.originalUrl} on this server!`, 404));
});
//app.use(globalErrorHandler);
module.exports = app;
