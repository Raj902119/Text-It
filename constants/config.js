const corsOptions = {
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET","POST","PUT","DELETE"],
};

const TEXTIT_TOKEN="Textit-token";

export {corsOptions,TEXTIT_TOKEN};