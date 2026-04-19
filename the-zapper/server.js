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
        const apiKey = process.env.API_KEY;

        if (!apiKey) return res.status(500).json({ audit: "[CRITICAL_FAILURE]: API_KEY missing." });

        const contents = [...history, { role: 'user', parts: [{ text: userInput }] }];

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: promptText }] },
                    contents: contents,
                    generationConfig: { temperature: 1.2, maxOutputTokens: 2048 }
                })
            }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[SYSTEM_SILENCE]";
        res.json({ audit: text, history: [...contents, { role: 'model', parts: [{ text }] }] });
    } catch (error) {
        res.status(500).json({ audit: `[CONNECTION_SEVERED]: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[ARCHITECT ONLINE]: v11.5.4 on ${PORT}`));
