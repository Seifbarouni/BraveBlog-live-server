const PORT = process.env.PORT || 3004;
const INDEX = '/index.html';

const server = require("express")()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));
//const httpServer = require("https").createServer(app);

const io = require("socket.io")(server, {
    cors: {
        origin: "https://wonderful-knuth-debaec.netlify.app",
        method: ["GET", "POST"],
    },
})

function getActiveRooms() {
    const arr = Array.from(io.sockets.adapter.rooms);
    const filtered = arr.filter(room => !room[1].has(room[0]))
    const res = filtered.map(i => i[0]);
    return res;
}

io.on("connection", socket => {
    setInterval(() => {
        const activeRooms = getActiveRooms()
        if (activeRooms.length !== 0) socket.emit("get-all-rooms-response", getActiveRooms());
    }, 1000)

    socket.on("joinRoom", (roomName) => {
        if (getActiveRooms().filter((room) => room == roomName).length !== 0) {
            socket.join(roomName)
            socket.emit("get-all-rooms-response", getActiveRooms())
        }
        else {
            io.to(socket.id).emit("error");
        }
    })
    socket.on("createRoom", (roomName) => {
        socket.join(roomName)
        socket.emit("get-all-rooms-response", getActiveRooms());
    })
    socket.on("get-all-rooms-request", () => {
        socket.emit("get-all-rooms-response", getActiveRooms());
    })
    socket.on("disconnect", () => {
        console.log("user disconnected");
    })
    socket.on("textData", (data) => {
        io.to(data.room).emit("getTextData", data.text);
    })
    socket.on("getTitle", (data) => {
        io.to(data.room).emit("getTitle", data.title);
    })
    socket.on("comment", (data) => {
        io.to(data.room).emit("comment", { user: data.user, comment: data.comment });
    })
    socket.on("cleanRoom", (room) => {
        io.to(room).emit("end");
        io.socketsLeave(room);
        io.emit("get-all-rooms-response", getActiveRooms());
    })
    socket.on("leave", (room) => {
        socket.leave(room);
    })
})
