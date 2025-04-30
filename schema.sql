CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temp REAL,
    pressure REAL,
    accel_x REAL,
    accel_y REAL,
    accel_z REAL,
    gyro_x REAL,
    gyro_y REAL,
    gyro_z REAL,
    latitude REAL,
    longitude REAL,
    hour INTEGER,
    minute INTEGER,
    seconds INTEGER,
    altitude REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON sensor_data(timestamp);

CREATE TABLE IF NOT EXISTS dashboard_config (
    id INTEGER PRIMARY KEY,
    config TEXT
);
