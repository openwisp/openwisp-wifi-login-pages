#!/usr/bin/env python
import json
import os
import sys

import django


def load_test_data():
    project_path = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    browser_test_path = os.path.join(project_path, "browser-test")
    test_data_file = open(os.path.join(browser_test_path, "testData.json"))
    test_data = json.loads(test_data_file.read())
    test_data_file.close()
    return test_data


OPENWISP_RADIUS_PATH = os.environ.get("OPENWISP_RADIUS_PATH", "")
if OPENWISP_RADIUS_PATH == "":
    print("OPENWISP_RADIUS_PATH is needed.", file=sys.stderr)
    sys.exit(1)

sys.path.insert(0, os.path.join(OPENWISP_RADIUS_PATH, "tests"))
sys.argv.insert(1, "browser-test")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "openwisp2.settings")
try:
    django.setup()
except ImportError:
    print(
        "OpenWISP RADIUS is not installed or python virtual environment is not activated correctly",
        file=sys.stderr,
    )
    sys.exit(1)

from django.contrib.auth import get_user_model
from swapper import load_model

User = get_user_model()
PhoneToken = load_model("openwisp_radius", "PhoneToken")

test_data = load_test_data()
phone_number = (
    sys.argv[2]
    if len(sys.argv) > 1
    else test_data["mobileVerificationTestUser"]["phoneNumber"]
)
try:
    phone_token = PhoneToken.objects.filter(phone_number=phone_number).first()
    sys.stdout.write(phone_token.token)
    sys.exit(0)
except Exception as e:
    sys.stderr.write(f"{e}")
    sys.exit(1)
