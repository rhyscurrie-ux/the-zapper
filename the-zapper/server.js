import { Client } from "@google/genai";
import express from "express";
import 'dotenv/config';

const app = express();
app.use(express.json());

// 1. Initialize the 2026 Client using your AQ... key
const client = new Client({ 
  apiKey: process.env.GEMINI_API_KEY 
});

// 2. Set the model (Gemini 3 Flash is the 2026 default for speed)
const MODEL_ID = process.env.GEMINI_MODEL || "gemini-3-flash";

app.post("/roast", async (req, res) => {
  const { prompt } = req.body;

  try {
    // 3. New 2026 Syntax for generating content
    const response = await client.models.generateContent(
      MODEL_ID,
      prompt
    );

    res.json({ text: response.text() });

  } catch (error) {
    console.error("Architect Connection Error:", error);
    
    // Specifically catch the "Invalid Key" error
    if (error.message.includes("API_KEY_INVALID")) {
      return res.status(401).json({ error: "The AQ key is rejected. Check Billing." });
    }

    res.status(500).json({ error: "The Architect is blinded." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Burner active on port ${PORT}`));
