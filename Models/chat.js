import mongoose from "mongoose";
const { Schema, model, models,Types } = mongoose;
//Schema: This is used to define the structure of the data that will be stored in the model.
//model: This function is used to create a mongoose model based on a schema.
//models: This is an object that stores all of the models that have been created using the model function.

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    groupChat: {
      type: Boolean,
      default: false,
    },
    creator: {
      // creator property should store an ObjectId value
      type: Types.ObjectId,
      // It tells Mongoose that the creator property is linked to another model named "User".
      ref: "User",
    },
    members: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    // timestamp is a special feature in Mongoose that automatically adds two fields to your database entries: createdAt and updatedAt.
  }
);

//check if a model named User already exists in the models object. If it does, the existing model is used; otherwise, a new model is created using the provided schema.
export const Chat = models.Chat || model("Chat", schema);
