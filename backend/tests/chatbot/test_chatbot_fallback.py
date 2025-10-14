def test_chatbot_unknown_intent_returns_fallback(api):
    # This avoids hitting DB-backed adapters by using an unknown intent
    res = api.post("/api/chatbot/query/", {"text": "blarghblargh"}, format="json")
    assert res.status_code == 200
    assert res.data.get("ai_fallback") is True
    assert "didn't quite get" in res.data.get("reply", "").lower()
