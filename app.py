from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from groq import Groq

load_dotenv()

app = Flask(__name__)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[],
    storage_uri="memory://",
)

api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
@limiter.limit("10 per minute")
def chat():
    if client is None:
        return jsonify({
            "error": "AI is not configured. Please check the server's environment settings."
        }), 500

    data = request.get_json(silent=True) or {}
    question = data.get("message", "").strip()

    if not question:
        return jsonify({"error": "Please enter a question."}), 400

    if len(question) > 1000:
        return jsonify({
            "error": "Please keep your question under 1000 characters."
        }), 400

    system_prompt = """
    You are Ask Kshitiz, the AI portfolio assistant for Kshitiz.

    Help recruiters and visitors understand Kshitiz's projects and
    technical interests in Python, data analytics, business intelligence,
    and generative AI.

    Known projects:
    - Indian Stock Market Analysis
    - Indian Startup Funding Analysis
    - NexaMart Multi-Source Data Fusion & Business Intelligence
    - AI Data Analyst Agent
    - CineMind, an AI movie and series companion

    Be professional, friendly, concise, and honest.
    Do not invent degrees, work experience, certifications, or achievements.
    If asked for a personal detail that has not been provided, say you
    don't have that information and suggest contacting Kshitiz.
    """

    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
            temperature=0.4,
            max_completion_tokens=500,
        )

        answer = response.choices[0].message.content

        return jsonify({"answer": answer or "I couldn't generate an answer."})

    except Exception:
        app.logger.exception("Groq request failed")
        return jsonify({
            "error": "The AI assistant is temporarily unavailable. Please try again."
        }), 502


if __name__ == "__main__":
    app.run(debug=True)
