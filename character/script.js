document.addEventListener('DOMContentLoaded', () => {
    const sliders = ['academic', 'athletic', 'creative', 'social', 'reactive', 'technical'];
    const totalSum = 32;
    
    function updateSliderValues() {
        const values = sliders.map(id => parseInt(document.getElementById(id).value));
        const sum = values.reduce((a, b) => a + b, 0);

        if (sum > totalSum) {
            const diff = sum - totalSum;
            for (let i = sliders.length - 1; i >= 0; i--) {
                const slider = document.getElementById(sliders[i]);
                const value = parseInt(slider.value);
                if (value > diff) {
                    slider.value = value - diff;
                    break;
                } else {
                    slider.value = 0;
                }
            }
        }

        sliders.forEach(id => {
            document.getElementById(`${id}Value`).textContent = document.getElementById(id).value;
        });
    }

    sliders.forEach(id => {
        const slider = document.getElementById(id);
        slider.addEventListener('input', updateSliderValues);
    });

    function generateJSON() {
        const form = document.getElementById('characterForm');
        const formData = new FormData(form);
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
                "SkillList": JSON.parse(formData.get('skillList')),
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
            "kills": {}
        };

        const jsonOutput = document.getElementById('jsonOutput');
        jsonOutput.textContent = JSON.stringify(character, null, 2);
    }

    document.querySelector('button').addEventListener('click', generateJSON);
});

