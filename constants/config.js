const corsOptions = {
  origin: [process.env.CLIENT_URL],
  methods: "GET,PUT,PATCH,POST,DELETE",
};

const TEXTIT_TOKEN = "Textit-token";

export { corsOptions, TEXTIT_TOKEN };