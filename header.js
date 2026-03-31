// header.js - Automatically injects shared header and breadcrumbs on all pages

(function() {
    'use strict';
    
    const pageMapping = {
        'character': 'Character Generator',
        'mission': 'Mission Generator',
        'minerals': 'Asteroid Cargo',
        'man': 'Manuals',
        'ships': 'Ships and Weapons',
        'nomad_virtues': 'Nomad Virtues',
        'universe': 'Universe Browser'
    };

    function injectHeader() {
        if (document.querySelector('.page-header-injected')) {
            return;
        }

        // Find current page info
        let currentPageName = '';
        let folderName = '';
        
        for (const [folder, name] of Object.entries(pageMapping)) {
            if (window.location.pathname.includes('/' + folder + '/')) {
                currentPageName = name;
                folderName = folder;
                break;
            }
        }

        // Special case for root
        if (!currentPageName && (window.location.pathname === '/' || window.location.pathname.endsWith('index.html'))) {
            currentPageName = 'Gemini Sector Hub';
        }

        const header = document.createElement('header');
        header.className = 'page-header page-header-injected';
        
        let breadcrumbHTML = '';
        if (folderName) {
            breadcrumbHTML = `<p class="breadcrumb"><a href="../index.html">Gemini Sector Hub</a> / ${currentPageName}</p>`;
        }

        // Use existing H1 text if available, otherwise use mapping
        const existingH1 = document.querySelector('h1');
        const h1Text = existingH1 ? existingH1.innerText : (currentPageName || 'Gemini Sector');

        header.innerHTML = `
            ${breadcrumbHTML}
            <h1>${h1Text.toUpperCase()}</h1>
        `;

        // Add description if it's minerals page (to match original look)
        if (folderName === 'minerals') {
            header.innerHTML += `<p>Market-grade mineral registry. Prices fluctuate ±30% from base value.<br>
            All readings pulled from deep-field spectrograph scans.</p>`;
        }

        // Remove existing header if it exists
        const oldHeader = document.querySelector('header:not(.page-header-injected)') || document.querySelector('.page-header:not(.page-header-injected)');
        if (oldHeader) {
            oldHeader.remove();
        }

        // Prepend to body or container
        const container = document.querySelector('.container');
        if (container) {
            container.prepend(header);
        } else {
            document.body.prepend(header);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectHeader);
    } else {
        injectHeader();
    }
})();
