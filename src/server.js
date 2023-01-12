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

wsServer.on('connection', (socket) => {
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on('enter_room', (roomName, done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit('welcome');  // 자신을 제외한 방안의 모두에게 전송
    // socket.to(rooName).emit()
    // console.log(socket.id);  // 유저 id이자 유저의 id로 자동생성되는 room
    // console.log(socket.rooms);  // rooms 목록
    // socket.join(roomName);  // roomName으로 입장
    // console.log(socket.rooms);
    // setTimeout(() => {
    //   done('hello from back-end');  
    //   // 마지막으로 전달한 함수를 front-end에서 실행시킨다.
    //   // 헷갈릴 수 있지만 애초에 front-end에서 전달한 함수를
    //   // back-end에서 실행시킨다는 것은 보안상으로 매우매우 위험한 일이므로 
    //   // 일어날 수 없는 일로 생각하면 쉬움
    // }, 5000);
  });
  socket.on('disconnecting', () => {
    socket.rooms.forEach((room) => {
      socket.to(room).emit('bye');
    });
  })
  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('new_message', msg);
    done();
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