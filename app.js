const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);//create http server connect with express.
const io = socket(server);//socket runs on http server.

const chess = new Chess();//aquire all chess.js functionalities in chess var.
let players = {};
let currentPlayer = 'W';

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res){
    res.render("index");
});
//when user comes on website then its coonnected to our socket. but first set up on frontend side
io.on("connection", function (uniquesocket){
    console.log("connected");

    if(!players.white){//if whtie field not avail in obj then create
        players.white = uniquesocket.id;//assighn id to player white field in players object
        uniquesocket.emit("playerRole", "w");//asign color to player in frontend
    } else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    } else{
        uniquesocket.emit("spectatorRole");
    }

    uniquesocket.on("disconnect", function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        } else if(uniquesocket.id === players.black){
            delete players.black;
        }
    });

    uniquesocket.on("move", (move) =>{
        try {
            //only player can move their pieace on their turn!
            if(chess.turn() === "w" && uniquesocket.id != players.white) return;
            if(chess.turn() === "b" && uniquesocket.id != players.black) return;

            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen()); // fen is a chess equation which give current boardstate.
            }else{
                console.log("Invalid move:", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (error) {
            console.log(error);
            uniquesocket.emit("Invalid move:", move);
        }
    });
});

server.listen(3000, ()=>{
    console.log("Server starts on port 3000");
})