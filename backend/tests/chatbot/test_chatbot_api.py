def test_chatbot_basic_reply(api):
    # Endpoint from chatbot/urls.py under api/chatbot/
    res = api.post("/api/chatbot/query/", {"text": "menu"}, format="json")
    assert res.status_code in (200, 201)
    assert "reply" in res.data or "message" in res.data
