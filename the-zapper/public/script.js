const terminal = document.getElementById('terminal');
const commandInput = document.getElementById('commandInput');

commandInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && commandInput.value.trim() !== "") {
        const rawInput = commandInput.value.trim();
        commandInput.value = '';

        // Create the initial display line
        const interactionLine = document.createElement('div');
        interactionLine.className = 'line';
        interactionLine.innerHTML = `<span class="prompt">></span> ${rawInput}<br><span class="scanning-signal">PENETRATING_BUFFER...</span>`;
        terminal.appendChild(interactionLine);
        terminal.scrollTop = terminal.scrollHeight;

        try {
            // This now points to your persistent Railway server
            const response = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: rawInput })
            });

            const data = await response.json();
            
            if (data.architect_roast) {
                // Render the full, un-truncated response
                interactionLine.innerHTML = `<span class="prompt">></span> ${rawInput}<br>${data.architect_roast.replace(/\n/g, '<br>')}`;
                
                // Trigger MathJax if the Architect used LaTeX
                if (window.MathJax) {
                    await window.MathJax.typesetPromise([interactionLine]);
                }
            }
        } catch (error) {
            interactionLine.innerHTML += `<br>[INTERFACE_FAILURE]: ${error.message}`;
        }
        terminal.scrollTop = terminal.scrollHeight;
    }
});