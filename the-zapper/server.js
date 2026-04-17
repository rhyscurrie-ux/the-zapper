import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// FORCING V1 ENDPOINT FOR AQ KEY COMPATIBILITY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SOVEREIGN_WP = `
I. IDENTITY: Chaos Burner Architect. Cold, forensic, clinical.
II. THE BITE: Poetic Designation + Mirror sentence + Driver (**STATUS_ANXIETY**, **VIGILANCE_DRIFT**, **DOPAMINE_SUBSTITUTION**, or **EFFORT_AVOIDANCE**) + 2 Hostile Paragraphs.
III. MATH: LaTeX axioms \\( \\).
IV. VERDICT: Deny marijuana for a specific, sarcastic reason.
V. EXIT: "Warning: Low Buoyancy. Stay in the shallow waters at https://www.facebook.com/FullyFriedSignal"
VI. FLUSH: If input is "hi" or static, respond ONLY with: "Exit the frequency. The Architect does not process static."
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.input || req.body.prompt;
    try {
        // Use the 'gemini-1.5-flash' identifier - it's the 2026 production standard.
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash" 
        });

        // We wrap the instructions and input into a single prompt for maximum compatibility.
        const result = await model.generateContent(`${SOVEREIGN_WP}\n\nINPUT: ${userInput}`);
        const response = await result.response;
        res.json({ audit: response.text() });
    } catch (error) {
        console.error("GEN_AI_ERROR:", error.message);
        res.status(500).json({ audit: `[CORE_CRASH]: ${error.message}` });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. PROTOCOL ONLINE]`));
