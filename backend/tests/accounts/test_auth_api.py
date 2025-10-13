import pytest

@pytest.mark.integration
def test_profile_requires_auth(api):
    url = "/api/auth/me/"
    res = api.get(url)
    assert res.status_code in (401, 403)

@pytest.mark.integration
def test_profile_returns_user_when_logged_in(api, normal_user):
    api.force_authenticate(user=normal_user)
    url = "/api/auth/me/"
    res = api.get(url)
    assert res.status_code == 200
    # Should contain the user's id or username/email
    assert str(normal_user.id) in str(res.data) or (normal_user.username in str(res.data))
