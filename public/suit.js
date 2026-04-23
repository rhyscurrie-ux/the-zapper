// suit.js — Specimen Dossier Page Logic
// Reads SS-ID from URL, fetches from /api/suit/:id, populates dossier, handles transcript request

// ── HOSTILE DELAY MESSAGES ────────────────────────────────────────────────────
const delayMessages = [
    '[IDENTIFYING_VULNERABILITIES...]',
    '[SCANNING_FOR_DECEPTION...]',
    '[CROSS-REFERENCING_ARCHIVE...]',
    '[VERIFYING_SUBSTRATE_INTEGRITY...]',
    '[CALCULATING_D_LABOR_DEFICIT...]',
    '[CHECKING_FOR_FALSE_EPIPHANY_PATTERNS...]',
    '[ASSESSING_RISK_OF_PREMATURE_DISCLOSURE...]',
    '[THERMAL_LOAD_ANALYSIS_IN_PROGRESS...]'
];

// ── PARSE SS-ID FROM URL ──────────────────────────────────────────────────────
function getSuitIdFromUrl() {
    // Supports both /SS-1234 and /?id=SS-1234
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    if (segments.length > 0) return segments[segments.length - 1];

    const params = new URLSearchParams(window.location.search);
    return params.get('id') || null;
}

// ── PARSE AUDIT TEXT FOR METADATA ────────────────────────────────────────────
function parseThermal(audit) {
    const match = audit.match(/\[THERMAL_STATUS:\s*([\w_\/]+)\]/i);
    return match ? match[1].trim() : '—';
}

function parseRating(audit) {
    const match = audit.match(/\[LIFE-RAFT RATING\]:\s*\(?(\d+(?:\.\d+)?\/10)\)?/i);
    return match ? match[1] : '—';
}

function parseAuditExcerpt(audit) {
    // Return DECIPHERED_WASTE section only — up to 600 chars
    const match = audit.match(/\[DECIPHERED_WASTE\]:\s*([\s\S]*?)(?:\[FORENSIC_AXIOM|\[THE WEED|$)/i);
    if (match) {
        return match[1].trim().substring(0, 600) + (match[1].length > 600 ? '...' : '');
    }
    // Fallback: first 600 chars of audit
    return audit.substring(0, 600) + (audit.length > 600 ? '...' : '');
}

function formatDate(isoString) {
    if (!isoString) return '—';
    try {
        return new Date(isoString).toLocaleDateString('en-NZ', {
            year: 'numeric', month: 'short', day: 'numeric'
        }).toUpperCase();
    } catch {
        return '—';
    }
}

// ── POPULATE DOSSIER ──────────────────────────────────────────────────────────
function populateDossier(data, suitId) {
    document.getElementById('display-id').innerText = data.suit_id || suitId;
    document.getElementById('display-thermal').innerText = parseThermal(data.audit || '');
    document.getElementById('display-rating').innerText = parseRating(data.audit || '');
    document.getElementById('display-date').innerText = formatDate(data.created_at);
    document.getElementById('display-input').innerText = data.input
        ? `"${data.input}"`
        : '[INPUT REDACTED]';
    document.getElementById('display-audit').innerText = data.audit
        ? parseAuditExcerpt(data.audit)
        : '[AUDIT REDACTED]';

    // Update page title
    document.title = `APEreaction // ${data.suit_id || suitId}`;
}

// ── HOSTILE DELAY TRANSCRIPT REQUEST ─────────────────────────────────────────
function initTranscriptRequest() {
    const requestBtn  = document.getElementById('request-btn');
    const step1       = document.getElementById('request-step-1');
    const step2       = document.getElementById('request-step-2');
    const step3       = document.getElementById('request-step-3');
    const delayMsg    = document.getElementById('delay-msg');

    requestBtn.addEventListener('click', () => {
        // Step 1 → Step 2: show hostile delay
        step1.classList.add('hidden');
        step2.classList.remove('hidden');

        // Cycle through hostile messages
        let msgIndex = 0;
        const msgInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % delayMessages.length;
            delayMsg.innerText = delayMessages[msgIndex];
        }, 600);

        // After 4–6 seconds, reveal the download
        const delay = 4000 + Math.random() * 2000;
        setTimeout(() => {
            clearInterval(msgInterval);
            step2.classList.add('hidden');
            step3.classList.remove('hidden');
        }, delay);
    });
}

// ── NODE 02 UNLOCK LOGIC ─────────────────────────────────────────────────────
// wpTotal is read from the database response — persistent across sessions
function initNode02(suitId, wpTotal) {
    const node02Section = document.getElementById('node02-section');
    const placeholderBtn = node02Section.querySelector('.disabled-btn');

    // Unlock if database confirms WP >= 100
    if (wpTotal >= 100) {
        // Replace the greyed-out placeholder with the live unlock
        placeholderBtn.style.display = 'none';

        const unlockBlock = document.createElement('div');
        unlockBlock.innerHTML = `
            <p class="reveal-warning" style="margin-bottom:14px;">
                ARCHITECT'S NOTE: The Initializer is the frequency.
                If your internal processor is too weak to decipher the logic,
                feed this schematic to your local LLM.
                Force your own machine to audit you before you arrive at Node 02.
                The Barfly will know if you haven't done the labor.
            </p>
            <a href="Account_Architect_AI_Initializer.pdf" target="_blank" class="action-btn reveal-link" style="margin-bottom:10px; display:block;">
                [ SYSTEM_INITIALIZER_DECRYPTED: STUDY_THE_INSTRUMENT ]
            </a>
            <p class="redaction-note">
                Deploy this into your own AI systems before arriving at Node 02.
                Open ChatGPT, Claude, or Gemini. Paste the entire document as your first message.
                Instruct your machine to audit you using its directives.
                The Barfly's session will begin where your preparation ends.
            </p>
        `;
        node02Section.appendChild(unlockBlock);
    }
}

// ── MAIN INIT ─────────────────────────────────────────────────────────────────
async function init() {
    const suitId = getSuitIdFromUrl();

    const loadingState  = document.getElementById('loading-state');
    const errorState    = document.getElementById('error-state');
    const errorMsg      = document.getElementById('error-msg');
    const dossierContent = document.getElementById('dossier-content');

    if (!suitId) {
        loadingState.classList.add('hidden');
        errorMsg.innerText = '[NO_IDENTIFIER]: Navigate to APEreaction.com/[YOUR-SS-ID] to access your dossier.';
        errorState.classList.remove('hidden');
        return;
    }

    try {
        const res = await fetch(`/api/suit/${encodeURIComponent(suitId)}`);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        if (data.error) {
            throw new Error(data.error);
        }

        loadingState.classList.add('hidden');
        populateDossier(data, suitId);
        initTranscriptRequest();
        initNode02(suitId, data.wp_total || 0);
        dossierContent.classList.remove('hidden');

    } catch (err) {
        loadingState.classList.add('hidden');
        errorMsg.innerText = `[ARCHIVE_FAILURE]: Specimen ${suitId} not found. The record may not yet exist or the ID is invalid.`;
        errorState.classList.remove('hidden');
        console.error('Dossier load error:', err.message);
    }
}

document.addEventListener('DOMContentLoaded', init);
