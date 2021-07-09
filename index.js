const io = require("socket.io")(3001, {
    cors: {
        origin: "http://localhost:3000",
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
    socket.on("cleanRoom", (room) => {
        io.socketsLeave(room);
        io.emit("get-all-rooms-response", getActiveRooms());
    })
})
