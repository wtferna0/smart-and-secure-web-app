import pytest

def test_points_requires_auth(api):
    res = api.get("/api/loyalty/points/")
    assert res.status_code in (401, 403)

def test_points_summary_for_user(api, normal_user):
    api.force_authenticate(user=normal_user)
    res = api.get("/api/loyalty/points/")
    assert res.status_code == 200
    # Should at least contain a points balance or similar numeric fields
    assert isinstance(res.data, dict)
