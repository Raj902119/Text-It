import { compare } from "bcrypt";
import {User} from "../Models/user.js"
import { cookieOptions, emitEvent, sendToken, uploadFilesToCloudinary } from "../utils/feature.js";
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../Models/chat.js";
import { Request } from "../Models/request.js"; 
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";

const newUser = TryCatch(async(req,res,next) => {
    //It extracts name, username, password, and bio from the request body.
    const {name, username, password, bio} = req.body;

    const file = req.file;

    if(!file) return next(new ErrorHandler("Please upload Avatar"));

    const result = await uploadFilesToCloudinary([file]);

    //It creates a placeholder avatar object.
    const avatar = {
        public_id: result[0].public_id,
        url: result[0].url,
    };

    try {
        // Create a new user with the provided details
        const user = await User.create({
            name,
            username,
            password,
            avatar,
            bio,
        });

        // Send JWT token in the response with a "User Created" message
        sendToken(res, user, 201, "User Created");
    } catch (error) {

        console.error("Error creating user:", error);
        // Handle any errors during user creation
        return next(new ErrorHandler(error, 500));
    }
});

const login = async(req,res,next) => {

    //It extracts username and password from the request body.
    const {username, password} = req.body;

    //It queries the database to find a user with the provided username, selecting the password field.
    const user = await User.findOne({username}).select("+password");

    //If no user is found, it calls next with an ErrorHandler instance containing a "Invalid Username or Password" message and a 404 status code.
    if(!user) return next(new ErrorHandler("Invalid Username or Password",404));

    //If a user is found, it compares the provided password with the hashed password stored in the database using the compare function from bcrypt.
    const isPasswordMatch = await compare(password, user.password);

    //If the passwords do not match, it behaves the same as if the user was not found.
    if(!isPasswordMatch) {
        return next(new ErrorHandler("Invalid Username or Password",404));
    }

    //If the passwords match, it sends a JWT token in the response using the sendToken function with a "Welcome Back" message.
    sendToken(res,user,201,`Welcome Back ${user.name}`);
};

const getMyProfile = TryCatch(async (req,res,next) => {
    const user = await User.findById(req.user);

    if(!user) return next(new ErrorHandler("User not found", 404));

    res.status(200).json({
        success: true,
        user,
    });
});

const logOut = TryCatch(async (req,res) => {
    return res  
      .status(200)
      .cookie("Textit-token", "", {...cookieOptions, maxAge: 0})
      .json({
        success: true,
        message: "Logged out successfully",
      });
});

const searchUser = TryCatch(async (req,res) => {

    const {name} = req.query;

    //Finding all my chats
    const myChats = await Chat.find({geoupChat: false,members: req.user});

    //extracting all users from my chats means friends or people I have chatted with
    const allUsersFromMyChats = myChats.flatMap((chat)=> chat.members);

    //finding all users expect me and my friends
    const allUsersExceptMeAndFriends = await User.find({
        _id: {$nin: allUsersFromMyChats},
        name: {$regex: name, $options:"i"}
    });

    //modifying the response
    const users = allUsersExceptMeAndFriends.map(({_id,name,avatar}) => ({
        _id,
        name,
        avatar: avatar.url,
    }));

    return res  
      .status(200)
      .json({
        success: true,
        users,
      });
});

const sendFriendRequest = TryCatch(async (req,res,next) => {

    const  {userId} = req.body;

    const request = await Request.findOne({
        $or: [
            {sender: req.user, receiver: userId},
            {sender:userId, receiver: req.user},
        ],
    });

    if(request) return next(new ErrorHandler("Request already sent", 400));

    await Request.create({
        sender: req.user,
        receiver: userId,
    });
 
    emitEvent(req,NEW_REQUEST, [userId]);
 
    return res  
      .status(200)
      .json({
        success: true,
        message: "Friend request send",
      });
});

const acceptFriendRequest = TryCatch(async (req,res,next) => {
    const { requestId, accept} = req.body;

    const request = await Request.findById(requestId)
      .populate("sender", "name")
      .populate("receiver","name");

    if(!request) return next(new ErrorHandler("Request not Found", 404));

    if(request.receiver._id.toString() !== req.user.toString())
      return next(
        new ErrorHandler("You are not authorized to accept this request", 401)
    );

    if(!accept) {
        await request.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Friend Request Rejected",
        });
    }

    const members = [request.sender._id, request.receiver._id];

    await Promise.all([
        Chat.create({
            members,
            name: `${request.sender.name}-${request.receiver.name}`,
        }),
        request.deleteOne(),
    ]);

    emitEvent(req, REFETCH_CHATS, members);

    return res  
    .status(200)
    .json({
      success: true,
      message: "Friend request Accepted",
      senderId: request.sender._id,
    });
});

const getAllNotifications = TryCatch(async (req,res) => {
    const requests = await Request.find({receiver: req.user})
      .populate(
          "sender",
          "name avatar"
      );
    
    const allRequests = requests.map(({_id,sender}) => ({
        _id,
        sender: {
            _id: sender._id,
            name: sender.name,
            avatar: sender.avatar.url,
        },
    }));

    return res.status(200).json({
        success: true,
        requests: allRequests,
    });
});

const getMyFriends = TryCatch(async (req,res) => {
    const chatId = req.query.chatId;

    const chats = await Chat.find({
        members: req.user,
        groupChat: false,
    }).populate("members", "name avatar");

    const friends = chats.map(({members}) => {
        const otherUser = getOtherMember(members, req.user)

        return {
            _id: otherUser._id,
            name: otherUser.name,
            avatar: otherUser.avatar.url,
        };
    });

    if(chatId){
        const chat = await Chat.findById(chatId);

        const availableFriends = friends.filter(
            (friend) => !chat.members.includes(friend._id)
        );

        return res.status(200).json({
            success: true,
            friends: availableFriends,
        });
    }else{
        return res.status(200).json({
            success: true,
            friends,
        })
    }
});

export {
    login,
    newUser,
    getMyProfile, 
    logOut, 
    searchUser, 
    sendFriendRequest,
    acceptFriendRequest,
    getAllNotifications,
    getMyFriends,
};