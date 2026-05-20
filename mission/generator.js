let navPointCount = -1;
let encounterCount = [];
let rewardCount = 0;

let factions = [];
let factionChoices = new Map();
let shipChoices = new Map();
let envChoices = new Map();

const REWARD_CONDITIONS = [
  { value: "success",          label: "Success",          title: "All required objectives completed." },
  { value: "failure",          label: "Failure",          title: "Any required objective incomplete." },
  { value: "no_casualties",    label: "No Casualties",    title: "All hero-team combatants alive at mission end." },
  { value: "friendly_fire",    label: "Friendly Fire",    title: "A hero damaged another hero during combat." },
];

const OBJECTIVE_TYPES = [
  { value: "destroy",  label: "Destroy",  title: "Kill a named target or enemy_squadron (all non-hero enemies)" },
  { value: "scan",     label: "Scan",     title: "Successfully scan a named target" },
  { value: "escort",   label: "Escort",   title: "A named combatant must survive until mission end" },
  { value: "defend",   label: "Defend",   title: "A named combatant must survive until mission end" },
  { value: "navigate", label: "Navigate", title: "Heroes must visit a specific nav point" },
  { value: "capture",  label: "Capture",  title: "Target must be scanned, hacked, and alive at mission end" },
];

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

document.addEventListener("DOMContentLoaded", async () => {
  await fetchConfigurations();
  addNavPoint();
  addDefaultReward();
});

// ─── REWARDS ────────────────────────────────────────────────────────────────

function addDefaultReward() {
  // Add a default "success" reward row so the form is never empty
  addReward("success", "confederation", 5, 1000);
}

function addReward(defaultCondition = "success", defaultFaction = "confederation", defaultRep = 5, defaultCredits = 1000) {
  rewardCount++;
  const id = rewardCount;
  const container = document.getElementById("rewardsContainer");

  const row = document.createElement("div");
  row.classList.add("reward-row");
  row.id = `reward${id}`;

  // ── Condition input with datalist ──
  const condInput = document.createElement("input");
  condInput.type = "text";
  condInput.id = `rewardCondition${id}`;
  condInput.name = `rewardCondition${id}`;
  condInput.classList.add("reward-condition-input");
  condInput.setAttribute("list", "rewardConditionsList");
  condInput.value = defaultCondition;
  condInput.placeholder = "e.g. success, exact_kill:Name";

  // ── Faction select ──
  const facSelect = document.createElement("select");
  facSelect.id = `rewardFaction${id}`;
  facSelect.name = `rewardFaction${id}`;
  facSelect.classList.add("reward-faction-select");
  factionChoices.forEach((helpText, factionName) => {
    const opt = document.createElement("option");
    opt.value = factionName.toLowerCase();
    opt.title = helpText || "";
    opt.textContent = factionName.charAt(0).toUpperCase() + factionName.slice(1);
    if (factionName.toLowerCase() === defaultFaction.toLowerCase()) opt.selected = true;
    facSelect.appendChild(opt);
  });

  // ── Rep input ──
  const repLabel = document.createElement("label");
  repLabel.textContent = "Rep:";
  repLabel.htmlFor = `rewardRep${id}`;
  repLabel.classList.add("reward-inline-label");

  const repInput = document.createElement("input");
  repInput.type = "number";
  repInput.id = `rewardRep${id}`;
  repInput.name = `rewardRep${id}`;
  repInput.value = defaultRep;
  repInput.min = "-100";
  repInput.max = "100";
  repInput.classList.add("reward-rep-input");
  repInput.title = "Reputation change (negative = penalty)";

  // ── Credits input ──
  const credLabel = document.createElement("label");
  credLabel.textContent = "Credits:";
  credLabel.htmlFor = `rewardCredits${id}`;
  credLabel.classList.add("reward-inline-label");

  const credInput = document.createElement("input");
  credInput.type = "number";
  credInput.id = `rewardCredits${id}`;
  credInput.name = `rewardCredits${id}`;
  credInput.value = defaultCredits;
  credInput.min = "0";
  credInput.step = "50";
  credInput.classList.add("reward-credits-input");
  credInput.title = "Credit payout for this condition";

  // ── Remove button ──
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "✕";
  removeBtn.classList.add("remove-reward-btn");
  removeBtn.title = "Remove this reward";
  removeBtn.onclick = () => row.remove();

  // ── Assemble ──
  const condWrap = document.createElement("div");
  condWrap.classList.add("reward-field");
  const condLabel = document.createElement("label");
  condLabel.textContent = "Condition:";
  condLabel.htmlFor = condInput.id;
  condLabel.classList.add("reward-inline-label");
  condWrap.appendChild(condLabel);
  condWrap.appendChild(condInput);

  const facWrap = document.createElement("div");
  facWrap.classList.add("reward-field");
  const facLabel = document.createElement("label");
  facLabel.textContent = "Faction:";
  facLabel.htmlFor = facSelect.id;
  facLabel.classList.add("reward-inline-label");
  facWrap.appendChild(facLabel);
  facWrap.appendChild(facSelect);

  const repWrap = document.createElement("div");
  repWrap.classList.add("reward-field");
  repWrap.appendChild(repLabel);
  repWrap.appendChild(repInput);

  const credWrap = document.createElement("div");
  credWrap.classList.add("reward-field");
  credWrap.appendChild(credLabel);
  credWrap.appendChild(credInput);

  row.appendChild(condWrap);
  row.appendChild(facWrap);
  row.appendChild(repWrap);
  row.appendChild(credWrap);
  row.appendChild(removeBtn);

  container.appendChild(row);
}

function collectRewards(formData) {
  const rewards = [];
  const container = document.getElementById("rewardsContainer");
  const rows = container.querySelectorAll(".reward-row");
  rows.forEach(row => {
    const id = row.id.replace("reward", "");
    const condition = document.getElementById(`rewardCondition${id}`)?.value?.trim();
    const faction = document.getElementById(`rewardFaction${id}`)?.value;
    const rep = parseInt(document.getElementById(`rewardRep${id}`)?.value || "0", 10);
    const credits = parseInt(document.getElementById(`rewardCredits${id}`)?.value || "0", 10);
    if (condition && faction) {
      rewards.push({ condition, faction, reputation: rep, credits });
    }
  });
  return rewards;
}

// ─── OBJECTIVES ─────────────────────────────────────────────────────────────

let objectiveCount = 0;

function addObjective() {
  objectiveCount++;
  const id = objectiveCount;
  const container = document.getElementById("objectivesContainer");

  const row = document.createElement("div");
  row.classList.add("objective-row");
  row.id = `objective${id}`;

  // ID input
  const idInput = document.createElement("input");
  idInput.type = "text";
  idInput.id = `objectiveId${id}`;
  idInput.name = `objectiveId${id}`;
  idInput.placeholder = "e.g. kill_ace";
  idInput.classList.add("objective-id-input");

  // Type select
  const typeSelect = document.createElement("select");
  typeSelect.id = `objectiveType${id}`;
  typeSelect.name = `objectiveType${id}`;
  typeSelect.classList.add("objective-type-select");
  OBJECTIVE_TYPES.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.value;
    opt.textContent = t.label;
    opt.title = t.title;
    typeSelect.appendChild(opt);
  });

  // Target input
  const targetInput = document.createElement("input");
  targetInput.type = "text";
  targetInput.id = `objectiveTarget${id}`;
  targetInput.name = `objectiveTarget${id}`;
  targetInput.placeholder = "e.g. enemy_squadron";
  targetInput.classList.add("objective-target-input");

  // Required checkbox
  const reqCheck = document.createElement("input");
  reqCheck.type = "checkbox";
  reqCheck.id = `objectiveRequired${id}`;
  reqCheck.name = `objectiveRequired${id}`;
  reqCheck.checked = true;

  const reqLabel = document.createElement("label");
  reqLabel.htmlFor = reqCheck.id;
  reqLabel.textContent = "Required";
  reqLabel.classList.add("objective-inline-label");

  // Hidden checkbox
  const hidCheck = document.createElement("input");
  hidCheck.type = "checkbox";
  hidCheck.id = `objectiveHidden${id}`;
  hidCheck.name = `objectiveHidden${id}`;

  const hidLabel = document.createElement("label");
  hidLabel.htmlFor = hidCheck.id;
  hidLabel.textContent = "Hidden";
  hidLabel.classList.add("objective-inline-label");

  // Reward conditions input (comma-separated)
  const rcInput = document.createElement("input");
  rcInput.type = "text";
  rcInput.id = `objectiveRC${id}`;
  rcInput.name = `objectiveRC${id}`;
  rcInput.placeholder = "success, exact_kill:Name";
  rcInput.classList.add("objective-rc-input");
  rcInput.title = "Comma-separated condition strings triggered when this objective is met";

  // Remove button
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "✕";
  removeBtn.classList.add("remove-objective-btn");
  removeBtn.title = "Remove this objective";
  removeBtn.onclick = () => row.remove();

  // Assemble with labels
  const idWrap = document.createElement("div");
  idWrap.classList.add("objective-field");
  const idLabel = document.createElement("label");
  idLabel.textContent = "ID:";
  idLabel.htmlFor = idInput.id;
  idLabel.classList.add("objective-inline-label");
  idWrap.appendChild(idLabel);
  idWrap.appendChild(idInput);

  const typeWrap = document.createElement("div");
  typeWrap.classList.add("objective-field");
  const typeLabel = document.createElement("label");
  typeLabel.textContent = "Type:";
  typeLabel.htmlFor = typeSelect.id;
  typeLabel.classList.add("objective-inline-label");
  typeWrap.appendChild(typeLabel);
  typeWrap.appendChild(typeSelect);

  const targetWrap = document.createElement("div");
  targetWrap.classList.add("objective-field");
  const targetLabel = document.createElement("label");
  targetLabel.textContent = "Target:";
  targetLabel.htmlFor = targetInput.id;
  targetLabel.classList.add("objective-inline-label");
  targetWrap.appendChild(targetLabel);
  targetWrap.appendChild(targetInput);

  const reqWrap = document.createElement("div");
  reqWrap.classList.add("objective-field");
  reqWrap.appendChild(reqCheck);
  reqWrap.appendChild(reqLabel);

  const hidWrap = document.createElement("div");
  hidWrap.classList.add("objective-field");
  hidWrap.appendChild(hidCheck);
  hidWrap.appendChild(hidLabel);

  const rcWrap = document.createElement("div");
  rcWrap.classList.add("objective-field");
  const rcLabel = document.createElement("label");
  rcLabel.textContent = "Reward Conditions:";
  rcLabel.htmlFor = rcInput.id;
  rcLabel.classList.add("objective-inline-label");
  rcWrap.appendChild(rcLabel);
  rcWrap.appendChild(rcInput);

  row.appendChild(idWrap);
  row.appendChild(typeWrap);
  row.appendChild(targetWrap);
  row.appendChild(reqWrap);
  row.appendChild(hidWrap);
  row.appendChild(rcWrap);
  row.appendChild(removeBtn);

  container.appendChild(row);
}

function collectObjectives() {
  const objectives = [];
  const container = document.getElementById("objectivesContainer");
  const rows = container.querySelectorAll(".objective-row");
  rows.forEach(row => {
    const id = row.id.replace("objective", "");
    const objId = document.getElementById(`objectiveId${id}`)?.value?.trim();
    const type = document.getElementById(`objectiveType${id}`)?.value;
    const target = document.getElementById(`objectiveTarget${id}`)?.value?.trim();
    const required = document.getElementById(`objectiveRequired${id}`)?.checked || false;
    const hidden = document.getElementById(`objectiveHidden${id}`)?.checked || false;
    const rcRaw = document.getElementById(`objectiveRC${id}`)?.value || "";
    const reward_conditions = rcRaw.split(",").map(s => s.trim()).filter(Boolean);
    if (objId && type && target) {
      objectives.push({ id: objId, type, target, required, reward_conditions, ...(hidden && { hidden: true }) });
    }
  });
  return objectives;
}

// ─── NAV POINTS ─────────────────────────────────────────────────────────────

function addNavPoint() {
  navPointCount++;
  encounterCount[navPointCount] = 0;

  const container = document.getElementById("navPointsContainer");
  const navPointDiv = document.createElement("div");
  navPointDiv.classList.add('nav-point-section');
  navPointDiv.id = `navPoint${navPointCount}`;

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
    <div class="form-group" id="navDescriptionGroup${navPointCount}">
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
    <div class="checkbox-group-row">
      <div class="form-group">
        <input type="checkbox" id="navHidden${navPointCount}" name="navHidden${navPointCount}">
        <label for="navHidden${navPointCount}">Hidden Nav Point</label>
      </div>
      <div class="form-group">
        <input type="checkbox" id="navAsteroids${navPointCount}" name="navAsteroids${navPointCount}">
        <label for="navAsteroids${navPointCount}">Has Asteroids</label>
      </div>
      <div class="form-group checkbox-with-text-input">
        <input type="checkbox" id="navIsJump${navPointCount}" name="navIsJump${navPointCount}">
        <label for="navIsJump${navPointCount}">Is Jump Point</label>
        <input type="text" id="navJumpDest${navPointCount}" name="navJumpDest${navPointCount}" placeholder="Jump Destination">
      </div>
    </div>
    
    <div class="encounters-container" id="encountersContainer${navPointCount}"></div>
    <div class="button-group">
      <button type="button" class="add-button" onclick="addEncounter(${navPointCount})">Add Encounter</button>
    </div>
  </fieldset>`;

  container.appendChild(navPointDiv);

  // After appending, add the Grok AI suggestion button if available
  if (window.GrokIntegration && window.GrokIntegration.isGrokAvailable) {
      const navDescriptionInput = document.getElementById(`navDescription${navPointCount}`);
      if (navDescriptionInput) {
          const currentNavPointNumber = navPointCount; // Capture for closure

          // Function to build the context for Grok AI for this specific nav point
          const navPointContextBuilder = () => {
              const envSelect = document.getElementById(`navEnv${currentNavPointNumber}`);
              // Get the text content of the selected option, not just its value
              const selectedEnv = envSelect ? envSelect.options[envSelect.selectedIndex].text : 'Unknown Environment';
              
              const encountersText = [];
              // Iterate through all possible encounters for this nav point
              // encounterCount is a global array, so use currentNavPointNumber
              for (let j = 1; j <= encounterCount[currentNavPointNumber]; j++) {
                  const nb = document.getElementById(`encounterNB${currentNavPointNumber}-${j}`)?.value || 'an unknown number of';
                  const factionElement = document.getElementById(`encounterFaction${currentNavPointNumber}-${j}`);
                  const faction = factionElement ? factionElement.options[factionElement.selectedIndex].text : 'unknown faction';
                  const shipType = document.getElementById(`encounterShipType${currentNavPointNumber}-${j}`)?.value || 'unknown ship type';
                  
                  if (faction && shipType) { // Only add if we have some meaningful data
                      encountersText.push(`${nb} ${faction} ${shipType} ships`);
                  }
              }
              
              let context = `Environment: ${selectedEnv}.`;

              // Add current description as part of the context
              const currentDescr = document.getElementById(`navDescription${currentNavPointNumber}`)?.value;
              if (currentDescr) {
                  context += ` Current description: "${currentDescr}".`;
              }


              if (encountersText.length > 0) {
                  context += ` Encounters: ${encountersText.join('; ')}.`;
              }

              // Add other relevant details if needed, e.g., asteroids, hidden status
              const hasAsteroids = document.getElementById(`navAsteroids${currentNavPointNumber}`)?.checked;
              if (hasAsteroids) {
                  context += ` Asteroids are present.`;
              }
              const isHidden = document.getElementById(`navHidden${currentNavPointNumber}`)?.checked;
              if (isHidden) {
                  context += ` This nav point is hidden.`;
              }

              return context;
          };

          window.GrokIntegration.addSuggestionButton(
              navDescriptionInput,
              window.GrokIntegration.NAV_POINT_DESCRIPTION_PROMPT,
              false, // Do not parse JSON for nav point description
              navPointContextBuilder // Pass the context builder function
          );
      }
  }
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
  const objectives = collectObjectives();
  const mission = {
    description: formData.get("missionDescription"),
    nav_points: {},
    name: formData.get("missionName"),
    rewards: collectRewards(formData),
    ...(objectives.length > 0 && { objectives }),
  };

  for (let i = 0; i <= navPointCount; i++) {
    const navPointKey = formData.get(`navName${i}`);
    const navDescription = formData.get(`navDescription${i}`);
    
    // Logic for new flags
    const isHidden = formData.get(`navHidden${i}`) === "on";
    const hasAsteroids = formData.get(`navAsteroids${i}`) === "on";
    const isJump = formData.get(`navIsJump${i}`) === "on";
    const jumpDest = formData.get(`navJumpDest${i}`);

    let encounters = [];
    let encounterIndex = 1;
    let encounter = generateEncounters(formData, i, encounterIndex);
    while (encounter) {
      encounters.push(encounter);
      encounterIndex++;
      encounter = generateEncounters(formData, i, encounterIndex);
    }

    const environment = envChoices[formData.get(`navEnv${i}`)];

    // Construct the nav point object
    mission.nav_points[navPointKey] = {
      descr: navDescription,
      encounters: [encounters],
      environment: environment,
      // Add new properties conditionally
      ...(isHidden && { hidden: true }),
      ...(hasAsteroids && { asteroids: true }),
      ...(isJump && { jump: true, dest: jumpDest || "Unknown" })
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
