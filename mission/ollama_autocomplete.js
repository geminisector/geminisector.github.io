// mission/ollama_autocomplete.js

// IMPORTANT: When deployed to an HTTPS domain (like GitHub Pages), direct access to "http://localhost:11434"
// will be blocked by browser security policies (e.g., Same-Origin Policy, Mixed Content Policy).
// Users accessing the deployed site will need to have Ollama running locally on their machine,
// or provide a reachable (and CORS-enabled HTTPS) remote Ollama instance URL in the settings.
// The default "http://localhost:11434" is primarily for local development/testing.
let OLLAMA_BASE_URL = localStorage.getItem('ollamaBaseUrl') || "http://localhost:11434";
let OLLAMA_MODEL_TAGS_ENDPOINT = `${OLLAMA_BASE_URL}/api/tags`;
const OLLAMA_CHECK_TIMEOUT = 3000; // 3 seconds
let OLLAMA_SELECTED_MODEL = "llama2"; // Default model, can be updated by user selection

window.OllamaIntegration = {
    isOllamaAvailable: false,
    availableOllamaModels: [],

    /**
     * Checks if the Ollama service is running and accessible.
     * Stores the result in window.OllamaIntegration.isOllamaAvailable.
     * Populates availableOllamaModels and sets OLLAMA_SELECTED_MODEL.
     * @returns {Promise<boolean>} True if Ollama is running and accessible, false otherwise.
     */
    async checkOllamaRunning() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), OLLAMA_CHECK_TIMEOUT);
            
            const response = await fetch(OLLAMA_MODEL_TAGS_ENDPOINT, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                this.availableOllamaModels = data.models.map(m => m.name);
                if (this.availableOllamaModels.length > 0) {
                    OLLAMA_SELECTED_MODEL = localStorage.getItem('ollamaSelectedModel') || this.availableOllamaModels[0];
                } else {
                    OLLAMA_SELECTED_MODEL = null; // No models available
                }
                this.isOllamaAvailable = true;
            } else {
                this.isOllamaAvailable = false;
            }
            return this.isOllamaAvailable;
        } catch (error) {
            console.error("Error checking Ollama status:", error);
            this.isOllamaAvailable = false;
            return false;
        }
    },

    /**
     * Sends a request to the Ollama API.
     * @param {string} prompt The prompt to send to Ollama.
     * @returns {Promise<string>} The generated content from Ollama.
     * @throws {Error} If the Ollama API returns an error or the request fails.
     */
    async _sendOllamaRequest(prompt) {
        if (!OLLAMA_SELECTED_MODEL) {
            throw new Error("No Ollama model selected. Please select a model.");
        }
        try {
            const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: OLLAMA_SELECTED_MODEL, // Use the selected model
                    prompt: prompt,
                    stream: false,
                    options: { temperature: 0.7 }
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status}: ${errorText}`);
            }
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error("Error during Ollama request:", error);
            throw error;
        }
    },

    /**
     * Extracts and formats content from a raw Ollama response.
     * Prioritizes markdown code blocks, then json code blocks.
     * If parseJson is true and no code block is found, attempts to parse raw content as JSON.
     * @param {string} rawContent The raw string content from Ollama.
     * @param {boolean} parseJson If true, attempts to parse and format JSON.
     * @returns {string} The formatted content.
     */
    extractAndFormatContent(rawContent, parseJson) {
        let content = rawContent.trim();

        // 1. Try to extract content from a Markdown code block
        let match = content.match(/^```(?:markdown)?\n([\s\S]*?)\n```$/m);
        if (match && match[1]) {
            return match[1].trim();
        }

        // 2. Try to extract and format content from a JSON code block
        match = content.match(/^```(?:json)?\n([\s\S]*?)\n```$/m);
        if (match && match[1]) {
            try {
                const parsedJson = JSON.parse(match[1]);
                return this._formatMissionJsonToMarkdown(parsedJson);
            } catch (jsonError) {
                console.warn("Error parsing JSON from code block, displaying raw content.", jsonError);
                return content; // Fallback to raw content if JSON in block is invalid
            }
        }

        // 3. If parseJson is true, try to parse the whole content as JSON (for older prompts/behavior)
        if (parseJson) {
            try {
                const parsedJson = JSON.parse(content);
                return this._formatMissionJsonToMarkdown(parsedJson);
            } catch (jsonError) {
                console.warn("Ollama did not return valid JSON, displaying raw response.", jsonError);
                return content; // Fallback to raw content if JSON is invalid
            }
        }

        // 4. If nothing else, return raw content
        return content;
    },

    /**
     * Helper to format parsed mission JSON into a Markdown string.
     * @param {object} parsedJson The parsed JSON object.
     * @returns {string} Formatted Markdown string.
     */
    _formatMissionJsonToMarkdown(parsedJson) {
        return `
# Mission Briefing

## Primary Objective:
${parsedJson.primaryObjective || 'N/A'}

## Secondary Objectives:
${(parsedJson.secondaryObjectives || []).map(obj => `- ${obj}`).join('\n') || 'N/A'}

## Environments:
${(parsedJson.environments || []).map(env => `- ${env}`).join('\n') || 'N/A'}

## Encounters:
${(parsedJson.encounters || []).map(enc => `- ${enc}`).join('\n') || 'N/A'}

## Narrative:
${parsedJson.narrativeDescription || 'N/A'}
`.trim();
    },

    /**
     * Gets a suggestion from Ollama for a specified textarea.
     * @param {string} textareaId The ID of the textarea element to update.
     * @param {string|Function} promptInstructions Base instructions for the Ollama prompt. If a function, it takes additionalContext and currentText.
     * @param {boolean} parseJson If true, attempts to parse and format the Ollama response as JSON.
     * @param {HTMLElement} [clickedButton=null] The button element that triggered the suggestion, for UI feedback.
     * @param {string} [additionalContext=""] Additional context string to include in the prompt.
     */
    async getSuggestion(textareaId, promptInstructions, parseJson = false, clickedButton = null, additionalContext = "") {
        const textarea = document.getElementById(textareaId);
        if (!textarea) {
            console.error(`Textarea with ID "${textareaId}" not found.`);
            return;
        }

        if (!this.isOllamaAvailable || !OLLAMA_SELECTED_MODEL) {
            alert("Ollama service is not running or no model is selected. Please check Ollama and select a model from the pop-up.");
            return;
        }

        const currentText = textarea.value;
        
        let prompt = "";
        if (typeof promptInstructions === 'function') {
            prompt = promptInstructions(additionalContext, currentText);
        } else {
            // Original logic for static prompts
            prompt = `${promptInstructions}\n\n`;
            if (additionalContext) {
                prompt += `Relevant Nav Point Details: ${additionalContext}\n\n`;
            }
            prompt += `Current description context: "${currentText}"`;
        }

        let originalButtonInnerHTML = '&#x1F916;'; // Robot face icon
        if (clickedButton) {
            originalButtonInnerHTML = clickedButton.innerHTML;
            clickedButton.disabled = true;
            clickedButton.innerHTML = '&#x231B;'; // Hourglass icon
        }
        
        try {
            const generatedContent = await this._sendOllamaRequest(prompt);
                        let finalOutput = this.extractAndFormatContent(generatedContent, parseJson);            
            textarea.value = finalOutput;

        } catch (error) {
            alert(`Failed to get suggestion from Ollama: ${error.message}. Check console for details.`);
        } finally {
            if (clickedButton) {
                clickedButton.disabled = false;
                clickedButton.innerHTML = originalButtonInnerHTML;
            }
        }
    },

    /**
     * Dynamically adds a "Suggest (Ollama)" button next to a target DOM element.
     * @param {HTMLElement} targetElement The input or textarea element to attach the button next to.
     * @param {string|Function} promptInstructions Base instructions for the Ollama prompt.
     * @param {boolean} parseJson If true, suggests the getSuggestion function to parse and format the Ollama response as JSON.
     * @param {Function} [contextBuilderFn=null] A function that returns a string of additional context for the prompt.
     */
    addSuggestionButton(targetElement, promptInstructions, parseJson = false, contextBuilderFn = null) {
        if (!targetElement) {
            console.error(`Target element not provided for suggestion button.`);
            return;
        }

        const button = document.createElement('button');
        button.type = 'button';
        button.classList.add('ollama-ai-button');
        button.innerHTML = '&#x1F916;'; // Robot face icon
        button.title = "Get AI Suggestion (Ollama)";

        if (!this.isOllamaAvailable) {
            button.disabled = true;
            button.title = "Ollama not running or no models available";
        }

        // Always show the model selection modal first, which will then call the suggestion logic if a model is selected.
        button.addEventListener('click', () => {
            this.showModelSelectionModal(() => {
                const additionalContext = contextBuilderFn ? contextBuilderFn() : "";
                this.getSuggestion(targetElement.id, promptInstructions, parseJson, button, additionalContext);
            });
        });

        // Wrap the input/textarea and the button in a new div for side-by-side layout
        const wrapperDiv = document.createElement('div');
        wrapperDiv.classList.add('input-with-button-wrapper');
        
        // Move the target element into the wrapper
        targetElement.parentNode.insertBefore(wrapperDiv, targetElement);
        wrapperDiv.appendChild(targetElement);
        wrapperDiv.appendChild(button);
    },

    // --- Modal Logic ---
    showModelSelectionModal(onModelSelectedCallback) {
        const modal = document.getElementById('ollamaModelSelectionModal');
        const modelSelect = document.getElementById('ollamaModelSelect');
        const confirmBtn = document.getElementById('ollamaModelConfirmBtn');
        const cancelBtn = document.getElementById('ollamaModelCancelBtn');
        const currentModelSpan = document.getElementById('ollamaCurrentModel');
        const ollamaBaseUrlInput = document.getElementById('ollamaBaseUrlInput');

        if (!modal || !modelSelect || !confirmBtn || !cancelBtn || !currentModelSpan || !ollamaBaseUrlInput) {
            console.error("Ollama model selection modal elements not found.");
            alert("Error: Model selection UI is missing. Please check the HTML structure.");
            return;
        }

        ollamaBaseUrlInput.value = OLLAMA_BASE_URL; // Initialize input with current base URL
        currentModelSpan.textContent = OLLAMA_SELECTED_MODEL || 'None selected';

        // Clear previous options and populate with available models
        modelSelect.innerHTML = '';
        if (this.availableOllamaModels.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models found';
            option.disabled = true;
            modelSelect.appendChild(option);
            confirmBtn.disabled = true;
        } else {
            this.availableOllamaModels.forEach(modelName => {
                const option = document.createElement('option');
                option.value = modelName;
                option.textContent = modelName;
                if (modelName === OLLAMA_SELECTED_MODEL) {
                    option.selected = true;
                }
                modelSelect.appendChild(option);
            });
            confirmBtn.disabled = false;
        }

        const handleConfirm = async () => {
            const selectedModel = modelSelect.value;
            const newBaseUrl = ollamaBaseUrlInput.value;

            if (newBaseUrl !== OLLAMA_BASE_URL) {
                OLLAMA_BASE_URL = newBaseUrl;
                localStorage.setItem('ollamaBaseUrl', newBaseUrl);
                OLLAMA_MODEL_TAGS_ENDPOINT = `${OLLAMA_BASE_URL}/api/tags`; // Update the endpoint
                await this.checkOllamaRunning(); // Re-check Ollama availability and models
            }

            if (selectedModel) {
                OLLAMA_SELECTED_MODEL = selectedModel;
                localStorage.setItem('ollamaSelectedModel', selectedModel);
                modal.style.display = 'none';
                // Remove event listeners to prevent multiple calls if modal is reopened
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                window.removeEventListener('click', handleWindowClick);

                if (onModelSelectedCallback) onModelSelectedCallback();
            } else {
                alert("Please select a model.");
            }
        };

        const handleCancel = () => {
            modal.style.display = 'none';
            // Remove event listeners
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            window.removeEventListener('click', handleWindowClick);
        };

        // Event listener for clicks outside the modal content
        const handleWindowClick = (event) => {
            if (event.target == modal) {
                handleCancel();
            }
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        window.addEventListener('click', handleWindowClick); // Add outside click listener

        modal.style.display = 'block';
    },

    MISSION_DESCRIPTION_PROMPT: (additionalContext, currentText) => {
        let prompt = `Generate a comprehensive mission description in Markdown format. Include distinct sections for "Primary Objective", "Secondary Objectives", "Environments", and "Encounters", using Markdown headings and lists. Provide a narrative description for the mission. (Random Seed: ${Math.random()})`;

        if (additionalContext) {
            prompt += `\n\nHere is the current mission setup for context:\n${additionalContext}`;
        }
        if (currentText) {
            prompt += `\n\nHere is the current mission description to expand upon:\n"${currentText}"`;
        }
        return prompt;
    },

    NAV_POINT_DESCRIPTION_PROMPT: (additionalContext, currentText) => {
        let prompt = `Generate a concise and evocative description for a navigation point in a space mission. (Random Seed: ${Math.random()})`;
        if (additionalContext) {
            prompt += ` Here are details about the nav point: ${additionalContext}.`;
        }
        if (currentText) {
            prompt += ` Expand upon the current description: "${currentText}".`;
        }
        prompt += ` The description should be narrative-focused, not a list of features. Provide only the descriptive text.`;
        return prompt;
    }
};

window.addEventListener('DOMContentLoaded', async () => {
    await window.OllamaIntegration.checkOllamaRunning();
});