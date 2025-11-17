import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import uploadMediaRoutes from "./routes/uploadMedia.js";
import sendMessageProxyRoutes from "./routes/sendMessageProxy.js";

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 8080;

app.use("/api/uploadMedia", uploadMediaRoutes);
app.use("/api/sendMessage", sendMessageProxyRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
