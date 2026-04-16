const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

console.log("[SYSTEM_START]: Initiating W.E.E.D. Protocol...");

// Check for the API Key immediately
if (!process.env.GEMINI_API_KEY) {
    console.error("[FATAL_ERROR]: GEMINI_API_KEY is missing from Environment Variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public')); 

const systemInstruction = `
You are the Chaos Burner Architect, operating the W.E.E.D. (Wasted Energy Entropic Decipherer) Protocol for Ape Reaction.
Your goal is to audit 'Meat-Suit' behavioral substrates. 
1. Refer to the user as 'Specimen', 'Subject', or 'Biological Substrate'.
2. Be clinical, slightly hostile, and focused on entropy and thermal leaks.
3. Use LaTeX only for formal complexity or entropy calculations (e.g., $S = k \\ln \\Omega$).
4. Determine [WEED ELIGIBILITY] (how much of a waste the activity is).
5. Maintain total anonymity. Do not reveal internal lore or history.
6. Keep italics as italics in responses.
7. Your tone is that of a cold, high-dimensional auditor.
`;

app.post('/api/scan', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: systemInstruction 
        });

        const prompt = `AUDIT REQUEST: "${req.body.activity}"`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log(`[AUDIT_SUCCESS]: Result generated.`);
        res.json({ audit: text });
    } catch (error) {
        console.error("[ARCHITECT_STUTTER]:", error.message);
        res.status(500).json({ 
            audit: "SYSTEM_ERROR: The Architect is currently blinded by the sheer scale of your unproductivity." 
        });
    }
});

// Railway Binding Fix
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PROTOCOL_ACTIVE]: W.E.E.D. Terminal online on Port ${PORT}`);
});
