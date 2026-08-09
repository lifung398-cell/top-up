# KHQR Web Generator

A Flask-based web application that generates Cambodia's KHQR (Bakong) payment QR codes, checks payment statuses, and includes a text-to-speech (TTS) proxy feature.

## Features

- **Generate KHQR Codes**: Dynamically generate KHQR codes for payments with specified amounts.
- **Check Payment Status**: Verify whether a payment has been successfully completed.
- **Text-to-Speech (TTS) Proxy**: Built-in proxy for calling TTS services.
- **Web Interface**: A simple web UI for interacting with the API.

## Requirements

- Python 3.7+
- pip (Python package manager)

## Installation & Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/Lyher99/KHQR-Payment-Hub
   cd KHQR
   ```

2. **Create and activate a virtual environment** (optional but recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install the dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy the `example.env` file to `.env` and fill in your actual credentials.
   ```bash
   cp example.env .env
   ```
   *Note: Never commit your `.env` file to public version control.*

## Configuration (.env)

The following environment variables are required:
- `TELEGRAM_TOKEN`: (Optional for this web app, depends on other scripts)
- `BAKONG_TOKEN`: Your JWT token provided by Bakong
- `BANK_ACCOUNT`: Your account (e.g., `account@bank`)
- `MERCHANT_NAME`: Your registered business name
- `MERCHANT_CITY`: The city of your business (e.g., `Phnom Penh`)
- `CURRENCY`: Default currency (`USD` or `KHR`)
- `STORE_LABEL`: Label for your store
- `PHONE_NUMBER`: Your phone number
- `TERMINAL_LABEL`: Identifier for the terminal (e.g., `Web-01`)
- `TTS_API_URL`: (Optional) The URL endpoint for the TTS API. If not provided, voice TTS will be skipped.
- `TTS_AUTH_HEADER`: (Optional) Auth header name for TTS proxy. If not provided, voice TTS will be skipped.
- `TTS_AUTH_VALUE`: (Optional) Auth header value for TTS proxy. If not provided, voice TTS will be skipped.

## Running the Application

Start the Flask server:
```bash
python app.py
```
By default, the application will be running on `http://localhost:5000`.

## Endpoints

- `GET /` : Loads the main web interface.
- `POST /generate_qr` : Generates a KHQR code (requires `amount` in JSON body).
- `GET /qr_image?qr_string=<string>` : Renders the generated QR string as a PNG image.
- `GET /check_status?md5=<md5_hash>` : Checks the status of the generated transaction.
- `POST /tts` : Proxy to generate audio using TTS service.

## License
MIT# KHQR-Payment-Hub
