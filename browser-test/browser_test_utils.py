from django.contrib.auth import get_user_model
from swapper import load_model

User = get_user_model()
Organization = load_model("openwisp_users", "Organization")
RadiusAccounting = load_model("openwisp_radius", "RadiusAccounting")


def cleanup_test_data(test_data):
    mobile_data = test_data["mobileVerificationTestUser"]
    cross_org_data = test_data["crossOrgPhoneVerificationUser"]
    User.objects.filter(username=test_data["testuser"]["email"]).delete()
    User.objects.filter(username=test_data["expiredPasswordUser"]["email"]).delete()
    User.objects.filter(username=cross_org_data["email"]).delete()
    User.objects.filter(username=mobile_data["phoneNumber"]).delete()
    User.objects.filter(username=mobile_data["changePhoneNumber"]).delete()
    Organization.objects.filter(name=mobile_data["organization"]).delete()
    RadiusAccounting.objects.filter(username=test_data["testuser"]["email"]).delete()
    RadiusAccounting.objects.filter(username=cross_org_data["email"]).delete()
