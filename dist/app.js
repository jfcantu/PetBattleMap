// Toggle node visibility
function toggleNode(nodeId) {
    const node = document.getElementById(nodeId);
    const icon = event.target.closest('.node-header').querySelector('.toggle-icon');

    if (node.style.display === 'none') {
        node.style.display = 'block';
        icon.textContent = '▼';
    } else {
        node.style.display = 'none';
        icon.textContent = '▶';
    }
}

// Toggle if-block visibility (includes children and connector)
function toggleIfNode(nodeId, childrenId) {
    const node = document.getElementById(nodeId);
    const children = document.getElementById(childrenId);
    const connector = document.getElementById(`connector-${childrenId}`);
    const icon = event.target.closest('.node-header').querySelector('.toggle-icon');

    if (node.style.display === 'none') {
        node.style.display = 'block';
        children.style.display = 'block';
        if (connector) connector.style.display = 'block';
        icon.textContent = '▼';
    } else {
        node.style.display = 'none';
        children.style.display = 'none';
        if (connector) connector.style.display = 'none';
        icon.textContent = '▶';
    }
}

function expandAll() {
    const allNodeBodies = document.querySelectorAll('.node-body');
    const allIcons = document.querySelectorAll('.toggle-icon');
    const allIfChildren = document.querySelectorAll('.if-children');
    const allConnectors = document.querySelectorAll('.connector[id^="connector-"]');

    allNodeBodies.forEach(body => {
        body.style.display = 'block';
    });

    allIfChildren.forEach(children => {
        children.style.display = 'block';
    });

    allConnectors.forEach(connector => {
        connector.style.display = 'block';
    });

    allIcons.forEach(icon => {
        icon.textContent = '▼';
    });
}

function collapseAll() {
    const allNodeBodies = document.querySelectorAll('.node-body');
    const allIcons = document.querySelectorAll('.toggle-icon');
    const allIfChildren = document.querySelectorAll('.if-children');
    const allConnectors = document.querySelectorAll('.connector[id^="connector-"]');

    allNodeBodies.forEach(body => {
        body.style.display = 'none';
    });

    allIfChildren.forEach(children => {
        children.style.display = 'none';
    });

    allConnectors.forEach(connector => {
        connector.style.display = 'none';
    });

    allIcons.forEach(icon => {
        icon.textContent = '▶';
    });
}

// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    const scriptInput = document.getElementById('scriptInput');
    const visualizeBtn = document.getElementById('visualizeBtn');
    const clearBtn = document.getElementById('clearBtn');
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');

    // Initialize ability lookup
    const blizzardAPI = new BlizzardAPI();
    const visualizer = new FlowVisualizer('flowCanvas', blizzardAPI);

    // Load example script on first load
    const exampleScript = `if [weather != Moonlight]
    ability(Moonfire:595)
    ability(#2)
    standby
endif
ability(#1)`;

    scriptInput.value = exampleScript;

    // Visualize button handler
    visualizeBtn.addEventListener('click', async () => {
        const script = scriptInput.value;

        if (!script.trim()) {
            await visualizer.visualize([]);
            return;
        }

        try {
            const parser = new PBSParser(script);
            const ast = parser.parse();
            await visualizer.visualize(ast);
        } catch (error) {
            console.error('Parse error:', error);
            const errorContainer = document.getElementById('flowCanvas');
            errorContainer.innerHTML = `
                <div style="padding: 20px; color: #f44336; background: #ffebee; border-radius: 8px;">
                    <strong>Parse Error:</strong> ${error.message}
                </div>
            `;
        }
    });

    // Clear button handler
    clearBtn.addEventListener('click', () => {
        scriptInput.value = '';
        visualizer.visualize([]);
    });

    // Expand/Collapse button handlers
    expandAllBtn.addEventListener('click', expandAll);
    collapseAllBtn.addEventListener('click', collapseAll);

    // Condensed view toggle
    const condensedViewBtn = document.getElementById('condensedViewBtn');
    condensedViewBtn.addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('condensed-view');
        } else {
            document.body.classList.remove('condensed-view');
        }
    });

    // Auto-visualize on load
    visualizeBtn.click();

    // Optional: Auto-visualize on input (with debounce)
    let debounceTimeout;
    scriptInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            visualizeBtn.click();
        }, 500);
    });
});
