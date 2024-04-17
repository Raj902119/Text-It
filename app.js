
 import cookieParser from "cookie-parser";
import raj from "dotenv";
import express from "express";
import mongoose from "mongoose";
import raj from "dotenv";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";

import userRoute from "./routes/user.js";
import chatRouter from "./routes/chat.js";
import adminRouter from "./routes/admin.js";

import { Server } from "socket.io";
import { v4 as uuid } from "uuid";
import { Message } from "./Models/message.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT, START_TYPING, STOP_TYPING } from "./constants/events.js";

import { createServer } from "http";
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGE_ALERT, ONLINE_USERS, START_TYPING, STOP_TYPING } from "./constants/events.js";
import { v4 as uuid } from "uuid";

import { getSockets } from "./lib/helper.js";
import { Message } from "./Models/message.js";

import cors from "cors";
import {v2 as cloudinary} from "cloudinary";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticator } from "./middlewares/auth.js";

 raj.config({
   path: "./raj.env",
 });

 const port = 3000; // Changed to uppercase "PORT"
 export const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";

export const userSocketIDs = new Map();

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
}
// Call the function to connect to the database
connectToDatabase();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

 const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {  origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],},
});

app.set("io",io);
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({  origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
console.log(process.env.CLIENT_URL);

app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/admin", adminRouter);

 app.get("/", (req, res) => {
   res.send("Hello world");
 });

io.use((socket,next) => {
  cookieParser()(socket.request, socket.request.res,
    async (err) => 
  await socketAuthenticator(err,socket,next));
});

// Corrected "connection" event handling
io.on("connection", (socket) => {
  // Added socket parameter
  const user = socket.user;
  userSocketIDs.set(user._id.toString(), socket.id);
  //New message
  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    };

    console.log("Emitting", messageForRealTime);

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(membersSocket).emit(NEW_MESSAGE_ALERT,{chatId});

    try {
      await Message.create(messageForDB);
    }catch (error) {
      console.log(error);
    }

  });

   socket.on(START_TYPING, ({members, chatId}) => {
    console.log("start-typing", chatId);

    const membersSocket = getSockets(members);

    socket.to(membersSocket).emit(START_TYPING, { chatId });
   });

   socket.on(STOP_TYPING, ({members, chatId}) => {
    console.log("stop-typing", members, chatId);

    const membersSocket = getSockets(members);

    socket.to(membersSocket).emit(STOP_TYPING, { chatId });
   });


  // Corrected "disconnect" event handling
  socket.on("disconnect", () => {
    console.log(`user disconnected ${socket.id}`);
    userSocketIDs.delete(user._id.toString());
  });
});

app.use(errorMiddleware);

 server.listen(port, () => {
  console.log(`Server running on port ${port} in ${envMode} mode`);
 });
