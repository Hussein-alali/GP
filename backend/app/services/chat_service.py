def process_message(message):
    if "price" in message.lower():
        return {"intent": "price_prediction"}
    elif "recommend" in message.lower():
        return {"intent": "recommendation"}
    return {"reply": "How can I help you?"}
