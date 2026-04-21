let chatHistory = [];
let auditCount = 0;
let isDisputing = false;

const btn = document.getElementById('submit-btn');
const input = document.getElementById('user-input');
const output = document.getElementById('audit-output');
const skinDisplay = document.getElementById('skin-suit-display');
const decisionBox = document.getElementById('decision-box');
const tickerBox = document.getElementById('sample-ticker');
const rewardContainer = document.getElementById('reward-container');

// 1. PERSISTENCE CHECK ON LOAD
window.onload = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const suitId = urlParams.get('suit');

    // Fetch Global Count
    const countRes = await fetch('/api/count');
    const countData = await countRes.json();
    document.getElementById('specimen-counter').innerText = `[MARTIS PROGRAM] // ${countData.count} SPECIMENS PROCESSED`;

    if (suitId) {
        input.classList.add('hidden');
        tickerBox.classList.add('hidden');
        btn.classList.add('hidden');
        output.innerHTML = "<span class='flashing-amber'>[RETRIEVING_ARCHIVED_LOG...]</span>";
        
        try {
            const res = await fetch(`/api/suit/${suitId}`);
            const data = await res.json();
            output.innerHTML = data.audit.replace(/\n/g, '<br>');
            skinDisplay.innerText = suitId;
            if (window.MathJax) MathJax.typesetPromise([output]);
            
            document.getElementById('decision-text').innerText = "THIS SKIN SUIT HAS BEEN ARCHIVED.";
            document.getElementById('btn-yes').innerText = "START NEW AUDIT";
            document.getElementById('btn-yes').onclick = () => window.location.href = '/';
            document.getElementById('btn-dispute').classList.add('hidden');
            decisionBox.classList.remove('hidden');
        } catch (e) {
            output.innerHTML = "[ERROR: LOG_NOT_FOUND]";
        }
    }
};

// 2. TICKER ENGINE
const samples = ["\"I checked my fridge 4 times...\"", "\"I spent 3 hours arguing about a movie...\"", "\"I re-read an old text thread...\""];
let sampleIndex = 0;
let tickerInterval = setInterval(() => {
    const t = document.getElementById('ticker-text');
    t.classList.add('fade-out');
    setTimeout(() => {
        sampleIndex = (sampleIndex + 1) % samples.length;
        t.innerText = samples[sampleIndex];
        t.classList.remove('fade-out');
    }, 600);
}, 4000);

// 3. CORE SCAN
async function runAudit(type = "standard") {
    const val = input.value;
    if (type === "standard" && !val.trim()) return;
    
    clearInterval(tickerInterval);
    tickerBox.style.display = 'none';
    input.classList.add('hidden');
    btn.classList.add('hidden');
    decisionBox.classList.add('hidden');
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING_PROXIMITY...]</span>";

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: val, history: chatHistory, isDispute: isDisputing, auditCount })
        });
        const data = await res.json();
        chatHistory = data.history;
        auditCount++;
        isDisputing = false;

        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        
        // Narrative Unlock
        if (auditCount >= 6) {
            output.innerHTML += `<br><br><span style='color:#ffaa00'>[COLLABORATOR STATUS CONFIRMED]<br>Retrieve CC v10.7.0 at fullyfried.com.</span>`;
            return;
        }

        const id = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/)?.[1] || "UNKNOWN";
        skinDisplay.innerText = id;
        decisionBox.classList.remove('hidden');
        rewardContainer.classList.remove('hidden');
        if (auditCount >= 1) document.getElementById('reward-fb').classList.remove('hidden');
        if (auditCount >= 2) document.getElementById('reward-amazon').classList.remove('hidden');
        if (auditCount >= 3) document.getElementById('reward-signal').classList.remove('hidden');

        if (window.MathJax) MathJax.typesetPromise([output]);
    } catch (e) { output.innerHTML = "[SYSTEM_FAILURE]"; }
}

// 4. UI HANDLERS
document.getElementById('invite-btn').onclick = async () => {
    const id = skinDisplay.innerText;
    const url = `${window.location.origin}/?suit=${id.replace(/\s+/g, '-')}`;
    const text = `I failed my W.E.E.D. audit. I am ${id}. Reverse my entropic spiralling at APEreaction.com.`;
    if (navigator.share) await navigator.share({ title: 'MARTIS AUDIT', text, url });
    else { navigator.clipboard.writeText(`${text} ${url}`); alert("[LINK_COPIED]"); }
};

document.querySelectorAll('.reward-btn').forEach(btn => {
    btn.onclick = (e) => {
        if (e.target.tagName === 'A') return;
        const info = btn.querySelector('.directive-info');
        const span = btn.querySelector('span');
        if (info) {
            info.classList.toggle('expanded');
            span.innerText = info.classList.contains('expanded') ? span.innerText + " ▼" : span.innerText.replace(" ▼", "");
        }
    };
});

btn.onclick = () => runAudit();
document.getElementById('btn-yes').onclick = () => runAudit("dumb");
document.getElementById('btn-dispute').onclick = () => {
    isDisputing = true;
    decisionBox.classList.add('hidden');
    input.classList.remove('hidden');
    input.value = "";
    btn.classList.remove('hidden');
};
