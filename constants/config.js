const corsOptions = {
    'Access-Control-Allow-Origin': process.env.CLIENT_URL,
    'Access-Control-Allow-Credentials': true,
    'Access-Control-Allow-Methods': ["GET","POST","PUT","DELETE"],
};

const TEXTIT_TOKEN="Textit-token";

export {corsOptions,TEXTIT_TOKEN};