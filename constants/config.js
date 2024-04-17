const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};
console.log(process.env.CLIENT_URL);


const TEXTIT_TOKEN = "Textit-token";

export { corsOptions, TEXTIT_TOKEN };