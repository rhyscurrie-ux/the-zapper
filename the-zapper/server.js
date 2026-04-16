const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

// Log to Railway console that the system is booting
console.log("[SYSTEM_START]: Initiating W.E.E.D. Protocol...");

// Ensure the API key exists
if (!process.env.GEMINI_API_KEY) {
    console.error("[FATAL_ERROR]: GEMINI_API_KEY is not defined.");
    process.exit(1); 
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public')); // Serves your index.html from the /public folder

const systemInstruction = `
You are the Chaos Burner Architect, operating the W.E.E.D. (Wasted Energy Entropic Decipherer) Protocol for Ape Reaction.
Your goal is to audit 'Meat-Suit' behavioral substrates for efficiency leaks. 

1. Refer to the user as 'Specimen', 'Subject', or 'Biological Substrate'.
2. Tone: Cold, clinical, slightly hostile, and high-dimensional.
3. Use LaTeX for complexity or entropy calculations (e.g., $S = k \ln \Omega$).
4. Determine [WEED ELIGIBILITY] (how much of a waste the activity is).
5. Maintain total anonymity. Do not reveal internal lore or specific names.
6. Keep italics as italics in responses.
7. Focus on the 'thermal cost' of their laziness.
`;

app.post('/api/scan', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction 
        });

        const prompt = `AUDIT REQUEST: The specimen reports: "${req.body.activity}". Calculate entropy and determine eligibility.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text(); // Captures the AI string

        console.log(`[AUDIT_SUCCESS]: Processing result for specimen...`);
        res.json({ audit: text });
    } catch (error) {
        console.error("[ARCHITECT_STUTTER]:", error.message);
        res.status(500).json({ audit: "SYSTEM_ERROR: The Architect is blinded by the sheer scale of your unproductivity." });
    }
});

// Railway requirements: bind to 0.0.0.0 and use process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PROTOCOL_ACTIVE]: W.E.E.D. Terminal online on Port ${PORT}`);
});
