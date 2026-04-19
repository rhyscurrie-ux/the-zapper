import express from 'express';
import { GoogleGenAI } from '@google/genai';
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

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.post('/api/scan', async (req, res) => {
    try {
        const userInput = req.body.input || req.body.activity;
        if (!userInput?.trim()) return res.status(400).json({ audit: "[SYSTEM_ERROR]: No signal." });

        const history = req.body.history || [];

        const contents = [
            ...(history.length === 0 ? [
                { role: 'user', parts: [{ text: promptText }] },
                { role: 'model', parts: [{ text: '[WP: 0] [THERMAL_STATUS: BANKRUPT] Architect Online. Substrate initialized.' }] }
            ] : history),
            { role: 'user', parts: [{ text: userInput }] }
        ];

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents,
            config: { temperature: 1.2, maxOutputTokens: 1024 }
        });

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "[SYSTEM_SILENCE]";
        const updatedHistory = [...contents, { role: 'model', parts: [{ text }] }];

        res.json({ audit: text, history: updatedHistory });

    } catch (error) {
        console.error("AUDIT_FAILURE:", error.message);
        res.status(500).json({ audit: `[CONNECTION_SEVERED]: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[ARCHITECT ONLINE]: Port ${PORT}`));
