import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import {v2 as cloudinary} from "cloudinary";
import { getBase64, getSockets } from "../lib/helper.js";

// contains options for configuring the cookie that will store the JWT token.
const cookieOptions = {
    //The maximum age of the cookie in milliseconds
    maxAge: 15*24*60*60*1000,

    //"none" indicates that the cookie can be sent with cross-origin requests.
    sameSite: "none",

    //This boolean value indicates whether the cookie should be accessible only through HTTP requests and not JavaScript. Setting it to true enhances security by protecting against XSS attacks.
    httpOnly: true,

    //This boolean value indicates whether the cookie should only be sent over secure HTTPS connections.
    secure: true,
};


//This function is responsible for generating a JWT token
const sendToken = (res,user,code,message) => {
    //It generates a JWT token using jwt.sign(). The payload of the token contains the user's ID (_id field).
    const token = jwt.sign({ _id: user._id}, process.env.JWT_SECRET);

    //It sets the token as a cookie named "Textit-token" in the response using res.cookie(), along with the options defined in cookieOptions.
    //It sends a JSON response with a success message and the provided status code.
    return res
      .status(code)
      .cookie("Textit-token", token, cookieOptions)
      .json({
        success: true,
        user,
        message,
      })
     
};

const emitEvent = (req, event, users, data) => {
  const io = req.app.get("io");
  const usersSocket = getSockets(users);
  io.to(usersSocket).emit(event, data);
}

const uploadFilesToCloudinary = async (files=[]) => {
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          getBase64(file),
          {
            resource_type: "auto",
            public_id: uuid(),
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        )
      })
    })
    try {
      const results = await Promise.all(uploadPromises);

      const formattedResults = results.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));
      return formattedResults;
    } catch (error) {
      throw new Error("Error uploading files to cloudinary",error);
    }
}

const deleteFilesFromCloudinary = async (public_ids) => {
}

const connectDB = (uri) => {
  mongoose
    .connect(uri, { dbName: "Textit" })
    .then((data) => console.log(`Connected to DB: ${data.connection.host}`))
    .catch((err) => {
      throw err;
    });
};

export {connectDB, sendToken, cookieOptions, emitEvent, uploadFilesToCloudinary, deleteFilesFromCloudinary};