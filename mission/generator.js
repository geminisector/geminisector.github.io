let navPointCount = 0;
let encounterCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
    });
});

function addNavPoint() {
    navPointCount++;
    encounterCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const container = document.getElementById("navPointsContainer");

    const navPointDiv = document.createElement("div");
    navPointDiv.id = `navPoint${navPointCount}`;

    navPointDiv.innerHTML = `<fieldset>
    <legend>Nav Point ${navPointCount}</legend>
    <label for="navName${navPointCount}">Name:</label><input type="text" id="navName${navPointCount}" name="navName${navPointCount}" value="Nav ${navPointCount}"><br>
    <label for="navDescription${navPointCount}">Description:</label>
    <input type="text" id="navDescription${navPointCount}" name="navDescription${navPointCount}"><br>
    <label for="encounter${navPointCount}">Encounter:</label>
    <div id="encountersContainer${navPointCount}"></div>
    <button type="button" onclick="addEncounter(${navPointCount})">Add Encounter to Nav ${navPointCount}</button><br>
    </fieldset>
  `;

    container.appendChild(navPointDiv);
}

function addEncounter(navPointNumber) {

    encounterCount[navPointNumber]++;
    const encountersContainer = document.getElementById(
        `encountersContainer${navPointNumber}`
    );

    const encounterDiv = document.createElement("div");
    encounterDiv.classList.add("encounter");

    encounterDiv.innerHTML = `<fieldset>
    <legend>Encounter ${navPointNumber}-${encounterCount[navPointNumber]}</legend>
    <label for="encounterNB${navPointNumber}-${encounterCount[navPointNumber]}">NB:</label>
    <input type="range" value=2 min=1 max=9 id="encounterNB${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterNB${navPointNumber}-${encounterCount[navPointNumber]}"><br>

    <label for="encounterFaction${navPointNumber}-${encounterCount[navPointNumber]}">Faction:</label>
    <select id="encounterFaction${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterFaction${navPointNumber}-${encounterCount[navPointNumber]}"><option value="kilrathi"> Kilrathi</option><option value="confederation">Confederation</option>
    <option value="Bounty Hunter">Bounty Hunter</option>
    <option value="Pirate">Pirate</option>
    <option value="Retro">Retro</option></select>
    <br>
    <label for="encounterShipType${navPointNumber}-${encounterCount[navPointNumber]}">ShipType:</label>
    <input type="text" id="encounterShipType${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterShipType${navPointNumber}-${encounterCount[navPointNumber]}"><br>
    <label for="encounterAggression${navPointNumber}-${encounterCount[navPointNumber]}">Aggression:</label>
    <select id="encounterAggression${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterAggression${navPointNumber}-${encounterCount[navPointNumber]}">
    <option value="fanatical">Fanatical</option>
    <option value="confident">Confident</option>
    <option value="timid">Timid</option>
    </select><br>
    <label for="encounterSkill${navPointNumber}-${encounterCount[navPointNumber]}">Skill:</label>
    <select id="encounterSkill${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterSkill${navPointNumber}-${encounterCount[navPointNumber]}">
    <option value="Ace">Ace</option>
    <option value="Good">Good</option>
    <option value="pro">Pro</option>
    <option value="Fair">Fair</option>
    <option value="Poor">Poor</option>
    <option value="novice">Novice</option>
    <option value="Pathetic">Pathetic</option>
    </select><br>
    <label for="encounterProbability${navPointNumber}-${encounterCount[navPointNumber]}">Probability:</label>
    <input type="range" min=1 max=100 id="encounterProbability${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterProbability${navPointNumber}-${encounterCount[navPointNumber]}"><br>
    
    <label for="encounterName${navPointNumber}-${encounterCount[navPointNumber]}">Name:</label>
    <input type="text" id="encounterName${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterName${navPointNumber}-${encounterCount[navPointNumber]}"><br>
    
    <label for="encounterTeam${navPointNumber}-${encounterCount[navPointNumber]}">Team:</label><input type="text" id="encounterTeam${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterTeam${navPointNumber}-${encounterCount[navPointNumber]}"><br>
    
    <label for="encounterCargo${navPointNumber}-${encounterCount[navPointNumber]}">Cargo:</label>
    <input type="text" id="encounterCargo${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterCargo${navPointNumber}-${encounterCount[navPointNumber]}"><br>
        <label for="encounterComms${navPointNumber}-${encounterCount[navPointNumber]}">Opening Hail:</label>
    <input type="text" id="encounterComms${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterComms${navPointNumber}-${encounterCount[navPointNumber]}"><br>`;
    encountersContainer.appendChild(encounterDiv);
}

document
    .getElementById("jsonForm")
    .addEventListener("submit", function (event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const json = generateJson(formData);

        document.getElementById("generatedJson").textContent = JSON.stringify(
            json,
            null,
            2
        );
    });

function generateJson(formData) {
    const mission = {
        description: formData.get("missionDescription"),
        nav_points: {},
    };

    for (let i = 1; i <= navPointCount; i++) {
        const navPointKey = formData.get(`navName${i}`);
        const navDescription = formData.get(`navDescription${i}`);

        let encounters = [];
        let encounterIndex = 1;
        let encounter = generateEncounters(formData, i, encounterIndex);
        while (encounter) {
            encounters.push(encounter);
            encounterIndex++;
            encounter = generateEncounters(formData, i, encounterIndex);
        }
        mission.nav_points[navPointKey] = {
            descr: navDescription,
            encounters: [encounters],
        };
    }

    return {
        mission: mission,
    };
}

function generateEncounters(formData, navPointNumber, encounterCount) {
    if (!formData.has(`encounterNB${navPointNumber}-${encounterCount}`)) {
        return null;
    }

    _name = formData.get(`encounterName${navPointNumber}-${encounterCount}`);
    _team = formData.get(`encounterTeam${navPointNumber}-${encounterCount}`);
    _cargo = formData.get(`encounterCargo${navPointNumber}-${encounterCount}`);
    _comms = formData.get(`encounterComms${navPointNumber}-${encounterCount}`);
    const encounter = {
        nb: formData.get(`encounterNB${navPointNumber}-${encounterCount}`),
        faction: formData.get(
            `encounterFaction${navPointNumber}-${encounterCount}`
        ),
        ship_type: formData.get(
            `encounterShipType${navPointNumber}-${encounterCount}`
        ),
        pilot:
            formData.get(`encounterAggression${navPointNumber}-${encounterCount}`) +
            " " +
            formData.get(`encounterSkill${navPointNumber}-${encounterCount}`),
        probability: formData.get(
            `encounterProbability${navPointNumber}-${encounterCount}`
        ),
        ...(_name && { name: _name }),
        ...(_team && { team: _team }),
        ...(_cargo && { cargo: _cargo }),
        ...(_comms && { comms: _comms }),
    };

    return encounter;
}

