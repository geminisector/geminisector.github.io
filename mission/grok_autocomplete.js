/**
 * Grok AI Integration for Mission Generator
 * Uses Puter's AI API to connect to Grok models
 */

window.GrokIntegration = (function() {
    let isGrokAvailable = false;
    let currentModel = 'x-ai/grok-4-1-fast';

    // Prompt templates
    const MISSION_DESCRIPTION_PROMPT = `You are a creative mission briefing writer for the space combat simulation game "Wing Commander: Gemini Sector". 
Based on the provided mission details, write a compelling and immersive mission briefing description (2-3 paragraphs).
The description should be written from the perspective of a commanding officer briefing a pilot.
Include tactical details, objectives, and create atmosphere appropriate to the space combat setting.

Mission Details:
{CONTEXT}

Write only the mission description, no additional commentary.`;

    const NAV_POINT_DESCRIPTION_PROMPT = `You are writing atmospheric descriptions for navigation points in the space combat game "Wing Commander: Gemini Sector".
Based on the provided details, write a brief (1-2 sentences) description of what the pilot sees upon arrival at this nav point.
Keep it concise but evocative and immersive.

{CONTEXT}

Write only the nav point description (1-2 sentences), no additional commentary.`;

    /**
     * Check if Grok AI is available through Puter
     */
    async function checkGrokAvailable() {
        try {
            // Check if puter is loaded
            if (typeof puter === 'undefined') {
                console.log('Puter SDK not loaded yet, will retry...');
                // Wait a bit and check again
                await new Promise(resolve => setTimeout(resolve, 500));
                if (typeof puter === 'undefined') {
                    console.error('Puter SDK failed to load');
                    isGrokAvailable = false;
                    return;
                }
            }
            
            // Test with a simple query
            await puter.ai.chat("Hello", { model: currentModel });
            isGrokAvailable = true;
            console.log('✅ Grok AI is available via Puter');
        } catch (error) {
            console.error('❌ Grok AI not available:', error);
            isGrokAvailable = false;
        }
    }

    /**
     * Get AI suggestion using Grok
     */
    async function getAISuggestion(prompt, contextBuilder = null) {
        if (!isGrokAvailable) {
            throw new Error('Grok AI is not available. Please ensure Puter SDK is loaded.');
        }

        try {
            // Build context if a context builder function is provided
            let fullPrompt = prompt;
            if (contextBuilder && typeof contextBuilder === 'function') {
                const context = contextBuilder();
                fullPrompt = prompt.replace('{CONTEXT}', context);
            }

            // Call Grok via Puter
            const response = await puter.ai.chat(fullPrompt, {
                model: currentModel
            });

            return response.message.content;
        } catch (error) {
            console.error('Error getting AI suggestion:', error);
            throw error;
        }
    }

    /**
     * Add an AI suggestion button next to an input field
     */
    function addSuggestionButton(inputElement, promptTemplate, isNavPoint = false, contextBuilder = null) {
        if (!isGrokAvailable) {
            return;
        }

        // Check if button already exists
        if (inputElement.nextElementSibling && inputElement.nextElementSibling.classList.contains('grok-ai-button')) {
            return;
        }

        // Create wrapper for input and button
        const wrapper = document.createElement('div');
        wrapper.classList.add('input-with-button-wrapper');
        
        // Insert wrapper before the input
        inputElement.parentNode.insertBefore(wrapper, inputElement);
        
        // Move input into wrapper
        wrapper.appendChild(inputElement);

        // Create AI suggestion button
        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('grok-ai-button');
        button.innerHTML = '✨'; // Sparkle emoji for AI
        button.title = 'Get AI suggestion from Grok';
        
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.innerHTML = '⏳'; // Loading indicator
            
            try {
                const suggestion = await getAISuggestion(promptTemplate, contextBuilder);
                inputElement.value = suggestion.trim();
                
                // Trigger input event for any listeners
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                
                button.innerHTML = '✅';
                setTimeout(() => {
                    button.innerHTML = '✨';
                    button.disabled = false;
                }, 1500);
            } catch (error) {
                console.error('Error getting suggestion:', error);
                alert('Failed to get AI suggestion: ' + error.message);
                button.innerHTML = '❌';
                setTimeout(() => {
                    button.innerHTML = '✨';
                    button.disabled = false;
                }, 2000);
            }
        });

        wrapper.appendChild(button);
    }

    // Public interface
    return {
        checkGrokAvailable,
        getAISuggestion,
        addSuggestionButton,
        get isGrokAvailable() { return isGrokAvailable; },
        get currentModel() { return currentModel; },
        MISSION_DESCRIPTION_PROMPT,
        NAV_POINT_DESCRIPTION_PROMPT
    };
})();
