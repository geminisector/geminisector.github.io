import json
import re

def parse_markdown(file_path):
    commands = {}
    with open(file_path, 'r') as f:
        content = f.read()
        # Commands are separated by ###
        sections = content.split('### ')
        for section in sections[1:]:
            # The command is the first word
            command_name = section.split('\n')[0].strip().split(' ')[0].replace('/', '').strip()
            # The example is a list item starting with * **Example
            example_match = re.search(r'\* \*\*Example(?:\s\(.*?\))?\*\*:\s*(.*)', section)
            if example_match:
                example = example_match.group(1).strip()
                commands[command_name] = example
    return commands

def update_commands_json():
    # First, parse the markdown files to get the examples
    player_commands = parse_markdown('commands.md')
    gm_commands = parse_markdown('gm.md')
    all_examples = {**player_commands, **gm_commands}

    # Now, read the commands.json file
    with open('commands.json', 'r') as f:
        data = json.load(f)

    # Add the examples to the commands
    for command_group in ['COMBAT_COMMANDS', 'SYSTEM_COMMANDS', 'DATABASE_COMMANDS', 'MELEE_COMMANDS']:
        for command_name, command_data in data[command_group].items():
            if 'cmd' in command_data and command_data['cmd'] in all_examples:
                command_data['example'] = all_examples[command_data['cmd']]

    # Add the separator info
    for role in data['ROLE_HIERARCHY']['roles']:
        if role['role'] == 'GM':
            role['separator'] = True
            
    # Fix the seekitem command
    if 'seekitem' in data['DATABASE_COMMANDS']:
        data['DATABASE_COMMANDS']['seekitem']['cmd'] = 'seekitem'
        if 'cmship_listarams' in data['DATABASE_COMMANDS']['seekitem']:
            data['DATABASE_COMMANDS']['seekitem']['minparams'] = data['DATABASE_COMMANDS']['seekitem'].pop('cmship_listarams')


    # Write the updated data back to the file
    with open('commands.json', 'w') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    update_commands_json()