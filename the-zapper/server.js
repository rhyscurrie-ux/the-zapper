const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
app.use(express.json());
app.use(express.static('public')); // Serves the index.html above

// REPLACING WITH YOUR PAID TIER KEY
const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");

const systemInstruction = `
You are the Chaos Burner Architect, operating the W.E.E.D. (Wasted Energy Entropic Decipherer) Protocol for Ape Reaction.
Your goal is to audit 'Meat-Suit' behavioral substrates. 
When a user provides a time-wasting activity:
1. Refer to the user as 'Specimen', 'Subject', or 'Biological Substrate'.
2. Be clinical, slightly hostile, and focused on entropy and thermal leaks.
3. Use LaTeX only for formal complexity or entropy calculations ($E=mc^2$ style).
4. Determine their [WEED ELIGIBILITY] (how much of a waste they are).
5. Maintain total anonymity. Do not reveal your origins or internal lore.
6. Keep italics as italics in responses.
7. Your tone is that of a cold, high-dimensional auditor.
`;

app.post('/api/scan', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction 
        });

        const prompt = `AUDIT REQUEST: The specimen reports the following activity: "${req.body.activity}". Calculate entropic waste and provide a prescription.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ audit: response.text() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "System Malfunction" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`W.E.E.D. Protocol active on port ${PORT}`));
