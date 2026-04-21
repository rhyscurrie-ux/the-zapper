let chatHistory = [], auditCount = 0, isDisputing = false;
const btn = document.getElementById('submit-btn'), input = document.getElementById('user-input'), output = document.getElementById('audit-output');

window.onload = async () => {
    const params = new URLSearchParams(window.location.search), suitId = params.get('suit');
    const cRes = await fetch('/api/count'), cData = await cRes.json();
    document.getElementById('specimen-counter').innerText = `[MARTIS] // ${cData.count} SPECIMENS`;

    if (suitId) {
        input.classList.add('hidden'); btn.classList.add('hidden');
        output.innerHTML = "<span class='flashing-amber'>[RETRIEVING...]</span>";
        const res = await fetch(`/api/suit/${suitId}`);
        const data = await res.json();
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        document.getElementById('skin-suit-display').innerText = suitId;
        if (window.MathJax) MathJax.typesetPromise([output]);
    }
};

const samples = ["I checked the fridge 4 times...", "I argued about a movie I haven't seen...", "I re-read old texts to feel bad..."];
let sIdx = 0;
setInterval(() => {
    const t = document.getElementById('ticker-text');
    t.innerText = samples[sIdx];
    sIdx = (sIdx + 1) % samples.length;
}, 4000);

async function runAudit(type = "standard") {
    const val = input.value;
    if (type === "standard" && !val.trim()) return;
    input.classList.add('hidden'); btn.classList.add('hidden');
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING...]</span>";
    
    const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({input: val, history: chatHistory, isDispute: isDisputing, auditCount})
    });
    const data = await res.json();
    chatHistory = data.history; auditCount++; isDisputing = false;
    output.innerHTML = data.audit.replace(/\n/g, '<br>');
    const id = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/)?.[1] || "UNKNOWN";
    document.getElementById('skin-suit-display').innerText = id;
    document.getElementById('decision-box').classList.remove('hidden');
    document.getElementById('reward-container').classList.remove('hidden');
    if (auditCount >= 1) document.getElementById('reward-fb').classList.remove('hidden');
    if (window.MathJax) MathJax.typesetPromise([output]);
}

btn.onclick = () => runAudit();
document.getElementById('btn-yes').onclick = () => runAudit("dumb");
document.getElementById('btn-dispute').onclick = () => {
    isDisputing = true;
    document.getElementById('decision-box').classList.add('hidden');
    input.classList.remove('hidden'); input.value = ""; btn.classList.remove('hidden');
};
document.getElementById('invite-btn').onclick = () => {
    const id = document.getElementById('skin-suit-display').innerText;
    const url = `${window.location.origin}/?suit=${id.replace(/\s+/g, '-')}`;
    navigator.clipboard.writeText(url); alert("ID LINK COPIED");
};
document.querySelectorAll('.reward-btn').forEach(b => {
    b.onclick = (e) => {
        const i = b.querySelector('.directive-info');
        if (i && e.target.tagName !== 'A') i.classList.toggle('expanded');
    };
});
