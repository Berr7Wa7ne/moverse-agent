import express from "express";
import axios from "axios";

const router = express.Router();

// Proxy POST /api/sendMediaMessage from Agent App -> Agency App
router.post("/", async (req, res) => {
  try {
    const agencyUrl =
      process.env.AGENCY_SEND_MEDIA_MESSAGE_URL ||
      "https://moverse-portfolio.vercel.app/api/sendMediaMessage";

    const response = await axios.post(agencyUrl, req.body, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res.status(response.status).json(response.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const data =
      err.response?.data || { error: "Failed to send media message via proxy" };
    console.error("[proxy sendMediaMessage] error", status, data);
    return res.status(status).json(data);
  }
});

export default router;
