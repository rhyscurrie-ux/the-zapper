const input = document.getElementById('terminal-input');
const terminal = document.getElementById('terminal-output');

input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && input.value.trim() !== '' && !input.disabled) {
        const val = input.value;
        input.value = '';
        input.disabled = true;

        // LOCAL INTERCEPT: The Dispute Gate
        const lower = val.toLowerCase();
        if (lower.includes('dispute') || lower.includes('appeal') || lower.includes('protest')) {
            renderLine('[RECURSIVE_WHINE_DETECTED]: Appeal decommissioned in v9.0. Exit the frequency.', '#ff0000');
            input.disabled = false;
            input.focus();
            return;
        }

        renderLine(`> Specimen_Input: "${val}"`, '#ffffff'); // Mirror input for clarity
        await handleCommand(val);
        input.disabled = false;
        input.focus();
    }
});

async function handleCommand(val) {
    const responseLine = renderLine("Scanning substrate...");

    try {
        const res = await fetch('/api/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activity: val })
        });
        
        const data = await res.json();

        // FIX: We must use innerHTML to allow MathJax and line breaks to exist
        // We also use a white-space preserve style to prevent word-clumping
        responseLine.style.whiteSpace = "pre-wrap"; 
        responseLine.innerHTML = data.audit;

        // Efficient MathJax trigger
        if (window.MathJax) {
            await MathJax.typesetPromise([responseLine]);
        }

        // Auto-scroll to bottom of the substrate
        terminal.scrollTop = terminal.scrollHeight;

    } catch (err) {
        responseLine.style.color = '#ff0000';
        responseLine.textContent = "CONNECTION_SEVERED: " + err.message;
    }
}

function renderLine(text, color = '#00ff00') {
    const line = document.createElement('div');
    line.className = 'line';
    line.style.color = color;
    line.style.marginBottom = '10px'; // Adds breathing room for the roast
    line.textContent = text;
    terminal.appendChild(line);
    
    // Smooth scroll for terminal feel
    terminal.scrollTop = terminal.scrollHeight;
    return line;
}
