from flask import Flask, jsonify, render_template
import os
import socket
import redis

app = Flask(__name__)

# Connect to Redis (with graceful fallback if not available)
try:
    redis_client = redis.Redis(host=os.environ.get('REDIS_HOST', 'redis'),
                              port=int(os.environ.get('REDIS_PORT', 6379)),
                              db=0,
                              socket_connect_timeout=2,
                              socket_timeout=2)
    redis_connected = True
except:
    redis_connected = False

@app.route('/')
def hello():
    hostname = socket.gethostname()
    counter = 0

    if redis_connected:
        try:
            redis_client.incr('hits')
            counter = int(redis_client.get('hits').decode('utf-8'))
        except:
            redis_connected = False

    return jsonify({
        "message": "Hello from Docker!",
        "hostname": hostname,
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "redis_connected": redis_connected,
        "counter": counter
    })

@app.route('/health')
def health():
    redis_status = "connected" if redis_connected else "disconnected"
    return jsonify({
        "status": "ok",
        "redis": redis_status
    })

@app.route('/ui')
def ui():
    hostname = socket.gethostname()
    counter = 0

    if redis_connected:
        try:
            redis_client.incr('hits')
            counter = int(redis_client.get('hits').decode('utf-8'))
        except:
            pass

    return render_template('index.html',
                           hostname=hostname,
                           counter=counter,
                           redis_connected=redis_connected)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get("DEBUG", "true").lower() == "true")
