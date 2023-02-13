const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    // console.log(devices);
    const cameras = devices.filter((device) => device.kind == "videoinput");
    // console.log(cameras);

    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {}
}

async function getMedia(deviceId) {
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: {
      deviceId: {
        exact: deviceId,
      },
    },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstraints : initialConstraints
    );
    // console.log(myStream);
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

// getMedia();

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  // console.log(camerasSelect.value);
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    // 위에서 getMedia()를 통해 video device의 새로운 id로 다시 또 다른 stream을 생성했기 때문에
    // 저 부분 이후로 video track을 받으면
    // 선택한 새 장치로 업데이트 된 video track을 받을 수 있다.
    const videoTrack = myStream.getVideoTracks()[0];
    // 이후 하단의 videoSender.replaceTrack()으로 연결

    // console.log(myPeerConnection.getSenders());
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    // console.log(videoSender);

    videoSender.replaceTrack(videoTrack);
  }
}

// sender는 우리의 peer로 보내진 media stream track을 컨트롤하게 해준다.
// https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  // console.log(input.value);
  await initCall();
  // webSocket의 속도가 media를 가져오는 속도나 연결을 만드는 속도보다 빠르기 때문에
  // 미리 생성되게 변경
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

// Peer A에서 실행
socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message", (event) => {
    console.log(event.data);
  });
  console.log("made data channel");
  // console.log("someone joined");
  const offer = await myPeerConnection.createOffer();
  // console.log(offer);
  myPeerConnection.setLocalDescription(offer);
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
});

// Peer B에서 실행
socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) => {
      console.log(event.data);
    });
  });
  console.log("received the offer");
  // console.log(offer);
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  // console.log(answer);
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

// RTC Code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    // Google STUN Server
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  // console.log(myStream.getTracks());
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
  // console.log("got ice candidate");
  // console.log(data);
}

function handleAddStream(data) {
  // console.log("got an stream from my peer");
  // console.log("Peer's Stream", data.stream);
  // console.log("My stream", myStream);
  const peerFace = document.getElementById("peerFace");
  peerFace.srcObject = data.stream;
}

// https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate
// offer와 answer를 가질 때. 즉, 받는걸 모두 끝냈을 때
// peer-to-peer 연결의 양쪽에서 icecandidate 라는 이벤트 실행
// RTCIceCandidate - Internet Connectivity Establishment (인터넷 연결 생성)
// IceCandidate는 webRTC에 필요한 프로토콜을 의미하는데 멀리 떨어진 장치와 소통할 수 있게 하기 위함이다.
// 그러니까 IceCandidate는 브라우저가 서로 소통할 수 있게 해주는 방법. 즉, 중재하는 프로세스
// 다수의 candidate(후보)들이 각각의 연결에서 제안되고 그들은 서로의 동의 하에 하나를 선택
