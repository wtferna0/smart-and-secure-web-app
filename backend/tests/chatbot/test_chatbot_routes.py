import pytest

@pytest.mark.parametrize("intent,func_name,payload", [
    ("menu", "intent_menu", {"text": "menu"}),
    ("order_status", "intent_order_status", {"text": "order status", "email": "a@b.com"}),
    ("loyalty", "intent_loyalty", {"text": "loyalty", "email": "a@b.com"}),
    ("hours", "intent_hours", {"text": "hours"}),
    ("location", "intent_location", {"text": "location"}),
    ("crowd", "intent_crowd", {"text": "crowd"}),
])
def test_chatbot_branches(monkeypatch, api, intent, func_name, payload):
    # force the classifier result
    monkeypatch.setattr("chatbot.views.detect_intent", lambda msg: (intent, 0.99, None))
    # stub the corresponding service to avoid DB
    import chatbot.services as services
    monkeypatch.setattr(services, func_name, lambda **kw: {"ok": True, "intent": intent})

    res = api.post("/api/chatbot/query/", payload, format="json")
    assert res.status_code == 200
    assert res.data.get("intent") == intent
