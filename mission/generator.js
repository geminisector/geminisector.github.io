let navPointCount = -1;
let encounterCount = [];

let factions = [];
let factionChoices = new Map();
let shipChoices = new Map();
let envChoices = new Map();

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

async function fetchConfigurations() {
  try {
    const [factionsResponse, environmentsResponse] = await Promise.all([
      fetch("./factions.json"),
      fetch("./environments.json"),
    ]);

    factions = await factionsResponse.json();
    envChoices = await environmentsResponse.json();
  } catch (error) {
    console.error("Error fetching configurations:", error);
    alert("Failed to load configurations. Please check the JSON files.");
  }
  factions.forEach(elem => { shipChoices.set(elem['name'], elem['ships']) })
  factions.forEach(elem => { factionChoices.set(elem['name'], elem['help_text']) });
}

document
  .getElementById("jsonForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const json = generateJson(formData);

    // Display formatted JSON on regular generate button
    document.getElementById("generatedJson").textContent = JSON.stringify(
      json,
      null,
      2
    );
  });

document
  .getElementById("generateBase64Btn")
  .addEventListener("click", function () {
    const formData = new FormData(document.getElementById("jsonForm"));
    const json = generateJson(formData);

    // Minify the JSON (no spaces, no newlines)
    const minifiedJson = JSON.stringify(json);

    // Encode the minified JSON in Base64
    const base64EncodedJson = btoa(minifiedJson);

    // Create a Blob from the JSON string
    const blob = new Blob([base64EncodedJson], { type: "application/base64EncodedJson" });

    // Create a temporary link element
    const link = document.createElement("a");

    // Create a URL for the Blob and set it as the href of the link
    const url = URL.createObjectURL(blob);
    link.href = url;
    const name = json.mission.name || "mission";
    // Set the download attribute to specify the filename
    link.download = name + ".mission";

    // Trigger a click on the link to start the download
    link.click();

    // Clean up by revoking the ObjectURL
    URL.revokeObjectURL(url);
  });

document.addEventListener("DOMContentLoaded", () => {
  fetchConfigurations();
  addNavPoint();
  // The theme toggle is now handled by the separate theme-toggle.js
});

function addNavPoint() {
  navPointCount++;
  encounterCount[navPointCount] = 0;

  const container = document.getElementById("navPointsContainer");

  const navPointDiv = document.createElement("div");
  navPointDiv.classList.add('nav-point-section');
  navPointDiv.id = `navPoint${navPointCount}`;

  // Set the default values for the first nav point (Home: base)
  let navNameValue = `Nav ${navPointCount}`;
  let legendText = `Nav Point ${navPointCount}`;
  if (navPointCount === 0) {
    navNameValue = 'Home: base';
    legendText = 'Home: base';
  }

  navPointDiv.innerHTML = `<fieldset class="form-fieldset">
    <legend>${legendText}</legend>
    <div class="form-group">
      <label for="navName${navPointCount}">Name:</label>
      <input type="text" id="navName${navPointCount}" name="navName${navPointCount}" value="${navNameValue}">
    </div>
    <div class="form-group">
      <label for="navDescription${navPointCount}">Description:</label>
      <input type="text" id="navDescription${navPointCount}" name="navDescription${navPointCount}" placeholder="You see empty space.">
    </div>
    <div class="form-group">
      <label for="navEnv${navPointCount}">Environment:</label> 
      <select id="navEnv${navPointCount}" name="navEnv${navPointCount}">
        <option value="space" title="Typical encounter environment">Space</option>
        <option value="water" title="Underwater, high pression makes shields less effective as well as manoeuvering and sensors">Underwater</option>
        <option value="planet" title="Typical encounter environment">Planet Side</option>
        <option value="ion nebula" title="This wreaks havok with IFFs, Sensors and Shields">Ion Nebula</option>
        <option value="ice field" title="This enhances sensor resolution but causes damage to armor when shields are down.">Ice Field</option>
        <option value="solar winds" title="Basically a nebula, but on fire, and trying to kill you.">Solar Winds</option>
      </select>
    </div>
    
    <div class="encounters-container" id="encountersContainer${navPointCount}"></div>
    <div class="button-group">
      <button type="button" class="add-button" onclick="addEncounter(${navPointCount})">Add Encounter</button>
    </div>
  </fieldset>`;

  container.appendChild(navPointDiv);
}

function createFactionSelect(navPointNumber, encounterId) {
  // Create the <select> element
  const selectElement = document.createElement("select");
  selectElement.id = `encounterFaction${navPointNumber}-${encounterId}`;
  selectElement.name = `encounterFaction${navPointNumber}-${encounterId}`;
  selectElement.onchange = () => updateShipChoices(navPointNumber, encounterId, selectElement.value);

  // Loop through factionChoices and create option elements
  factionChoices.forEach((factionHelpText, factionName) => {
    const optionElement = document.createElement("option");
    optionElement.value = factionName.toLowerCase();  // Using faction name in lowercase as value
    optionElement.title = factionHelpText || "";  // Set title if help_text exists
    const remaining = factionName.substring(1);
    const first = factionName.charAt(0).toUpperCase();
    optionElement.textContent = first + remaining;  // Display name in the option

    // Optional: Set the default selection (if applicable)
    if (optionElement.value === "kilrathi") {
      optionElement.selected = true;
    }
    // Append the option to the select
    selectElement.appendChild(optionElement);
  });

  return selectElement;
}

function updateShipChoices(navPointNumber, encounterId, selectedFaction) {
  const shipChoicesList = shipChoices.get(selectedFaction) || [];
  const shipTypeInput = document.getElementById(`encounterShipType${navPointNumber}-${encounterId}`);
  const shipTypeDatalist = document.getElementById(`shipTypeDatalist${navPointNumber}-${encounterId}`);

  // Clear the datalist options
  if (shipTypeDatalist) {
    shipTypeDatalist.innerHTML = '';
    // Add new options based on selected faction
    shipChoicesList.forEach(ship => {
      const option = document.createElement("option");
      option.setAttribute("value", ship);
      shipTypeDatalist.appendChild(option);
    });

    // Set the datalist as the "list" for the shipTypeInput
    if (shipTypeInput) {
      shipTypeInput.setAttribute("list", shipTypeDatalist.id);
    }
  }
}

function addEncounter(navPointNumber) {
  encounterCount[navPointNumber]++;
  const encountersContainer = document.getElementById(
    `encountersContainer${navPointNumber}`
  );

  const encounterDiv = document.createElement("div");
  encounterDiv.classList.add("encounter-group");
  const encounterId = encounterCount[navPointNumber];

  const fieldset = document.createElement("fieldset");
  fieldset.classList.add("form-fieldset");

  const legend = document.createElement("legend");
  legend.textContent = `Encounter ${encounterId}`;
  fieldset.appendChild(legend);

  // Helper function to create form elements
  const createInput = (type, id, name, placeholder = '', value = '') => {
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = name;
    if (placeholder) input.placeholder = placeholder;
    if (value) input.value = value;
    return input;
  };

  const createLabel = (forAttr, text) => {
    const label = document.createElement('label');
    label.htmlFor = forAttr;
    label.textContent = text;
    return label;
  };

  const createSelect = (id, name, options, initialValue = '') => {
    const select = document.createElement('select');
    select.id = id;
    select.name = name;
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      option.title = opt.title;
      if (opt.value === initialValue) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    return select;
  };

  // Faction select
  const factionSelect = createFactionSelect(navPointNumber, encounterId);
  factionSelect.classList.add('form-select');
  fieldset.appendChild(createLabel(factionSelect.id, "Faction:"));
  fieldset.appendChild(factionSelect);

  // Number of Ships
  const numShipsInputId = `encounterNB${navPointNumber}-${encounterId}`;
  const numShipsLabel = createLabel(numShipsInputId, "Number of Ships: 2");
  const numShipsInput = createInput('range', numShipsInputId, numShipsInputId, '', '2');
  numShipsInput.min = '1';
  numShipsInput.max = '9';
  numShipsInput.oninput = () => numShipsLabel.textContent = `Number of Ships: ${numShipsInput.value}`;
  fieldset.appendChild(numShipsLabel);
  fieldset.appendChild(numShipsInput);

  // Ship Type
  const shipTypeInputId = `encounterShipType${navPointNumber}-${encounterId}`;
  const shipTypeInput = createInput('text', shipTypeInputId, shipTypeInputId);
  const shipTypeDatalist = document.createElement('datalist');
  shipTypeDatalist.id = `shipTypeDatalist${navPointNumber}-${encounterId}`;
  shipTypeInput.setAttribute('list', shipTypeDatalist.id);
  fieldset.appendChild(createLabel(shipTypeInputId, 'Ship Type:'));
  fieldset.appendChild(shipTypeInput);
  fieldset.appendChild(shipTypeDatalist);

  // Aggression
  const aggressionOptions = [
    { value: "fanatical", text: "Fanatical", title: "Will tend to attack with a more aggressive stance and with missiles more often." },
    { value: "confident", text: "Confident", title: "A balanced stance. Attacks with a mix of missiles and guns." },
    { value: "timid", text: "Timid", title: "A defensive stance, tends to attack mostly with guns and Friend or Foe missiles." }
  ];
  const aggressionSelect = createSelect(`encounterAggression${navPointNumber}-${encounterId}`, `encounterAggression${navPointNumber}-${encounterId}`, aggressionOptions);
  fieldset.appendChild(createLabel(aggressionSelect.id, 'Aggression:'));
  fieldset.appendChild(aggressionSelect);

  // Skill
  const skillOptions = [
    { value: "Ace", text: "Ace", title: "An ace is a good pilot, expect it to be a match for you" },
    { value: "Good", text: "Good", title: "A good pilot is very competent, in a good ship you are in trouble." },
    { value: "pro", text: "Pro", title: "A pro is as it says, someone who can fly well, they may not be showy, but they get the job done." },
    { value: "Fair", text: "Fair", title: "Fair is the run-of-the-mill pilot." },
    { value: "Poor", text: "Poor", title: "Poor is still dangerous in numbers, but one could afford to make some mistakes and come out on top against them" },
    { value: "novice", text: "Novice", title: "A rookie. They rely on luck to win or survive." },
    { value: "Pathetic", text: "Pathetic", title: "Target practice, don't expect any high flying here." }
  ];
  const skillSelect = createSelect(`encounterSkill${navPointNumber}-${encounterId}`, `encounterSkill${navPointNumber}-${encounterId}`, skillOptions);
  fieldset.appendChild(createLabel(skillSelect.id, 'Skill:'));
  fieldset.appendChild(skillSelect);

  // Probability
  const probabilityInput = createInput('range', `encounterProbability${navPointNumber}-${encounterId}`, `encounterProbability${navPointNumber}-${encounterId}`, '', '100');
  probabilityInput.min = '1';
  probabilityInput.max = '100';
  fieldset.appendChild(createLabel(probabilityInput.id, 'Probability:'));
  fieldset.appendChild(probabilityInput);

  // Name
  const nameInput = createInput('text', `encounterName${navPointNumber}-${encounterId}`, `encounterName${navPointNumber}-${encounterId}`, "Individual's name. Only use when there is 1 ship in this encounter.");
  fieldset.appendChild(createLabel(nameInput.id, 'Name:'));
  fieldset.appendChild(nameInput);

  // Team
  const teamInput = createInput('text', `encounterTeam${navPointNumber}-${encounterId}`, `encounterTeam${navPointNumber}-${encounterId}`, "Wing's name. If blank will use random faction wing name.");
  fieldset.appendChild(createLabel(teamInput.id, 'Team:'));
  fieldset.appendChild(teamInput);

  // Cargo
  const cargoInput = createInput('text', `encounterCargo${navPointNumber}-${encounterId}`, `encounterCargo${navPointNumber}-${encounterId}`, '{"grain":400, "iron":20}');
  fieldset.appendChild(createLabel(cargoInput.id, 'Cargo:'));
  fieldset.appendChild(cargoInput);

  // Opening Hail
  const commsInput = createInput('text', `encounterComms${navPointNumber}-${encounterId}`, `encounterComms${navPointNumber}-${encounterId}`, '"Identify yourself."');
  fieldset.appendChild(createLabel(commsInput.id, 'Opening Hail:'));
  fieldset.appendChild(commsInput);


  encounterDiv.appendChild(fieldset);
  encountersContainer.appendChild(encounterDiv);

  updateShipChoices(navPointNumber, encounterId, "kilrathi");
}

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
  if (_cargo) {
    const cargoHold = document.getElementById(`encounterCargo${navPointNumber}-${encounterCount}`);
    try {
      _cargo = JSON.parse(_cargo);
      // If successful, return the input field to default style (no red background)
      cargoHold.style.backgroundColor = "";
      forceRedraw(cargoHold);
    } catch (error) {
      // If parsing fails, change the background color to red
      cargoHold.style.backgroundColor = "red";
      alert(`Could not understand Cargo in Nav ${navPointNumber} Encounter ${encounterCount}:\n ${_cargo} \nPlease make sure it follows the format {\"Grain\":20,\"Tungsten\":10,...}`);
      forceRedraw(cargoHold);
      return null
    }
  }

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

var forceRedraw = function (element) {
  var disp = element.style.display;
  element.style.display = 'none';
  var trick = element.offsetHeight;
  element.style.display = disp;
};
