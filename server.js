const express = require('express');
const path = require('path');
const http = require('http');

const PORT = process.env.PORT || 3000;

const socketio = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Static Folder to Server to Server 
app.use(express.static(path.join(__dirname, "public")));


//Start Express Server
server.listen(PORT, ()=> console.log(`Server is running on PORT ${PORT}.`));

//Socket io connection request
const connections = [null, null];
io.on('connection', socket =>{
    //Available player number
    let playerIndex = -1;
    for (const i in connections){
        if(connections[i] === null){
            playerIndex = i;
            break;
        }
    }

    //Tell Player the number they are
    socket.emit('player-number', playerIndex);
    console.log(`Player ${playerIndex} has connected.`);

    // Ignore more than 2 players
    if(playerIndex === -1) return;

    connections[playerIndex] = false;

    socket.broadcast.emit('player-connection', playerIndex);

    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log(`Player ${playerIndex} disconnected`);
        connections[playerIndex] = null
        // Tell everyone what player just dc
        socket.broadcast.emit('player-connection', playerIndex);
    })

    //On Ready
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex);
        connections[playerIndex] = true;
    })

    //Check Player Connection
    socket.on('check-players', () =>{
        const players = []
        for (const i in connections){
            connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
        }
        socket.emit('check-players', players);
    })

    // On Fire recv
    socket.on('fire', id => {
        console.log(`Shot fired from ${playerIndex}`, id)

        // Emit the move to the other player
        socket.broadcast.emit('fire', id);
    })

    // On Fire Reply
    socket.on('fire-reply', square =>{
        console.log(square)
        socket.broadcast.emit('fire-reply', square)
    })

    setTimeout(() =>{
        connections[playerIndex] = null;
        socket.emit('timeout');
        socket.disconnect();
    }, 600000 ) // 10 min limit player
})