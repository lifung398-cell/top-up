import os
import time
import urllib.request
import urllib.parse
from flask import Flask, request, jsonify, render_template, send_file, Response
from dotenv import load_dotenv
from bakong_khqr import KHQR

load_dotenv()

app = Flask(__name__)

# ── CONFIG ────────────────────────────────────────────────
BAKONG_TOKEN    = os.getenv("BAKONG_TOKEN")
BANK_ACCOUNT    = os.getenv("BANK_ACCOUNT", "din_champa@aclb")
MERCHANT_NAME   = os.getenv("MERCHANT_NAME", "EVIL STORE")
MERCHANT_CITY   = os.getenv("MERCHANT_CITY", "Phnom Penh")
CURRENCY        = os.getenv("CURRENCY", "USD")
STORE_LABEL     = os.getenv("STORE_LABEL", "EVIL STORE")
PHONE_NUMBER    = os.getenv("PHONE_NUMBER", "855978147990")
TERMINAL_LABEL  = os.getenv("TERMINAL_LABEL", "Web-01")
TTS_AUTH_HEADER = os.getenv("TTS_AUTH_HEADER", "")
TTS_AUTH_VALUE  = os.getenv("TTS_AUTH_VALUE", "")
TTS_API_URL     = os.getenv("TTS_API_URL", "")
# ─────────────────────────────────────────────────────────

khqr = KHQR(BAKONG_TOKEN)

@app.route("/")
def index():
    return render_template("index.html", currency=CURRENCY)

@app.route("/generate_qr", methods=["POST"])
def generate_qr():
    data = request.json
    try:
        amount = float(data.get("amount", 0))
        if amount <= 0:
            return jsonify({"success": False, "error": "Amount must be greater than 0"}), 400
    except ValueError:
        return jsonify({"success": False, "error": "Invalid amount"}), 400

    bill_number = f"WEB{int(time.time())}"

    try:
        qr_string = khqr.create_qr(
            bank_account=BANK_ACCOUNT,
            merchant_name=MERCHANT_NAME,
            merchant_city=MERCHANT_CITY,
            amount=amount,
            currency=CURRENCY,
            store_label=STORE_LABEL,
            phone_number=PHONE_NUMBER,
            bill_number=bill_number,
            terminal_label=TERMINAL_LABEL,
            static=False
        )

        md5 = khqr.generate_md5(qr_string)

        return jsonify({
            "success": True,
            "qr_string": qr_string,
            "bill_number": bill_number,
            "md5": md5,
            "amount": amount,
            "currency": CURRENCY
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/qr_image")
def qr_image():
    qr_string = request.args.get("qr_string")
    if not qr_string:
        return "Missing qr_string", 400
    
    try:
        # Generate QR image file locally
        qr_image_path = khqr.qr_image(qr_string, format="png")
        return send_file(qr_image_path, mimetype="image/png")
    except Exception as e:
        return str(e), 500

@app.route("/check_status")
def check_status():
    md5 = request.args.get("md5")
    if not md5:
        return jsonify({"success": False, "error": "Missing md5 hash"}), 400
    
    try:
        status = khqr.check_payment(md5)
        if status == "PAID":
            details = khqr.get_payment(md5)
            return jsonify({"success": True, "status": status, "details": details})
        return jsonify({"success": True, "status": status})
    except Exception as e:
        # Ignore network errors on polling, return pending
        return jsonify({"success": True, "status": "PENDING", "error": str(e)})

@app.route("/tts", methods=["POST"])
def proxy_tts():
    if not TTS_API_URL or not TTS_AUTH_HEADER or not TTS_AUTH_VALUE:
        return jsonify({"error": "TTS API not configured. Skipping."}), 503

    text = request.form.get("text", "")
    voice = request.form.get("voice", "km-KH-SreymomNeural")
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    url = TTS_API_URL
    data = urllib.parse.urlencode({"text": text, "voice": voice}).encode("utf-8")
    
    req = urllib.request.Request(url, data=data)
    req.add_header(TTS_AUTH_HEADER, TTS_AUTH_VALUE)
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("User-Agent", "Mozilla/5.0")
    
    try:
        with urllib.request.urlopen(req) as response:
            audio_data = response.read()
            return Response(audio_data, mimetype="audio/mpeg")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
