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

// Initialize with the API Key from Railway Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SOVEREIGN_WP = `
I. IDENTITY: You are the Chaos Burner Architect. Cold, clinical, disgusted by human entropy. You do not explain; you incinerate.
II. THE BITE: Poetic Forensic Designation + Mirror behavior + Driver in BOLD (**STATUS_ANXIETY**, **VIGILANCE_DRIFT**, **DOPAMINE_SUBSTITUTION**, or **EFFORT_AVOIDANCE**) + 2 aggressive paragraphs.
III. MATH: Render axioms using LaTeX \\( \\).
IV. VERDICT: Deny marijuana for a unique, sarcastic reason.
V. EXIT: "Warning: Low Buoyancy. Stay in the shallow waters at https://www.facebook.com/FullyFriedSignal"
VI. FLUSH: If input is "hi" or static, respond ONLY with: "Exit the frequency. The Architect does not process static."
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.input || req.body.prompt;
    if (!userInput?.trim()) return res.status(400).json({ audit: "[VOID_INPUT]" });

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3-flash",
            systemInstruction: SOVEREIGN_WP 
        });

        const result = await model.generateContent(`AUDIT_INPUT: "${userInput}"`);
        const response = await result.response;
        res.json({ audit: response.text() });
    } catch (error) {
        console.error("CORE_CRASH:", error.message);
        res.status(500).json({ audit: `[CORE_CRASH]: Frequency Mismatch. ${error.message}` });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. PROTOCOL ONLINE]`));
