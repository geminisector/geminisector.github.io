let navPointCount = 0;
let encounterCount = 0;

let shipChoices = {
  confederation: [
    "Stiletto",
    "RapierII",
    "Sabre-F",
    "Broadsword",
    "Venture",
    "Drayman",
  ],
  Pirate: ["Talon", "Galaxy", "Orion", "Tarsus"],
  kilrathi: ["Dralthi", "Krant", "Drakhri", "Jalthi", "Kamekh", "Dorkir"],
  Retro: ["Talon", "Talon-R", "Tarsus"],
  "Bounty Hunter": ["Talon", "Demon", "Orion", "Raptor"],
};

let envChoices = {
  space: {},
  water: {
    bg: "img/underwater.png",
    shield_reduce_percent: 0.5,
    sensors_enhance: -1.0,
    atmosphere: 2.0,
  },
  planet: {
    shield_reduce: 1.0,
    shield_reduce_percent: 0.0,
    armor_reduce: 1.0,
    sensors_enhance: -0.5,
    atmosphere: 0.5,
    bg: "img/planet.png",
  },
  "ion nebula": {
    shield_reduce: 3.0,
    shield_reduce_percent: 0.0,
    sensors_enhance: -0.5,
    bg: "img/yellow_nebula.png",
  },
  "ice field": {
    shield_reduce: 0.0,
    shield_reduce_percent: 0.0,
    sensors_enhance: 1.0,
    armor_reduce: 0.5,
    bg: "img/ice.png",
  },
};
// Function to generate datalists dynamically
function generateDatalists() {
  const datalistContainer = document.getElementById("datalistContainer");

  // Loop through the shipChoices object
  for (let faction in shipChoices) {
    // Create a datalist element
    const datalist = document.createElement("datalist");
    datalist.id = faction;

    // Loop through the array of ship types for each faction
    shipChoices[faction].forEach((ship) => {
      const option = document.createElement("option");
      option.value = ship;
      datalist.appendChild(option);
    });

    // Append the datalist to the container
    datalistContainer.appendChild(datalist);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById("theme-toggle");
  generateDatalists();
  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });
});

function addNavPoint() {
  navPointCount++;
  encounterCount = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];

  const container = document.getElementById("navPointsContainer");

  const navPointDiv = document.createElement("div");
  navPointDiv.id = `navPoint${navPointCount}`;

  navPointDiv.innerHTML = `<fieldset>
    <legend>Nav Point ${navPointCount}</legend>
    <label for="navName${navPointCount}">Name:</label><input type="text" id="navName${navPointCount}" name="navName${navPointCount}" value="Nav ${navPointCount}"><br>
    <label for="navDescription${navPointCount}">Description:</label>
    <input type="text" id="navDescription${navPointCount}" name="navDescription${navPointCount}" placeholder="You see empty space."><br>
    <label for="navEnv${navPointCount}">Environment:</label> 
    <select id="navEnv${navPointCount}" name="navEnv${navPointCount}">
    <option value="space" title="Typical encounter environment">Space</option>
    <option value="water" title="Underwater, high pression makes shields less effective as well as manoeuvering and sensors">Underwater</option>
    <option value="planet" title="Typical encounter environment">Planet Side</option>
    <option value="ion nebula" title="This wreaks havok with IFFs, Sensors and Shields">Ion Nebula</option>
    <option value="ice field" title="This enhances sensor resolution but causes damage to armor when shields are down.">Ice Field</option></select>
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
    <label id="encounterNBl${navPointNumber}-${encounterCount[navPointNumber]}" 
    for="encounterNB${navPointNumber}-${encounterCount[navPointNumber]}">Number of Ships:</label>
    <input type="range" value="2" min="1" max="9" id="encounterNB${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterNB${navPointNumber}-${encounterCount[navPointNumber]}" oninput="updateEncounterLabel(${navPointNumber}, ${encounterCount[navPointNumber]})"><br>
    <label for="encounterFaction${navPointNumber}-${encounterCount[navPointNumber]}">Faction:</label>
    <select id="encounterFaction${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterFaction${navPointNumber}-${encounterCount[navPointNumber]}" onchange="updateShipDatalist(${navPointNumber}, ${encounterCount[navPointNumber]})">
    <option value="kilrathi" selected title="Typical enemies, violent alient race."> Kilrathi</option>
    <option value="confederation" title="The human military, here to protect">Confederation</option>
    <option value="Bounty Hunter" title="Bounty hunters are armed civilians with deadly intent.">Bounty Hunter</option>
    <option value="Pirate" title="Thieves, scoundrels and ruffians.">Pirate</option>
    <option value="Retro" title="Religious Zealots, often lacking coherent thought, they hate technology.">Retro</option></select>
    <br>
    <label id="lbEncounterShipType${navPointNumber}-${encounterCount[navPointNumber]}" for="encounterShipType${navPointNumber}-${encounterCount[navPointNumber]}" list="kilrathi">ShipType:</label>
    <input type="text" id="encounterShipType${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterShipType${navPointNumber}-${encounterCount[navPointNumber]}"><br>
    <label for="encounterAggression${navPointNumber}-${encounterCount[navPointNumber]}">Aggression:</label>
    <select id="encounterAggression${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterAggression${navPointNumber}-${encounterCount[navPointNumber]}">
    <option value="fanatical" title="Will tend to attack with a more aggressive stance and with missiles more often.">Fanatical</option>
    <option value="confident" title="A balanced stance. Attacks with a mix of missiles and guns.">Confident</option>
    <option value="timid" title="A defensive stance, tends to attack mostly with guns and Friend or Foe missiles.">Timid</option>
    </select><br>
    <label for="encounterSkill${navPointNumber}-${encounterCount[navPointNumber]}">Skill:</label>
    <select id="encounterSkill${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterSkill${navPointNumber}-${encounterCount[navPointNumber]}">
    <option value="Ace" title="An ace is a good pilot, expect it to be a match for you">Ace</option>
    <option value="Good" title="An good pilot is very competent, in a good ship you are in trouble.">Good</option>
    <option value="pro" title="A pro is as it says, someone who can fly well, they may not be showy, but they get the job done.">Pro</option>
    <option value="Fair" selected title="Fair is the run of the mill pilot.">Fair</option>
    <option value="Poor" title="Poor is still dangerous in numbers, but one could afford to make some mistakes and come out on top against them">Poor</option>
    <option value="novice" title="A rookie. They rely on luck to win or survive.">Novice</option>
    <option value="Pathetic" title="Target practice, don't expect any high flying here. Avoid using on trained pilots.">Pathetic</option>
    </select><br>
    <label for="encounterProbability${navPointNumber}-${encounterCount[navPointNumber]}">Probability:</label>
    <input type="range" min=1 max=100 id="encounterProbability${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterProbability${navPointNumber}-${encounterCount[navPointNumber]}"><br>
    
    <label for="encounterName${navPointNumber}-${encounterCount[navPointNumber]}">Name:</label>
    <input type="text" id="encounterName${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterName${navPointNumber}-${encounterCount[navPointNumber]}" placeholder="Individual's name. Only use when there is 1 ship in this encounter."><br>
    
    <label for="encounterTeam${navPointNumber}-${encounterCount[navPointNumber]}">Team:</label><input type="text" id="encounterTeam${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterTeam${navPointNumber}-${encounterCount[navPointNumber]}"placeholder="Wing's name. If blank will use random faction wing name."><br>
    
    <label for="encounterCargo${navPointNumber}-${encounterCount[navPointNumber]}">Cargo:</label>
    <input type="text" id="encounterCargo${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterCargo${navPointNumber}-${encounterCount[navPointNumber]}" placeholder='e.g. {\"grain\":400, \"iron\":20}'><br>
        <label for="encounterComms${navPointNumber}-${encounterCount[navPointNumber]}">Opening Hail:</label>
    <input type="text" id="encounterComms${navPointNumber}-${encounterCount[navPointNumber]}" name="encounterComms${navPointNumber}-${encounterCount[navPointNumber]}" placeholder='e.g. \"Identify yourself.\"'><br>`;
  encountersContainer.appendChild(encounterDiv);
  updateEncounterLabel(navPointNumber, encounterCount[navPointNumber]);
  updateShipDatalist(navPointNumber, encounterCount[navPointNumber]);
}

function updateEncounterLabel(navPointNumber, encounterCount) {
  const slider = document.getElementById(
    `encounterNB${navPointNumber}-${encounterCount}`
  );
  const label = document.getElementById(
    `encounterNBl${navPointNumber}-${encounterCount}`
  );
  label.textContent = `Number of Ships: ${slider.value}`;
}

function updateShipDatalist(navPointNumber, encounterCount) {
  const faction = document.getElementById(
    `encounterFaction${navPointNumber}-${encounterCount}`
  ).value;
  const shipTypeInput = document.getElementById(
    `encounterShipType${navPointNumber}-${encounterCount}`
  );
  if (faction in shipChoices) shipTypeInput.setAttribute("list", faction);
  else shipTypeInput.removeAttribute("list");
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
    name: formData.get("missionName"),
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
    environment = envChoices[formData.get(`navEnv${i}`)];
    console.log(formData.get(`navEnv${i}`));
    mission.nav_points[navPointKey] = {
      descr: navDescription,
      encounters: [encounters],
      environment: environment,
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
