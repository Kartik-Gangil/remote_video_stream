const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');

const path = require('path');


const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 8005;

app.use(express.static('public'));

app.get('/video', (req, res) => {
    const videoPath = path.join(__dirname, '/video/document_6062122312809846557.mp4');
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (!range) {
        return res.status(400).send("Requires Range header");
    }

    const chunkSize = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + chunkSize, fileSize - 1);

    const contentLength = end - start + 1;

    res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    });

    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
});

io.on('connection', socket => {
    console.log('User connected', socket.id);

    socket.on('videoAction', data => {
        // Broadcast to all other users
        socket.broadcast.emit('videoAction', data);
    });

    socket.on('disconnect', () => console.log('User disconnected', socket.id));
});

server.listen(PORT, '0.0.0.0',() => console.log('Server running on 8005'));