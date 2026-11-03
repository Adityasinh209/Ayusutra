from app.services.otp import sms_error_detail


def test_sms_error_maps_invalid_key():
    assert "API key" in sms_error_detail({"return": False, "message": "Invalid API Key"})


def test_sms_error_maps_auth_list():
    detail = sms_error_detail({"return": False, "message": ["Invalid Authentication"]})
    assert "API key" in detail


def test_sms_error_maps_balance():
    assert "balance" in sms_error_detail({"message": "Insufficient credits in wallet"}).lower()


def test_sms_error_maps_ip_allowlist():
    assert "IP" in sms_error_detail({"message": "IP not allowed"})


def test_sms_error_maps_dlt_to_template_hint():
    assert "OTP template" in sms_error_detail({"message": "DLT rejected"})


def test_sms_error_includes_provider_text():
    assert "Gateway timeout" in sms_error_detail({"message": "Gateway timeout"})
