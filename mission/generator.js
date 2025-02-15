let navPointCount = 0;
let encounterCount = 0;

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

document.addEventListener("DOMContentLoaded", () => {
  fetchConfigurations();
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
  shipTypeDatalist.innerHTML = '';

  // Add new options based on selected faction
  shipChoicesList.forEach(ship => {
    const option = document.createElement("option");
    option.setAttribute("value", ship);
    shipTypeDatalist.appendChild(option);
  });

  // Set the datalist as the "list" for the shipTypeInput
  shipTypeInput.setAttribute("list", shipTypeDatalist.id);
}

function addEncounter(navPointNumber) {
  encounterCount[navPointNumber]++;
  const encountersContainer = document.getElementById(
    `encountersContainer${navPointNumber}`
  );

  const encounterDiv = document.createElement("div");
  encounterDiv.classList.add("encounter");
  const encounterId = encounterCount[navPointNumber];

  // Create a fieldset element for the encounter details
  const fieldset = document.createElement("fieldset");

  // Create the legend element
  const legend = document.createElement("legend");
  legend.textContent = `Encounter ${navPointNumber}-${encounterId}`;
  fieldset.appendChild(legend);
  // Create the label element for "Faction"
  const factionLabel = document.createElement("label");
  factionLabel.textContent = "Faction: ";

  // Create the select element for factions
  const factionSelect = createFactionSelect(navPointNumber, encounterId);

  // Append the label and the select to the encounterDiv
  fieldset.appendChild(factionLabel);
  fieldset.appendChild(factionSelect);

  // Create the "Number of Ships" label and input (range)
  const numShipsLabel = document.createElement("label");
  numShipsLabel.setAttribute("for", `encounterNB${navPointNumber}-${encounterId}`);
  numShipsLabel.textContent = "Number of Ships:";
  numShipsLabel.setAttribute("id", `encounterNBl${navPointNumber}-${encounterId}`);
  const numShipsInput = document.createElement("input");
  numShipsInput.setAttribute("type", "range");
  numShipsInput.setAttribute("value", "2");
  numShipsInput.setAttribute("min", "1");
  numShipsInput.setAttribute("max", "9");
  numShipsInput.setAttribute("id", `encounterNB${navPointNumber}-${encounterId}`);
  numShipsInput.setAttribute("name", `encounterNB${navPointNumber}-${encounterId}`);
  numShipsInput.setAttribute("oninput", `updateEncounterLabel(${navPointNumber}, ${encounterId})`);

  fieldset.appendChild(numShipsLabel);
  fieldset.appendChild(numShipsInput);

  // Create the "ShipType" label and input (text)
  const shipTypeLabel = document.createElement("label");
  shipTypeLabel.setAttribute("for", `encounterShipType${navPointNumber}-${encounterId}`);
  shipTypeLabel.textContent = "ShipType:";
  const shipTypeInput = document.createElement("input");
  shipTypeInput.setAttribute("type", "text");
  shipTypeInput.setAttribute("id", `encounterShipType${navPointNumber}-${encounterId}`);
  shipTypeInput.setAttribute("name", `encounterShipType${navPointNumber}-${encounterId}`);
  const shipTypeDatalist = document.createElement("datalist");
  shipTypeDatalist.setAttribute("id", `shipTypeDatalist${navPointNumber}-${encounterId}`);

  fieldset.appendChild(shipTypeLabel);
  fieldset.appendChild(shipTypeInput);
  fieldset.appendChild(shipTypeDatalist);


  // Create the "Aggression" label and select
  const aggressionLabel = document.createElement("label");
  aggressionLabel.setAttribute("for", `encounterAggression${navPointNumber}-${encounterId}`);
  aggressionLabel.textContent = "Aggression:";
  const aggressionSelect = document.createElement("select");
  aggressionSelect.setAttribute("id", `encounterAggression${navPointNumber}-${encounterId}`);
  aggressionSelect.setAttribute("name", `encounterAggression${navPointNumber}-${encounterId}`);

  // Create aggression options
  const options = [
    { value: "fanatical", text: "Fanatical", title: "Will tend to attack with a more aggressive stance and with missiles more often." },
    { value: "confident", text: "Confident", title: "A balanced stance. Attacks with a mix of missiles and guns." },
    { value: "timid", text: "Timid", title: "A defensive stance, tends to attack mostly with guns and Friend or Foe missiles." }
  ];

  options.forEach(option => {
    const optElement = document.createElement("option");
    optElement.setAttribute("value", option.value);
    optElement.setAttribute("title", option.title);
    optElement.textContent = option.text;
    aggressionSelect.appendChild(optElement);
  });

  fieldset.appendChild(aggressionLabel);
  fieldset.appendChild(aggressionSelect);

  // Create the "Skill" label and select
  const skillLabel = document.createElement("label");
  skillLabel.setAttribute("for", `encounterSkill${navPointNumber}-${encounterId}`);
  skillLabel.textContent = "Skill:";
  const skillSelect = document.createElement("select");
  skillSelect.setAttribute("id", `encounterSkill${navPointNumber}-${encounterId}`);
  skillSelect.setAttribute("name", `encounterSkill${navPointNumber}-${encounterId}`);

  // Create skill options
  const skillOptions = [
    { value: "Ace", text: "Ace", title: "An ace is a good pilot, expect it to be a match for you" },
    { value: "Good", text: "Good", title: "A good pilot is very competent, in a good ship you are in trouble." },
    { value: "pro", text: "Pro", title: "A pro is as it says, someone who can fly well, they may not be showy, but they get the job done." },
    { value: "Fair", text: "Fair", title: "Fair is the run-of-the-mill pilot." },
    { value: "Poor", text: "Poor", title: "Poor is still dangerous in numbers, but one could afford to make some mistakes and come out on top against them" },
    { value: "novice", text: "Novice", title: "A rookie. They rely on luck to win or survive." },
    { value: "Pathetic", text: "Pathetic", title: "Target practice, don't expect any high flying here." }
  ];

  skillOptions.forEach(option => {
    const optElement = document.createElement("option");
    optElement.setAttribute("value", option.value);
    optElement.setAttribute("title", option.title);
    optElement.textContent = option.text;
    skillSelect.appendChild(optElement);
  });

  fieldset.appendChild(skillLabel);
  fieldset.appendChild(skillSelect);

  // Create the "Probability" label and input (range)
  const probabilityLabel = document.createElement("label");
  probabilityLabel.setAttribute("for", `encounterProbability${navPointNumber}-${encounterId}`);
  probabilityLabel.textContent = "Probability:";
  const probabilityInput = document.createElement("input");
  probabilityInput.setAttribute("type", "range");
  probabilityInput.setAttribute("min", "1");
  probabilityInput.setAttribute("max", "100");
  probabilityInput.setAttribute("id", `encounterProbability${navPointNumber}-${encounterId}`);
  probabilityInput.setAttribute("name", `encounterProbability${navPointNumber}-${encounterId}`);

  fieldset.appendChild(probabilityLabel);
  fieldset.appendChild(probabilityInput);

  // Create the "Name" label and input (text)
  const nameLabel = document.createElement("label");
  nameLabel.setAttribute("for", `encounterName${navPointNumber}-${encounterId}`);
  nameLabel.textContent = "Name:";
  const nameInput = document.createElement("input");
  nameInput.setAttribute("type", "text");
  nameInput.setAttribute("id", `encounterName${navPointNumber}-${encounterId}`);
  nameInput.setAttribute("name", `encounterName${navPointNumber}-${encounterId}`);
  nameInput.setAttribute("placeholder", "Individual's name. Only use when there is 1 ship in this encounter.");

  fieldset.appendChild(nameLabel);
  fieldset.appendChild(nameInput);

  // Create the "Team" label and input (text)
  const teamLabel = document.createElement("label");
  teamLabel.setAttribute("for", `encounterTeam${navPointNumber}-${encounterId}`);
  teamLabel.textContent = "Team:";
  const teamInput = document.createElement("input");
  teamInput.setAttribute("type", "text");
  teamInput.setAttribute("id", `encounterTeam${navPointNumber}-${encounterId}`);
  teamInput.setAttribute("name", `encounterTeam${navPointNumber}-${encounterId}`);
  teamInput.setAttribute("placeholder", "Wing's name. If blank will use random faction wing name.");

  fieldset.appendChild(teamLabel);
  fieldset.appendChild(teamInput);

  // Create the "Cargo" label and input (text)
  const cargoLabel = document.createElement("label");
  cargoLabel.setAttribute("for", `encounterCargo${navPointNumber}-${encounterId}`);
  cargoLabel.textContent = "Cargo:";
  const cargoInput = document.createElement("input");
  cargoInput.setAttribute("type", "text");
  cargoInput.setAttribute("id", `encounterCargo${navPointNumber}-${encounterId}`);
  cargoInput.setAttribute("name", `encounterCargo${navPointNumber}-${encounterId}`);
  cargoInput.setAttribute("placeholder", '{"grain":400, "iron":20}');

  fieldset.appendChild(cargoLabel);
  fieldset.appendChild(cargoInput);

  // Create the "Opening Hail" label and input (text)
  const commsLabel = document.createElement("label");
  commsLabel.setAttribute("for", `encounterComms${navPointNumber}-${encounterId}`);
  commsLabel.textContent = "Opening Hail:";
  const commsInput = document.createElement("input");
  commsInput.setAttribute("type", "text");
  commsInput.setAttribute("id", `encounterComms${navPointNumber}-${encounterId}`);
  commsInput.setAttribute("name", `encounterComms${navPointNumber}-${encounterId}`);
  commsInput.setAttribute("placeholder", '"Identify yourself."');

  fieldset.appendChild(commsLabel);
  fieldset.appendChild(commsInput);

  // Append the fieldset to the encounterDiv
  encounterDiv.appendChild(fieldset);

  // Append the encounterDiv to the container
  encountersContainer.appendChild(encounterDiv);

  // Call other necessary update functions
  updateEncounterLabel(navPointNumber, encounterId);
  updateShipChoices(navPointNumber, encounterId, "kilrathi");
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

var forceRedraw = function(element){
  var disp = element.style.display;
  element.style.display = 'none';
  var trick = element.offsetHeight;
  element.style.display = disp;
};