import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(express.static('public')); // If you have a front-end folder

// Initialize the 2026 SDK Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// PASTE YOUR FULL PROTOCOL/SYSTEM INSTRUCTIONS HERE
const SOVEREIGN_WP = `Your W.E.E.D. Protocol content goes here. Keep it raw.`;

app.post('/api/scan', async (req, res) => {
    try {
        // Updated 2026 syntax for generateContent
        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: `AUDIT_INPUT: "${req.body.activity}"` }] }],
            config: {
                systemInstruction: SOVEREIGN_WP,
                temperature: 0.95,
                maxOutputTokens: 1024
            }
        });

        // The new SDK returns 'text' directly on the response object
        res.json({ audit: response.text });
        
    } catch (error) {
        console.error("CRASH:", error.message);
        res.status(500).json({ audit: `DIAGNOSTIC: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
// Listening on 0.0.0.0 is MANDATORY for Railway
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[W.E.E.D. PROTOCOL ONLINE] ON PORT ${PORT}`);
});
