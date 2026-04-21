let chatHistory = [], auditCount = 0;
const boredomLimit = 6;

// RESTORED: These are the original, boring, hyper-specific "Martis" observations.
const samples = [
    "\"I checked the fridge 4 times in 10 minutes hoping for new content.\"",
    "\"I keep a spreadsheet of my neighbors' cars.\"",
    "\"I haven't told anyone about the zapper.\"",
    "\"I reuse single-use plastics when no one is looking.\"",
    "\"I sometimes agree with the architect.\""
];

let sampleIndex = 0;
const tickerText = document.getElementById('ticker-text');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');

// THE MUNDANE TICKER
setInterval(() => {
    tickerText.classList.add('fade-out');
    setTimeout(() => {
        sampleIndex = (sampleIndex + 1) % samples.length;
        tickerText.innerText = samples[sampleIndex];
        tickerText.classList.remove('fade-out');
    }, 600);
}, 4000);

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const suitId = params.get('suit');
    
    // Global Counter (Social Proof)
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
            document.getElementById('reactivate-btn').classList.remove('hidden');
        }
    }
};

async function runAudit(type = "standard") {
    if (type === "standard" && !input.value.trim()) return;

    document.getElementById('sample-ticker').style.display = 'none';
    document.getElementById('input-section').classList.add('hidden');
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";

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

    // Narrative Payoff (Boredom Limit)
    if (auditCount >= boredomLimit) {
        output.innerHTML += `<br><br><span style='color:#ffaa00'>[ARCHITECT_STATUS: BORED]<br>Your repetitive biological resistance is no longer instructive. Go outside.</span>`;
    }

    document.getElementById('decision-box').classList.remove('hidden');
    if (window.MathJax) MathJax.typesetPromise([output]);
}

// HANDLERS
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

document.getElementById('reactivate-btn').onclick = () => window.location.href = window.location.origin;
