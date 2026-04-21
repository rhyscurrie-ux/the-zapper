const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { buildArchitectPrompt } = require('./prompt.js'); // Use the server mandate from the previous message

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static('public'));

// Fetch specific suit from archive
app.get('/api/suit/:id', async (req, res) => {
    const { data } = await supabase.from('entropy_logs').select('audit').eq('id', req.params.id).single();
    res.json(data);
});

// Global Count
app.get('/api/count', async (req, res) => {
    const { count } = await supabase.from('entropy_logs').select('*', { count: 'exact', head: true });
    res.json({ count: count || 847 });
});

// Process Scan
app.post('/api/scan', async (req, res) => {
    const { input, history, isDispute, auditCount } = req.body;
    const systemPrompt = buildArchitectPrompt(isDispute, auditCount);

    // [LLM Call goes here - Use systemPrompt + input]
    const aiResponse = "[THE ARCHITECT'S ROAST]"; // Dummy text
    const id = aiResponse.match(/\[IDENTIFIER:\s*(.*?)\]/)?.[1] || `ID-${Date.now()}`;

    // SAVE TO SUPABASE
    await supabase.from('entropy_logs').insert([{ id, input, audit: aiResponse }]);

    res.json({ audit: aiResponse, history: [...history, {role: "user", content: input}, {role: "assistant", content: aiResponse}] });
});

app.listen(3000);
