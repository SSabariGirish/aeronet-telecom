import mysql.connector
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
import requests
import datetime
import os
import urllib.parse
import bcrypt

app = Flask(__name__)
CORS(app, origins=["http://localhost:8080"])

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("FATAL: JWT_SECRET environment variable is missing!")

def get_db_connection():
    return mysql.connector.connect(
        host=os.environ["DB_HOST"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_ROOT_PASSWORD"],
        database=os.environ["DB_NAME"]
    )

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({"message": "AeroNet Telecom API is live!", "status": "Vulnerable to JWT & SSRF!"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    account_number = data.get('account_number')
    password = data.get('password')
    
    query = "SELECT * FROM customers WHERE account_number = %s"
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(query, (account_number,))
        user = cursor.fetchone() 
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user["password_hash"].encode('utf-8')):
            token_payload = {
                "account_number": user["account_number"],
                "role": "customer",
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
            }
            token = jwt.encode(token_payload, JWT_SECRET, algorithm="HS256")
            
            del user["password_hash"]
            
            return jsonify({"success": True, "token": token, "data": user})
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
    finally:
        cursor.close()
        conn.close()

@app.route('/api/verify', methods=['GET'])
def verify_session():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"valid": False}), 401
    
    parts = auth_header.split(" ")
    if len(parts) != 2 or parts.lower() != "bearer":
        return jsonify({"success": False, "message": "Invalid header format"}), 401
    
    token = parts
    
    try:
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return jsonify({"valid": True}), 200
    except Exception:
        return jsonify({"valid": False}), 401

@app.route('/api/admin/system_ping', methods=['POST'])
def system_ping():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"success": False, "message": "Missing token"}), 401
    
    token = auth_header.split(" ")
    
    try:
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if decoded_token.get("role") != "admin":
            return jsonify({"success": False, "message": "Access Denied: Admin role required."}), 403
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "message": "Invalid token"}), 401

    target_url = request.json.get('url')
    
    ALLOWED_DOMAINS = ["example.com", "google.com", "cloudflare.com"]
    
    try:
        parsed_url = urllib.parse.urlparse(target_url)
        hostname = parsed_url.hostname

        if hostname not in ALLOWED_DOMAINS:
            return jsonify({"success": False, "message": "Security Violation: Target domain is not whitelisted."}), 403
        
        response = requests.get(target_url, timeout=3, allow_redirects=False)

        if response.status_code in (301, 302, 303, 307, 308):
            return jsonify({"success": False, "message": "Security Violation: Redirects are not permitted."}), 403

        return jsonify({
            "success": True, 
            "message": "Ping successful", 
            "response_snippet": response.text[:200]
        })
    except Exception as e:
         return jsonify({"success": False, "message": "Failed to connect or invalid URL."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)