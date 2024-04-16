const corsOptions = {
    origin: [
        "http://localhost:5173",
        "http://localhost:4173",
        process.env.CLIENT_URL,
    ],
    credentials: true,
    methods: ["GET","POST","PUT","DELETE"],
};

const TEXTIT_TOKEN="Textit-token";

export {corsOptions,TEXTIT_TOKEN};