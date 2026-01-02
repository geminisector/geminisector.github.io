// footer.js - Automatically injects legal disclaimer footer on all pages

(function() {
    'use strict';
    
    // Footer HTML content
    const footerHTML = `
        <footer class="legal-disclaimer">
            <p>
                <strong>Gemini Sector</strong> is in no way associated with Origin Systems or Electronic Arts. 
                The Wing Commander universe (including images, locations, names, and other intellectual property) 
                belongs to its designated copyright holders. We're just devoted fans having some fun together 
                in a setting we enjoy. Please don't sue us!
            </p>
            
            <div class="fair-use-notice">
                <p>
                    <strong>DISCLAIMER:</strong> This game is a fan project; it is by its nature transformative, and tongue in cheek critical (exploring the consequences of action), is completely nonprofit, and should be considered fair use as stated in the Copyright Act of 1976, 17 U.S.C. section 107. It is not an official product and it should not be sold nor bought. This game is intended for private use and any sale or for-profit use is prohibited. Please respect the rights of the copyright holders and purchase a copy of the original product if you do not own one already. 
                    The original game can be purchased at 
                    <a href="https://www.gog.com/en/games?query=wing%20commander" target="_blank" rel="noopener noreferrer">GOG.com</a> 
                    and 
                    <a href="https://www.origin.com/" target="_blank" rel="noopener noreferrer">Origin</a>.
                </p>
            </div>
            
            <div class="dmca-notice">
                <p>
                    <strong>DMCA Notice:</strong> If you are a copyright holder and believe any content on this site 
                    infringes your rights, please 
                    <a href="https://github.com/geminisector/geminisector.github.io/issues/new?template=dmca-notice.md" 
                       target="_blank" 
                       rel="noopener noreferrer">
                        open a GitHub issue here
                    </a> 
                    and we will respond promptly.
                </p>
            </div>
        </footer>
    `;
    
    // Function to inject footer
    function injectFooter() {
        // Check if footer already exists to avoid duplicates
        if (document.querySelector('.legal-disclaimer')) {
            return;
        }
        
        // Insert before closing body tag, or append to body if no other script found
        const body = document.body;
        if (body) {
            body.insertAdjacentHTML('beforeend', footerHTML);
        }
    }
    
    // Inject footer when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectFooter);
    } else {
        // DOM already loaded
        injectFooter();
    }
})();
