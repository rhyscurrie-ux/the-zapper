let chatHistory = [], auditCount = 0, isDisputing = false;
const btn = document.getElementById('submit-btn'), 
      input = document.getElementById('user-input'), 
      output = document.getElementById('audit-output'),
      ticker = document.getElementById('sample-ticker'),
      skinDisplay = document.getElementById('skin-suit-display'),
      decisionBox = document.getElementById('decision-box'),
      rewardContainer = document.getElementById('reward-container');

window.onload = async () => {
    const params = new URLSearchParams(window.location.search), suitId = params.get('suit');
    const cRes = await fetch('/api/count'), cData = await cRes.json();
    document.getElementById('specimen-counter').innerText = `[MARTIS] // ${cData.count} SPECIMENS`;

    if (suitId) {
        input.classList.add('hidden'); btn.classList.add('hidden'); ticker.classList.add('hidden');
        output.innerHTML = "<span class='flashing-amber'>[RETRIEVING...]</span>";
        const res = await fetch(`/api/suit/${suitId}`);
        const data = await res.json();
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        skinDisplay.innerText = suitId;
        if (window.MathJax) MathJax.typesetPromise([output]);
    }
};

// Ticker Logic
const samples = ["I checked the fridge 4 times...", "I argued about a movie I haven't seen...", "I re-read old texts to feel bad..."];
let sIdx = 0;
let tickerInt = setInterval(() => {
    const t = document.getElementById('ticker-text');
    if(t) {
        t.innerText = samples[sIdx];
        sIdx = (sIdx + 1) % samples.length;
    }
}, 4000);

async function runAudit(type = "standard") {
    const val = input.value;
    if (type === "standard" && !val.trim()) return;

    // IMMEDIATE UI CLEANUP
    clearInterval(tickerInt);
    ticker.classList.add('hidden');
    input.classList.add('hidden'); 
    btn.classList.add('hidden');
    
    // Clear the footer message
    skinDisplay.innerText = "[ANALYZING_SKIN_SUIT...]";
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING...]</span>";
    
    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({input: val, history: chatHistory, isDispute: isDisputing, auditCount})
        });
        const data = await res.json();
        
        chatHistory = data.history; 
        auditCount++; 
        isDisputing = false;
        
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        const id = data.audit.match(/\[IDENTIFIER:\s*(.*?)\]/)?.[1] || "UNKNOWN";
        
        // Final Footer Update
        skinDisplay.innerText = id;
        
        decisionBox.classList.remove('hidden');
        rewardContainer.classList.remove('hidden');
        if (auditCount >= 1) document.getElementById('reward-fb').classList.remove('hidden');
        if (auditCount >= 2) document.getElementById('reward-amazon').classList.remove('hidden');
        if (auditCount >= 3) document.getElementById('reward-signal').classList.remove('hidden');
        
        if (window.MathJax) MathJax.typesetPromise([output]);
    } catch (e) {
        output.innerHTML = "[SYSTEM_FAILURE]";
        skinDisplay.innerText = "[ERROR]";
    }
}

btn.onclick = () => runAudit();
document.getElementById('btn-yes').onclick = () => runAudit("dumb");
document.getElementById('btn-dispute').onclick = () => {
    isDisputing = true;
    decisionBox.classList.add('hidden');
    input.classList.remove('hidden'); input.value = ""; btn.classList.remove('hidden');
    skinDisplay.innerText = "[RE-EVALUATING_SUIT]";
};
document.getElementById('invite-btn').onclick = () => {
    const id = skinDisplay.innerText;
    const url = `${window.location.origin}/?suit=${id.replace(/\s+/g, '-')}`;
    navigator.clipboard.writeText(url); alert("ID LINK COPIED");
};
document.querySelectorAll('.reward-btn').forEach(b => {
    b.onclick = (e) => {
        const i = b.querySelector('.directive-info');
        if (i && e.target.tagName !== 'A') i.classList.toggle('expanded');
    };
});
