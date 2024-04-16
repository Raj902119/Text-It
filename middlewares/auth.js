import { User } from "../Models/user.js";
import { TEXTIT_TOKEN } from "../constants/config.js";
import { ErrorHandler } from "../utils/utility.js";
import { TryCatch } from "./error.js";
import jwt from "jsonwebtoken";


const isAuthenticated = (req,res,next) => {
    try {
        const token = req.cookies[TEXTIT_TOKEN];

        if (!token)
            return next(new ErrorHandler("Please login to access this route", 401));

        const decodedData = jwt.verify(token, process.env.JWT_SECRET);

        // If decoding is successful, you can attach the decoded data to the request object
        req.user = decodedData._id;

        next();
    } catch (error) {
        // If there's an error in token verification, handle it
        return next(new ErrorHandler("Invalid or expired token", 401));
    }
};

const isAdmin = (req,res,next) => {
        const token = req.cookies["textit-admin-token"];

        if (!token)
            return next(new ErrorHandler("Only admin can access this route", 401));

        const adminId = jwt.verify(token, process.env.JWT_SECRET);

        const adminSecretKey = process.env.ADMIN_SECRET_KEY || "Rajpatil";

        const isMatch = adminId === adminSecretKey;

        if(!isMatch) return next(new ErrorHandler("Invalid Admin Key",401));

        next();
};

const socketAuthenticator = async (err,socket,next) => {
    try {
        if (err) return next(err);

        const authToken = socket.request.cookies[TEXTIT_TOKEN];

        if(!authToken) return next(new ErrorHandler("Please login to access this route", 401));

        const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);

        const user = await User.findById(decodedData._id);

        if(!user)
          return next(new ErrorHandler("Please login to access this route", 401));
        
        socket.user = user;
          
        return next();
    } catch (error) {
        return next(new ErrorHandler("Please login to access this route", 401));
    }
};

export {isAuthenticated,isAdmin,socketAuthenticator};