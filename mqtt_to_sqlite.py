import json
import sqlite3
import paho.mqtt.client as mqtt
from datetime import datetime

# Database configuration
DATABASE = 'sensor_data.db'

# Enable WAL mode for better concurrency
def init_db():
    conn = sqlite3.connect(DATABASE)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.close()
    print("Database initialized with WAL mode")

def get_db_connection():
    # Create a new connection for each operation
    conn = sqlite3.connect(DATABASE, timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe("/sensor/json/")

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        
        # Print the full received JSON payload
        print("Raw data received:")
        print(json.dumps(data, indent=2))
        
        # Create a new connection for each message
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert data into database
        cursor.execute('''
        INSERT INTO sensor_data (
            temp, pressure, accel_x, accel_y, accel_z,
            gyro_x, gyro_y, gyro_z, latitude, longitude,
            hour, minute, seconds, altitude
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            float(data.get('Temp', 0)),
            float(data.get('Pressure', 0)),
            float(data.get('Accel_X', 0)),
            float(data.get('Accel_Y', 0)),
            float(data.get('Accel_Z', 0)),
            float(data.get('Gyro_x', 0)),
            float(data.get('Gyro_Y', 0)),
            float(data.get('Gyro_Z', 0)),
            float(data.get('Latitude', 0)),
            float(data.get('Longitude', 0)),
            int(data.get('Hour', 0)),
            int(data.get('Minute', 0)),
            int(data.get('Seconds', 0)),
            float(data.get('Altitude', 0))
        ))
        
        # Commit and close the connection
        conn.commit()
        conn.close()
        
        # Print all data fields being stored
        print("Data stored:")
        print(f"  Temperature: {data.get('Temp')} °C")
        print(f"  Pressure: {data.get('Pressure')} hPa")
        print(f"  Acceleration: X={data.get('Accel_X')}, Y={data.get('Accel_Y')}, Z={data.get('Accel_Z')}")
        print(f"  Gyroscope: X={data.get('Gyro_x')}, Y={data.get('Gyro_Y')}, Z={data.get('Gyro_Z')}")
        print(f"  Location: Lat={data.get('Latitude')}, Lng={data.get('Longitude')}")
        print(f"  Time: {data.get('Hour')}:{data.get('Minute')}:{data.get('Seconds')}")
        print(f"  Altitude: {data.get('Altitude')} m")
        print("-" * 50)  # Add a separator between messages
        
    except Exception as e:
        print(f"Error processing message: {e}")
        # Ensure connection is closed in case of error
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    # Initialize database with WAL mode
    init_db()
    
    # Setup MQTT client
    mqttc = mqtt.Client()
    mqttc.on_connect = on_connect
    mqttc.on_message = on_message
    
    print("Starting MQTT subscriber... Press Ctrl+C to stop")
    try:
        mqttc.connect("localhost", 1883, 60)
        mqttc.loop_forever()
    except KeyboardInterrupt:
        print("Stopping MQTT subscriber...")
    except Exception as e:
        print(f"Error in MQTT connection: {e}")
