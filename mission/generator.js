let navPointCount = 0;
let encounterCount = 0;

function addNavPoint() {
  navPointCount++;
  encounterCount = 0;

  const container = document.getElementById("navPointsContainer");

  const navPointDiv = document.createElement("div");
  navPointDiv.id = `navPoint${navPointCount}`;

  navPointDiv.innerHTML = `
    <h3>Nav Point ${navPointCount}</h3>
    <label for="navDescription${navPointCount}">Description:</label>
    <input type="text" id="navDescription${navPointCount}" name="navDescription${navPointCount}"><br>
    <label for="encounter${navPointCount}">Encounter:</label>
    <button type="button" onclick="addEncounter(${navPointCount})">Add Encounter</button><br>
    <div id="encountersContainer${navPointCount}"></div>
  `;

  container.appendChild(navPointDiv);
}

function addEncounter(navPointNumber) {
  encounterCount++;
  const encountersContainer = document.getElementById(
    `encountersContainer${navPointNumber}`
  );

  const encounterDiv = document.createElement("div");
  encounterDiv.classList.add("encounter");

  encounterDiv.innerHTML = `
    <h4>Encounter ${navPointNumber}-${encounterCount}</h4>
    <label for="encounterNB${navPointNumber}-${encounterCount}">NB:</label>
    <input type="range" value=2 min=1 max=9 id="encounterNB${navPointNumber}-${encounterCount}" name="encounterNB${navPointNumber}-${encounterCount}"><br>

    <label for="encounterFaction${navPointNumber}-${encounterCount}">Faction:</label>
    <select id="encounterFaction${navPointNumber}-${encounterCount}" name="encounterFaction${navPointNumber}-${encounterCount}"><option value="kilrathi"> Kilrathi</option><option value="confederation">Confederation</option>
    <option value="Bounty Hunter">Bounty Hunter</option>
    <option value="Pirate">Pirate</option>
    <option value="Retro">Retro</option></select>
    <br>
    <label for="encounterShipType${navPointNumber}-${encounterCount}">ShipType:</label>
    <input type="text" id="encounterShipType${navPointNumber}-${encounterCount}" name="encounterShipType${navPointNumber}-${encounterCount}"><br>
    <label for="encounterAggression${navPointNumber}-${encounterCount}">Aggression:</label>
    <select id="encounterAggression${navPointNumber}-${encounterCount}" name="encounterAggression${navPointNumber}-${encounterCount}">
    <option value="fanatical">Fanatical</option>
    <option value="confident">Confident</option>
    <option value="timid">Timid</option>
    </select><br>
    <label for="encounterSkill${navPointNumber}-${encounterCount}">Skill:</label>
    <select id="encounterSkill${navPointNumber}-${encounterCount}" name="encounterSkill${navPointNumber}-${encounterCount}">
    <option value="Ace">Ace</option>
    <option value="Good">Good</option>
    <option value="pro">Pro</option>
    <option value="Fair">Fair</option>
    <option value="Poor">Poor</option>
    <option value="novice">Novice</option>
    <option value="Pathetic">Pathetic</option>
    </select><br>
    <label for="encounterProbability${navPointNumber}-${encounterCount}">Probability:</label>
    <input type="range" min=1 max=100 id="encounterProbability${navPointNumber}-${encounterCount}" name="encounterProbability${navPointNumber}-${encounterCount}"><br>
    
    <label for="encounterName${navPointNumber}-${encounterCount}">Name:</label>
    <input type="text" id="encounterName${navPointNumber}-${encounterCount}" name="encounterName${navPointNumber}-${encounterCount}"><br>
    
    <label for="encounterTeam${navPointNumber}-${encounterCount}">Team:</label><input type="text" id="encounterTeam${navPointNumber}-${encounterCount}" name="encounterTeam${navPointNumber}-${encounterCount}"><br>
    
    <label for="encounterCargo${navPointNumber}-${encounterCount}">Cargo:</label>
    <input type="text" id="encounterCargo${navPointNumber}-${encounterCount}" name="encounterCargo${navPointNumber}-${encounterCount}"><br>
        <label for="encounterComms${navPointNumber}-${encounterCount}">Opening Hail:</label>
    <input type="text" id="encounterComms${navPointNumber}-${encounterCount}" name="encounterComms${navPointNumber}-${encounterCount}"><br>`;
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
    const navPointKey = `$nav${i}`;
    const navDescription = formData.get(`navDescription${i}`);

    encounters = [];
    let encounterIndex = 1;
    encounter = generateEncounters(formData, i, encounterIndex);
    while (encounter) {
      encounters.push(encounter);
      encounterIndex++;
      encounter = generateEncounters(formData, i, encounterIndex);
    }
    mission.nav_points[navPointKey] = {
      descr: navDescription,
      encounters: [[encounters]],
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
