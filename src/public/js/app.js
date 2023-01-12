const socket = io();  
// io function이 알아서 socket.io를 실행하고 있는 서버를 찾는다.

const welcome = document.querySelector('#welcome');
const welcomeForm = welcome.querySelector('form');
const room = document.querySelector('#room');

room.hidden = true;
let roomName;

function addMessage(message) {
  const ul = room.querySelector('ul');
  const li = document.createElement('li');
  li.innerText = message;
  ul.appendChild(li);
}

welcomeForm.addEventListener('submit', handleRoomSubmit);

function handleRoomSubmit(event) {
  event.preventDefault();  // 작동해야할 기능을 막아줌 ex) submit

  const input = welcomeForm.querySelector('input');
  socket.emit('enter_room', input.value, showRoom);
  // 첫 번째: event name
  // 두 번째 ~: 전달할 값 마음대로 가능
  // 마지막: back-end에서 front-end에 실행시킬 function 
  roomName = input.value;
  input.value = '';
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;

  const h3 = room.querySelector('h3');
  h3.innerText = `Room ${roomName}`;

  const roomForm = room.querySelector('form');
  roomForm.addEventListener('submit', handleMessageSubmit);
}

function handleMessageSubmit(event) {
  event.preventDefault();

  const input = room.querySelector('input');
  socket.emit('new_message', input.value, roomName, () => {
    addMessage(`You: ${input.value}`);
    input.value = '';
  });
}

socket.on('welcome', () => {
  addMessage('someone joined');
})

socket.on('bye', () => {
  addMessage('someone left ㅠㅠ');
})

socket.on('new_message', addMessage);