module.exports = (io, socket, reverseMap) => {
    socket.on("addUser", (data) => {
        data = JSON.parse(data)
        console.log("📝📝Client requested to add user with user id", data.userId)
        reverseMap[[data.userId]] = socket.id
        socket.userId = data.userId
    })
    socket.on("removeUser", (data) => {
        data = JSON.parse(data)
        console.log("📝📝Client requested to remove user with user id:", data.userId)
        delete reverseMap[data.userId]
        socket.userId = undefined
    })
    socket.on("joinLeadsPage", (data) => {
        data = JSON.parse(data)
        const sourceId = data.sourceId;
        console.log("📝📝Client requested to watch leadsPage with sourceId:", data.sourceId, " socketId:", socket.id, " userId:", socket.userId)
        socket.leadsPage = sourceId
    })
    socket.on("leaveLeadsPage", (data) => {
        data = JSON.parse(data)
        console.log("📝📝Client requested to leave leads leadsPage for user:", socket.userId, " sourceId:", socket.sourceId, "socketId:", socket.id)
        socket.leadsPage = undefined
    })
    socket.on("info", () => {
        console.log("<++++++++++++++++++++++Socket debug++++++++++++++++++++++++++++>")
        console.log("reverseMap==============>", reverseMap, "=======>", socket.id)
        console.log("\n");
        const logsTable = []
        console.log("in info function sockets are:", io.sockets.sockets.keys())
        for (let elem of io.sockets.sockets.keys()) {
            const theSocketObject = io.sockets.sockets.get(elem)
            logsTable.push(
                {
                    userId: theSocketObject["userId"],
                    socketId: elem,
                    leadsPage: theSocketObject["leadsPage"]
                }
            )
        }
        console.table(logsTable)
        console.log("<++++++++++++++++++++++Socket debug End++++++++++++++++++++++++++++>")
    })
}