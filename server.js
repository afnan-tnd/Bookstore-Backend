const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { errorWrapper } = require("./utils/errorWrapper")
dotenv.config({ path: ".env" });
const App = require("./app");
const { reverseMap } = require("./reverseMap");
const userHandlers = require("./socketHandlers/userHandlers");
mongoose
  .connect(process.env.mongourl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("database is connected successfully");
  });

const PORT = process.env.PORT || 5000;

const server = App.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
io.on("connection", (socket) => {
  console.log("A user got connected with socket id", socket.id);
  userHandlers(io, socket, reverseMap);
  socket.on("disconnect", () => {
    console.log("disconnect occured for socket-id", socket.id);
  });
});
App.io = io;
process.on('uncaughtException', (error) => {
  errorWrapper(error, true)
});
process.on('unhandledRejection', (reason, promise) => {
  errorWrapper(reason, true)
});