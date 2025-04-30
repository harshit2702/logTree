import os
import sqlite3
import json
from datetime import datetime, timedelta
import pandas as pd
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Database configuration
DATABASE = 'sensor_data.db'

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data/latest')
def get_latest_data():
    conn = get_db_connection()
    data = conn.execute('SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1').fetchone()
    conn.close()
    
    if data:
        return jsonify({
            'id': data['id'],
            'temp': data['temp'],
            'pressure': data['pressure'],
            'accel': {
                'x': data['accel_x'],
                'y': data['accel_y'],
                'z': data['accel_z']
            },
            'gyro': {
                'x': data['gyro_x'],
                'y': data['gyro_y'],
                'z': data['gyro_z']
            },
            'location': {
                'latitude': data['latitude'],
                'longitude': data['longitude'],
                'altitude': data['altitude']
            },
            'time': {
                'hour': data['hour'],
                'minute': data['minute'],
                'seconds': data['seconds']
            },
            'timestamp': data['timestamp']
        })
    else:
        return jsonify({})

@app.route('/api/data/history')
def get_historical_data():
    hours = request.args.get('hours', default=1, type=int)
    conn = get_db_connection()
    cutoff_time = datetime.now() - timedelta(hours=hours)
    cutoff_time_str = cutoff_time.strftime('%Y-%m-%d %H:%M:%S')
    
    query = '''
    SELECT * FROM sensor_data
    WHERE timestamp > ?
    ORDER BY timestamp
    '''
    
    rows = conn.execute(query, (cutoff_time_str,)).fetchall()
    conn.close()
    
    # Convert to list of dicts for easier processing
    data = [dict(row) for row in rows]
    
    if data:
        # Create time series for each sensor type
        result = {
            'timestamps': [row['timestamp'] for row in data],
            'temperature': [row['temp'] for row in data],
            'pressure': [row['pressure'] for row in data],
            'accel_x': [row['accel_x'] for row in data],
            'accel_y': [row['accel_y'] for row in data],
            'accel_z': [row['accel_z'] for row in data],
            'gyro_x': [row['gyro_x'] for row in data],
            'gyro_y': [row['gyro_y'] for row in data],
            'gyro_z': [row['gyro_z'] for row in data],
            'altitude': [row['altitude'] for row in data]
        }
        return jsonify(result)
    else:
        return jsonify({})

@app.route('/api/config', methods=['GET', 'POST'])
def dashboard_config():
    conn = get_db_connection()
    
    if request.method == 'POST':
        config = request.json
        # Save config to database
        conn.execute('DELETE FROM dashboard_config')
        conn.execute('INSERT INTO dashboard_config (id, config) VALUES (1, ?)', 
                   (json.dumps(config),))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"})
    else:
        # Get config from database
        config = conn.execute('SELECT config FROM dashboard_config WHERE id = 1').fetchone()
        conn.close()
        
        if config:
            return jsonify(json.loads(config['config']))
        else:
            # Default configuration
            default_config = {
                "refresh_rate": 5,
                "charts": ["temperature", "pressure", "acceleration", "gyroscope", "location"],
                "time_range": 1  # hours
            }
            return jsonify(default_config)

if __name__ == '__main__':
    # Ensure directories exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    
    # Run the app
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
