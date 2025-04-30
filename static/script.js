// Initialize charts and gauges
let tempChart, pressureChart, accelChart, gyroChart, altitudeChart;
let dashboardConfig = {};
let updateTimer;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Load settings
    loadDashboardConfig();
    
    // Initialize gauges
    initGauges();
    
    // Initialize charts
    initCharts();
    
    // Initialize gyroscope visualization
    initGyroscopeVisualization();
    
    // Set up event handlers
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    
    // First data load
    updateDashboard();
});

// Initialize gauge displays using Plotly.js
function initGauges() {
    // Temperature gauge configuration
    const tempGaugeConfig = {
        domain: {x: [0, 1], y: [0, 1]},
        value: 0,
        title: {text: "Temperature (°C)"},
        type: "indicator",
        mode: "gauge+number",
        gauge: {
            axis: {range: [0, 50]},
            bar: {color: "darkblue"},
            steps: [
                {range: [0, 20], color: "cyan"},
                {range: [20, 30], color: "royalblue"},
                {range: [30, 50], color: "red"}
            ],
            threshold: {
                line: {color: "red", width: 4},
                thickness: 0.75,
                value: 45
            }
        }
    };
    
    // Pressure gauge configuration
    const pressureGaugeConfig = {
        domain: {x: [0, 1], y: [0, 1]},
        value: 0,
        title: {text: "Pressure (hPa)"},
        type: "indicator",
        mode: "gauge+number",
        gauge: {
            axis: {range: [950, 1050]},
            bar: {color: "darkgreen"},
            steps: [
                {range: [950, 980], color: "lightgreen"},
                {range: [980, 1020], color: "green"},
                {range: [1020, 1050], color: "darkgreen"}
            ]
        }
    };
    
    // Create the gauges
    Plotly.newPlot('gauge-temp', [tempGaugeConfig], {margin: {t: 0, b: 0, l: 0, r: 0}});
    Plotly.newPlot('gauge-pressure', [pressureGaugeConfig], {margin: {t: 0, b: 0, l: 0, r: 0}});
}

// Load dashboard configuration
function loadDashboardConfig() {
    fetch('/api/config')
        .then(response => response.json())
        .then(config => {
            dashboardConfig = config;
            
            // Apply settings to UI
            document.getElementById('refresh-rate').value = config.refresh_rate || 5;
            document.getElementById('time-range').value = config.time_range || 1;
            
            // Set visibility of charts based on config
            setChartVisibility('temperature', 'temperature-card', config.charts);
            setChartVisibility('pressure', 'pressure-card', config.charts);
            setChartVisibility('acceleration', 'acceleration-card', config.charts);
            setChartVisibility('gyroscope', 'gyroscope-card', config.charts);
            setChartVisibility('location', 'altitude-card', config.charts);
            
            // Update checkboxes
            document.getElementById('chart-temp').checked = config.charts.includes('temperature');
            document.getElementById('chart-pressure').checked = config.charts.includes('pressure');
            document.getElementById('chart-accel').checked = config.charts.includes('acceleration');
            document.getElementById('chart-gyro').checked = config.charts.includes('gyroscope');
            document.getElementById('chart-location').checked = config.charts.includes('location');
            
            // Set refresh timer
            if (updateTimer) {
                clearInterval(updateTimer);
            }
            updateTimer = setInterval(updateDashboard, (config.refresh_rate || 5) * 1000);
        })
        .catch(error => console.error('Error loading configuration:', error));
}

// Set chart visibility based on config
function setChartVisibility(chartName, cardId, enabledCharts) {
    const card = document.getElementById(cardId);
    if (card) {
        card.style.display = enabledCharts.includes(chartName) ? 'block' : 'none';
    }
}

// Save dashboard configuration
function saveSettings() {
    const refreshRate = parseInt(document.getElementById('refresh-rate').value);
    const timeRange = parseInt(document.getElementById('time-range').value);
    const charts = [];
    
    if (document.getElementById('chart-temp').checked) charts.push('temperature');
    if (document.getElementById('chart-pressure').checked) charts.push('pressure');
    if (document.getElementById('chart-accel').checked) charts.push('acceleration');
    if (document.getElementById('chart-gyro').checked) charts.push('gyroscope');
    if (document.getElementById('chart-location').checked) charts.push('location');
    
    const config = {
        refresh_rate: refreshRate,
        time_range: timeRange,
        charts: charts
    };
    
    fetch('/api/config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
            modal.hide();
            
            // Update config and restart timer
            dashboardConfig = config;
            if (updateTimer) {
                clearInterval(updateTimer);
            }
            updateTimer = setInterval(updateDashboard, config.refresh_rate * 1000);
            
            // Update charts with new time range
            updateChartData();
            
            // Update chart visibility
            setChartVisibility('temperature', 'temperature-card', config.charts);
            setChartVisibility('pressure', 'pressure-card', config.charts);
            setChartVisibility('acceleration', 'acceleration-card', config.charts);
            setChartVisibility('gyroscope', 'gyroscope-card', config.charts);
            setChartVisibility('location', 'altitude-card', config.charts);
        }
    })
    .catch(error => console.error('Error saving configuration:', error));
}

// Initialize all charts
function initCharts() {
    // Temperature chart
    tempChart = new Chart(document.getElementById('temp-chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                data: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
    
    // Pressure chart
    pressureChart = new Chart(document.getElementById('pressure-chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Pressure (hPa)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                data: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
    
    // Acceleration chart
    accelChart = new Chart(document.getElementById('accel-chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'X',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    data: []
                },
                {
                    label: 'Y',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    data: []
                },
                {
                    label: 'Z',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Gyroscope chart
    gyroChart = new Chart(document.getElementById('gyro-chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'X',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    data: []
                },
                {
                    label: 'Y',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    data: []
                },
                {
                    label: 'Z',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    // Altitude chart
    altitudeChart = new Chart(document.getElementById('altitude-chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Altitude (m)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                data: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Update the dashboard
function updateDashboard() {
    // Get latest readings
    fetch('/api/data/latest')
        .then(response => response.json())
        .then(data => {
            if (Object.keys(data).length > 0) {
                // Update current readings
                document.getElementById('current-temp').textContent = `${data.temp.toFixed(2)} °C`;
                document.getElementById('current-pressure').textContent = `${data.pressure.toFixed(2)} hPa`;
                document.getElementById('current-altitude').textContent = `${data.location.altitude.toFixed(2)} m`;
                document.getElementById('current-lat').textContent = data.location.latitude.toFixed(6);
                document.getElementById('current-lng').textContent = data.location.longitude.toFixed(6);
                
                // Update gauge displays
                Plotly.update('gauge-temp', {'value': data.temp});
                Plotly.update('gauge-pressure', {'value': data.pressure});
                
                // Update gyroscope visualization
                if (data.gyro) {
                    updateGyroscopeVisualization(
                        data.gyro.x, 
                        data.gyro.y, 
                        data.gyro.z
                    );
                }
                
                // Format timestamp
                const timestamp = new Date(data.timestamp);
                document.getElementById('last-update').textContent = timestamp.toLocaleTimeString();
            }
        })
        .catch(error => console.error('Error fetching latest data:', error));
    
    // Update historical data
    updateChartData();
}

// Update chart data
function updateChartData() {
    const timeRange = dashboardConfig.time_range || 1;
    fetch(`/api/data/history?hours=${timeRange}`)
        .then(response => response.json())
        .then(data => {
            if (data.timestamps && data.timestamps.length > 0) {
                // Format timestamps for display
                const labels = data.timestamps.map(ts => {
                    const date = new Date(ts);
                    return date.toLocaleTimeString();
                });
                
                // Update temperature chart
                tempChart.data.labels = labels;
                tempChart.data.datasets[0].data = data.temperature;
                tempChart.update();
                
                // Update pressure chart
                pressureChart.data.labels = labels;
                pressureChart.data.datasets[0].data = data.pressure;
                pressureChart.update();
                
                // Update acceleration chart
                accelChart.data.labels = labels;
                accelChart.data.datasets[0].data = data.accel_x;
                accelChart.data.datasets[1].data = data.accel_y;
                accelChart.data.datasets[2].data = data.accel_z;
                accelChart.update();
                
                // Update gyroscope chart
                gyroChart.data.labels = labels;
                gyroChart.data.datasets[0].data = data.gyro_x;
                gyroChart.data.datasets[1].data = data.gyro_y;
                gyroChart.data.datasets[2].data = data.gyro_z;
                gyroChart.update();
                
                // Update altitude chart
                altitudeChart.data.labels = labels;
                altitudeChart.data.datasets[0].data = data.altitude;
                altitudeChart.update();
            }
        })
        .catch(error => console.error('Error fetching historical data:', error));
}
