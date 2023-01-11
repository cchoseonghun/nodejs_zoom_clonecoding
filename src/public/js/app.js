const socket = io();  
// io function이 알아서 socket.io를 실행하고 있는 서버를 찾는다.

const welcome = document.querySelector('#welcome');
const form = document.querySelector('form');

function handleRoomSubmit(event) {
  event.preventDefault();  // 작동해야할 기능을 막아줌 ex) submit
  const input = form.querySelector('input');
  socket.emit('enter_room', { payload: input.value }, () => {
    console.log('server is done');
  });
  // socket.emit에서 
  // 첫 번째 argument -> event 이름
  // 두 번째 argument -> 보내고 싶은 payload
  // 세 번째 argument -> 서버에서 호출하는 function *중요*
  input.value = '';
}

form.addEventListener('submit', handleRoomSubmit);