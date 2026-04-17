const input = document.getElementById('terminal-input');
const terminal = document.getElementById('terminal-output');

const bootLines = [
    "[INITIATING_W.E.E.D._PROTOCOL...]",
    "[SOVEREIGN_ARCHITECT: ONLINE]",
    "[SUBSTRATE_SCANNER: ARMED]",
    "[AWAITING_SPECIMEN_INPUT...]"
];

async function boot() {
    input.disabled = true;
    for (const line of bootLines) {
        renderLine(line, '#00ff00');
        await new Promise(r => setTimeout(r, 400));
    }
    input.disabled = false;
    input.focus();
}

async function typeWrite(element, text, speed = 5) {
    element.textContent = ''; 
    element.style.whiteSpace = "pre-wrap";
    let currentText = "";
    for (let i = 0; i < text.length; i++) {
        currentText += text[i];
        element.innerHTML = currentText.replace(/\n/g, '<br>');
        terminal.scrollTop = terminal.scrollHeight;
        await new Promise(r => setTimeout(r, speed));
    }
}

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '' && !input.disabled) {
        const val = input.value;
        input.value = '';
        input.disabled = true;

        if (val.toLowerCase().includes('dispute') || val.toLowerCase().includes('appeal')) {
            renderLine('[RECURSIVE_WHINE_DETECTED]: Appeal decommissioned. Exit the frequency.', '#ff0000');
        } else {
            renderLine(`> Specimen_Input: "${val}"`, '#ffffff');
            await handleCommand(val);
        }
        
        input.disabled = false;
        input.focus();
    }
});

async function handleCommand(val) {
    const responseLine = renderLine("Scanning substrate...");
    const frames = ["SCANNING.", "SCANNING..", "SCANNING...", "PENETRATING_BUFFER..."];
    let f = 0;
    const interval = setInterval(() => {
        responseLine.textContent = frames[f % frames.length];
        f++;
    }, 400);

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activity: val })
        });
        
        const data = await res.json();
        clearInterval(interval);

        await typeWrite(responseLine, data.audit);

        if (window.MathJax) {
            await MathJax.typesetPromise([responseLine]);
        }

    } catch (err) {
        clearInterval(interval);
        responseLine.style.color = '#ff0000';
        responseLine.textContent = "[CONNECTION_SEVERED]: " + err.message;
    }
}

function renderLine(text, color = '#00ff00') {
    const line = document.createElement('div');
    line.className = 'line';
    line.style.color = color;
    line.style.marginBottom = '8px';
    line.textContent = text;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
    return line;
}

boot();
