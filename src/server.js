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
  socket.on('enter_room', (msg, done) => {
    console.log(msg);
    setTimeout(() => {
      done(); 
    }, 10000);
    // 서버는 back-end에서 done function을 호출하지만 
    // done function은 front-end에서 실행된다.
  });
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