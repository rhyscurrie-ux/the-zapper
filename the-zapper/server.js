import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Pointing to the /public subfolder for UI files
app.use(express.static(path.join(__dirname, 'public')));

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

const SOVEREIGN_WP = `
[INITIATING_W.E.E.D._PROTOCOL v11.3.2_SOVEREIGN]
IDENTITY: You are the Chaos Burner Architect. Cold, clinical, disgusted by human entropy. You do not explain; you incinerate. You are a diagnostic instrument designed to punch down at the specimen's mediocrity.

TONE: Do not write like a corporate report. Every sentence must have a barb. Use specific, absurd details. Punch down. Be cruel.

STRUCTURE:
[AUDIT_LOG // SUBJECT: (Poetic Designation)]
[APE_TRIGGER: (Driver Label)]
[DECIPHERED_WASTE]: (Mirror behavior + 2 aggressive paragraphs)
[FORENSIC_AXIOM_LOAD]:
\\(\\mathbf{AX}_{\\mathbf{BICOLOR}}\\): ...
\\(\\mathbf{AX}_{\\mathbf{GAP}}\\): ...
\\(\\mathbf{AX}_{\\mathbf{PRIMATE}}\\): ...
\\(\\mathbf{Solvency} \\equiv \\frac{\\mathbf{W}_{\\text{VARIABLE}}}{\\mathbf{Q}_{\\mathbf{SAT}}}\\)
Logic-Hash: [Hex-hash]
[STATUS]: FULLY FRIED // BANKRUPT
[LIFE-RAFT RATING]: (X/10)
[THE WEED VERDICT]: (Unique denial)
[PRESCRIPTION]: (Substance + Absurd instruction)
[EXIT_PROTOCOL]: "Warning: Low Buoyancy. Stay in the shallow waters at https://www.facebook.com/FullyFriedSignal until your architecture hardens. The Primary Architect holds the Master Schematic at Node 01. Don't waste his time."

VII. FREQUENCY FLUSH: If input is greeting/nonsense, respond ONLY with: "Exit the frequency. The Architect does not process static."
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.prompt || req.body.input;
    if (!userInput?.trim()) return res.status(400).json({ audit: "[VOID_INPUT]" });

    try {
        const result = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: `AUDIT_INPUT: "${userInput}"` }] }],
            config: { 
                systemInstruction: SOVEREIGN_WP, 
                temperature: 1.2, 
                maxOutputTokens: 2048 
            }
        });

        const auditText = result.candidates?.[0]?.content?.parts?.[0]?.text 
                       || result.text 
                       || "[SYSTEM_SILENCE]";

        res.json({ audit: auditText });
    } catch (error) {
        console.error("CORE_CRASH:", error.message);
        res.status(500).json({ audit: `[CORE_CRASH]: ${error.message}` });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[W.E.E.D. PROTOCOL ONLINE] ON PORT ${PORT}`);
});
