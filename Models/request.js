import mongoose from "mongoose";
const { Schema, model, models,Types } = mongoose;
//Schema: This is used to define the structure of the data that will be stored in the model.
//model: This function is used to create a mongoose model based on a schema.
//models: This is an object that stores all of the models that have been created using the model function.

const schema = new Schema(
  {
    status: {
      type: String,
      default: "pending",
      enum: ["pending","accepted","rejected"],
    },
    sender: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    }
  },
  {
    timestamps: true,
    // timestamp is a special feature in Mongoose that automatically adds two fields to your database entries: createdAt and updatedAt.
  }
);

//check if a model named User already exists in the models object. If it does, the existing model is used; otherwise, a new model is created using the provided schema.
export const Request = models.Request || model("Request", schema);
