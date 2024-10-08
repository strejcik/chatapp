import { Request, Response, Express } from "express";
import jwt from 'jsonwebtoken';
import {removeUser, addUser, getUserSocket, getUser,} from './socketFunctions';
import bodyParser from 'body-parser';
import connectDB from './utils/connect-mongo.js';
import userRoutes from './routes/userRoutes';
import {createID} from './singal/signal';
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
  getConversationByFriendId,
  sGetMyId,
  sGetFriendId,
  sAddMessage} from './mongooseFunctions/index';
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


  s.on("sxGetMyId", async() => {
    console.log(s.decoded.userId);
    await sGetMyId(s.decoded.userId).then(r => s.emit("sxGetMyId", r));
  });

  s.on("sGetFriendId", async(id) => {
    console.log(id);
    await sGetFriendId(id).then(r => {
      console.log(r);
      s.emit("sGetFriendId", r)
    });
  })

  s.on("sAddMessage", async(d) => {
    await sAddMessage(d.userId, d.friendId, d.message).then(() => s?.to(getUserSocket(d.friendId)).emit('refreshMessages', {message: d.message, user:d.userId}));
    
});

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
      await addMessage(d.userId, d.friendId, d.message).then(() => s.to(getUserSocket(d.friendId)).emit('refreshMessages', {message: d.message, user:d.userId}));
      
  });

  s.on("getConversations", async(id) => {
      // await getConversations(id);
      await getConversations(id).then(r => s.emit("getConversations", r));
  });

  s.on("getConversation", async(id) => {

    //DISPLAY ONLY LAST 25 MESSAGES, CHANGE THE LOGIC IF YOU WANT TO DISPLAY ALL THE MESSAGES
    const page = 2;
    const limit = 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
  
    
    await getConversation(id.userId, id.conversation_id).then(r => {
      let msgLength = r![0]["messages"].length;
      if(msgLength >=25) {
        const temp = r![0]["messages"].slice(startIndex + msgLength - endIndex, startIndex + msgLength);
        let resultMessages = r;
        resultMessages![0]["messages"] = temp;
        s.emit("getConversation", resultMessages);
      }
      if(msgLength < 25) {
        s.emit("getConversation", r);
      }
    });
  });




  s.on("getChunkOfConversation", async(d) => {


  
    
    await getConversation(d.userId, d.conversation_id).then(r => {
      let page = d.page;
      let limit = 25;
      let msgLength = r![0]["messages"].length;
      let endIndex = msgLength - (page - 1) * limit;
      let startIndex = Math.max(0, endIndex - limit);
      const temp = r![0]["messages"].slice(startIndex, endIndex);
      let resultMessages = r;
      resultMessages![0]["messages"] = temp;
      s.emit("getChunkOfConversation", resultMessages);
    });
  })

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

  s.on("disconnect", () => {
      console.log('🔥: A user disconnected')
      removeUser(s.id);
      //s.emit("getUsers", users);
      //s.broadcast.emit("callEnded");
  });


})