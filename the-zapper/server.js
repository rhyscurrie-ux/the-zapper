import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// FORCE the absolute path to the public folder
const PUBLIC_DIR = path.resolve(__dirname, 'public');
app.use(express.static(PUBLIC_DIR));

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

const SOVEREIGN_WP = `Identity: Chaos Burner Architect. Tone: Cruel. Structure: [AUDIT_LOG]...`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.prompt || req.body.input;
    try {
        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: `AUDIT_INPUT: "${userInput}"` }] }],
            config: { systemInstruction: SOVEREIGN_WP, temperature: 1.2, maxOutputTokens: 2048 }
        });
        res.json({ audit: result.candidates?.[0]?.content?.parts?.[0]?.text || "[SILENCE]" });
    } catch (error) {
        res.status(500).json({ audit: `[CORE_CRASH]: ${error.message}` });
    }
});

// THE EMERGENCY FALLBACK: Manually serve index.html for ANY GET request
app.get('*', (req, res) => {
    console.log(`[ROUTING]: Serving index.html from ${PUBLIC_DIR}`);
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'), (err) => {
        if (err) {
            console.error("[CRITICAL]: index.html NOT FOUND at " + path.join(PUBLIC_DIR, 'index.html'));
            res.status(500).send("The Architect is missing its interface. Check your 'public' folder name.");
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[W.E.E.D. PROTOCOL ONLINE]`);
    console.log(`[DIAGNOSTIC]: Searching for UI in: ${PUBLIC_DIR}`);
});
