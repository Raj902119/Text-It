import express from "express";

import { isAuthenticated } from "../middlewares/auth.js";
import { addMembers, deleteChat, getChatDetails, getMessages, getMyChats, getMyGroups, leaveGroup, newGroupChat, removeMembers, renameGroup, sendAttachments } from "../controllers/chat.js";
import { attachmentsMulter } from "../middlewares/multer.js";
import { addMembersValidator, deleteChatValidator, getChatDetailsValidator, getMessagesValidator, leaveGroupValidator, newGroupValidator, removeMembersValidator, renameGroupValidator, sendAttachmentsValidator, validateHandler } from "../lib/validators.js";

const app = express.Router();

app.use(isAuthenticated);

app.post("/new",newGroupValidator(),validateHandler,newGroupChat);
app.get("/my",getMyChats);
app.get("/my/groups", getMyGroups);
app.put("/addmembers",addMembersValidator(),validateHandler, addMembers)
app.put("/removemember",removeMembersValidator(),validateHandler, removeMembers);
app.delete("/leave/:id",leaveGroupValidator(),validateHandler, leaveGroup);
app.post("/message",attachmentsMulter,sendAttachmentsValidator(),validateHandler,sendAttachments);
app.get("/messages/:id",getMessagesValidator(),validateHandler,getMessages);
app
  .route("/:id")
  .get(getChatDetailsValidator(),validateHandler,getChatDetails)
  .put(renameGroupValidator(),validateHandler,renameGroup)
  .delete(deleteChatValidator(),validateHandler,deleteChat);

export default app;