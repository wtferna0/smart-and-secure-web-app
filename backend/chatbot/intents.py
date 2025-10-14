import re, string
from rapidfuzz import fuzz

INTENT_SYNONYMS = {
    "menu": [
        "menu", "items", "drinks", "food", "what do you have", "show me the menu",
        "list items", "see menu", "available", "recommendations"
    ],
    "order_status": [
        "order status", "status", "track order", "where is my order", "order tracking",
        "track my order", "order update", "delivery status"
    ],
    "loyalty": [
        "loyalty", "points", "rewards", "balance", "how many points", "redeem"
    ],
    "hours": [
        "hours", "opening time", "closing time", "open today", "when do you close", "when open"
    ],
    "location": [
        "location", "address", "where are you", "directions", "map"
    ],
    "crowd": [
        "crowd", "busy", "busy now", "wait time", "queue", "how crowded", "packed"
    ],
}

ORDER_ID_RE = re.compile(r"(?:order|#)\s*(\d{3,})", re.I)

def normalize(text: str) -> str:
    text = (text or "").lower()
    return text.translate(str.maketrans("", "", string.punctuation)).strip()

def detect_intent(user_msg: str, threshold: int = 78):
    msg = normalize(user_msg)

    if ORDER_ID_RE.search(user_msg):
        return ("order_status", 100, {})

    best_intent, best_score = None, 0
    for intent, phrases in INTENT_SYNONYMS.items():
        for p in phrases:
            score = fuzz.partial_ratio(msg, p)
            if score > best_score:
                best_intent, best_score = intent, score

    if best_score >= threshold:
        return (best_intent, best_score, {})
    return (None, best_score, {})
