#!/usr/bin/env python
import os
import sys
import json

project_path = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
browser_test_path = os.path.join(project_path, 'browser-test')
test_data_file = open(os.path.join(browser_test_path, 'testData.json'))
test_data = json.loads(test_data_file.read())
test_data_file.close()

OPENWISP_RADIUS_PATH = os.getenv('OPENWISP_RADIUS_PATH', '')

if OPENWISP_RADIUS_PATH == '':
    print('OPENWISP_RADIUS_PATH is needed for initializing data.')
    sys.exit(0)

test_user_email = test_data['testuser']['email']
print(
    os.popen(
        f'''
echo "User.objects.get(username='{test_user_email}').delete()"\
| {OPENWISP_RADIUS_PATH}/tests/manage.py shell_plus
        '''
    ).read()
)
