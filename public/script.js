// script.js — APEreaction v15.0 // W.E.E.D. ENGINE DUAL-STATE

let chatHistory = [];
let auditCount = 0;
let lastInput = "";
let currentSuitId = "";
let isDisabled = false;
let currentWP = 0;
let currentPathStatus = 'PENDING';

// ── ARCHITECT IDs — ZERO-LATENCY RENDERING ────────────────────────────────────
// These IDs bypass all theatrical delays for Architect use.
const ARCHITECT_IDS = ['SS-0000', 'SS-1111'];

function isArchitectSession() {
    return ARCHITECT_IDS.includes(currentSuitId);
}

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const input           = document.getElementById('user-input');
const output          = document.getElementById('audit-output');
const submitBtn       = document.getElementById('submit-btn');
const tickerText      = document.getElementById('ticker-text');
const inputSection    = document.getElementById('input-section');
const decisionBox     = document.getElementById('decision-box');
const skinDisplay     = document.getElementById('skin-suit-display');
const rewardContainer = document.getElementById('reward-container');
const specimenCount   = document.getElementById('specimen-count');

// ── SPECIMEN COUNT ────────────────────────────────────────────────────────────
async function loadCount() {
    try {
        const res = await fetch('/api/count');
        const data = await res.json();
        specimenCount.innerText = `[ ${data.count} SPECIMENS PROCESSED ]`;
    } catch {
        specimenCount.innerText = '[ ARCHIVE ONLINE ]';
    }
}
loadCount();

// ── TICKER ENGINE — CP v2.8 HIGH-HEAT SAMPLES ─────────────────────────────────
const samples = [
    '"I spent four hours yesterday scrolling through people I don\'t like, living lives I don\'t want."',
    '"I have spent 15 years \'waiting for the right time\' to start the only project that matters."',
    '"I measure my worth in notifications from an algorithm that doesn\'t know my name."',
    '"I have 42 \'saved\' videos on how to be productive, yet I haven\'t produced anything in months."',
    '"My social mask is so thick I\'ve forgotten which side of the glass I\'m standing on."',
    '"I\'m just a biological placeholder for a version of myself that never arrived."'
];

let sampleIndex = 0;
let tickerInterval = setInterval(() => {
    tickerText.classList.add('fade-out');
    setTimeout(() => {
        sampleIndex = (sampleIndex + 1) % samples.length;
        tickerText.innerText = samples[sampleIndex];
        tickerText.classList.remove('fade-out');
    }, 600);
}, 4000);

// ── ELASTIC VOID ──────────────────────────────────────────────────────────────
input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// ── DIRECTIVE EXPANSION ───────────────────────────────────────────────────────
document.querySelectorAll('.reward-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        if (e.target.classList.contains('proceed-link')) return;
        const info = this.querySelector('.directive-info');
        if (info) {
            document.querySelectorAll('.directive-info').forEach(d => d.classList.remove('expanded'));
            info.classList.toggle('expanded');
        }
    });
});

// ── SHARE / DIRECTIVE 00 ──────────────────────────────────────────────────────
document.getElementById('invite-btn').addEventListener('click', async () => {
    const id = skinDisplay.innerText || 'UNKNOWN_SPECIMEN';
    const shareData = {
        title: 'MARTIS PROGRAM // PROXIMITY AUDIT',
        text: `I failed my W.E.E.D. audit at APEreaction.com. I have been identified as ${id}. I am sending you this to reverse my ENTROPIC SPIRALLING and offload some shame. The Architect is waiting for you.`,
        url: 'https://apereaction.com'
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            alert('[INVITATION_COPIED_TO_CLIPBOARD]');
        }
    } catch (err) {
        console.log('Share failed:', err);
    }
});

// ── DECISION BOX — PATH A / PATH B ───────────────────────────────────────────
// PATH A: Gold confirmed — Node 02 accessible via dossier
// PATH B: Conscript — Node 02 locked, Hub only
function renderDecisionBox(suitId, pathStatus) {
    const isPathA = pathStatus === 'PATH_A';

    decisionBox.innerHTML = `
        <p class="decision-header">
            RECORD PERSISTED TO ARCHIVE &nbsp;//&nbsp;
            <span style="color:#fff; font-weight:900;">${suitId}</span>
            &nbsp;//&nbsp;
            <span style="color:${isPathA ? '#00ff41' : '#ff0000'}; font-weight:900;">
                ${isPathA ? 'PATH_A: ELITE' : 'PATH_B: CONSCRIPT'}
            </span>
        </p>
        <div class="decision-buttons">
            <a href="/suit/${suitId}" class="reward-btn dossier-link" style="text-decoration:none; text-align:center; display:block;">
                [ ACCESS SPECIMEN DOSSIER ]
            </a>
            <button id="btn-dispute" class="reward-btn">
                [ DISPUTE_FINDINGS ]
            </button>
        </div>
    `;

    document.getElementById('btn-dispute').addEventListener('click', () => {
        decisionBox.classList.add('hidden');
        inputSection.classList.remove('hidden');
        input.value = '';
        input.style.height = '120px';
        input.placeholder = 'STATE YOUR GROUNDS...';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        input.focus();
        submitBtn.dataset.mode = 'dispute';
    });

    decisionBox.classList.remove('hidden');
}

// ── CORE AUDIT FUNCTION ───────────────────────────────────────────────────────
async function runAudit(type = 'standard') {
    if (isDisabled) return;

    if (type === 'standard') {
        if (!input.value.trim()) return;
        lastInput = input.value.trim();
    }

    isDisabled = true;
    submitBtn.disabled = true;
    clearInterval(tickerInterval);
    inputSection.classList.add('hidden');
    decisionBox.classList.add('hidden');

    // Architect IDs get instant render — no theatrical delay
    if (!isArchitectSession()) {
        output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";
    }

    const isDispute = (type === 'dispute') || (submitBtn.dataset.mode === 'dispute');
    submitBtn.dataset.mode = 'standard';

    const userPayload = isDispute
        ? `[DISPUTE_PROTOCOL]: ${lastInput}`
        : lastInput;

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: userPayload,
                history: chatHistory,
                isDispute,
                auditCount
            })
        });

        if (res.status === 429) {
            output.innerHTML = "<span style='color:#ff0000'>[THERMAL_OVERLOAD]: Too many specimens. Retry in 60 seconds.</span>";
            isDisabled = false;
            submitBtn.disabled = false;
            inputSection.classList.remove('hidden');
            return;
        }

        const data = await res.json();

        if (data.error) {
            output.innerHTML = `<span style='color:#ff0000'>[GATEWAY_ERROR]: ${data.error}</span>`;
            isDisabled = false;
            submitBtn.disabled = false;
            inputSection.classList.remove('hidden');
            return;
        }

        chatHistory = data.history || chatHistory;
        auditCount++;
        if (data.suitId) currentSuitId = data.suitId;
        if (data.pathStatus) currentPathStatus = data.pathStatus;

        const wpMatch = data.audit.match(/\[WP:\s*(\d+)\]/i);
        if (wpMatch) currentWP = parseInt(wpMatch[1], 10);

        // ── RENDER OUTPUT ─────────────────────────────────────────────────────
        const auditText = data.audit || '[SYSTEM_SILENCE]';
        output.innerHTML = auditText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');

        // Extract and stamp SS-ID
        const idMatch = auditText.match(/\[IDENTIFIER:\s*([^\]\n]+)/);
        if (idMatch) {
            const resolvedId = idMatch[1].trim();
            skinDisplay.innerText = resolvedId;
            currentSuitId = resolvedId;
        } else if (currentSuitId) {
            skinDisplay.innerText = currentSuitId;
        }

        // MathJax render
        if (window.MathJax) {
            await MathJax.typesetPromise([output]);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Sequential directive unlock — gated by WP
        if (currentWP >= 50) {
            rewardContainer.classList.remove('hidden');
            document.getElementById('reward-fb').classList.remove('hidden');
        }
        if (currentWP >= 75) {
            document.getElementById('reward-amazon').classList.remove('hidden');
        }
        if (currentWP >= 100) {
            document.getElementById('reward-signal').classList.remove('hidden');
        }

        // Centrifuge — WP 100+
        if (currentWP >= 100) {
            renderDecisionBox(currentSuitId, currentPathStatus);
        } else {
            decisionBox.classList.add('hidden');
            inputSection.classList.remove('hidden');
            input.value = '';
            input.placeholder = 'PROVIDE EVIDENCE OF YOUR STAGNATION...';
            input.style.height = '120px';
        }

    } catch (err) {
        output.innerHTML = `<span style='color:#ff0000'>[CORE_CRASH]: ${err.message}</span>`;
    } finally {
        isDisabled = false;
        submitBtn.disabled = false;
    }
}

// ── SUBMIT ────────────────────────────────────────────────────────────────────
submitBtn.addEventListener('click', () => {
    const mode = submitBtn.dataset.mode || 'standard';
    runAudit(mode);
});

// ── ENTER KEY ─────────────────────────────────────────────────────────────────
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isDisabled) {
        e.preventDefault();
        submitBtn.click();
    }
});
