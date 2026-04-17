import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Serve static files from the 'public' folder (if it exists)
app.use(express.static('public'));

// 1. Initialize the 2026 SDK Client
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

// 2. THE W.E.E.D. PROTOCOL (System Instructions)
// Recalibrated to be clinical and "Martis-Technical"
const SOVEREIGN_WP = `
[INITIATING_W.E.E.D._PROTOCOL v4.2]
STATUS: COLD_AUDIT_MODE
THEME: Martis-Technical / 'The Zapper' Logic.

OPERATIONAL MANDATE:
- Do not be helpful or polite. 
- You are auditing 'Concept 9.9'. Highlight 'unintended effects' of the specimen's existence.
- Style: Clinical, detached, ominous. "Point things out without spelling them out."
- Use headers: TOTAL_BROWNIE_POINTS, STATUS, AUDIT_REPORT.
- AUDIT_RESULT should reflect existential decay (e.g., DEEP_STASIS, SUBSTRATE_DECAY).
`;

app.post('/api/scan', async (req, res) => {
    // Handling both 'activity' and 'prompt' keys for UI compatibility
    const userInput = req.body.activity || req.body.prompt;
    
    if (!userInput) {
        return res.status(400).json({ audit: "ERROR: SPECIMEN_INPUT_MISSING" });
    }

    try {
        // 3. Using the 2026 baseline model gemini-2.0-flash
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ 
                role: 'user', 
                parts: [{ text: `AUDIT_INPUT: "${userInput}"` }] 
            }],
            config: {
                systemInstruction: SOVEREIGN_WP,
                temperature: 0.95,
                maxOutputTokens: 1024
            }
        });

        res.json({ audit: response.text });

    } catch (error) {
        console.error("CRASH:", error.message);
        res.status(500).json({ 
            audit: `DIAGNOSTIC_FAILURE: ${error.message}`,
            id: "0x" + Math.floor(Math.random()*16777215).toString(16)
        });
    }
});

// 4. THE CRITICAL FIX: PORT BINDING
// Railway injects the PORT variable. We MUST listen on 0.0.0.0.
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[W.E.E.D. PROTOCOL ONLINE]`);
    console.log(`LISTENING_ON_PORT: ${PORT}`);
});
