function escapeHtml(text) {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Fetches command data from JSON, filters for GM commands, and generates
 * a card-based layout.
 */
async function initializeCommandDisplay(showGmCommands) {
    const cardContainer = document.getElementById('card-container');
    const searchBox = document.getElementById('search-box');
    
    if (!cardContainer) return;

    try {
        const response = await fetch('commands.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const commandCategories = {
            "COMBAT_COMMANDS": "🚀 Combat Commands",
            "DATABASE_COMMANDS": "💾 Database Commands",
            "SYSTEM_COMMANDS": "🖥️ System Commands",
            "MELEE_COMMANDS": "⚔️ Melee Commands"
        };

        let commandCards = [];

        for (const categoryKey in commandCategories) {
            const categoryName = commandCategories[categoryKey];
            const commands = data[categoryKey];

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'command-category';
            categoryDiv.textContent = categoryName;
            cardContainer.appendChild(categoryDiv);

            for (const cmdKey in commands) {
                const command = commands[cmdKey];
                if (command.secret) {
                    continue;
                }

                const isGmCommand = command.role === 'GM';
                if ((showGmCommands && isGmCommand) || (!showGmCommands && !isGmCommand)) {
                    let contentHtml = `<ul>`;
                    contentHtml += `<li><strong>Role</strong>: ${command.role}</li>`;
                    let description = (command.HELP || '').replace(/\n/g, '<br>');
                    description = description.replace(/`([^`]+)`/g, (match, g1) => `<span class="pill">${escapeHtml(g1)}</span>`);
                    contentHtml += `<li><strong>Description</strong>: ${description}</li>`;
                    if (command.minparams) {
                        contentHtml += `<li><strong>Minimum Parameters</strong>: ${command.minparams}</li>`;
                    }
                    if (command.new_params && command.new_params.length > 0) {
                        contentHtml += `<li><strong>Parameters</strong>: ${command.new_params.join(', ')}</li>`;
                    }
                    if (command.examples && command.examples.length > 0) {
                        contentHtml += `<li><strong>Examples</strong>:<ul>`;
                        command.examples.forEach(example => {
                            const escapedExample = example.replace(/`([^`]+)`/g, (match, g1) => `<span class="pill">${escapeHtml(g1)}</span>`);
                            contentHtml += `<li>${escapedExample}</li>`;
                        });
                        contentHtml += `</ul></li>`;
                    }
                    contentHtml += `</ul>`;

                    const cardData = {
                        category: categoryName,
                        name: command.cmd,
                        contentHtml: contentHtml,
                        searchableText: `${command.cmd} ${categoryName} ${command.role} ${command.HELP}`.toLowerCase()
                    };
                    commandCards.push(cardData);
                }
            }
        }

        renderCards(commandCards);

        searchBox.addEventListener('keyup', () => filterCards());
        searchBox.addEventListener('change', () => filterCards());

    } catch (error) {
        console.error('Error fetching or processing command data:', error);
        cardContainer.innerHTML = '<p>Error loading command data. Please check the console for details.</p>';
    }
}

function renderCards(data) {
    const cardContainer = document.getElementById('card-container');
    // Clear existing cards, but not categories
    const existingCards = cardContainer.querySelectorAll('.command-card');
    existingCards.forEach(card => card.remove());

    data.forEach(item => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'command-card';
        cardDiv.setAttribute('data-category', item.category);
        cardDiv.setAttribute('data-search-text', item.searchableText);

        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = item.name;
        cardDiv.appendChild(header);

        const content = document.createElement('div');
        content.className = 'card-content';
        content.innerHTML = item.contentHtml;
        cardDiv.appendChild(content);

        const categoryElement = Array.from(cardContainer.querySelectorAll('.command-category'))
            .find(cat => cat.textContent.trim() === item.category.trim());
        
        if (categoryElement) {
            categoryElement.parentNode.insertBefore(cardDiv, categoryElement.nextSibling);
        } else {
            cardContainer.appendChild(cardDiv);
        }
    });
}

function filterCards() {
    const filterText = document.getElementById('search-box').value.toLowerCase().trim();
    const cards = document.querySelectorAll('.command-card');
    let found = 0;

    cards.forEach(card => {
        const searchText = card.getAttribute('data-search-text');
        if (searchText.includes(filterText)) {
            card.style.display = 'block';
            found++;
        } else {
            card.style.display = 'none';
        }
    });

    const categories = document.querySelectorAll('.command-category');
    categories.forEach(category => {
        let hasVisibleCard = false;
        let nextSibling = category.nextElementSibling;
        while (nextSibling && !nextSibling.classList.contains('command-category')) {
            if (nextSibling.classList.contains('command-card') && nextSibling.style.display !== 'none') {
                hasVisibleCard = true;
                break;
            }
            nextSibling = nextSibling.nextElementSibling;
        }
        category.style.display = hasVisibleCard ? 'block' : 'none';
    });

    const existingNoResults = document.getElementById('no-results-message');
    if (found === 0 && filterText.length > 0) {
        if (!existingNoResults) {
            const msg = document.createElement('div');
            msg.id = 'no-results-message';
            msg.className = 'card';
            msg.style.gridColumn = '1 / -1';
            msg.innerHTML = '<p style="padding: 20px;">No commands match your filter.</p>';
            document.getElementById('card-container').appendChild(msg);
        }
    } else if (existingNoResults) {
        existingNoResults.remove();
    }
}
