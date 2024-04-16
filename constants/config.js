const corsOptions = {
    origin: [
        "https://text-it-frontend.vercel.app",
    ],
    credentials: true,
    methods: ["GET","POST","PUT","DELETE"],
};

const TEXTIT_TOKEN="Textit-token";

export {corsOptions,TEXTIT_TOKEN};