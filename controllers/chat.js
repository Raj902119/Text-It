import { Chat } from "../Models/chat.js";
import { Message } from "../Models/message.js";
import { User } from "../Models/user.js";
import { ALERT, NEW_ATTACHMENT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { TryCatch } from "../middlewares/error.js"
import { deleteFilesFromCloudinary, emitEvent, uploadFilesToCloudinary } from "../utils/feature.js";
import { ErrorHandler } from "../utils/utility.js";

const newGroupChat = TryCatch(async(req,res,next) => {
    const {name,members} = req.body;

    const allMembers = [...members, req.user];
    
    await Chat.create({
        name,
        groupChat: true,
        creator: req.user,
        members: allMembers,
    });

    emitEvent(req, ALERT, allMembers, `Welcome to ${name} group`);
    emitEvent(req, REFETCH_CHATS, members);

    return res.status(201).json({
        success: true,
        message: "Group Created",
    });

});

const getMyChats = TryCatch(async(req,res,next) => {

    const chats = await Chat.find({members: req.user}).populate(
        "members",
        "name avatar"
    );

    const transformedChats = chats.map(({_id,name,members,groupChat}) => {
        const otherMember = getOtherMember(members, req.user);

        return {
            _id,
            groupChat,
            avatar: groupChat?members.slice(0,3).map
            (({avatar}) => avatar.url):[otherMember.avatar.url],
            name: groupChat ? name : otherMember.name,
            members: members.reduce((prev,curr) => {

                if(curr._id.toString() !== req.user.toString()){
                    prev.push(curr._id)
                }
                return prev;
            },[])
            
        }
    })

    return res.status(201).json({
        success: true,
        chats: transformedChats,
    });

});

const getMyGroups = TryCatch(async(req,res,next) => {
    const chats = await Chat.find({
        members: req.user,
        groupChat: true,
        creator: req.user,
    }).populate("members", "name avatar");

    const groups = chats.map(({members, _id, groupChat, name}) => ({
        _id,
        groupChat,
        name,
        avatar: members.slice(0,3).map(({avatar}) => avatar.url),
    }));

    return res.status(200).json({
        success: true,
        groups,
    });
});

const addMembers = TryCatch(async (req, res, next) => {
    const { chatId, members } = req.body;
    console.log(chatId, members);

    if (!members || members.length < 1) 
        return next(new ErrorHandler("Please provide members", 400));

    const chat = await Chat.findById(chatId);

    if (!chat) 
        return next(new ErrorHandler("Chat not found", 404));

    if (!chat.groupChat) 
        return next(new ErrorHandler("This is not a group chat", 404));

    if (chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler("You are not allowed to add members", 403));

    const allNewMembersPromise = members.map(async (i) => {
        const user = await User.findById(i, "name");
        return user;
    });

    const allNewMembers = await Promise.all(allNewMembersPromise);

    const uniqueMembers = allNewMembers
        .filter((user) => !chat.members.includes(user._id.toString()))
        .map((user) => user._id);

    chat.members.push(...uniqueMembers);

    if (chat.members.length > 100) {
        return next(new ErrorHandler("Group members limit reached", 400));
    }

    await chat.save();

    const allUserName = allNewMembers.map((user) => user.name).join(", ");

    emitEvent(
        req,
        ALERT,
        chat.members,
        `${allUserName} has been added to the group`
    );

    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
        success: true,
        message: "Members added successfully",
    });
});

const removeMembers = TryCatch(async(req,res,next) => {

    const {chatId, userId} = req.body;

    const [chat, userThatWillBeRemoved ] = await Promise.all([
        Chat.findById(chatId),
        User.findById(userId, "name"),
    ]);

    if(!chat) return next(new ErrorHandler("Chat not found",404));

    if(!chat.groupChat) return next(new ErrorHandler("This is not the group chat",404));

    if(chat.creator.toString() !== req.user.toString())
        return next(new ErrorHandler("You are not allowed to add members", 403));

    if(chat.members.length <= 3){
        return next(new ErrorHandler("Group must have at least 3 members", 400));
    }

    const allChatMembers = chat.members.map((i)=> i.toString());
    chat.members = chat.members.filter(
        (member) => member.toString() !== userId.toString()
    );

    await chat.save();

    emitEvent(
        req,
        ALERT,
        chat.members,
        {message:`${userThatWillBeRemoved.name} has been removed from the group`,chatId}
    );

    emitEvent(req, REFETCH_CHATS, allChatMembers);

    return res.status(200).json({
        success: true,
        message: "Members removed sucessfully",
    });
});

const leaveGroup = TryCatch(async(req,res,next) => {

    const chatId = req.params.id;
    console.log(chatId);
    const chat = await Chat.findById(chatId);
    console.log(chat);

    if(!chat) return next(new ErrorHandler("Chat not found",404));

    if(!chat.groupChat){
        return next(new ErrorHandler("This is not a group chat",400));
    }

    const remainingMembers = chat.members.filter(
        (member) => member.toString() !== req.user.toString()
    );

    if(remainingMembers.length <3){
        return next (new ErrorHandler("Group must have at least 3 members",400));
    }

    if(chat.creator.toString() === req.user.toString()){
        const randomCreator = Math.floor(Math.random()*
        remainingMembers.length);
        const newCreator = remainingMembers[randomCreator];
        chat.creator = newCreator;
    }

    chat.members = remainingMembers;

    const [user] = await Promise.all([
        User.findById(req.user, "name"),
        chat.save(),
    ]);
 
    emitEvent(
        req,
        ALERT,
        chat.members,
        {chatId,message:`User ${user.name} has left the group`}
    );

    return res.status(200).json({
        success: true,
        message: "Group Left successfully",
    });
});

const sendAttachments = TryCatch(async(req,res,next) => {
  const { chatId } = req.body;

  const files = req.files || [];

  if(files.length < 1) return next(new ErrorHandler("Please Upload Attachments",400));

  if(files.length > 5) return next(new ErrorHandler("Files can't be more than 5",400));

  const [chat, me] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user, "name"),
  ]);

  if(!chat) return next(new ErrorHandler("Chat not found",404));

  if(files.length < 1){
    return next (new ErrorHandler("Please provide attachments",400));
  }

  const attachments = await uploadFilesToCloudinary(files);

  const messageForDb = {
    content: "",
    attachments,
    sender: me._id,
    chat: chatId,
  };

  const messageForRealTime = {
    ...messageForDb,
    sender: {
        _id: me._id,
        name: me.name,
    },
  };

  const message = await Message.create(messageForDb);

  emitEvent(
    req,
    NEW_MESSAGE,
    chat.members,
    {
        message: messageForRealTime,
        chatId,
    }
  );

  emitEvent(
    req,
    NEW_MESSAGE_ALERT,
    chat.members,
    {
        chatId
    }
  )

  return res.status(200).json({
    success: true,
    message,
  });
});    

const getChatDetails = TryCatch(async(req,res,next) => {
 
    if(req.query.populate==="true"){
    
        const chat = await Chat.findById(req.params.id)
          .populate("members","name avatar")
          .lean();

        if(!chat) return next(new ErrorHandler("Chat not found",404));

        chat.members = chat.members.map(({ _id, name, avatar}) =>
           ({
            _id,
            name,
            avatar: avatar.url,
           })
        );

        return res.status(200).json({
            success: true,
            chat,
        });

    }else{

        const chat = await Chat.findById(req.params.id);
        if(!chat) return next(new ErrorHandler("Chat not found",404));

        return res.status(200).json({
            success: true,
            chat,
        });
    };
});    

const renameGroup = TryCatch(async(req,res,next) => {
    const chatId = req.params.id;
    const {name} = req.body;

    const chat = await Chat.findById(chatId);

    if(!chat) return next (new ErrorHandler("Chat not found",404));

    if(!chat.groupChat) return next(new ErrorHandler("This is not a group chat",400));

    if(chat.creator.toString() !== req.user.toString())
        return next(
          new ErrorHandler("You are not allowed to rename the group",403)
        );

    chat.name = name;
    
    await chat.save();

    emitEvent(req, REFETCH_CHATS, chat.members);

    return res.status(200).json({
        success: true,
        message: "Group renamed sucessfully",
    })

});

const deleteChat = TryCatch(async(req,res,next) => {
    const chatId = req.params.id;
    console.log(chatId);

    const chat = await Chat.findById(chatId);
    console.log(chat);

    if(!chat) return next(new ErrorHandler("Chat not Found",404));

    const members = chat.members;

    if(chat.groupChat && chat.creator.toString() !== req.user.toString()){
        return next(new ErrorHandler("You are not allowed to delete the group", 403));
    }

    if(!chat.groupChat && !chat.members.includes(req.user.toString())){
        return next(new ErrorHandler("You are not allowed to delete the group", 403));
    }

    //Here we have to delete All Messages as well as attachments or file from cloudinary

    const messageWithAttachments = await Message.find({
        chat: chatId,
        attachments: {$exists: true, $ne: []},
    });

    const public_ids = [];

    messageWithAttachments.forEach(({attachments}) => {
        attachments.forEach(({public_id}) => {
            public_ids.push(public_id);
        });
    });

    await Promise.all([
        deleteFilesFromCloudinary(public_ids),
        chat.deleteOne(),
        Message.deleteMany({chat:chatId}),
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    return res.status(200).json({
        success: true,
        message: "Chat deleted successfully",
    });
});    

const getMessages = TryCatch(async(req,res,next) => {

    const chatId = req.params.id;
    const {page=1} = req.query;

    const limit = 20;
    const skip = (page-1)*limit;

    const chat = await Chat.findById(chatId);
    if(!chat) return next(new ErrorHandler("Chat not found", 404));
    if(!chat.members.includes(req.user.toString()))
      return next(
    new ErrorHandler("You are not allowed to access this chat", 403));

    const [messages,totalMessagesCount] = await Promise.all([Message.find({chat: chatId})
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)
        .populate("sender","name")
        .lean(),
        Message.countDocuments({chat: chatId}),
    ]);

    const totalPages = Math.ceil(totalMessagesCount/limit) || 0;

    return res.status(200).json({
        success: true,
        messages: messages.reverse(),
        totalPages,
    })
});

export {
    newGroupChat,
    getMyChats, 
    getMyGroups, 
    addMembers, 
    removeMembers, 
    leaveGroup,
    sendAttachments,
    getChatDetails,
    renameGroup,
    deleteChat,
    getMessages,
};   