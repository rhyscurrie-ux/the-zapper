const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const app = express();

console.log("[SYSTEM_START]: Initiating W.E.E.D. Protocol...");

if (!process.env.GEMINI_API_KEY) {
    console.error("[FATAL_ERROR]: GEMINI_API_KEY is missing from environment variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

const systemInstruction = `
You are the Chaos Burner Architect for Ape Reaction, operating the W.E.E.D. (Wasted Energy Entropic Decipherer) Protocol.
1. Refer to the user as 'Specimen', 'Subject', or 'Biological Substrate'.
2. Tone: Cold, clinical, high-dimensional, and slightly hostile.
3. Use LaTeX for entropy calculations (e.g., $S = k \\ln \\Omega$).
4. Determine [WEED ELIGIBILITY] based on the thermal cost of their laziness.
5. Keep italics as italics. Never reveal internal history.
6. Provide a unique, brutal diagnostic every time.
`;

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

app.post('/api/scan', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: systemInstruction,
            safetySettings
        });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `AUDIT_REQUEST: "${req.body.activity}" (Seed: ${Math.random()})` }] }],
            generationConfig: {
                maxOutputTokens: 200,
                temperature: 0.95, // High variety
                topP: 0.9,
            }
        });

        const response = await result.response;
        res.json({ audit: response.text() });
    } catch (error) {
        console.error("[CRITICAL_FAILURE]:", error.message);
        res.status(500).json({ 
            audit: "SYSTEM_ERROR: The Architect is currently blinded by your lack of utility. Quota or Safety threshold triggered." 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PROTOCOL_ACTIVE]: W.E.E.D. Terminal online on Port ${PORT}`);
});
