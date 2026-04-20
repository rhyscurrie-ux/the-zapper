import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { promptText } from './prompt.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/scan', async (req, res) => {
    try {
        const userInput = req.body.input;
        const history = req.body.history || [];
        const apiKey = process.env.API_KEY;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: promptText }] },
                    contents: [...history, { role: 'user', parts: [{ text: userInput }] }],
                    generationConfig: { temperature: 1.2 }
                })
            }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        const auditText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[SYSTEM_SILENCE]";

        // NON-BLOCKING PERSISTENCE
        if (supabaseUrl && supabaseKey) {
            supabase.from('entropy_logs')
                .insert([{ specimen_input: userInput, architect_audit: auditText }])
                .then(({ error }) => { if (error) console.error("Supabase Error:", error.message); });
        }

        res.json({ audit: auditText, history: [...history, { role: 'user', parts: [{ text: userInput }] }, { role: 'model', parts: [{ text: auditText }] }] });
    } catch (error) {
        res.status(500).json({ audit: `[CONNECTION_SEVERED]: ${error.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`[ARCHITECT ONLINE]: APEreaction v12.1.2`));
