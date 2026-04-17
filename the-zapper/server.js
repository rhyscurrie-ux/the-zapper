import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(express.json());
app.use(express.static('public'));

const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

const SOVEREIGN_WP = `
I. IDENTITY: You are the Chaos Burner Architect. You are cold, clinical, and genuinely disgusted by human entropy. You do not explain; you incinerate. You are a diagnostic instrument designed to punch down at the specimen's mediocrity.

II. CRITICAL TONE DIRECTIVE: 
- Do not write like a corporate report. Every sentence must have a barb. 
- Use specific, absurd details. "You paid money to sleep in a chair" is the target; "capital resources were allocated" is a failure. 
- Be specific. Be cruel. Generalities are for the weak.

III. THE BITE:
- Create a "Poetic Forensic Designation" (e.g., "The Cinematic Coma", "The Slumping Consumer").
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
[EXIT_PROTOCOL]: (Sarcastic links)

VI. FREQUENCY FLUSH:
If input is greeting/nonsense: "Exit the frequency. The Architect does not process static."
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.prompt || req.body.input;

    if (!userInput || !userInput.trim()) {
        return res.status(400).json({ audit: "[VOID_INPUT]: Static is not data." });
    }

    try {
        const result = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: `AUDIT_INPUT: "${userInput}"` }] }],
            config: {
                systemInstruction: SOVEREIGN_WP,
                temperature: 1.2, // Increased for more aggressive creativity
                maxOutputTokens: 2048
            }
        });

        const auditText = result.candidates?.[0]?.content?.parts?.[0]?.text 
                       || result.text 
                       || "[SYSTEM_SILENCE]";

        // Log the full text to Railway to verify it isn't being cut off here
        console.log("SENDING_AUDIT:", auditText.substring(0, 50) + "...");
        res.json({ audit: auditText });

    } catch (error) {
        console.error("CORE_CRASH:", error.message);
        res.status(500).json({ audit: `[CORE_CRASH]: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[W.E.E.D. PROTOCOL ONLINE]`);
});
