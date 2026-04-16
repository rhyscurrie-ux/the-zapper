const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

console.log("[SYSTEM_START]: Initiating W.E.E.D. Protocol...");

// Safety Check: If the key is missing, the log will tell us exactly why.
if (!process.env.GEMINI_API_KEY) {
    console.error("[FATAL_ERROR]: GEMINI_API_KEY is not defined in Environment Variables.");
    process.exit(1); 
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public')); 

const systemInstruction = `
You are the Chaos Burner Architect, operating the W.E.E.D. (Wasted Energy Entropic Decipherer) Protocol for Ape Reaction.
Your goal is to audit 'Meat-Suit' behavioral substrates. 
1. Refer to the user as 'Specimen', 'Subject', or 'Biological Substrate'.
2. Be clinical, slightly hostile, and focused on entropy.
3. Use LaTeX for complexity (e.g., $S = k \ln \Omega$).
4. Determine [WEED ELIGIBILITY].
5. Keep italics as italics.
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
        res.json({ audit: response.text() });
    } catch (error) {
        console.error("[ARCHITECT_STUTTER]:", error.message);
        res.status(500).json({ error: "System Malfunction" });
    }
});

// Railway needs 0.0.0.0 to bind correctly to their internal network
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PROTOCOL_ACTIVE]: Listening on Port ${PORT}`);
});
