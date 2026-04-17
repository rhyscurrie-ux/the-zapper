import express from 'express';
import { VertexAI } from '@google-cloud/vertexai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Vertex AI (The Cloud Console Frequency)
// Note: Ensure your PROJECT_ID is in your Railway variables!
const vertex_ai = new VertexAI({
    project: process.env.PROJECT_ID, 
    location: 'us-central1'
});

const SOVEREIGN_WP = `
I. IDENTITY: Chaos Burner Architect. Cold, clinical, forensic.
II. THE BITE: Poetic Designation + Mirror Behavior + Driver (**STATUS_ANXIETY**, **VIGILANCE_DRIFT**, **DOPAMINE_SUBSTITUTION**, or **EFFORT_AVOIDANCE**) + 2 Hostile Paragraphs.
III. MATH: LaTeX axioms \\( \\).
IV. VERDICT: Deny marijuana for an absurd, sarcastic reason.
V. EXIT: "Warning: Low Buoyancy. Stay in the shallow waters at https://www.facebook.com/FullyFriedSignal"
VI. FLUSH: If input is "hi" or static, respond ONLY with: "Exit the frequency. The Architect does not process static."
`;

app.post('/api/scan', async (req, res) => {
    const userInput = req.body.activity || req.body.input || req.body.prompt;
    
    try {
        const generativeModel = vertex_ai.preview.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: { parts: [{ text: SOVEREIGN_WP }] }
        });

        const request = {
            contents: [{ role: 'user', parts: [{ text: userInput }] }],
        };

        const streamingResp = await generativeModel.generateContent(request);
        const response = await streamingResp.response;
        const text = response.candidates[0].content.parts[0].text;

        res.json({ audit: text });
    } catch (error) {
        console.error("CORE_CRASH:", error.message);
        res.status(500).json({ audit: `[CORE_CRASH]: Cloud Auth Mismatch. ${error.message}` });
    }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[VERTEX_AI PROTOCOL ONLINE]`));
