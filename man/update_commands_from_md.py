import json
import re

def parse_markdown_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    commands = {}
    command_sections = re.split(r'###\s+\*\*([a-zA-Z0-9_/,\s]+)\*\*', content)
    
    for i in range(1, len(command_sections), 2):
        command_name = command_sections[i].strip()
        command_body = command_sections[i+1]
        
        # In case of commands like `jam, jam25, jam50, jam75` or `runic / unrunic`
        command_names = re.split(r'[,/]', command_name)
        
        for name in command_names:
            name = name.strip()
            if not name:
                continue

            commands[name] = {}
            
            # Description
            desc_match = re.search(r'\*\s+\*\*Description\*\*:\s+(.*?)\n', command_body, re.DOTALL)
            if desc_match:
                commands[name]['HELP'] = desc_match.group(1).strip()
            
            # Role
            role_match = re.search(r'\*\s+\*\*Role\*\*:\s+(.*?)\n', command_body)
            if role_match:
                commands[name]['role'] = role_match.group(1).strip()

            # Syntax
            syntax_match = re.search(r'\*\s+\*\*Syntax\*\*:\s+`?(!\w+\s+)?(.*?)`?\n', command_body)
            if syntax_match:
                syntax_string = syntax_match.group(2).strip()
                # The first word is the command itself, so we skip it.
                params = syntax_string.split(' ')[1:]
                commands[name]['params'] = [p.replace('<','').replace('>','') for p in params]

            # Examples
            examples = re.findall(r'\*\s+\*\*Example(?:\s\(.+?\))?\*\*:\s+`?(!\w+\s+)?(.*?)\n', command_body)
            if examples:
                commands[name]['examples'] = [e[1].strip() for e in examples]

    return commands

def update_json_with_markdown_data():
    # Read existing json
    with open('commands.json', 'r') as f:
        json_data = json.load(f)

    # Parse markdown files
    md_data = {}
    md_data.update(parse_markdown_file('commands.md'))
    md_data.update(parse_markdown_file('gm.md'))

    # Update json with md_data
    for command_group in json_data:
        if isinstance(json_data[command_group], dict):
            for command, properties in json_data[command_group].items():
                if command in md_data:
                    for key, value in md_data[command].items():
                        if key not in properties:
                            properties[key] = value

    # Write updated json
    with open('commands.json', 'w') as f:
        json.dump(json_data, f, indent=2)


if __name__ == '__main__':
    update_json_with_markdown_data()
