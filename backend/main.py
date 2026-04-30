from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {"message": "Backend is running 🚀"}


@app.post("/analyze")
def analyze(data: dict):
    text = data.get("text", "")

    if text.lower() == "i go market":
        return {
            "score": 5,
            "mistakes": ['Missing "to"', 'Missing "the"', "Wrong tense"],
            "corrections": [],
            "improved": "I went to the market"
        }

    return {
        "score": 9,
        "mistakes": [],
        "corrections": [],
        "improved": text
    }