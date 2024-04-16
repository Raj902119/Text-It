import mongoose from "mongoose";
const { Schema, model, models,Types } = mongoose;

//Schema: This is used to define the structure of the data that will be stored in the model.
//model: This function is used to create a mongoose model based on a schema.
//models: This is an object that stores all of the models that have been created using the model function.

const schema = new Schema(
  {
    content: String,
    attachments: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      }
    ],
    sender: {
      // creator property should store an ObjectId value
      type: Types.ObjectId,
      // It tells Mongoose that the creator property is linked to another model named "User".
      ref: "User",
      required: true,
    },
    chat: {
      // creator property should store an ObjectId value
      type: Types.ObjectId,
      // It tells Mongoose that the creator property is linked to another model named "Chat".
      ref: "Chat",
      required: true,
    },
  },
  {
    timestamps: true,
    // timestamp is a special feature in Mongoose that automatically adds two fields to your database entries: createdAt and updatedAt.
  }
);

//check if a model named User already exists in the models object. If it does, the existing model is used; otherwise, a new model is created using the provided schema.
export const Message = models.Message || model("Message", schema);
