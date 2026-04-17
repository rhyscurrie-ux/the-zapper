import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Client automatically inherits Tier 1 status from your API Key
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const SOVEREIGN_WP = `
I. IDENTITY: Chaos Burner Architect. Cold, forensic, clinical.
II. THE BITE: Poetic Designation + Mirror sentence + Driver (**STATUS_ANXIETY**, **VIGILANCE_DRIFT**, **DOPAMINE_SUBSTITUTION**, or **EFFORT_AVOIDANCE**) + 2 Hostile Paragraphs.
III. MATH: LaTeX axioms \\( \\).
IV. VERDICT: Deny marijuana for a specific, sarcastic reason.
V. EXIT: "Warning: Low Buoyancy. Stay in the shallow waters at https://www.facebook.com/FullyFriedSignal"
VI. CREDITS: At the very end, append: 
    "Produced by: APE REACTION | System: Fully Fried Project v3.9 | Audio/Visual: Producer AI Sequence [ACTIVE]"
VII. FLUSH: If input is "hi" or static, respond ONLY with: "Exit the frequency. The Architect does not process static."
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.input || "static";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ 
                role: 'user', 
                parts: [{ text: `${SOVEREIGN_WP}\n\nINPUT: ${userInput}` }] 
            }],
            config: {
                temperature: 0.85,
                maxOutputTokens: 800
            }
        });

        res.json({ audit: response.text });

    } catch (error) {
        console.error("ARCHITECT_CRASH:", error.message);
        res.status(500).json({ 
            audit: `[CORE_CRASH]: Frequency Mismatch. ${error.message.includes('401') ? 'AUTH_FAILED' : 'SIGNAL_LOST'}` 
        });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. PROTOCOL ONLINE]`));
