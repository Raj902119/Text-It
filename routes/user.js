import express from "express";
import { acceptFriendRequest, getAllNotifications, getMyFriends, getMyProfile, logOut, login, newUser, searchUser, sendFriendRequest } from "../controllers/user.js";
import { singleAvatar } from "../middlewares/multer.js";
import { isAuthenticated } from "../middlewares/auth.js";
import { acceptRequestValidator, loginValidator, registerValidator, sendRequestValidator, validateHandler } from "../lib/validators.js";

const app = express.Router();

app.post("/new", singleAvatar,registerValidator(),validateHandler, newUser);
app.post("/login",loginValidator(),validateHandler, login);

//After here user must be logged in to access the routes

//All the routes below this i automatically get isAuthenticated as middleware
app.use(isAuthenticated);

app.get("/me",getMyProfile);

app.get("/logout", logOut);

app.get("/search", searchUser);

app.put("/sendReq", sendRequestValidator(), validateHandler, sendFriendRequest);

app.put("/acceptReq",acceptRequestValidator(),validateHandler,acceptFriendRequest);

app.get("/notification",getAllNotifications);

app.get("/friends",getMyFriends);

export default app;