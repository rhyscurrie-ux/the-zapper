import { Client } from "@google/genai";
import express from "express";
import 'dotenv/config';

const app = express();
app.use(express.json());

const client = new Client({ 
  apiKey: process.env.GEMINI_API_KEY 
});

// This line reads from your Railway variable
const MODEL_ID = process.env.GEMINI_MODEL || "gemini-1.5-flash";

app.post("/roast", async (req, res) => {
  try {
    const response = await client.models.generateContent(MODEL_ID, req.body.prompt);
    res.json({ text: response.text() });
  } catch (error) {
    console.error("Architect Error:", error);
    res.status(500).json({ error: "Check Railway Logs." });
  }
});

app.listen(process.env.PORT || 3000);
