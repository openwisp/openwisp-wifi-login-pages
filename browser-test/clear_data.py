#!/usr/bin/env python
import os
import sys
import json
import subprocess
import re

project_path = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
browser_test_path = os.path.join(project_path, 'browser-test')
test_data_file = open(os.path.join(browser_test_path, 'testData.json'))
test_data = json.loads(test_data_file.read())
test_data_file.close()

OPENWISP_RADIUS_PATH = os.environ.get('OPENWISP_RADIUS_PATH', '')

errors = []
test_user_email = test_data['testuser']['email']

command = f'''
echo "User.objects.get(username='{test_user_email}').delete()"\
| {OPENWISP_RADIUS_PATH}/tests/manage.py shell_plus
'''

if OPENWISP_RADIUS_PATH == '':
    errors.append('OPENWISP_RADIUS_PATH is needed for clearing data.')
else:
    process = subprocess.Popen(
        command, shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    stdout, stderr = process.communicate()
    errors.extend(re.findall('(\\n.*?Error.*?\\n)', stderr.decode('utf-8')))
    sys.stdout.write(stdout.decode('utf-8'))
sys.stderr.write('\n'.join(errors))
