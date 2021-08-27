#!/usr/bin/env python
import json
import os
import sys

import django
import swapper


def load_test_data():
    project_path = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    browser_test_path = os.path.join(project_path, 'browser-test')
    test_data_file = open(os.path.join(browser_test_path, 'testData.json'))
    test_data = json.loads(test_data_file.read())
    test_data_file.close()
    return test_data


OPENWISP_RADIUS_PATH = os.environ.get('OPENWISP_RADIUS_PATH', '')
if OPENWISP_RADIUS_PATH == '':
    print('OPENWISP_RADIUS_PATH is needed.', file=sys.stderr)
    sys.exit(1)

sys.path.insert(0, os.path.join(OPENWISP_RADIUS_PATH, 'tests'))
sys.argv.insert(1, 'browser-test')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'openwisp2.settings')
try:
    django.setup()
except ImportError:
    print(
        'OpenWISP RADIUS is not installed or python '
        'virtual environment is not activated correctly',
        file=sys.stderr,
    )
    sys.exit(1)


from django.contrib.auth import get_user_model

User = get_user_model()
RadiusAccounting = swapper.load_model('openwisp_radius', 'RadiusAccounting')
Organization = swapper.load_model('openwisp_users', 'Organization')

test_data = load_test_data()

User.objects.filter(username=test_data['testuser']['email']).delete()
User.objects.filter(
    username=test_data['mobileVerificationTestUser']['phoneNumber']
).delete()
User.objects.filter(
    username='+91' + test_data['mobileVerificationTestUser']['changePhoneNumber']
).delete()
Organization.objects.filter(
    name=test_data['mobileVerificationTestUser']['organization']
).delete()
RadiusAccounting.objects.filter(username=test_data['testuser']['email']).delete()
