-- GPS devices table
CREATE TABLE devices (
    device_id SERIAL PRIMARY KEY,
    imei VARCHAR(20) UNIQUE NOT NULL,
    device_name VARCHAR(50),
    model VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GPS location data table
CREATE TABLE gps_data (
    id SERIAL PRIMARY KEY,
    device_imei VARCHAR(20) NOT NULL,
    protocol VARCHAR(10),
    timestamp TIMESTAMP NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    speed DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    altitude DECIMAL(6, 2),
    satellites INTEGER,
    hdop DECIMAL(4, 2),
    gsm_signal INTEGER,
    battery_voltage DECIMAL(5, 2),
    status INTEGER,
    raw_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_imei) REFERENCES devices(imei)
);

-- Create indexes for faster queries
CREATE INDEX idx_gps_data_timestamp ON gps_data(timestamp);
CREATE INDEX idx_gps_data_device_imei ON gps_data(device_imei);
CREATE INDEX idx_gps_data_location ON gps_data(latitude, longitude);

-- Create view for latest device positions
CREATE VIEW latest_positions AS
SELECT DISTINCT ON (device_imei) 
    device_imei,
    timestamp,
    latitude,
    longitude,
    speed,
    heading,
    satellites,
    created_at
FROM gps_data 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
ORDER BY device_imei, timestamp DESC;