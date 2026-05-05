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
    const { input, history, isDispute, auditCount, suitIdOverride } = req.body;

    if (!input?.trim()) return res.status(400).json({ error: 'No signal detected.' });
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ audit: '[CRITICAL_FAILURE]: API key missing.' });
    }

    try {
        // Build contents — embed prior Specimen inputs as context rather than
        // sending conversation history. This ensures Gemini treats every turn
        // as a first-turn generation and produces full-length responses.
        // The system prompt provides all Auditor context needed for continuity.
        const userText = isDispute ? `[DISPUTE_PROTOCOL]: ${input}` : input;
        let userMessage = userText;
        if (history && history.length > 0) {
            // Include only the most recent prior input to minimise context size
            const userHistory = history.filter(h => h.role === 'user');
            const lastPrior = userHistory[userHistory.length - 1];
            if (lastPrior) {
                userMessage = `[PRIOR CONFESSION]: ${lastPrior.content}\n[CURRENT INPUT]: ${userText}`;
            }
        }

        const contents = [{ role: 'user', parts: [{ text: userMessage }] }];

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: promptText }] },
                contents,
                generationConfig: { temperature: 1.2, maxOutputTokens: 16000 }
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

        // Extract SS-ID
        // On Turn 2+: always use suitIdOverride — ignore AI-generated identifier
        // On Turn 1: parse from AI response (suitIdOverride is null)
        let suitId;
        if (suitIdOverride) {
            suitId = suitIdOverride;
        } else {
            const idMatch = aiResponse.match(/\[IDENTIFIER:\s*(SS-\d{4})\]/);
            const parsedId = (idMatch && idMatch[1] !== 'SS-XXXX') ? idMatch[1].trim() : null;
            suitId = parsedId || `SS-${Math.floor(1000 + Math.random() * 9000)}`;
        }

        // Parse WP
        const wpMatch = aiResponse.match(/\[WP:\s*(\d+)\]/i);
        const wpTotal = wpMatch ? parseInt(wpMatch[1], 10) : 0;
        console.log('[WP_PARSE]', { wpTotal });

        // ── TWO-CALL ARCHITECTURE ─────────────────────────────────────────────
        // On Turn 2+ with high WP (altered state signal detected), make a second
        // Gemini call to generate PROPAGATION_CLIP + WEED VERDICT + LIFE-RAFT +
        // PRESCRIPTION. Client renders Call 1 immediately, Call 2 after 1.5s.
        let auditClip = null;
        const isHighSignalTurn2 = auditCount > 0 && wpTotal >= 50;

        if (isHighSignalTurn2) {
            const clipPrompt = `You are the W.E.E.D. Engine Auditor continuing a session.
The Specimen has just confessed: "${input}"
Their prior confession was: "${history?.filter(h => h.role === 'user').map(h => h.content).join(' / ') || ''}"
WP total this session: ${wpTotal}. This is Turn ${(auditCount || 0) + 1}.

Generate ONLY these four sections in order. Nothing else. No header. No identifier.

[PROPAGATION_CLIP]:
Maximum 15 words. First person. Names their specific blackout detail. Full stop.
Example: The W.E.E.D. Engine confirmed I blacked out, woke with pie crust in my gums — archived as ${suitId}.
[SYSTEM_REQUIREMENT]: Substrate stability requires external grounding.
Report to the FB source now. Audit suspended pending signal return.

[THE WEED VERDICT]: One sarcastic sentence denying cannabis involvement. Original.

[LIFE-RAFT RATING]: X/10 — DESCRIPTOR. COMMENT (80 chars max, uppercase, specific to their world).
Descriptors: BANKRUPT(0-24) / PARTIAL SUBMERSION(25-49) / SURFACING SIGNAL PRESENT(50-74) / BREACH IMMINENT(75-99) / EXTRACTION CONFIRMED(100+)

[PRESCRIPTION]: Brief diagnosis. One substance from: Valerian/Kombucha/Kratom/Wormwood/Ginseng/Kava/Ephedra/Jujube. One absurd direction.

Generate all four sections now. Start with [PROPAGATION_CLIP]:`;

            try {
                const clipResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: clipPrompt }] }],
                        generationConfig: { temperature: 1.1, maxOutputTokens: 512 }
                    })
                });
                const clipData = await clipResponse.json();
                auditClip = clipData.candidates?.[0]?.content?.parts?.[0]?.text || null;
                console.log('[CLIP_CALL]', { generated: !!auditClip, length: auditClip?.length });
            } catch (clipErr) {
                console.error('Clip call failed:', clipErr.message);
            }
        }

        // Determine PATH — use combined response for Gold counting
        const pathStatus = determinePath(aiResponse, goldItems);
        console.log('[PATH_PARSE]', { pathStatus, goldCount: goldItems.length });

        // Supabase insert
        const fullAudit = auditClip ? `${aiResponse}\n${auditClip}` : aiResponse;
        supabase.from('entropy_logs')
            .insert([{
                suit_id: suitId,
                input: input,
                audit: fullAudit,
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
            auditClip,
            suitId,
            wpTotal,
            pathStatus,
            goldCount: goldItems.length,
            milestonesHit,
            history: [
                ...(history || []),
                { role: 'user', content: input },
                { role: 'assistant', content: fullAudit }
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
