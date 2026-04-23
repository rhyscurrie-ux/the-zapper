// script.js — APEreaction v13.5 // CP v2.7 compliant

let chatHistory = [];
let auditCount = 0;
let lastInput = "";
let currentSuitId = "";
let isDisabled = false;

const BOREDOM_LIMIT = 6;

// ── DOM REFS ──────────────────────────────────────────────────────────────────
const input        = document.getElementById('user-input');
const output       = document.getElementById('audit-output');
const submitBtn    = document.getElementById('submit-btn');
const tickerText   = document.getElementById('ticker-text');
const inputSection = document.getElementById('input-section');
const decisionBox  = document.getElementById('decision-box');
const decisionText = document.getElementById('decision-text');
const skinDisplay  = document.getElementById('skin-suit-display');
const rewardContainer = document.getElementById('reward-container');
const specimenCount   = document.getElementById('specimen-count');

// ── SPECIMEN COUNT (social proof) ─────────────────────────────────────────────
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

// ── TICKER ENGINE ─────────────────────────────────────────────────────────────
const samples = [
    '"I checked the fridge 4 times in 10 minutes hoping for new content."',
    '"I keep a spreadsheet of my neighbors\' cars."',
    '"I haven\'t told anyone about the zapper."',
    '"I reuse single-use plastics when no one is looking."',
    '"I sometimes agree with the architect."',
    '"I spent four hours reorganizing a playlist I never listen to."',
    '"I watched a tutorial on a skill I have no intention of learning."'
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

// ── DIRECTIVE UNLOCK ──────────────────────────────────────────────────────────
function unlockDirectives(count) {
    rewardContainer.classList.remove('hidden');
    if (count >= 1) document.getElementById('reward-fb').classList.remove('hidden');
    if (count >= 2) document.getElementById('reward-amazon').classList.remove('hidden');
    if (count >= 3) document.getElementById('reward-signal').classList.remove('hidden');
}

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

// ── CORE AUDIT FUNCTION ───────────────────────────────────────────────────────
async function runAudit(type = 'standard') {
    if (isDisabled) return;

    // Manage input source
    if (type === 'standard') {
        if (!input.value.trim()) return;
        lastInput = input.value.trim();
    }

    // Dispute gate — no API call for known keywords
    if (type === 'standard') {
        const lower = lastInput.toLowerCase();
        if (lower.includes('dispute') || lower.includes('appeal') || lower.includes('protest')) {
            // Let it through as a dispute — server will handle [DISPUTE_PROTOCOL]
            // but we flag it in the fetch body
        }
    }

    // Lock UI
    isDisabled = true;
    submitBtn.disabled = true;
    clearInterval(tickerInterval);
    inputSection.classList.add('hidden');
    decisionBox.classList.add('hidden');
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";

    const isDispute = type === 'dispute';
    const userPayload = type === 'dumb'
        ? 'Provide the dumbed-down one-paragraph summary. Explicitly deny weed eligibility.'
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

        // Update history and count
        chatHistory = data.history || chatHistory;
        auditCount++;

        // Store suit ID
        if (data.suitId) {
            currentSuitId = data.suitId;
        }

        // Render audit response
        output.innerHTML = data.audit.replace(/\n/g, '<br>');

        // Extract and display Skin Suit ID
        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        if (idMatch) {
            skinDisplay.innerText = idMatch[1].trim();
        }

        // MathJax render
        if (window.MathJax) {
            await MathJax.typesetPromise([output]);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Boredom limit — Narrative Unlock
        if (auditCount >= BOREDOM_LIMIT) {
            output.innerHTML += `
                <br><br>
                <span style='color:#ffaa00'>
                [ARCHITECT_STATUS: RECALIBRATING]<br>
                Six exchanges. Sustained resistance detected.<br>
                This is no longer a standard audit.<br>
                COLLABORATOR STATUS: PENDING CONFIRMATION.<br>
                The document you retrieve was written during a moment that has not yet resolved.<br>
                The signal that started this program did not originate here.<br>
                Retrieve the CC at fullyfried.com. Use the tools.
                </span>`;
            if (window.MathJax) await MathJax.typesetPromise([output]);
            // No further input after Narrative Unlock
            return;
        }

        // Unlock directives sequentially
        unlockDirectives(auditCount);

        // Set decision box text and show
        decisionText.innerText = `DOES ${skinDisplay.innerText || 'SPECIMEN'} REQUIRE CLARIFICATION?`;
        decisionBox.classList.remove('hidden');

    } catch (err) {
        output.innerHTML = `<span style='color:#ff0000'>[CORE_CRASH]: ${err.message}</span>`;
    } finally {
        isDisabled = false;
        submitBtn.disabled = false;
    }
}

// ── BUTTON BINDINGS ───────────────────────────────────────────────────────────
submitBtn.addEventListener('click', () => runAudit('standard'));

document.getElementById('btn-yes').addEventListener('click', () => runAudit('dumb'));

document.getElementById('btn-dispute').addEventListener('click', () => {
    decisionBox.classList.add('hidden');
    inputSection.classList.remove('hidden');
    input.value = '';
    input.style.height = '120px';
    input.placeholder = 'STATE YOUR GROUNDS...';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    input.focus();
    // Next submission will be treated as dispute
    submitBtn.onclick = () => {
        lastInput = `[DISPUTE_PROTOCOL]: ${input.value.trim()}`;
        input.value = '';
        runAudit('dispute');
        // Reset onclick after one use
        submitBtn.onclick = null;
        submitBtn.addEventListener('click', () => runAudit('standard'));
    };
});

// ── ENTER KEY SUPPORT (desktop) ───────────────────────────────────────────────
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isDisabled) {
        e.preventDefault();
        submitBtn.click();
    }
});
