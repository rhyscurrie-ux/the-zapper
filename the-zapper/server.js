import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { promptText } from './prompt.js';

// 1. Initialise Environment
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2. The Core AI Bridge
app.post('/api/scan', async (req, res) => {
    try {
        const userInput = req.body.input || req.body.activity;
        const history = req.body.history || [];

        // Check for Key - Ensure this matches your Railway Variable name!
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            return res.status(500).json({ 
                audit: "[CRITICAL_FAILURE]: API_KEY missing from Railway Variables." 
            });
        }

        // Prepare context for the REST API
        const contents = [
            ...history,
            { role: 'user', parts: [{ text: userInput }] }
        ];

        // DIRECT REST CALL - Using the verified 'gemini-3-flash-preview' string
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: promptText }] },
                    contents: contents,
                    generationConfig: {
                        temperature: 1.2,
                        maxOutputTokens: 1024
                    }
                })
            }
        );

        const data = await response.json();

        // Error Handling for Deprecation or Tier issues
        if (data.error) {
            console.error("GOOGLE_API_ERROR:", data.error.message);
            throw new Error(data.error.message);
        }

        // Extract Response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[SYSTEM_SILENCE]";

        // Sync History
        const updatedHistory = [
            ...contents,
            { role: 'model', parts: [{ text }] }
        ];

        res.json({ audit: text, history: updatedHistory });

    } catch (error) {
        console.error("REST_FAILURE:", error.message);
        res.status(500).json({ 
            audit: `[CONNECTION_SEVERED]: ${error.message}` 
        });
    }
});

// 3. Start Terminal
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ARCHITECT ONLINE]: Sovereign v11.5.1 active on port ${PORT}`);
});
