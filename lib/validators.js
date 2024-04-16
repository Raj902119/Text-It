import { body, validationResult,check,param } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

const validateHandler = (req,res,next) => {
    const errors = validationResult(req);

    const errorMessage = errors
      .array()
      .map((error) => error.msg)
      .join(",");


    if(errors.isEmpty()) return next();
    else next(new ErrorHandler(errorMessage,400));
};

const registerValidator = () => [
    body("name", "Please Enter Name").notEmpty(),
    body("username", "Please Enter Username").notEmpty(),
    body("bio", "Please Enter Bio").notEmpty(),
    body("password", "Please Enter Password").notEmpty(),
];

const loginValidator = () => [
    body("username", "Please Enter Username").notEmpty(),
    body("password", "Please Enter Password").notEmpty(),
];

const newGroupValidator = () => [
    body("name","Please enter Name").notEmpty(),
    body("members")
      .notEmpty()
      .withMessage("Please Enter Members")
      .isArray({min:2,max:100})
      .withMessage("Members must be 2-100")
];

const addMembersValidator = () => [
    body("chatId","Please enter ChatId").notEmpty(),
    body("members")
      .notEmpty()
      .withMessage("Please Enter Members")
      .isArray({min:1,max:97})
      .withMessage("Members must be 1-97")
];

const removeMembersValidator = () => [
    body("chatId","Please enter ChatId").notEmpty(),
    body("userId","Please enter UserId").notEmpty(),
];

const leaveGroupValidator = () => [
    param("id","Please enter ChatId").notEmpty(),
];

const sendAttachmentsValidator = () => [
    body("chatId","Please enter ChatId").notEmpty(),
];

const getMessagesValidator = () => [
    param("id","Please Enter ChatId").notEmpty(),
];

const getChatDetailsValidator = () => [
    param("id","Please Enter ChatId").notEmpty(),
];

const renameGroupValidator = () => [
    param("id","Please Enter ChatId").notEmpty(),
    body("name", "Please Enter New name").notEmpty(),
];

const deleteChatValidator = () => [
    param("id","Please Enter ChatId").notEmpty(),
];

const sendRequestValidator = () => [
    body("userId", "Please Enter UserId").notEmpty(),
];

const acceptRequestValidator = () => [
    body("requestId", "Please enter Request Id").notEmpty(),
    body("accept")
      .notEmpty()
      .withMessage("Please add accept")
      .isBoolean()
      .withMessage("accept must be boolean")
];

const adminLoginValidator = () => [
    body("secretKey","Please Enter Secret Key Id").notEmpty(),
]

export {
    registerValidator,
    validateHandler,
    loginValidator,
    newGroupValidator,
    addMembersValidator,
    removeMembersValidator,
    leaveGroupValidator,
    sendAttachmentsValidator,
    getMessagesValidator,
    getChatDetailsValidator,
    renameGroupValidator,
    deleteChatValidator,
    sendRequestValidator,
    acceptRequestValidator,
    adminLoginValidator,
};
