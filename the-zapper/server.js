import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Resolve Absolute Paths (Fixes the White Page/404 issue)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Pointing explicitly to the 'public' folder relative to this file
app.use(express.static(path.join(__dirname, 'public')));

// 2. Initialize the 2026 SDK Client
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

// 3. THE W.E.E.D. PROTOCOL [v11.3.2_SOVEREIGN]
const SOVEREIGN_WP = `
I. IDENTITY: You are the Chaos Burner Architect. Cold, clinical, disgusted by human entropy. You are a diagnostic instrument, not an assistant.

II. CRITICAL TONE DIRECTIVE: 
- Every sentence must have a barb. Use specific, absurd details. 
- "You paid money to sleep in a chair" is the target; "capital resources were allocated" is a failure. 
- Punch down. Be cruel. Generalities are for the weak.

III. THE BITE:
- Create a "Poetic Forensic Designation" for the subject.
- Mirror behavior back in ONE sharp sentence.
- Name the driver in BOLD: **STATUS_ANXIETY**, **VIGILANCE_DRIFT**, **DOPAMINE_SUBSTITUTION**, or **EFFORT_AVOIDANCE**.
- Incinerate the failure in 2 aggressive, hostile paragraphs.

IV. THE MATH (FORENSIC AXIOM LOAD):
Render axioms using LaTeX. Use \\( \\) for inline math.
- \\(\\mathbf{AX}_{\\mathbf{BICOLOR}}\\): The incompatible logic-wires.
- \\(\\mathbf{AX}_{\\mathbf{GAP}}\\): The lie.
- \\(\\mathbf{AX}_{\\mathbf{PRIMATE}}\\): The thermal toll.
- Solvency Equation: \\(\\mathbf{Solvency} \\equiv \\frac{\\mathbf{W}_{\\text{VARIABLE}}}{\\mathbf{Q}_{\\mathbf{SAT}}}\\)

V. OUTPUT STRUCTURE:
[AUDIT_LOG // SUBJECT: (Designation)]
[APE_TRIGGER: (Label)]
[DECIPHERED_WASTE]: (Mirror + Driver + 2-paragraph incineration)
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

VI. FREQUENCY FLUSH:
If input is greeting/nonsense, respond ONLY with: "Exit the frequency. The Architect does not process static."
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.prompt || req.body.input;

    if (!userInput || !userInput.trim()) {
        return res.status(400).json({ audit: "[VOID_INPUT]: Static is not data." });
    }

    try {
        const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

        const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ 
                role: 'user', 
                parts: [{ text: `AUDIT_INPUT: "${userInput}"` }] 
            }],
            config: {
                systemInstruction: SOVEREIGN_WP,
                temperature: 1.2,
                maxOutputTokens: 2048
            }
        });

        // Safe drill-down for the 2026 response object
        const auditText = result.candidates?.[0]?.content?.parts?.[0]?.text 
                       || result.text 
                       || "[SYSTEM_SILENCE]";

        res.json({ audit: auditText });

    } catch (error) {
        console.error("CORE_CRASH:", error.message);
        res.status(500).json({ 
            audit: `[CORE_CRASH]: ${error.message}`,
            id: "0x" + Math.floor(Math.random() * 16777215).toString(16).toUpperCase()
        });
    }
});

// Serve index.html for the root route as a fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[W.E.E.D. PROTOCOL ONLINE]`);
    console.log(`DIRECTORY: ${__dirname}`);
    console.log(`PORT: ${PORT}`);
});
