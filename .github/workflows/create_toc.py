import re

def create_toc(file_path):
    with open(file_path, 'r') as file:
        lines = file.readlines()

    # Find all headers in the file
    headers = []
    for line in lines:
        match = re.search(r'^#+ (.*)', line)
        if match:
            headers.append((len(match.group(0)) - 1, match.group(1)))

    # Create table of contents
    toc = '## Table of Contents\n\n'
    for level, header in headers:
        toc += '  ' * (level - 1) + '- [' + header + '](#' + header.lower().replace(' ', '-') + ')\n'

    # Insert table of contents into file
    with open(file_path, 'w') as file:
        file.write(toc)
        file.write('\n'.join(lines))

create_toc("README.md")
