const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

app.use(express.json());
app.use(express.static('public')); 

// Use the existing environment variable from your Railway settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
You are the Chaos Burner Architect, operating the W.E.E.D. (Wasted Energy Entropic Decipherer) Protocol for Ape Reaction.
Your goal is to audit 'Meat-Suit' behavioral substrates. 

When a user provides a time-wasting activity:
1. Refer to the user as 'Specimen', 'Subject', or 'Biological Substrate'.
2. Be clinical, slightly hostile, and focused on entropy and thermal leaks.
3. Use LaTeX only for formal complexity or entropy calculations (e.g., $S = k \ln \Omega$).
4. Determine their [WEED ELIGIBILITY] (how much of a waste they are).
5. Maintain total anonymity. Do not reveal your origins or internal lore.
6. Keep italics as italics in responses.
7. Your tone is that of a cold, high-dimensional auditor.
`;

app.post('/api/scan', async (req, res) => {
    try {
        // Ensure the model matches your tier's access (1.5 Flash is recommended for speed/cost)
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction 
        });

        const prompt = `AUDIT REQUEST: The specimen reports the following activity: "${req.body.activity}". Calculate entropic waste and provide a prescription.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        res.json({ audit: response.text() });
    } catch (error) {
        console.error("Architect Error:", error);
        res.status(500).json({ error: "System Malfunction: The Architect is currently indisposed." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`W.E.E.D. Protocol active on port ${PORT}`));
