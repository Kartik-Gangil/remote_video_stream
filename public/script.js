// Create peer
const peer = new Peer();
// --- Socket.IO ---
const socket = io();

// Video element
const movie = document.getElementById('movie');
const id = document.getElementById('myId');
const copyBtn = document.getElementById('copy');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const myIdSpan = document.getElementById('myId');

let localStream;

let isRemoteAction = false;


copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(id.innerText);
})


// Show peer ID
peer.on('open', id => {
    myIdSpan.innerText = id;
    console.log('My Peer ID:', id);
});

// Get camera stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch(err => console.error('Camera error:', err));

// Call another peer
function callPeer() {
    const peerId = document.getElementById('peerIdInput').value;
    const call = peer.call(peerId, localStream);

    call.on('stream', remoteStream => {
        remoteVideo.srcObject = remoteStream;
    });
}

// Answer incoming call
peer.on('call', call => {
    call.answer(localStream);

    call.on('stream', remoteStream => {
        remoteVideo.srcObject = remoteStream;
    });
});


// Broadcast events
movie.addEventListener('play', () => {
    if (isRemoteAction) return;
    socket.emit('videoAction', { type: 'play', currentTime: movie.currentTime });
});

movie.addEventListener('pause', () => {
     if (isRemoteAction) return;
    socket.emit('videoAction', { type: 'pause', currentTime: movie.currentTime });
});

movie.addEventListener('seeked', () => {
     if (isRemoteAction) return;
    socket.emit('videoAction', { type: 'seek', currentTime: movie.currentTime });
});

// Receive events
socket.on('videoAction', data => {
    isRemoteAction = true;
    movie.currentTime = data.currentTime;
    if (data.type === 'play') {
        movie.play();
    }
    else if (data.type === 'pause') {
        movie.pause();
    }

    setTimeout(() => {
        isRemoteAction = false;
    }, 200);
});