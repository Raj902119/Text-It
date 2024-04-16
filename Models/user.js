import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
import { hash } from "bcrypt";
//Schema: This is used to define the structure of the data that will be stored in the model.
//model: This function is used to create a mongoose model based on a schema.
//models: This is an object that stores all of the models that have been created using the model function.

const schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    username: {
      type: String, 
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      selected: false,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
    // timestamp is a special feature in Mongoose that automatically adds two fields to your database entries: createdAt and updatedAt.
  }
);

schema.pre("save", async function(next){
  if(!this.isModified("password")) return next();
  this.password = await hash(this.password, 10);
})

//check if a model named User already exists in the models object. If it does, the existing model is used; otherwise, a new model is created using the provided schema.
export const User = models.User || model("User", schema);
