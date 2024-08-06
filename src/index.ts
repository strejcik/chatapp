import { Request, Response, Express } from "express";
import jwt from 'jsonwebtoken';
import {removeUser, addUser, getUserSocket, getUser,} from './socketFunctions';
import bodyParser from 'body-parser';
import connectDB from './utils/connect-mongo.js';
import userRoutes from './routes/userRoutes';
import {
  mongoFindUser, 
  addFriend, 
  getFriend, 
  getFriends, 
  removeFriend, 
  populateFriends, 
  getMessages, 
  addMessage,
  getConversations,
  populateUser,
  getMyId,
  getContactList,
  getConversation,
  getConversationByFriendId} from './mongooseFunctions/index';
//import s from './socket';
require('dotenv').config()

const app:Express = require("express")();
const cors = require('cors');
const socket = require("socket.io");





//Middleware
const PORT = process.env.PORT || 3000;
const corsOptions ={
  origin:'*', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



//Routes
app.use('/api', userRoutes);



// MongoDB Connection
connectDB();

let server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000"
  },
  methods: ["GET", "POST"],
  transports: ['websocket', 'polling'],
  credentials: true,
  allowEIO3: true
});
//require('./socket')(io);





















io.use(function(socket, next){
  if (socket.handshake.auth.token){
    jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET as string, function(err, decoded) {
      if (err){
        console.log(err);
        return next(new Error('Authentication error'));
      }
      socket.decoded = decoded;
      next();
    });
  }
  else {
    next(new Error('Authentication error'));
  }    
}).on("connection", (s:any) => {
  console.log(`⚡: ${s.id} user just connected!`);
  addUser(s.decoded.userId, s.id);
  // s.on("message", () => {
  //     socket.emit("message", "kurdebele");
  // })
  s.on("addUser", userId=>{
      mongoFindUser(userId).then(e => addUser(e?._id, s.id));
      //console.log(users);
      //socket.emit("getUsers", users);
  });

  s.on("getFriends", (id) => {
      getFriends(id).then(f => console.log(f));
  });

  s.on("removeFriend", (id) => {
      removeFriend(id.userId, id.friendId);
  });

  s.on("getFriend", (id) => {
      getFriend(id.userId, id.friendId);
  });

  s.on("addFriend", (id) => {
      addFriend(id.userId, id.friendId);
  });

  s.on("populateFriends", (id) => {
      populateFriends(id);
  });


  s.on("getMessages", async(id) => {
      await getMessages(id.userId, id.friendId);
  });

  s.on("addMessage", async(d) => {
      // let response = await getConversationByFriendId(d.friendId, d.userId).then(r => { return r  });
      // let responseObj;
      // let response = await getConversations(d.friendId).then(r => { return r});
      // responseObj = {
      //   response,
      //   message:d.message
      // }
      await addMessage(d.userId, d.friendId, d.message).then(() => s.to(getUserSocket(d.friendId)).emit('refreshMessages', {message: d.message, user:d.userId}));
      
  });

  s.on("getConversations", async(id) => {
      // await getConversations(id);
      await getConversations(id).then(r => s.emit("getConversations", r));
  });

  s.on("getConversation", async(id) => {
    // await getConversations(id);
    await getConversation(id.userId, id.conversation_id).then(r => s.emit("getConversation", r));
  });

  s.on("getConversationByFriendId", async(id) => {
    await getConversationByFriendId(id.userId, id.frienId);
  });

  s.on("getContactList", async(id) => {
    await getContactList(id).then(r=> s.emit("getContactList", r));
    // await getContactList(id).then(r=> console.log(r));
  })

  s.on("populateUser", async(id) => {
      await populateUser(id);
  });

  s.on("getMyId", async() => {
      await getMyId(s.decoded.userId).then(r => s.emit("getMyId", r));
  })
  // socket.on('getMe', (u) => {
  //     socket.emit("me", getUser(u)["socketId"]);
  // });

  
  // socket.on("refreshOnlineUsers", () => {
  //     socket.emit("getUsers", users);
  // });
  




  // socket.on('callUser', (data)=>{
  //     socket.to(getU(data.userToCall)?.["socketId"]).emit('hey', {signal: data.signalData, from: data.from})
  // })

  // socket.on('acceptCall', (data)=>{
  //     socket.to(getU(data.to)["socketId"]).emit('callAccepted', data.signal)
  // })

  // socket.on('close', (data)=>{
  //     socket.to(getU(data.to)?.["socketId"]).emit('close');
  // })

  // socket.on('rejected', (data)=>{
  //     socket.to(getU(data.to)["socketId"]).emit('rejected')
  // })

  
  
  


  //send and get message
  // socket.on("sendMessage", ({senderId, receiverId, text}) => {
  //     const user = getUser(receiverId);
      

  //     socket.to(user?.socketId).emit("getMessage", {
  //         senderId,
  //         text
  //     })
  // });

  s.on("disconnect", () => {
      console.log('🔥: A user disconnected')
      removeUser(s.id);
      //s.emit("getUsers", users);
      //s.broadcast.emit("callEnded");
  });


})