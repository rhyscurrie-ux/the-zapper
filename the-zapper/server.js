require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { buildArchitectPrompt } = require('./prompt.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(express.json());
app.use(express.static('public'));

// 1. Specimen Count with Verbose Error Logging
app.get('/api/count', async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('entropy_logs')
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.error("❌ SUPABASE COUNT ERROR:", error.message);
            return res.json({ count: 847, error: error.message });
        }
        
        console.log(`✅ Specimen Count Retreived: ${count}`);
        res.json({ count: count || 847 });
    } catch (e) {
        console.error("❌ CRITICAL SERVER ERROR (COUNT):", e.message);
        res.json({ count: 847 });
    }
});

// 2. Archive Retrieval
app.get('/api/suit/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('entropy_logs')
        .select('audit')
        .eq('id', req.params.id)
        .single();
    
    if (error || !data) {
        console.warn(`⚠️ Suit ID [${req.params.id}] not found in archive.`);
        return res.status(404).json({ error: "Log not found" });
    }
    res.json(data);
});

// 3. The Audit Engine with Verbose Insert Logging
app.post('/api/scan', async (req, res) => {
    const { input, history, isDispute, auditCount } = req.body;
    const systemPrompt = buildArchitectPrompt(isDispute, auditCount);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        let contents = history.map(h => ({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }]
        }));

        contents.push({ 
            role: "user", 
            parts: [{ text: `${systemPrompt}\n\nUSER_CONFESSION: ${input}` }] 
        });

        const result = await model.generateContent({ contents });
        const aiResponse = result.response.text();

        // Identifier Extraction
        const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(.*?)\]/);
        const suitId = idMatch ? idMatch[1].trim().replace(/\s+/g, '-') : `ID-${Date.now()}`;

        console.log(`🚀 AI Response Generated. Attempting to archive Suit: ${suitId}`);

        // VERBOSE INSERT
        const { error: dbError } = await supabase
            .from('entropy_logs')
            .insert([{ id: suitId, input: input, audit: aiResponse }]);

        if (dbError) {
            console.error("❌ SUPABASE INSERT FAILURE:", dbError.message);
            console.error("Payload Attempted:", { id: suitId, input_length: input.length });
        } else {
            console.log(`✅ Archive Success: Suit ${suitId} stored.`);
        }

        res.json({ 
            audit: aiResponse, 
            history: [...history, { role: "user", content: input }, { role: "assistant", content: aiResponse }] 
        });

    } catch (err) {
        console.error("❌ ARCHITECT BRAIN FAILURE:", err.message);
        res.status(500).json({ error: "The Architect's signal is fluctuating. Check logs." });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Martis Terminal Online: Port ${PORT}`);
});
