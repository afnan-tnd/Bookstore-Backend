const { request } = require("express");
const req = require("express/lib/request");

/**
 * @param {object} request
 * @param {String} userId
 * @param {String} eventName
 * @param {Object} eventData
 * @param {String} socketId - Provide this if already now socketId
*/
const sendSocketEvent = (data) => {
    try {
        const { request, userId, eventName } = data;
        let { socketId, eventData } = data;
        if (!eventData) {
            eventData = {}
        }
        console.log("from send socket event data is", socketId)
        if (!eventName) {
            throw new Error("please provide eventName to emit it")
        }
        const { io } = parseRequest(request)
        if (!socketId) {
            let socketId = getSocketId(userId, request)
            if (isOnline(userId, request)) {
                console.log("📝📝Sending=>", eventName, " to socketId:", socketId)
                io.to(socketId).emit(eventName, eventData)
            } else {
                console.log("⚠⚠Send socket event is not sending anything as user not online⚠⚠")
            }
        } else {
            console.log("📝📝Sending=>", eventName, " to socketId:", socketId, " as directly passed")
            io.to(socketId).emit(eventName, eventData)
        }
    } catch (err) {
        console.log("💥💥This error is created from sendSocketEvent💥💥", err.message);
    }
}
const isOnline = (userId, request) => {
    try {
        const { reverseMap } = parseRequest(request)
        console.log("🧨🧨🧨🧨from reverseMap is:", reverseMap, "  =====>", reverseMap[userId])
        if (reverseMap[userId]) {
            return true
        }
        return false
    } catch (err) {
        console.log("💥💥This error is created from isOnline💥💥", err.message);
    }
}
const getSocketId = (userId, request) => {
    try {
        const { reverseMap } = parseRequest(request)
        if (isOnline(userId, request)) {
            return reverseMap[userId]
        } else {
            console.log("⚠⚠Warn! getSocketid returning nothing for userId", userId, " as not onlie⚠⚠")
        }
    } catch (err) {
        console.log("💥💥This error is created from getSocketId", err.message);
    }
}
/**
 * @param {Object} request ,
 * @param {String} propName,
 * @param {String} propValue, 
*/
const getXPropValue = (data) => {
    try {
        const { request, propName, propValue } = data;
        console.log("📝📝Looking for ", propName, " for propValue", propValue, "on io📝📝")
        const { reverseMap, io } = parseRequest(request)
        const socketIds = []
        const socketKeys = io.sockets.sockets.keys();
        if (socketKeys.length == 0) {
            console.log("⚠⚠Oops there are no sockets in the io⚠⚠")
        }
        console.log("looking for propName on", io.sockets.sockets.keys())
        for (let elem of io.sockets.sockets.keys()) {
            //console.log("saying from keys", io.sockets.sockets.get(elem).userId)
            console.log("🎇🎇comparing", io.sockets.sockets.get(elem)[propName], " with ", propValue, "socketId", elem)
            if (io.sockets.sockets.get(elem)[propName] == propValue) {
                socketIds.push(elem)
            }
        }
        return socketIds
    } catch (err) {

        console.log("💥💥This error is created from getXProp", err.message);
    }
}
/**
 * 
*/
const sendLeadPostedEvent = (sourceId, request, eventData = {}) => {
    try {

        const listenerIds = getXPropValue({ request, propName: "leadsPage", propValue: sourceId })
        console.log("📝📝📝📝", listenerIds)
        for (let elem of listenerIds) {
            console.log("passing elem", elem)
            sendSocketEvent({
                request,
                eventName: "NEW_LEAD_POSTED",
                eventData,
                socketId: elem
            })
        }
    } catch (err) {
        console.log("💥💥This error is created from sendLeadPostedEvent💥💥", err.message)
    }
}
const parseRequest = (request) => {
    try {

        if (!request) {
            throw new Error("You need to pass request object")
        }
        if (!request.app.io) {
            throw new Error("app on request not have io object please assign it in index/server.js")
        }
        if (!request.reverseMap) {
            throw new Error("Request not have reverseMap object please create in index/server.js and bind it to every request using a top level middleware")
        }
        const { io } = request.app;
        const { reverseMap } = request;
        return { io, reverseMap }
    } catch (err) {
        console.log("💥💥This error is created from parseRequest", err.message);
    }
}
module.exports = {
    getXPropValue,
    sendSocketEvent,
    sendLeadPostedEvent
}