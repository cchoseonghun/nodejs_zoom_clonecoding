import http from "http";
import SocketIO from "socket.io";
// import { Server } from 'socket.io';
// import { instrument } from '@socket.io/admin-ui';
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
  socket.on("join_room", (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit('welcome');
  });
});

// const wsServer = new Server(httpServer, {
//   cors: {
//     origin: ['https://admin.socket.io'],
//     credentials: true,
//   },
// });

// instrument(wsServer, {
//   auth: false
// })

const handleListen = () => console.log(`Listening on http://localhost:3000 `);
httpServer.listen(3000, handleListen);
