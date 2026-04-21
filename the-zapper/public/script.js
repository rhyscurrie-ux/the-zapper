const samples = ["I checked the fridge 4 times...", "I keep a spreadsheet of my neighbors' cars.", "I haven't told anyone about the zapper.", "I reuse single-use plastics when no one is looking.", "I sometimes agree with the architect."];
let sampleIndex = 0, chatHistory = [], auditCount = 0, isDisputing = false;

setInterval(() => {
    const tickerText = document.getElementById('ticker-text');
    if (tickerText) {
        sampleIndex = (sampleIndex + 1) % samples.length;
        tickerText.innerText = samples[sampleIndex];
    }
}, 4000);

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const suitId = params.get('suit');
    const cRes = await fetch('/api/count');
    const cData = await cRes.json();
    document.getElementById('specimen-counter').innerText = `[MARTIS] // ${cData.count} SPECIMENS`;

    if (suitId) {
        document.getElementById('input-pane').classList.add('hidden');
        document.getElementById('audit-output').innerHTML = "<span class='flashing-amber'>[RETRIEVING...]</span>";
        const res = await fetch(`/api/suit/${suitId}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('audit-output').innerHTML = data.audit.replace(/\n/g, '<br>');
            document.getElementById('skin-suit-display').innerText = suitId;
            document.getElementById('decision-box').classList.remove('hidden');
        }
    }
};

async function runAudit() {
    const input = document.getElementById('user-input');
    if (!isDisputing && !input.value.trim()) return;
    document.getElementById('input-pane').classList.add('hidden');
    document.getElementById('audit-output').innerHTML = "<span class='flashing-amber'>[CALIBRATING...]</span>";
    const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({input: input.value, history: chatHistory, isDispute: isDisputing, auditCount})
    });
    const data = await res.json();
    chatHistory = data.history; auditCount++; isDisputing = false;
    document.getElementById('audit-output').innerHTML = data.audit.replace(/\n/g, '<br>');
    const id = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/)?.[1] || "UNKNOWN";
    document.getElementById('skin-suit-display').innerText = id;
    document.getElementById('decision-box').classList.remove('hidden');
}

document.getElementById('submit-btn').onclick = runAudit;
document.getElementById('reactivate-btn').onclick = () => window.location.href = window.location.origin;
document.getElementById('btn-dispute').onclick = () => {
    isDisputing = true;
    document.getElementById('decision-box').classList.add('hidden');
    document.getElementById('input-pane').classList.remove('hidden');
    document.getElementById('user-input').value = "";
};
document.getElementById('copy-link-btn').onclick = () => {
    const id = document.getElementById('skin-suit-display').innerText;
    navigator.clipboard.writeText(`${window.location.origin}/?suit=${id}`);
    document.getElementById('copy-link-btn').innerText = "[COPIED]";
    setTimeout(() => document.getElementById('copy-link-btn').innerText = "[COPY_LINK]", 2000);
};
