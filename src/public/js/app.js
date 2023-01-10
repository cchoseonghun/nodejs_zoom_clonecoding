// const socket = new WebSocket('ws://localhost:3000');
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener('open', () => {
  console.log('Connected to Browser ✅');
});

socket.addEventListener('message', (message) => {
  console.log('New message: ', message.data, ' from the Server');
});

socket.addEventListener('close', () => {
  console.log('Disconnected to Browser ❌');
});

setTimeout(() => {
  socket.send('hello from the browser');
}, 10000);