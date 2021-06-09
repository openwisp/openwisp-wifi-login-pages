#!/bin/python
import os
import sys
import json

test_data_file = open('testData.json')
test_data = json.loads(test_data_file.read())
test_data_file.close()

OPENWISP_RADIUS_PATH = os.getenv('OPENWISP_RADIUS_PATH', '')

if OPENWISP_RADIUS_PATH == '':
    print('OPENWISP_RADIUS_PATH is needed for initializing data.')
    sys.exit(0)

test_user_email = test_data['testuser']['email']
test_user_password = test_data['testuser']['password']
test_user_organization = test_data['testuser']['organization']
print(
    os.popen(
        f'''
echo "user=User.objects.create_user(username='{test_user_email}', password='{test_user_password}', email='{test_user_email}')\n
org = Organization.objects.get(name='{test_user_organization}')\n
OrganizationUser.objects.create(organization=org, user=user)"\
| {OPENWISP_RADIUS_PATH}/tests/manage.py shell_plus
        '''
    ).read()
)
