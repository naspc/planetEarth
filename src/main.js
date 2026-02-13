import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import getStarfield from './stars.js';

// ============================================================================
// Use string paths for images
// ============================================================================

const WorldMap = 'img/earth.jpg';
const EarthNormalMap = 'img/earthNightt.jpg';
const SpecMap = 'img/earthSpec.jpg';
// ============================================================================
// COUNTRY MARKER FIXES ONLY
// ============================================================================

const countryMarkers = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredCountry = null;

// store client coordinates for tooltip
let mouseClientX = 0;
let mouseClientY = 0;

const tooltip = document.createElement('div');
tooltip.style = `
    position: fixed;
    padding: 8px;
    background: rgba(0,0,0,0.7);
    color: white;
    border-radius: 4px;
    pointer-events: none;
    display: none;
`;
document.body.appendChild(tooltip);

// FIXED: mouse event listener with client coordinates
window.addEventListener('mousemove', (event) => {
    // normalized device coordinates for raycasting
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // store client coordinates for tooltip positioning
    mouseClientX = event.clientX;
    mouseClientY = event.clientY;
});

async function createCountryMarkers() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const countries = await response.json();
        
        // ADD THESE SPECIFIC LOCATIONS FIRST
        const specificLocations = [
            { name: "Havana, Cuba", lat: 23.1136, lng: -82.3666, population: "2.1M", isSpecific: true },
            { name: "Portland, Oregon", lat: 45.5152, lng: -122.6784, population: "652K", isSpecific: true },
            { name: "Italy", lat: 41.8719, lng: 12.5674, population: "59.1M", isSpecific: true },
            { name: "Iceland", lat: 64.9631, lng: -19.0208, population: "376K", isSpecific: true },
            { name: "France", lat: 46.2276, lng: 2.2137, population: "67.9M", isSpecific: true },
            { name: "Spain", lat: 40.4637, lng: -3.7492, population: "47.4M", isSpecific: true },
            { name: "Switzerland", lat: 46.8182, lng: 8.2275, population: "8.7M", isSpecific: true },
            { name: "Gibraltar", lat: 36.1408, lng: -5.3536, population: "34K", isSpecific: true }
        ];
        
        // CREATE MARKERS FOR SPECIFIC LOCATIONS
        specificLocations.forEach(location => {
            const phi = (90 - location.lat) * Math.PI / 180;
            const theta = (location.lng + 180) * Math.PI / 180;
            const radius = 1.52;
            
            // USE RED COLOR FOR SPECIFIC LOCATIONS
            const markerGeometry = new THREE.SphereGeometry(0.025, 8, 8);
            const markerMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000, // RED for specific locations
                transparent: true,
                opacity: 0.8
            });
            
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.setFromSphericalCoords(radius, phi, theta);
            marker.lookAt(new THREE.Vector3(0, 0, 0));
            marker.userData = {
                name: location.name,
                population: location.population,
                isSpecific: true
            };
            
            earthGroup.add(marker);
            countryMarkers.push(marker);
        });
        
        // THEN ADD ALL COUNTRIES AS BEFORE
        countries.forEach(country => {
            if (country.latlng) {
                const lat = country.latlng[0];
                const lng = country.latlng[1];
                const phi = (90 - lat) * Math.PI / 180;
                const theta = (lng + 180) * Math.PI / 180;
                const radius = 1.52;

                const markerGeometry = new THREE.SphereGeometry(0.025, 8, 8);
                const markerMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0xffffff, // WHITE for regular countries
                    transparent: true,
                    opacity: 0.8
                });
                
                const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                marker.position.setFromSphericalCoords(radius, phi, theta);
                marker.lookAt(new THREE.Vector3(0, 0, 0));
                marker.userData = {
                    name: country.name.common,
                    population: country.population.toLocaleString(),
                    isSpecific: false
                };
                
                earthGroup.add(marker);
                countryMarkers.push(marker);
            }
        });
        
        console.log(`Created ${specificLocations.length} specific locations + ${countries.length} countries`);
        
    } catch (error) {
        console.error('Error fetching country data:', error);
        createTestMarkers(); // Fallback to test markers if API fails
    }
}

// fallback test markers
function createTestMarkers() {
    console.log('Creating test markers...');
    
    const testCountries = [
        { name: 'USA', lat: 40, lng: -100 },
        { name: 'UK', lat: 54, lng: -2 },
        { name: 'Japan', lat: 36, lng: 138 },
        { name: 'Australia', lat: -25, lng: 133 },
        { name: 'Brazil', lat: -14, lng: -51 }
    ];
    
    testCountries.forEach(country => {
        const phi = (90 - country.lat) * (Math.PI / 180);
        const theta = (country.lng + 180) * (Math.PI / 180);
        const radius = 1.52;
        
        const markerGeometry = new THREE.SphereGeometry(0.05, 8, 8); // larger for visibility
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, // red for visibility
            transparent: true,
            opacity: 0.9
        });
        
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.setFromSphericalCoords(radius, phi, theta);
        marker.lookAt(new THREE.Vector3(0, 0, 0));
        
        marker.userData = {
            name: country.name,
            population: 'Test Data'
        };
        
        // FIXED: ADD TO EARTHGROUP
        earthGroup.add(marker);
        countryMarkers.push(marker);
    });
}

// ============================================================================
// YOUR ORIGINAL CODE BELOW - NO CHANGES TO FUNCTIONALITY
// ============================================================================

const clock = new THREE.Clock();
const EARTH_ROTATION_SPEED = 0.002;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);
camera.position.z = 100;

const canvas = document.getElementById('display-canvas');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas || document.createElement('canvas'),
    antialias: true
});
if (!canvas) document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ORBIT CONTROLS - NO CHANGES
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// EARTH - NO CHANGES
const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);

const earthGeometry = new THREE.SphereGeometry(1.5, 40, 40);
const loader = new THREE.TextureLoader();

const earthMaterial = new THREE.MeshPhongMaterial({
    map: loader.load(WorldMap),
    normalMap: loader.load(EarthNormalMap),
    specularMap: loader.load(SpecMap),
    specular: 0x222222,
    shininess: 5,
    normalScale: new THREE.Vector2(0.8, 0.8)
});

earthMaterial.map.colorSpace = THREE.SRGBColorSpace;
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earthGroup.add(earth);

// LIGHTING - NO CHANGES
const sunLight = new THREE.DirectionalLight(0xfff3d6, 1.8);
sunLight.position.set(-5, 3, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const lightMat = new THREE.MeshBasicMaterial({
    map: loader.load('img/earthNightt.jpg'), // Fixed: use string path
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8,
    color: 0x222222
});

const lightMesh = new THREE.Mesh(earthGeometry, lightMat);
earthGroup.add(lightMesh);

// ATMOSPHERE - NO CHANGES
const atmosphereGeometry = new THREE.SphereGeometry(1.52, 40, 40);
const glowMaterial = new THREE.MeshPhongMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const glowMesh = new THREE.Mesh(atmosphereGeometry, glowMaterial);
earthGroup.add(glowMesh);

// CLOUDS - NO CHANGES
const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load('img/cloud.jpg'), // Fixed: use string path
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    alphaMap: loader.load('img/clouds.jpg'), // Fixed: use string path
});
const cloudsMesh = new THREE.Mesh(earthGeometry, cloudsMat);
cloudsMesh.scale.setScalar(1.003);
earthGroup.add(cloudsMesh);

// FIXED: animate function with correct tooltip positioning
function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    
    // raycasting for country markers
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(countryMarkers);
    
    if (intersects.length > 0) {
        if (hoveredCountry !== intersects[0].object) {
            hoveredCountry = intersects[0].object;
            
            // update tooltip
            tooltip.style.display = 'block';
            tooltip.innerHTML = `
                <strong>${hoveredCountry.userData.name}</strong><br>
                Population: ${hoveredCountry.userData.population}
            `;
            
            // animation
            new TWEEN.Tween(hoveredCountry.scale)
                .to({ x: 1.5, y: 1.5, z: 1.5 }, 200)
                .start();
        }
        
        // FIXED: use client coordinates for tooltip positioning
        tooltip.style.left = `${mouseClientX + 15}px`;
        tooltip.style.top = `${mouseClientY + 15}px`;
        
    } else {
        if (hoveredCountry) {
            new TWEEN.Tween(hoveredCountry.scale)
                .to({ x: 1, y: 1, z: 1 }, 200)
                .start();
            hoveredCountry = null;
            tooltip.style.display = 'none';
        }
    }
    
    // EARTH ROTATION - NO CHANGES
    earthGroup.rotation.y += EARTH_ROTATION_SPEED;
    cloudsMesh.rotation.y += 0.0001;
    stars.rotation.y -= 0.0002;
    
    controls.update();
    renderer.render(scene, camera);
}

// WINDOW RESIZE - NO CHANGES
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// STARS - USING IMPORTED STARFIELD
const stars = getStarfield({numStars: 5000});
scene.add(stars);

// START EVERYTHING
animate();
createCountryMarkers();