const corsOptions = {
  origin: [process.env.CLIENT_URL],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const TEXTIT_TOKEN = "Textit-token";

export { corsOptions, TEXTIT_TOKEN };