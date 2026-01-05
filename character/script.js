document.addEventListener('DOMContentLoaded', () => {
    const attributes = ['academic', 'athletic', 'creative', 'social', 'reactive', 'technical'];
    const totalSum = 32;
    const totalSkills = 80;
    const occupationSkills = {
        "p": [
            "academic",
            "reactive",
            "technical",
            "alertness",
            "ecm",
            "gunnery",
            "piloting",
        ],
        "g": ["reactive", "alertness", "gunnery"],
        "t": ["technical", "ecm", "demolitions", "repair"],
        "no": [
            "academic",
            "reactive",
            "social",
            "technical",
            "alertness",
            "ecm",
            "gunnery",
            "piloting",
        ],
        "np": [
            "academic",
            "reactive",
            "technical",
            "alertness",
            "ecm",
            "gunnery",
            "piloting",
        ],
        "nc": [
            "academic",
            "reactive",
            "technical",
            "alertness",
            "ecm",
            "gunnery",
            "repair",
        ],
        "md": ["academic", "social", "first aid", "medicine"],
        "mo": [
            "athletic",
            "reactive",
            "social",
            "alertness",
            "stealth",
            "firearms",
            "lasers",
            "melee",
            "demolitions",
        ],
        "m": [
            "athletic",
            "reactive",
            "alertness",
            "stealth",
            "firearms",
            "lasers",
            "melee",
            "demolitions",
        ],
        "mm": [
            "athletic",
            "academic",
            "reactive",
            "social",
            "alertness",
            "stealth",
            "firearms",
            "lasers",
            "melee",
            "first aid",
        ],
        "v": ["athletic", "reactive", "alertness", "melee", "martial arts", "dance"],
        "merch": ["social", "reactive", "logicistic", "economics", "bartering", "piloting"],
        "smug": ["creative", "reactive", "melee", "stealth", "bartering", "piloting"],
    };


    // Function to update skill points display and enforce max points limit
    function updateSkillDisplay() {
        let totalPoints = 0;

        attributes.forEach(id => {
            totalPoints += parseInt(document.getElementById(id).value);
        });

        // Calculate total points for dynamic skills
        document.querySelectorAll('#skillsContainer input[type="range"]').forEach(skill => {
            totalPoints += parseInt(skill.value);
        });

        // Update the total skill points display
        const totalSkillPointsSpan = document.getElementById('totalSkillPoints');
        if (totalSkillPointsSpan) {
            totalSkillPointsSpan.textContent = totalPoints;
            // Change color to red if over limit, otherwise reset to default
            if (totalPoints > totalSkills) {
                totalSkillPointsSpan.style.color = 'red';
            } else {
                totalSkillPointsSpan.style.color = '';
            }
        }

        // If total points exceed the max, alert and disable further adjustments
        if (totalPoints > totalSkills) {
            // Using a simple alert for now, but a custom modal is recommended for a better UX.
            alert(`Total skill points cannot exceed ${totalSkills}. Please adjust your skills.`);
        }

        // Update skill value displays
        document.querySelectorAll('#skillsContainer input[type="range"]').forEach(skill => {
            const valueDisplay = document.getElementById(`${skill.id}Value`);
            if (valueDisplay) {
                valueDisplay.textContent = skill.value;
            }
        });
    }

    // Function to update attribute values and enforce a total sum limit
    function updateAttributeValues(changedSlider = null) {
        const values = attributes.map(id => parseInt(document.getElementById(id).value));
        const sum = values.reduce((a, b) => a + b, 0);

        // Update the total attributes display
        const totalAttributesSpan = document.getElementById('totalAttributes');
        if (totalAttributesSpan) {
            totalAttributesSpan.textContent = sum;
            // Change color to red if over limit, otherwise reset to default
            if (sum > totalSum) {
                totalAttributesSpan.style.color = 'red';
            } else {
                totalAttributesSpan.style.color = '';
            }
        }

        if (sum > totalSum && changedSlider) {
            // Cap the changed slider at the maximum value that keeps us within totalSum
            const diff = sum - totalSum;
            const currentValue = parseInt(changedSlider.value);
            changedSlider.value = Math.max(1, currentValue - diff);
        }

        attributes.forEach(id => {
            document.getElementById(`${id}Value`).textContent = document.getElementById(id).value;
        });

        // Also update skill display since attributes count toward total
        updateSkillDisplay();
    }

    attributes.forEach(id => {
        const slider = document.getElementById(id);
        slider.addEventListener('input', function() {
            updateAttributeValues(this);
        });
    });

    // Function to update skills based on the selected occupation
    function updateSkills(occupation) {
        // Get the container for skills
        const skillsContainer = document.getElementById('skillsContainer');
        skillsContainer.innerHTML = ''; // Clear previous skills

        // Create a parent fieldset for all skills
        const skillsFieldset = document.createElement('fieldset');
        skillsFieldset.innerHTML = '<legend>Skills (<span id="totalSkillPoints">0</span> / ' + totalSkills + ')</legend>';

        // Create fieldsets for Major and Minor Skills
        const majorFieldset = document.createElement('fieldset');
        const minorFieldset = document.createElement('fieldset');
        const languagesFieldset = document.createElement('fieldset');

        majorFieldset.innerHTML = '<legend>Major Skills</legend>';
        minorFieldset.innerHTML = '<legend>Minor Skills</legend>';
        languagesFieldset.innerHTML = '<legend>Languages</legend>';

        // Get skills for the selected occupation
        let majorSkills = occupationSkills[occupation] || [];

        // Remove attributes from majorSkills
        majorSkills = majorSkills.filter(skill => !attributes.includes(skill));

        // Create sliders for each major skill
        majorSkills.forEach(skill => {
            const formGroup = document.createElement('div');
            formGroup.classList.add('form-group');

            const skillLabel = document.createElement('label');
            skillLabel.setAttribute('for', skill);
            skillLabel.innerHTML = `${capitalize(skill)}: <span id="${skill}Value">5</span>`;

            const skillSlider = document.createElement('input');
            skillSlider.setAttribute('type', 'range');
            skillSlider.setAttribute('id', skill);
            skillSlider.setAttribute('name', skill);
            skillSlider.setAttribute('min', '0');
            skillSlider.setAttribute('max', '10');
            skillSlider.setAttribute('value', '5');
            skillSlider.setAttribute('step', '1');
            skillSlider.addEventListener('input', updateSkillDisplay);

            formGroup.appendChild(skillLabel);
            formGroup.appendChild(skillSlider);
            majorFieldset.appendChild(formGroup);
        });

        // Add the English language skill slider
        const englishSkillGroup = document.createElement('div');
        englishSkillGroup.classList.add('form-group');
        const skill = 'english';
        const skillLabel = document.createElement('label');
        skillLabel.setAttribute('for', skill);
        skillLabel.innerHTML = `${capitalize(skill)}: <span id="${skill}Value">7</span>`;
        const skillSlider = document.createElement('input');
        skillSlider.setAttribute('type', 'range');
        skillSlider.setAttribute('id', skill);
        skillSlider.setAttribute('name', skill);
        skillSlider.setAttribute('min', '6');
        skillSlider.setAttribute('max', '10');
        skillSlider.setAttribute('value', '7');
        skillSlider.setAttribute('step', '1');
        skillSlider.classList.add('english-skill-slider');
        skillSlider.addEventListener('input', updateSkillDisplay);
        englishSkillGroup.appendChild(skillLabel);
        englishSkillGroup.appendChild(skillSlider);
        languagesFieldset.appendChild(englishSkillGroup);

        // Add a button to add custom skills
        const addSkillButton = document.createElement('button');
        addSkillButton.textContent = "Add Custom Skill";
        addSkillButton.type = "button";
        addSkillButton.classList.add('add-button'); // Added class for styling
        addSkillButton.classList.add('container')
        addSkillButton.onclick = addCustomSkill;

        skillsFieldset.appendChild(majorFieldset);
        skillsFieldset.appendChild(minorFieldset);
        skillsFieldset.appendChild(addSkillButton);
        skillsFieldset.appendChild(languagesFieldset);
        
        skillsContainer.appendChild(skillsFieldset);

        updateMinorSkillSuggestions(occupation);
        updateSkillDisplay();
    }

    // Function to get suggested minor skills based on occupation
    function getSuggestedMinorSkills(occupation) {
        // Get union of all skills from all occupations
        const allSkills = new Set();
        Object.values(occupationSkills).forEach(skillList => {
            skillList.forEach(skill => allSkills.add(skill));
        });

        // Remove attributes
        attributes.forEach(attr => allSkills.delete(attr));

        // Remove major skills for current occupation
        const majorSkills = occupationSkills[occupation] || [];
        majorSkills.forEach(skill => {
            if (!attributes.includes(skill)) {
                allSkills.delete(skill);
            }
        });

        // Remove already-added minor skills
        const addedMinorSkills = new Set();
        document.querySelectorAll('#skillsContainer .custom-skill-name').forEach(input => {
            const skillName = input.value.trim().toLowerCase();
            if (skillName) {
                addedMinorSkills.add(skillName);
            }
        });
        addedMinorSkills.forEach(skill => allSkills.delete(skill));

        return Array.from(allSkills).sort();
    }

    // Function to update the datalist for minor skill suggestions
    function updateMinorSkillSuggestions(occupation) {
        const suggestedSkills = getSuggestedMinorSkills(occupation);
        
        // Remove old datalist if it exists
        let datalist = document.getElementById('minorSkillSuggestions');
        if (datalist) {
            datalist.innerHTML = ''; // Clear existing options
        } else {
            // Create new datalist and add it to the skills container
            datalist = document.createElement('datalist');
            datalist.id = 'minorSkillSuggestions';
            document.getElementById('skillsContainer').appendChild(datalist);
        }
        
        suggestedSkills.forEach(skill => {
            const option = document.createElement('option');
            option.value = capitalize(skill);
            datalist.appendChild(option);
        });
    }
    function addCustomSkill() {
        // Get the minor skills fieldset
        const minorFieldset = document.querySelector('#skillsContainer fieldset:nth-child(2)');

        const formGroup = document.createElement('div');
        formGroup.classList.add('form-group');

        const customSkillDiv = document.createElement('div');
        customSkillDiv.classList.add('custom-skill-input-group');

        const skillNameInput = document.createElement('input');
        skillNameInput.setAttribute('type', 'text');
        skillNameInput.setAttribute('placeholder', 'Custom Skill Name');
        skillNameInput.classList.add('custom-skill-name');
        skillNameInput.setAttribute('list', 'minorSkillSuggestions');

        const skillValueLabel = document.createElement('span');
        skillValueLabel.textContent = '5'; // default value

        const skillSlider = document.createElement('input');
        skillSlider.setAttribute('type', 'range');
        skillSlider.setAttribute('min', '0');
        skillSlider.setAttribute('max', '10');
        skillSlider.setAttribute('value', '5');
        skillSlider.setAttribute('step', '1');
        skillSlider.classList.add('custom-skill-slider');
        skillSlider.addEventListener('input', () => {
            skillValueLabel.textContent = skillSlider.value;
            updateSkillDisplay();
        });

        // Append elements to the minor fieldset
        formGroup.appendChild(skillNameInput);
        formGroup.appendChild(skillValueLabel);
        formGroup.appendChild(skillSlider);
        minorFieldset.appendChild(formGroup);

        updateSkillDisplay();
    }

    document.getElementById('occupation').addEventListener('change', (event) => {
        updateSkills(event.target.value);
    });

    function capitalize(word) {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    function generateJSON() {
        const form = document.getElementById('characterForm');
        const formData = new FormData(form);
        let skills = {};

        // Collect major and custom skills
        document.querySelectorAll('#skillsContainer input[type="range"]').forEach(skill => {
            let skillName = skill.name || (skill.previousElementSibling && skill.previousElementSibling.previousElementSibling.value.trim()); // Use slider name or custom input value
            if (skillName && skillName !== 'english') {
                skills[skillName] = parseInt(skill.value);
            }
        });

        // Add english skill separately
        const englishSkill = document.getElementById('english');
        if (englishSkill) {
            skills['english'] = parseInt(englishSkill.value);
        }

        // Collect skills from the form that are not sliders (e.g., custom skills)
        const customSkillInputs = document.querySelectorAll('#skillsContainer .custom-skill-name');
        customSkillInputs.forEach(input => {
            const skillName = input.value.trim();
            if (skillName) {
                const skillSlider = input.nextElementSibling.nextElementSibling;
                if (skillSlider) {
                    skills[skillName] = parseInt(skillSlider.value);
                }
            }
        });

        const character = {
            "Character": {
                "Callsign": formData.get('callsign'),
                "temporary": false,
                "FirstName": formData.get('firstName'),
                "LastName": formData.get('lastName'),
                "Academic": parseInt(formData.get('academic')),
                "Athletic": parseInt(formData.get('athletic')),
                "Creative": parseInt(formData.get('creative')),
                "Social": parseInt(formData.get('social')),
                "Reactive": parseInt(formData.get('reactive')),
                "Technical": parseInt(formData.get('technical')),
                "SkillList": skills,
                "Quirks": formData.get('quirks').split(',').map(item => item.trim()),
                "occupation": formData.get('occupation'),
                "branch": formData.get('branch'),
                "rank": formData.get('rank'),
                "ribbons": formData.get('ribbons').split(',').map(item => item.trim()),
                "medals": formData.get('medals').split(',').map(item => item.trim()),
                "attitude": formData.get('attitude'),
                "faction": formData.get('faction'),
                "reputation": {},
                "inventory": {},
                "location": "",
                "relations": {},
                "PorT": formData.get('porT')
            },
            "Descriptions": {
                "Uniform": formData.get('uniformDesc')
            },
            "CurrentDesc": formData.get('currentDesc'),
            "achievements": {},
            "kills": []
        };

        const jsonOutput = document.getElementById('jsonOutput');
        jsonOutput.textContent = JSON.stringify(character, null, 2);

        // Create a Blob from the JSON string
        const blob = new Blob([JSON.stringify(character)], { type: "application/json" });

        // Create a temporary link element
        const link = document.createElement("a");

        // Create a URL for the Blob and set it as the href of the link
        const url = URL.createObjectURL(blob);
        link.href = url;
        const name = formData.get('callsign') || "player";
        // Set the download attribute to specify the filename
        link.download = name + ".json";

        // Trigger a click on the link to start the download
        link.click();

        // Clean up by revoking the ObjectURL
        URL.revokeObjectURL(url);
    }

    document.getElementById('generatorButton').addEventListener('click', generateJSON);
    document.getElementById('occupation').addEventListener('change', (event) => {
        updateSkills(event.target.value);
    });

    // Initial call to set up skills based on default occupation
    updateSkills(document.getElementById('occupation').value);
    
    // Initial update of attribute total
    updateAttributeValues();
});