// Initialize Three.js scene and gyroscope visualization
let gyroScene, gyroCamera, gyroRenderer, gyroControls;
let gyroBox, gyroXArrow, gyroYArrow, gyroZArrow;
let isGyroVisualizationInitialized = false;

// Initialize the gyroscope visualization
function initGyroscopeVisualization() {
    // Check if the gyroscope visualization element exists
    const gyroVisElement = document.getElementById('gyroscope-visualization');
    if (!gyroVisElement) return;
    
    // Check if already initialized
    if (isGyroVisualizationInitialized) return;
    isGyroVisualizationInitialized = true;
    
    // Set up Three.js scene
    gyroScene = new THREE.Scene();
    gyroScene.background = new THREE.Color(0xf8f9fa);
    
    // Set up camera
    gyroCamera = new THREE.PerspectiveCamera(
        75, 
        gyroVisElement.clientWidth / gyroVisElement.clientHeight, 
        0.1, 
        1000
    );
    gyroCamera.position.set(5, 5, 5);
    
    // Set up renderer
    gyroRenderer = new THREE.WebGLRenderer({ antialias: true });
    gyroRenderer.setSize(gyroVisElement.clientWidth, gyroVisElement.clientHeight);
    gyroVisElement.appendChild(gyroRenderer.domElement);
    
    // Create coordinate axes
    const axesHelper = new THREE.AxesHelper(4);
    gyroScene.add(axesHelper);
    
    // Add labels for axes
    const createLabel = (text, position, color) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 32;
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = color;
        ctx.fillText(text, 10, 20);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(0.5, 0.25, 1);
        return sprite;
    };
    
    gyroScene.add(createLabel('X', new THREE.Vector3(4.5, 0, 0), '#ff0000'));
    gyroScene.add(createLabel('Y', new THREE.Vector3(0, 4.5, 0), '#00ff00'));
    gyroScene.add(createLabel('Z', new THREE.Vector3(0, 0, 4.5), '#0000ff'));
    
    // Create a box to represent the device orientation
    const boxGeometry = new THREE.BoxGeometry(2, 0.5, 1);
    const boxMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x4a90e2,
        wireframe: false,
        transparent: true,
        opacity: 0.7
    });
    gyroBox = new THREE.Mesh(boxGeometry, boxMaterial);
    gyroScene.add(gyroBox);
    
    // Add edges to the box for better visibility
    const edges = new THREE.EdgesGeometry(boxGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const edgesObject = new THREE.LineSegments(edges, edgesMaterial);
    gyroBox.add(edgesObject);
    
    // Add direction indicators on the box
    const frontGeometry = new THREE.ConeGeometry(0.3, 0.6, 32);
    const frontMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const frontCone = new THREE.Mesh(frontGeometry, frontMaterial);
    frontCone.position.set(0, 0, 0.7);
    frontCone.rotation.x = Math.PI / 2;
    gyroBox.add(frontCone);
    
    // Create rotation arrows for visualization
    const origin = new THREE.Vector3(0, 0, 0);
    
    // X-axis rotation arrow (red, roll)
    gyroXArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), 
        origin, 
        0, 
        0xff0000, 
        0.2, 
        0.1
    );
    gyroScene.add(gyroXArrow);
    
    // Y-axis rotation arrow (green, pitch)
    gyroYArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0), 
        origin, 
        0, 
        0x00ff00, 
        0.2, 
        0.1
    );
    gyroScene.add(gyroYArrow);
    
    // Z-axis rotation arrow (blue, yaw)
    gyroZArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1), 
        origin, 
        0, 
        0x0000ff, 
        0.2, 
        0.1
    );
    gyroScene.add(gyroZArrow);
    
    // Add grid for reference
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x888888);
    gyroScene.add(gridHelper);
    
    // Add OrbitControls for rotating the view
    gyroControls = new THREE.OrbitControls(gyroCamera, gyroRenderer.domElement);
    gyroControls.enableDamping = true;
    gyroControls.dampingFactor = 0.25;
    gyroControls.screenSpacePanning = false;
    gyroControls.update();
    
    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        gyroControls.update();
        gyroRenderer.render(gyroScene, gyroCamera);
    }
    animate();
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (!gyroVisElement) return;
        const width = gyroVisElement.clientWidth;
        const height = gyroVisElement.clientHeight;
        gyroCamera.aspect = width / height;
        gyroCamera.updateProjectionMatrix();
        gyroRenderer.setSize(width, height);
    });
}

// Update the gyroscope visualization
function updateGyroscopeVisualization(gyroX, gyroY, gyroZ) {
    if (!isGyroVisualizationInitialized || !gyroBox) return;
    
    // Calculate rotation magnitude
    const magnitude = Math.sqrt(gyroX * gyroX + gyroY * gyroY + gyroZ * gyroZ);
    
    // Apply rotation to the box based on gyroscope data
    // For real-time visualization, we'll simulate cumulative rotation
    // Scale down the rotation values to make visualization smoother
    const scaleFactor = 0.01;
    
    // Apply incremental rotation based on gyroscope values
    gyroBox.rotation.x += gyroY * scaleFactor; // Pitch (around X-axis)
    gyroBox.rotation.y += gyroZ * scaleFactor; // Yaw (around Y-axis)
    gyroBox.rotation.z += gyroX * scaleFactor; // Roll (around Z-axis)
    
    // Update rotation arrows to show current rotation rates
    // X-axis (roll)
    const xLength = Math.min(Math.abs(gyroX) / 50, 3);
    gyroXArrow.setLength(xLength);
    gyroXArrow.setDirection(new THREE.Vector3(Math.sign(gyroX), 0, 0));
    
    // Y-axis (pitch)
    const yLength = Math.min(Math.abs(gyroY) / 50, 3);
    gyroYArrow.setLength(yLength);
    gyroYArrow.setDirection(new THREE.Vector3(0, Math.sign(gyroY), 0));
    
    // Z-axis (yaw)
    const zLength = Math.min(Math.abs(gyroZ) / 50, 3);
    gyroZArrow.setLength(zLength);
    gyroZArrow.setDirection(new THREE.Vector3(0, 0, Math.sign(gyroZ)));
    
    // Update display values
    document.getElementById('gyro-x-value').textContent = gyroX.toFixed(3);
    document.getElementById('gyro-y-value').textContent = gyroY.toFixed(3);
    document.getElementById('gyro-z-value').textContent = gyroZ.toFixed(3);
    document.getElementById('gyro-magnitude').textContent = magnitude.toFixed(3);
}
