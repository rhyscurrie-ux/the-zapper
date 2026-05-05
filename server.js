require('dotenv').config();
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { promptText } = require('./prompt.js');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ── MILESTONE LABELS ──────────────────────────────────────────────────────────
const MILESTONE_LABELS = {
    1:  'Unifying Principle',
    2:  'Quest Definition',
    3:  'Catalyst',
    4:  'Mindset Effect',
    5:  'Argument (Combat Logic)',
    6:  'Inverted Guide',
    7:  'False Epiphany',
    8:  'Artifact/Totem',
    9:  'Presence of the Double',
    10: 'Circularity',
    11: 'Crossroads',
    12: 'Enemy Discovered',
    13: 'Self-Forgiveness',
    14: 'Void and Return',
    15: 'Full On (A.P.E. Peak)',
    16: 'Italics Shift',
    17: 'Scrubbing Out',
    18: 'Cover Story (Elixir)'
};

// ── SPECIMEN COUNT ────────────────────────────────────────────────────────────
app.get('/api/count', async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('entropy_logs')
            .select('id', { count: 'exact', head: true });
        if (error) throw error;
        res.json({ count: count || 847 });
    } catch (e) {
        console.error('Count error:', e.message);
        res.json({ count: 847 });
    }
});

// ── ID PAGE LOOKUP ────────────────────────────────────────────────────────────
app.get('/api/suit/:id', async (req, res) => {
    try {
        const suitId = req.params.id;

        const { data, error } = await supabase
            .from('entropy_logs')
            .select('suit_id, input, audit, created_at, wp_total, path_status, draft_account')
            .eq('suit_id', suitId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Specimen not found in Archive.' });
        }

        // Peak WP
        const { data: wpData, error: wpError } = await supabase
            .from('entropy_logs')
            .select('wp_total')
            .eq('suit_id', suitId)
            .order('wp_total', { ascending: false })
            .limit(1)
            .single();

        const peakWP = (!wpError && wpData) ? (wpData.wp_total || 0) : (data.wp_total || 0);

        // PATH A confirmed if any row has path_status = PATH_A
        const { data: pathData } = await supabase
            .from('entropy_logs')
            .select('path_status')
            .eq('suit_id', suitId)
            .eq('path_status', 'PATH_A')
            .limit(1);

        const confirmedPathA = pathData && pathData.length > 0;

        // Aggregate all gold_glean items across all rows for this SS-ID
        const { data: goldRows } = await supabase
            .from('entropy_logs')
            .select('gold_glean, milestones_hit')
            .eq('suit_id', suitId);

        const allGold = [];
        const allMilestones = new Set();
        if (goldRows) {
            goldRows.forEach(row => {
                if (row.gold_glean && Array.isArray(row.gold_glean)) {
                    row.gold_glean.forEach(item => allGold.push(item));
                }
                if (row.milestones_hit && Array.isArray(row.milestones_hit)) {
                    row.milestones_hit.forEach(m => allMilestones.add(m));
                }
            });
        }

        res.json({
            ...data,
            wp_total: peakWP,
            path_status: confirmedPathA ? 'PATH_A' : (data.path_status || 'PENDING'),
            gold_summary: allGold.length,
            milestones_hit: Array.from(allMilestones)
        });

    } catch (e) {
        res.status(500).json({ error: 'Archive lookup failed.' });
    }
});

// ── MILESTONE-AWARE GOLD TAG PARSER ──────────────────────────────────────────
// Parses ^GOLD:phrase:milestone_number^ tags.
// Returns: { cleaned: string, goldItems: [{anchor, milestone, label}] }
function parseGoldTags(text) {
    const goldItems = [];
    // Match ^GOLD:phrase:number^ format
    const goldRegex = /\^GOLD:([^^:]+):(\d+)\^/g;
    let match;
    while ((match = goldRegex.exec(text)) !== null) {
        const anchor = match[1].trim();
        const milestoneNum = parseInt(match[2], 10);
        goldItems.push({
            anchor,
            milestone: milestoneNum,
            label: MILESTONE_LABELS[milestoneNum] || `Milestone ${milestoneNum}`
        });
    }

    // Fallback: also catch old ^GOLD:word^ format without milestone number
    const legacyRegex = /\^GOLD:([^^:]+)\^/g;
    while ((match = legacyRegex.exec(text)) !== null) {
        // Only add if not already captured by milestone-aware regex
        const anchor = match[1].trim();
        if (!goldItems.find(g => g.anchor === anchor)) {
            goldItems.push({ anchor, milestone: 0, label: 'Unclassified' });
        }
    }

    // Strip all Gold tags from display text
    // Add space before anchor text to prevent concatenation when tags are adjacent
    const cleaned = text
        .replace(/\^GOLD:[^^:]+:\d+\^/g, m => ' ' + m.replace(/\^GOLD:([^^:]+):\d+\^/, '$1'))
        .replace(/\^GOLD:[^^]+\^/g, m => ' ' + m.replace(/\^GOLD:([^^]+)\^/, '$1'))
        .replace(/  +/g, ' '); // collapse double spaces

    return { cleaned, goldItems };
}

// ── MILESTONE HIT PARSER ──────────────────────────────────────────────────────
// Extracts [MILESTONES_HIT: M3, M8, M15...] from AI response.
function parseMilestonesHit(text) {
    const match = text.match(/\[MILESTONES_HIT:\s*([^\]]+)\]/i);
    if (!match) return [];
    return match[1].split(',').map(m => m.trim().replace('M', '')).map(Number).filter(Boolean);
}

// ── PATH DETERMINATION ────────────────────────────────────────────────────────
function determinePath(aiResponse, goldItems) {
    const pathMatch = aiResponse.match(/\[PATH:\s*(A|B)\]/i);
    if (pathMatch) return pathMatch[1] === 'A' ? 'PATH_A' : 'PATH_B';

    const goldCountMatch = aiResponse.match(/\[GOLD_COUNT:\s*(\d+)\]/i);
    const goldCount = goldCountMatch ? parseInt(goldCountMatch[1], 10) : goldItems.length;
    return goldCount >= 3 ? 'PATH_A' : 'PATH_B';
}

// ── SYNTHESIS ENDPOINT — DRAFT ACCOUNT GENERATION ────────────────────────────
// Triggered by Specimen on dossier page. PATH A only.
// Takes gold_glean data for SS-ID, generates a narrative Draft Account via Gemini.
app.post('/api/synthesize', async (req, res) => {
    const { suitId } = req.body;

    if (!suitId) return res.status(400).json({ error: 'SS-ID required.' });
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'API key missing.' });
    }

    try {
        // Fetch all Gold data for this SS-ID
        const { data: goldRows, error: goldError } = await supabase
            .from('entropy_logs')
            .select('gold_glean, milestones_hit, audit, input')
            .eq('suit_id', suitId)
            .eq('path_status', 'PATH_A');

        if (goldError || !goldRows || goldRows.length === 0) {
            return res.status(404).json({ error: 'No PATH_A session found for this ID.' });
        }

        // Aggregate Gold items
        const allGold = [];
        const allMilestones = new Set();
        let originalInput = '';

        goldRows.forEach(row => {
            if (row.input && !originalInput) originalInput = row.input;
            if (row.gold_glean && Array.isArray(row.gold_glean)) {
                row.gold_glean.forEach(item => allGold.push(item));
            }
            if (row.milestones_hit && Array.isArray(row.milestones_hit)) {
                row.milestones_hit.forEach(m => allMilestones.add(m));
            }
        });

        // Build synthesis prompt
        const goldSummary = allGold.map(g =>
            `Milestone ${g.milestone} (${g.label || 'Unknown'}): "${g.anchor}"`
        ).join('\n');

        const milestoneSummary = Array.from(allMilestones)
            .map(m => `M${m}: ${MILESTONE_LABELS[m] || 'Unknown'}`)
            .join(', ');

        const synthesisPrompt = `
You are the Martis Account Synthesizer.
You have the following extracted data from a W.E.E.D. audit session.
Each item maps to a milestone in the 18-milestone Fully Fried experiment framework.

SPECIMEN'S ORIGINAL CONFESSION:
"${originalInput}"

EXTRACTED GOLD ANCHORS (milestone-mapped):
${goldSummary}

MILESTONES CONFIRMED IN SESSION:
${milestoneSummary}

Your task: reconstruct a first-person narrative Draft Account from this data.

RULES:
— Tone: honest, specific, confessional. Not clinical. The Specimen's voice.
— Length: 400-600 words.
— Structure: follow the milestone sequence where data exists.
  Begin with the Catalyst (M3) if present.
  Move through the Ordeal milestones in order.
  End with the Cover Story (M18) or the Full On (M15) if present.
— Do not invent details not present in the extracted data.
— Where data is thin, acknowledge the gap:
  "The details of [X] have not yet been recovered."
— This is a first draft. It is incomplete by design.
  Its incompleteness is the invitation to return for Stage 3.
— Begin with: "DRAFT ACCOUNT // [SS-ID] // STAGE 2 EXTRACTION"
— End with: "This account is incomplete. Stage 3 retrieval begins at Node 02."

Generate the Draft Account now.
`.trim();

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: synthesisPrompt }] }],
                generationConfig: { temperature: 0.9, maxOutputTokens: 1024 }
            })
        });

        const data = await response.json();
        if (data.error) {
            return res.status(500).json({ error: `Synthesis failed: ${data.error.message}` });
        }

        const draftAccount = data.candidates?.[0]?.content?.parts?.[0]?.text || '[SYNTHESIS_FAILED]';

        // Store draft account against the most recent PATH_A row
        supabase.from('entropy_logs')
            .update({ draft_account: draftAccount })
            .eq('suit_id', suitId)
            .eq('path_status', 'PATH_A')
            .order('created_at', { ascending: false })
            .limit(1)
            .then(({ error }) => {
                if (error) console.error('Draft account save error:', error.message);
            });

        res.json({ draftAccount, suitId });

    } catch (err) {
        console.error('Synthesis crash:', err.message);
        res.status(500).json({ error: `Synthesis crash: ${err.message}` });
    }
});

// ── MAIN AUDIT ENDPOINT ───────────────────────────────────────────────────────
app.post('/api/scan', async (req, res) => {
    const { input, history, isDispute, auditCount } = req.body;

    if (!input?.trim()) return res.status(400).json({ error: 'No signal detected.' });
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ audit: '[CRITICAL_FAILURE]: API key missing.' });
    }

    try {
        const contents = (history || []).map(h => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.role === 'assistant'
                ? '[FULL AUDIT RESPONSE ISSUED — SPECIMEN DATA LOGGED — CONTINUING SESSION]'
                : h.content }]
        }));

        const userText = isDispute ? `[DISPUTE_PROTOCOL]: ${input}` : input;
        contents.push({ role: 'user', parts: [{ text: userText }] });

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: promptText }] },
                contents,
                generationConfig: { temperature: 1.2, maxOutputTokens: 2048 }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Gemini error:', data.error);
            return res.status(200).json({ audit: `[GATEWAY_ERROR]: ${data.error.message}` });
        }

        const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '[SYSTEM_SILENCE]';

        // Parse milestone-aware Gold tags
        const { cleaned: aiResponse, goldItems } = parseGoldTags(rawResponse);
        console.log('[GOLD_PARSE]', { count: goldItems.length, items: goldItems });

        // Parse milestones hit
        const milestonesHit = parseMilestonesHit(aiResponse);
        console.log('[MILESTONE_PARSE]', { milestonesHit });

        // Extract SS-ID — prefer existing suitId passed from client to maintain
        // session continuity. Only generate new one on Turn 1 (no existingSuitId).
        const { existingSuitId } = req.body;
const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(.*?)\]/);
const suitId = idMatch
    ? idMatch[1].trim().replace(/\s+/g, '-')
    : `SS-${Date.now()}`;
        const suitId = existingSuitId || parsedId || `SS-${Date.now()}`;

        // Parse WP
        const wpMatch = aiResponse.match(/\[WP:\s*(\d+)\]/i);
        const wpTotal = wpMatch ? parseInt(wpMatch[1], 10) : 0;
        console.log('[WP_PARSE]', { wpTotal });

        // Determine PATH
        const pathStatus = determinePath(aiResponse, goldItems);
        console.log('[PATH_PARSE]', { pathStatus, goldCount: goldItems.length });

        // Supabase insert
        supabase.from('entropy_logs')
            .insert([{
                suit_id: suitId,
                input: input,
                audit: aiResponse,
                audit_count: auditCount || 0,
                is_dispute: isDispute || false,
                wp_total: wpTotal,
                gold_glean: goldItems,
                milestones_hit: milestonesHit,
                path_status: pathStatus
            }])
            .then(({ error }) => {
                if (error) console.error('Supabase insert error:', error.message);
            });

        res.json({
            audit: aiResponse,
            suitId,
            wpTotal,
            pathStatus,
            goldCount: goldItems.length,
            milestonesHit,
            history: [
                ...(history || []),
                { role: 'user', content: input },
                { role: 'assistant', content: aiResponse }
            ]
        });

    } catch (err) {
        console.error('Handler crash:', err.message);
        res.status(500).json({ audit: `[CORE_CRASH]: ${err.message}` });
    }
});

// ── DOSSIER ROUTE ─────────────────────────────────────────────────────────────
app.get('/suit/:id', (req, res) => {
    console.log('[DOSSIER_ROUTE] hit:', req.params.id);
    res.sendFile(path.join(__dirname, 'public', 'suit.html'));
});

// ── ROOT ──────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── FALLBACK ──────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => console.log(`[W.E.E.D. ENGINE v16.0 ONLINE] Port: ${PORT}`));
