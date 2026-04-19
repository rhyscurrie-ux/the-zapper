import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { promptText } from './prompt.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/scan', async (req, res) => {
    try {
        const userInput = req.body.input || req.body.activity;
        const history = req.body.history || [];

        if (!process.env.API_KEY) {
            return res.status(500).json({ audit: "[CRITICAL_FAILURE]: API_KEY missing from Railway Variables." });
        }

        // Format history for the REST API
        // Note: The REST API uses 'model' instead of 'assistant'
        const contents = [
            ...history,
            { role: 'user', parts: [{ text: userInput }] }
        ];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.API_KEY}`,
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

        if (data.error) {
            throw new Error(data.error.message);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[SYSTEM_SILENCE]";

        const updatedHistory = [
            ...contents,
            { role: 'model', parts: [{ text }] }
        ];

        res.json({ audit: text, history: updatedHistory });

    } catch (error) {
        console.error("REST_FAILURE:", error.message);
        res.status(500).json({ audit: `[CONNECTION_SEVERED]: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[ARCHITECT ONLINE]: REST mode active on port ${PORT}`));
