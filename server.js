const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: ".env" });
const App = require("./app");
const { reverseMap } = require("./reverseMap");
const userHandlers = require("./socketHandlers/userHandlers");


// cron.schedule(" */2 * * * * ", () => {
//   get_all_list_contents();
//   console.log("running a task every 2 minutes");
// });

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
