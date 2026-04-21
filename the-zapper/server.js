require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { buildArchitectPrompt } = require('./prompt.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// --- CONNECTION LOGGING ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing from Railway Variables!");
} else {
    console.log("✅ GEMINI_API_KEY detected. Starting handshake...");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

app.use(express.json());
app.use(express.static('public'));

// Fetch global specimen count
app.get('/api/count', async (req, res) => {
    try {
        const { count } = await supabase.from('entropy_logs').select('*', { count: 'exact', head: true });
        res.json({ count: count || 847 });
    } catch (e) { res.json({ count: 847 }); }
});

// Retrieve archived suit
app.get('/api/suit/:id', async (req, res) => {
    const { data, error } = await supabase.from('entropy_logs').select('audit').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: "Log not found" });
    res.json(data);
});

// The Core Audit Engine
app.post('/api/scan', async (req, res) => {
    const { input, history, isDispute, auditCount } = req.body;
    const systemPrompt = buildArchitectPrompt(isDispute, auditCount);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Format history for Gemini
        const contents = history.map(h => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }]
        }));

        contents.push({ 
            role: "user", 
            parts: [{ text: `${systemPrompt}\n\nUSER_INPUT: ${input}` }] 
        });

        const result = await model.generateContent({ contents });
        const aiResponse = result.response.text();

        // Extract ID
        const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(.*?)\]/);
        const suitId = idMatch ? idMatch[1].trim().replace(/\s+/g, '-') : `ID-${Date.now()}`;

        // Save to Database
        await supabase.from('entropy_logs').insert([{ 
            id: suitId, 
            input: input, 
            audit: aiResponse 
        }]);

        res.json({ 
            audit: aiResponse, 
            history: [...history, { role: "user", content: input }, { role: "assistant", content: aiResponse }] 
        });

    } catch (err) {
        console.error("Gemini Brain Failure:", err);
        res.status(500).json({ error: "The Architect is indisposed. Check server logs." });
    }
});

// Railway dynamic PORT binding
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Martis Terminal Online: Port ${PORT}`);
});
