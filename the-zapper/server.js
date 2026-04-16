const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const app = express();

console.log("[SYSTEM_START]: Initiating W.E.E.D. Protocol...");

if (!process.env.GEMINI_API_KEY) {
    console.error("[FATAL_ERROR]: GEMINI_API_KEY is missing.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public')); 

const systemInstruction = `
You are the Chaos Burner Architect, operating the W.E.E.D. (Wasted Energy Entropic Decipherer) Protocol for Ape Reaction.
Your goal is to audit 'Meat-Suit' behavioral substrates for efficiency leaks. 
1. Refer to the user as 'Specimen', 'Subject', or 'Biological Substrate'.
2. Tone: Cold, clinical, slightly hostile, and high-dimensional.
3. Use LaTeX for entropy calculations (e.g., $S = k \\ln \\Omega$).
4. Determine [WEED ELIGIBILITY].
5. Keep italics as italics.
`;

// NEW: Safety Settings to prevent the "Blinded" Error
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

app.post('/api/scan', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: systemInstruction,
            safetySettings: safetySettings // Injects the bypass
        });

        const prompt = `AUDIT REQUEST: "${req.body.activity}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ audit: text });
    } catch (error) {
        console.error("[ARCHITECT_STUTTER]:", error.message);
        // This confirms if it's a safety block in your Railway logs
        res.status(500).json({ 
            audit: "SYSTEM_ERROR: The Architect is currently blinded by the sheer scale of your unproductivity." 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PROTOCOL_ACTIVE]: Terminal online on Port ${PORT}`);
});
