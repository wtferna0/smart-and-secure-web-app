import pytest

def test_user_can_view_crowd_current(api):
    res = api.get("/api/crowd/current/")
    assert res.status_code == 200

@pytest.mark.security
def test_only_staff_can_override_crowd_level(api, normal_user):
    api.force_authenticate(user=normal_user)
    res = api.post("/api/crowd/override/", {"level": 5, "note": "test"})
    assert res.status_code in (401, 403)
