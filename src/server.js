import http from 'http';
// import WebSocket from 'ws';
import SocketIO from 'socket.io';
import express from 'express';

const app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const handleListen = () => console.log(`Listening on http://localhost:3000 `);
// app.listen(3000, handleListen);

const httpServer = http.createServer(app);
// const wss = new WebSocket.Server({ server });
const wsServer = SocketIO(httpServer);

function publicRooms() {
  // const sids = wsServer.sockets.adapter.sids;
  // const rooms = wsServer.sockets.adapter.rooms;
  // const { sids, rooms } = wsServer.sockets.adapter;
  const { sockets: { adapter: { sids, rooms } } } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  })
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on('connection', (socket) => {
  socket['nickname'] = 'Anon';
  socket.onAny((event) => {
    // console.log(wsServer.sockets.adapter);
    console.log(`Socket Event: ${event}`);
  });
  socket.on('enter_room', (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit('welcome', socket.nickname, countRoom(roomName));
    wsServer.sockets.emit('room_change', publicRooms());
  });
  // socket이 방을 떠나기 바로 직전에 실행하는 disconnecting event
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit('bye', socket.nickname, countRoom(room) -1);
    });
  })
  socket.on('disconnect', () => {
    wsServer.sockets.emit('room_change', publicRooms());
  })
  socket.on('new_message', (msg, roomName, done) => {
    socket.to(roomName).emit('new_message', `${socket.nickname}: ${msg}`);
    done();
  })
  socket.on('nickname', (nickname) => {
    socket['nickname'] = nickname;
  })
});


// const sockets = [];
// wss.on('connection', (socket) => {
//   sockets.push(socket);
//   socket['nickname'] = 'Anon';

//   console.log('Connected to Server ✅');

//   socket.on('close', () => {
//     console.log('Disconnected from the Browser ❌');
//   });

//   socket.on('message', (msg) => {
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case 'new_message':
//         sockets.forEach((aSocket) => {
//           aSocket.send(`${socket.nickname}: ${message.payload}`);
//         });
//       case 'nickname':
//         socket['nickname'] = message.payload;
//     }
//   });
// });

httpServer.listen(3000, handleListen);