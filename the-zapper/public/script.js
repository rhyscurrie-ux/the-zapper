let chatHistory = [];
let auditCount = 0;
const boredomLimit = 6; 

const btn = document.getElementById('submit-btn');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');
const decisionBox = document.getElementById('decision-box');
const tickerBox = document.getElementById('sample-ticker');
const tickerText = document.getElementById('ticker-text');
const rewardContainer = document.getElementById('reward-container');

// TICKER ENGINE (RESTORED)
const samples = [
    "\"I checked my fridge 4 times in 10 minutes hoping for new content.\"",
    "\"I spent 3 hours arguing about a movie I haven't seen.\"",
    "\"I re-read an old text thread to find a reason to be offended.\"",
    "\"I watched a 15-minute video on how to wash a car I don't own.\""
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

// PERSISTENCE HANDSHAKE (NEW)
window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const suitId = params.get('suit');

    if (suitId) {
        document.getElementById('input-section').classList.add('hidden');
        output.innerHTML = "<span class='flashing-amber'>[RETRIEVING_ARCHIVE...]</span>";
        
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
    const val = input.value;
    if (type === "standard" && !val.trim() && auditCount === 0) return;
    
    clearInterval(tickerInterval);
    tickerBox.style.display = 'none';
    document.getElementById('input-section').classList.add('hidden');
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: val, history: chatHistory, type: type, auditCount: auditCount })
        });
        
        const data = await res.json();
        chatHistory = data.history;
        auditCount++;

        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        
        const idMatch = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/);
        const currentID = idMatch ? idMatch[1] : "UNKNOWN";
        skinDisplay.innerText = currentID;

        document.getElementById('decision-text').innerText = `DOES ${currentID} NEED ITS AUDIT DUMB_DOWN?`;
        decisionBox.classList.remove('hidden');
        rewardContainer.classList.remove('hidden');

        if (window.MathJax) MathJax.typesetPromise([output]);
    } catch (err) {
        output.innerHTML = `<span style="color:red">[CRITICAL_FAILURE]</span>`;
    }
}

// HANDLERS
btn.onclick = () => runAudit("standard");
document.getElementById('btn-yes').onclick = () => runAudit("dumb");
document.getElementById('btn-dispute').onclick = () => {
    decisionBox.classList.add('hidden');
    document.getElementById('input-section').classList.remove('hidden');
    input.value = "";
};
document.getElementById('copy-link-btn').onclick = () => {
    const id = skinDisplay.innerText;
    navigator.clipboard.writeText(`${window.location.origin}/?suit=${id}`);
    document.getElementById('copy-link-btn').innerText = "[LINK_COPIED]";
    setTimeout(() => document.getElementById('copy-link-btn').innerText = "[COPY_ARCHIVE_LINK]", 2000);
};
document.getElementById('reactivate-btn').onclick = () => window.location.href = window.location.origin;
