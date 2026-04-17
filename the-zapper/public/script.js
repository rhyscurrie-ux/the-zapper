const input = document.getElementById('terminal-input');
const terminal = document.getElementById('terminal-output');

async function boot() {
    input.disabled = true;
    const lines = ["[INITIATING...]", "[ARCHITECT: ONLINE]", "[AWAITING INPUT...]"];
    for (const l of lines) {
        renderLine(l);
        await new Promise(r => setTimeout(r, 400));
    }
    input.disabled = false;
    input.focus();
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '') {
        const val = input.value;
        input.value = '';
        input.disabled = true;
        renderLine(`> Specimen_Input: "${val}"`, '#ffffff');
        const responseLine = renderLine("Scanning...");

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activity: val })
            });
            const data = await res.json();
            
            const content = data.audit || "[SYSTEM_SILENCE]";
            responseLine.innerHTML = content.replace(/\n/g, '<br>');
            
            if (window.MathJax) MathJax.typesetPromise([responseLine]);
        } catch (err) {
            responseLine.textContent = "[CONNECTION_SEVERED]";
        }
        input.disabled = false;
        input.focus();
    }
});

function renderLine(text, color = '#00ff41') {
    const line = document.createElement('div');
    line.className = 'line';
    line.style.color = color;
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
    return line;
}

boot();
