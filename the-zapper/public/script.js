let chatHistory = [], auditCount = 0, isDisputing = false;
const btn = document.getElementById('submit-btn'), 
      input = document.getElementById('user-input'), 
      output = document.getElementById('audit-output'),
      ticker = document.getElementById('sample-ticker'),
      skinDisplay = document.getElementById('skin-suit-display'),
      decisionBox = document.getElementById('decision-box'),
      archiveControls = document.getElementById('archive-controls'),
      inputArea = document.getElementById('input-area');

// Initial Load
window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const suitId = params.get('suit');
    
    // Fetch Global Count
    const cRes = await fetch('/api/count');
    const cData = await cRes.json();
    document.getElementById('specimen-counter').innerText = `[MARTIS] // ${cData.count} SPECIMENS`;

    if (suitId) {
        enterArchiveMode(suitId);
    }
};

async function enterArchiveMode(id) {
    inputArea.classList.add('hidden');
    ticker.classList.add('hidden');
    output.innerHTML = "<span class='flashing-amber'>[RETRIEVING_SPECIMEN...]</span>";
    
    const res = await fetch(`/api/suit/${id}`);
    if (res.ok) {
        const data = await res.json();
        output.innerHTML = data.audit.replace(/\n/g, '<br>');
        skinDisplay.innerText = id;
        archiveControls.classList.remove('hidden');
    } else {
        output.innerHTML = "[ERROR: SPECIMEN_LOST_TO_ENTROPY]";
        skinDisplay.innerText = "NOT_FOUND";
        archiveControls.classList.remove('hidden'); // Still allow reactivation
    }
}

async function runAudit() {
    const val = input.value;
    if (!isDisputing && !val.trim()) return;

    // UI Cleanup
    ticker.classList.add('hidden');
    inputArea.classList.add('hidden');
    decisionBox.classList.add('hidden');
    output.innerHTML = "<span class='flashing-amber'>[CALIBRATING...]</span>";
    skinDisplay.innerText = "[ANALYZING_SUIT...]";

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
    skinDisplay.innerText = id;
    
    decisionBox.classList.remove('hidden');
    archiveControls.classList.remove('hidden');
    
    // Show rewards based on audit depth
    document.getElementById('reward-container').classList.remove('hidden');
    if (auditCount >= 1) document.getElementById('reward-fb').classList.remove('hidden');
    if (auditCount >= 2) document.getElementById('reward-amazon').classList.remove('hidden');
    if (auditCount >= 3) document.getElementById('reward-signal').classList.remove('hidden');
}

// Button Logic
btn.onclick = () => runAudit();

document.getElementById('btn-dispute').onclick = () => {
    isDisputing = true;
    decisionBox.classList.add('hidden');
    inputArea.classList.remove('hidden');
    input.value = "";
    skinDisplay.innerText = "[RE-EVALUATING]";
};

document.getElementById('copy-link-btn').onclick = () => {
    const id = skinDisplay.innerText;
    const url = `${window.location.origin}/?suit=${id}`;
    navigator.clipboard.writeText(url).then(() => {
        document.getElementById('copy-link-btn').innerText = "[LINK_COPIED]";
        setTimeout(() => document.getElementById('copy-link-btn').innerText = "[COPY_ARCHIVE_LINK]", 2000);
    });
};

document.getElementById('reactivate-btn').onclick = () => {
    window.location.href = window.location.origin; // Clears the ?suit param and resets
};
