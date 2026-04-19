const input = document.getElementById('terminal-input');
const terminal = document.getElementById('terminal-output');
let conversationHistory = [];

async function boot() {
    input.disabled = true;
    const lines = ["[INITIATING_SOVEREIGN_v11.5.0...]", "[ARCHITECT: ONLINE]", "[AWAITING SPECIMEN INPUT...]"];
    for (const l of lines) {
        renderLine(l);
        await new Promise(r => setTimeout(r, 400));
    }
    input.disabled = false; input.focus();
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '' && !input.disabled) {
        const val = input.value;
        input.value = ''; input.disabled = true;
        renderLine(`> Specimen_Input: "${val}"`, '#ffffff');
        const responseLine = renderLine("SCANNING...", '#ff9900');

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activity: val, history: conversationHistory })
            });
            const data = await res.json();
            conversationHistory = data.history || [];
            responseLine.innerHTML = (data.audit || "[SYSTEM_SILENCE]").replace(/\n/g, '<br>');
            if (window.MathJax) MathJax.typesetPromise([responseLine]);
        } catch (err) {
            responseLine.textContent = `[CONNECTION_SEVERED]: ${err.message}`;
        }
        input.disabled = false; input.focus();
    }
});

function renderLine(text, color = '#00ff41') {
    const line = document.createElement('div');
    line.style.color = color; line.className = 'line';
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
    return line;
}

boot();
