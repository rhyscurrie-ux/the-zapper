let chatHistory = [], auditCount = 0;
const boredomLimit = 6;

const samples = [
    "\"Be honest. When did you last finish something?\"",
    "\"The Architect has processed 847 Skin Suits this week. Most lied.\"",
    "\"Your procrastination has a name. Submit it.\"",
    "\"The audit takes 30 seconds. Your excuses took longer.\"",
    "\"D. Martis is watching this frequency. Don't waste his time.\""
];

let sampleIndex = 0;
const tickerText = document.getElementById('ticker-text');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');

// Ticker Provocations
setInterval(() => {
    tickerText.classList.add('fade-out');
    setTimeout(() => {
        sampleIndex = (sampleIndex + 1) % samples.length;
        tickerText.innerText = samples[sampleIndex];
        tickerText.classList.remove('fade-out');
    }, 600);
}, 4000);

// Auto-expand the Void
input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Load Logic (Persistent Links & Counter)
window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const suitId = params.get('suit');
    
    const cRes = await fetch('/api/count');
    const cData = await cRes.json();
    document.querySelector('#eligibility-header span').innerText = `${cData.count} SPECIMENS PROCESSED // WEED_SCAN`;

    if (suitId) {
        document.getElementById('input-section').classList.add('hidden');
        output.innerHTML = "<span class='flashing-amber'>[RETRIEVING_LOG...]</span>";
        const res = await fetch(`/api/suit/${suitId}`);
        if (res.ok) {
            const data = await res.json();
            output.innerHTML = data.audit.replace(/\n/g, '<br>');
            skinDisplay.innerText = suitId;
            document.getElementById('decision-box').classList.remove('hidden');
        }
    }
};

async function runAudit(type = "standard") {
    if (type === "standard" && !input.value.trim()) return;

    document.getElementById('sample-ticker').style.display = 'none';
    document.getElementById('input-section').classList.add('hidden');
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING...]</span>";

    const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.value, history: chatHistory, type, auditCount })
    });
    
    const data = await res.json();
    chatHistory = data.history;
    auditCount++;

    output.innerHTML = data.audit.replace(/\n/g, '<br>');
    const id = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/)?.[1] || "UNKNOWN";
    skinDisplay.innerText = id;

    // Boredom Limit Unlock
    if (auditCount >= boredomLimit) {
        output.innerHTML += `<br><br><span style='color:#ffaa00'>[ARCHITECT_STATUS: RECALIBRATING]<br>Sustained resistance. COLLABORATOR STATUS CONFIRMED.<br>The CC v10.7.0 is waiting at fullyfried.com.</span>`;
    }

    document.getElementById('decision-box').classList.remove('hidden');
    if (window.MathJax) MathJax.typesetPromise([output]);
}

// Global Handlers
document.getElementById('submit-btn').onclick = () => runAudit("standard");
document.getElementById('btn-yes').onclick = () => runAudit("dumb");
document.getElementById('btn-dispute').onclick = () => {
    document.getElementById('decision-box').classList.add('hidden');
    document.getElementById('input-section').classList.remove('hidden');
    input.placeholder = "STATE YOUR GROUNDS...";
    input.value = "";
};

document.getElementById('copy-link-btn').onclick = () => {
    const url = `${window.location.origin}/?suit=${skinDisplay.innerText}`;
    navigator.clipboard.writeText(url);
    document.getElementById('copy-link-btn').innerText = "[LINK_COPIED]";
    setTimeout(() => document.getElementById('copy-link-btn').innerText = "[COPY_LINK]", 2000);
};
