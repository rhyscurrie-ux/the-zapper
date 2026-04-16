const terminal = document.getElementById('terminal');
const input = document.getElementById('input');

async function handleCommand(val) {
    const line = document.createElement('div');
    line.textContent = `> ${val}`;
    terminal.appendChild(line);

    // Create the loading indicator
    const loading = document.createElement('div');
    loading.textContent = "[PENETRATING_BUFFER...]";
    terminal.appendChild(loading);

    try {
        // Use relative path so it works on Railway automatically
        const response = await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: val })
        });

        const data = await response.json();
        
        // Remove loading and show the Architect's response
        loading.remove();
        const responseLine = document.createElement('div');
        responseLine.style.color = "#00ff00"; // Classic Matrix green
        responseLine.innerHTML = data.architect_roast;
        terminal.appendChild(responseLine);

    } catch (e) {
        loading.textContent = "[SYSTEM_SILENCE]: Check connection.";
        console.error(e);
    }
    
    terminal.scrollTop = terminal.scrollHeight;
}

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleCommand(input.value);
        input.value = '';
    }
});
