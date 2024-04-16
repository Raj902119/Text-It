//This line defines a class named ErrorHandler that extends the built-in JavaScript Error class
class ErrorHandler extends Error {
    //This is the constructor method of the ErrorHandler class
    constructor(message, statusCode){
        // This line calls the constructor of the Error class with the provided message
        super(message);
        //This line sets the statusCode property of the ErrorHandler
        this.statusCode = statusCode;
    }
}

export {ErrorHandler};