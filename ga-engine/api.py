"""
SplIT — GA Microservice
api.py

Flask HTTP wrapper around ga_engine.py.
Spring Boot calls POST /suggest with group state and gets back a payer suggestion.

Usage
-----
    source .venv/bin/activate
    python api.py
    # Listens on http://localhost:5000
"""

from flask import Flask, request, jsonify
from ga_engine import suggest_payer, CATEGORIES

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "categories": CATEGORIES})


@app.route("/suggest", methods=["POST"])
def suggest():
    data = request.get_json(force=True)

    members  = data.get("members", [])
    amount   = float(data.get("amount", 0))
    category = data.get("category", "Restaurant")

    if not members or amount <= 0:
        return jsonify({"error": "Invalid payload"}), 400

    result = suggest_payer(members, amount, category)

    payer = result["payer"]
    return jsonify({
        "payer":              payer["name"],
        "archetype":          payer["archetype"],
        "balance_before":     payer["balance"],
        "convergence_history": result["fitness_history"],
        "member_variances": [
            {
                "name":     members[i]["name"],
                "archetype": members[i]["archetype"],
                "variance": round(v, 4),
            }
            for i, v in enumerate(result["all_variances"])
        ],
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)