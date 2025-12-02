import json

def update_params():
    with open('commands.json', 'r') as f:
        data = json.load(f)

    param_map = {
        "C": "Character",
        "S": "Ship",
        "CS": "Combatant (Ship or Character)",
        "CT": "Target Character",
        "ST": "Target Ship",
        "CST": "Target (Ship or Character)",
        "DC": "Difficulty Check",
        "DCD": "Character Descriptor",
        "DS": "Ship to Join",
        "A": "Action",
        "L": "Luck Application",
        "P": "Public/Private",
        "STR": "String",
        "EDIT": "Element to Edit",
        "WP": "Weapon Tag",
        "DSARG": "Database Argument",
        "CARGO": "Cargo Item",
        "SYSTEM": "System Item",
        "DESC": "Description Tag",
        "ATTR": "Attribute"
    }

    for command_group in ['COMBAT_COMMANDS', 'SYSTEM_COMMANDS', 'DATABASE_COMMANDS', 'MELEE_COMMANDS']:
        for command_name, command_data in data[command_group].items():
            if 'params' in command_data:
                new_params = []
                for param in command_data['params']:
                    if param in param_map:
                        new_params.append(param_map[param])
                    elif param.startswith('I['):
                        parts = param[2:-1].split(',')
                        new_params.append(f"Integer from {parts[0]} to {parts[1]}")
                    elif param.startswith('F['):
                        parts = param[2:-1].split(',')
                        new_params.append(f"Number from {parts[0]} to {parts[1]}")
                    elif param.startswith('S['):
                        parts = param[2:-1].split(',')
                        new_params.append(f"Letter in the set {', '.join(parts)}")
                    else:
                        new_params.append(param)
                command_data['new_params'] = new_params

    with open('commands.json', 'w') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    update_params()
