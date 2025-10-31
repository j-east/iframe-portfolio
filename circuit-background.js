// Triangle Mesh Globe Background with Three.js
class GlobeBackground {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.globe = null;
        this.pulses = [];
        this.scrollVelocity = { x: 0, y: 0 };
        this.lastScrollY = 0;
        this.lastScrollX = 0;
        this.lastScrollTime = Date.now();
        
        this.init();
    }
    
    init() {
        // Remove existing canvas if it exists
        const existingCanvas = document.getElementById(this.canvasId);
        if (existingCanvas) {
            existingCanvas.remove();
        }
        
        // Scene setup
        this.scene = new THREE.Scene();
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 5;
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        this.renderer.domElement.id = this.canvasId;
        this.renderer.domElement.className = 'circuit-canvas';
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '0';
        this.renderer.domElement.style.pointerEvents = 'none';
        
        // Insert canvas into the portfolio container
        const portfolioContainer = document.querySelector('.portfolio-container');
        if (portfolioContainer) {
            portfolioContainer.insertBefore(this.renderer.domElement, portfolioContainer.firstChild);
        } else {
            document.body.appendChild(this.renderer.domElement);
        }
        
        // Create icosphere geometry for triangle mesh
        const geometry = new THREE.IcosahedronGeometry(2, 2);
        
        // Create wireframe material with portfolio colors
        const material = new THREE.MeshBasicMaterial({
            color: 0x4DD9D9, // Using cathode cyan from portfolio colors
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        
        this.globe = new THREE.Mesh(geometry, material);
        this.scene.add(this.globe);
        
        // Create pulse system
        this.createPulses(geometry);
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
        
        // Handle scroll for globe rotation
        window.addEventListener('wheel', (e) => this.onScroll(e), { passive: true });
        window.addEventListener('scroll', (e) => this.onScroll(e), { passive: true });
        
        // Start animation
        this.animate();
    }
    
    onScroll(event) {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastScrollTime;
        
        // Get scroll delta
        let deltaY = 0;
        let deltaX = 0;
        
        if (event.type === 'wheel') {
            deltaY = event.deltaY;
            deltaX = event.deltaX;
        } else {
            deltaY = window.scrollY - this.lastScrollY;
            deltaX = window.scrollX - this.lastScrollX;
        }
        
        // Calculate velocity with much lower dampening factor
        const velocityFactor = 0.0001; // Reduced from 0.0008 to 0.0001
        this.scrollVelocity.y += deltaY * velocityFactor;
        this.scrollVelocity.x += deltaX * velocityFactor;
        
        // Cap maximum velocity at much lower level
        const maxVelocity = 0.02; // Reduced from 0.15 to 0.02
        this.scrollVelocity.y = Math.max(-maxVelocity, Math.min(maxVelocity, this.scrollVelocity.y));
        this.scrollVelocity.x = Math.max(-maxVelocity, Math.min(maxVelocity, this.scrollVelocity.x));
        
        this.lastScrollY = window.scrollY;
        this.lastScrollX = window.scrollX;
        this.lastScrollTime = currentTime;
    }
    
    createPulses(geometry) {
        const edges = new THREE.EdgesGeometry(geometry);
        const positions = edges.attributes.position.array;
        
        // Create multiple pulses
        for (let i = 0; i < 15; i++) {
            const pulseGeometry = new THREE.BufferGeometry();
            const pulseMaterial = new THREE.LineBasicMaterial({
                color: 0x7FBF5F, // Using phosphor green from portfolio colors
                transparent: true,
                opacity: 0,
                linewidth: 2
            });
            
            const pulsePositions = new Float32Array(6);
            pulseGeometry.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
            
            const pulse = new THREE.Line(pulseGeometry, pulseMaterial);
            this.globe.add(pulse);
            
            // Random edge selection
            const edgeIndex = Math.floor(Math.random() * (positions.length / 6)) * 6;
            
            this.pulses.push({
                line: pulse,
                startPoint: new THREE.Vector3(
                    positions[edgeIndex],
                    positions[edgeIndex + 1],
                    positions[edgeIndex + 2]
                ),
                endPoint: new THREE.Vector3(
                    positions[edgeIndex + 3],
                    positions[edgeIndex + 4],
                    positions[edgeIndex + 5]
                ),
                progress: Math.random(),
                speed: 0.005 + Math.random() * 0.01,
                delay: Math.random() * 200
            });
        }
    }
    
    updatePulses() {
        this.pulses.forEach(pulse => {
            if (pulse.delay > 0) {
                pulse.delay--;
                return;
            }
            
            pulse.progress += pulse.speed;
            
            if (pulse.progress >= 1) {
                pulse.progress = 0;
                pulse.delay = Math.random() * 100;
                pulse.line.material.opacity = 0;
            }
            
            // Calculate pulse position and length
            const pulseLength = 0.15;
            const fadeIn = 0.1;
            const fadeOut = 0.9;
            
            let opacity = 1;
            if (pulse.progress < fadeIn) {
                opacity = pulse.progress / fadeIn;
            } else if (pulse.progress > fadeOut) {
                opacity = (1 - pulse.progress) / (1 - fadeOut);
            }
            
            pulse.line.material.opacity = opacity * 0.9;
            
            // Calculate start and end of the pulse segment
            const segmentStart = Math.max(0, pulse.progress - pulseLength);
            const segmentEnd = Math.min(1, pulse.progress);
            
            const startPos = new THREE.Vector3().lerpVectors(
                pulse.startPoint,
                pulse.endPoint,
                segmentStart
            );
            
            const endPos = new THREE.Vector3().lerpVectors(
                pulse.startPoint,
                pulse.endPoint,
                segmentEnd
            );
            
            // Update pulse geometry
            const positions = pulse.line.geometry.attributes.position.array;
            positions[0] = startPos.x;
            positions[1] = startPos.y;
            positions[2] = startPos.z;
            positions[3] = endPos.x;
            positions[4] = endPos.y;
            positions[5] = endPos.z;
            pulse.line.geometry.attributes.position.needsUpdate = true;
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Apply scroll velocity to rotation
        this.globe.rotation.y += this.scrollVelocity.y;
        this.globe.rotation.x += this.scrollVelocity.x;
        
        // Apply friction to create momentum decay
        const friction = 0.98;
        this.scrollVelocity.y *= friction;
        this.scrollVelocity.x *= friction;
        
        // Add subtle base rotation when not scrolling
        if (Math.abs(this.scrollVelocity.y) < 0.001 && Math.abs(this.scrollVelocity.x) < 0.001) {
            this.globe.rotation.y += 0.002;
            this.globe.rotation.x += 0.001;
        }
        
        // Update pulses
        this.updatePulses();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    destroy() {
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}

// Compatibility wrapper to maintain the same interface
class CircuitBackground extends GlobeBackground {
    constructor(canvasId) {
        super(canvasId);
    }
}

// Export for use in main script
window.CircuitBackground = CircuitBackground;
window.GlobeBackground = GlobeBackground;