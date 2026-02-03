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

let player;

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(id.innerText);
})

function onYouTubeIframeAPIReady() {
    player = new YT.Player("movie", {
        videoId: "HoCOiKW1SaI",
        events: {
            onStateChange: onPlayerStateChange
        }
    });
}

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
function onPlayerStateChange(event) {
    if (isRemoteAction) return;
    const currentTime = player.getCurrentTime();

    if (event.data === YT.PlayerState.PLAYING) {
        socket.emit("videoAction", {
            type: "play",
            currentTime
        });
    };
    if (event.data === YT.PlayerState.PAUSED) {
        socket.emit("videoAction", {
            type: "pause",
            currentTime
        });
    }
}
let lastTime = 0;

setInterval(() => {
    if (!player || player.getPlayerState() !== YT.PlayerState.PLAYING) return;

    const now = player.getCurrentTime();

    if (Math.abs(now - lastTime) > 2) {
        socket.emit("videoAction", {
            type: "seek",
            currentTime: now
        });
    }

    lastTime = now;
}, 1000);

// Receive events
socket.on("videoAction", (data) => {
    isRemoteAction = true;

    player.seekTo(data.currentTime, true);

    if (data.type === "play") {
        player.playVideo();
    }

    if (data.type === "pause") {
        player.pauseVideo();
    }
    if (data.type === "seek") {
        player.seekTo(data.currentTime, true);
    }
    setTimeout(() => {
        isRemoteAction = false;
    }, 300);
});
