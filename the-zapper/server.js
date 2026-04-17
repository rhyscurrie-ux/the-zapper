import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 1. Initialize the 2026 Client
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

// 2. SOVEREIGN_WP (Paste your full Protocol content here)
const SOVEREIGN_WP = `[W.E.E.D. PROTOCOL v4.2]: AUDIT MODE ACTIVE.`;

app.post('/api/scan', async (req, res) => {
    try {
        // 3. Use 2026 models (2.5 or 3.1)
        const activeModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

        const response = await ai.models.generateContent({
            model: activeModel,
            contents: [{ 
                role: 'user', 
                parts: [{ text: `AUDIT_INPUT: "${req.body.activity}"` }] 
            }],
            config: {
                systemInstruction: SOVEREIGN_WP,
                temperature: 0.95,
                maxOutputTokens: 1024
            }
        });

        // 4. Send clean response
        res.json({ audit: response.text });

    } catch (error) {
        console.error("DIAGNOSTIC_FAILURE:", error.message);
        res.status(500).json({ audit: `CRASH_REPORT: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[W.E.E.D. PROTOCOL ONLINE] ON PORT ${PORT}`);
});
