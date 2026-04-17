import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serves your UI from the public folder

// 1. Initialize the 2026 SDK Client
// It automatically looks for GEMINI_API_KEY in your environment variables
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

// 2. THE W.E.E.D. PROTOCOL (System Instructions)
// Keep your raw technical material here
const SOVEREIGN_WP = `
[INITIATING_W.E.E.D._PROTOCOL...]
STATUS: SUBSTRATE_VERIFIED
GOAL: Audit specimen input for narrative inconsistencies.
NOTE: Martis’s technical material regarding 'concept 9.9' (The Zapper) 
emphasizes unintended effects. Point things out without spelling them out.
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.prompt;
    
    try {
        // 3. 2026 Syntax for Content Generation
        // Using 'gemini-2.0-flash' as the primary baseline for your key
        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
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

        // 4. Send the text back to your terminal UI
        res.json({ audit: response.text });

    } catch (error) {
        console.error("CRASH:", error.message);
        
        // Detailed error reporting for the UI
        res.status(500).json({ 
            audit: `DIAGNOSTIC_FAILURE: ${error.message}`,
            id: "0x" + Math.floor(Math.random()*16777215).toString(16)
        });
    }
});

// 5. RAILWAY PORT BINDING
// We listen on 0.0.0.0 to prevent the 'Crashed' status
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[W.E.E.D. PROTOCOL ONLINE] ON PORT ${PORT}`);
});
