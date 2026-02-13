import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';
import getStarfield from './stars.js';

// ============================================================================
// IMAGE PATHS (relative to index.html)
// ============================================================================
const WorldMap = 'img/earth.jpg';
const EarthNormalMap = 'img/earthNightt.jpg';
const SpecMap = 'img/earthSpec.jpg';

// ============================================================================
// COUNTRY MARKERS – FIXED
// ============================================================================
const countryMarkers = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredCountry = null;
let mouseClientX = 0, mouseClientY = 0;

const tooltip = document.createElement('div');
tooltip.style = `
    position: fixed;
    padding: 8px;
    background: rgba(0,0,0,0.7);
    color: white;
    border-radius: 4px;
    pointer-events: none;
    display: none;
    z-index: 1000;
`;
document.body.appendChild(tooltip);

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouseClientX = event.clientX;
    mouseClientY = event.clientY;
});

async function createCountryMarkers() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const countries = await response.json();

        const specificLocations = [
            { name: "Havana, Cuba", lat: 23.1136, lng: -82.3666, population: "2.1M" },
            { name: "Portland, Oregon", lat: 45.5152, lng: -122.6784, population: "652K" },
            { name: "Italy", lat: 41.8719, lng: 12.5674, population: "59.1M" },
            { name: "Iceland", lat: 64.9631, lng: -19.0208, population: "376K" },
            { name: "France", lat: 46.2276, lng: 2.2137, population: "67.9M" },
            { name: "Spain", lat: 40.4637, lng: -3.7492, population: "47.4M" },
            { name: "Switzerland", lat: 46.8182, lng: 8.2275, population: "8.7M" },
            { name: "Gibraltar", lat: 36.1408, lng: -5.3536, population: "34K" }
        ];

        // Add specific locations (red)
        specificLocations.forEach(location => {
            const phi = (90 - location.lat) * Math.PI / 180;
            const theta = (location.lng + 180) * Math.PI / 180;
            const radius = 1.52;

            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 })
            );
            marker.position.setFromSphericalCoords(radius, phi, theta);
            marker.lookAt(0, 0, 0);
            marker.userData = { name: location.name, population: location.population };
            earthGroup.add(marker);
            countryMarkers.push(marker);
        });

        // Add all countries from API (white)
        countries.forEach(country => {
            if (country.latlng) {
                const lat = country.latlng[0];
                const lng = country.latlng[1];
                const phi = (90 - lat) * Math.PI / 180;
                const theta = (lng + 180) * Math.PI / 180;
                const radius = 1.52;

                const marker = new THREE.Mesh(
                    new THREE.SphereGeometry(0.025, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
                );
                marker.position.setFromSphericalCoords(radius, phi, theta);
                marker.lookAt(0, 0, 0);
                marker.userData = {
                    name: country.name.common,
                    population: country.population ? country.population.toLocaleString() : 'N/A'
                };
                earthGroup.add(marker);
                countryMarkers.push(marker);
            }
        });

        console.log(`✅ Created ${specificLocations.length} specific + ${countryMarkers.length - specificLocations.length} country markers`);
    } catch (error) {
        console.error('❌ Failed to fetch countries, using fallback:', error);
        createTestMarkers();
    }
}

function createTestMarkers() {
    const testCountries = [
        { name: 'USA', lat: 40, lng: -100 },
        { name: 'UK', lat: 54, lng: -2 },
        { name: 'Japan', lat: 36, lng: 138 },
        { name: 'Australia', lat: -25, lng: 133 },
        { name: 'Brazil', lat: -14, lng: -51 }
    ];
    testCountries.forEach(country => {
        const phi = (90 - country.lat) * Math.PI / 180;
        const theta = (country.lng + 180) * Math.PI / 180;
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.9 })
        );
        marker.position.setFromSphericalCoords(1.52, phi, theta);
        marker.lookAt(0, 0, 0);
        marker.userData = { name: country.name, population: 'TEST' };
        earthGroup.add(marker);
        countryMarkers.push(marker);
    });
}

// ============================================================================
// SCENE SETUP
// ============================================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 100;

const canvas = document.getElementById('display-canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas || undefined, antialias: true });
if (!canvas) document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = false;

// ============================================================================
// EARTH GROUP
// ============================================================================
const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180; // axial tilt
scene.add(earthGroup);

const earthGeometry = new THREE.SphereGeometry(1.5, 64, 64);
const loader = new THREE.TextureLoader();

// Earth material
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

// Night lights
const lightMat = new THREE.MeshBasicMaterial({
    map: loader.load(EarthNormalMap), // using night texture
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8,
    color: 0x444444
});
const lightMesh = new THREE.Mesh(earthGeometry, lightMat);
earthGroup.add(lightMesh);

// Atmosphere glow
const atmosphereGeometry = new THREE.SphereGeometry(1.52, 64, 64);
const glowMaterial = new THREE.MeshPhongMaterial({
    color: 0x3399ff,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const glowMesh = new THREE.Mesh(atmosphereGeometry, glowMaterial);
earthGroup.add(glowMesh);

// Clouds
const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load('img/cloud.jpg'),
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    alphaMap: loader.load('img/clouds.jpg'),
    side: THREE.DoubleSide
});
const cloudsMesh = new THREE.Mesh(earthGeometry, cloudsMat);
cloudsMesh.scale.setScalar(1.003);
earthGroup.add(cloudsMesh);

// ============================================================================
// LIGHTING
// ============================================================================
const sunLight = new THREE.DirectionalLight(0xffeedd, 1.8);
sunLight.position.set(-5, 3, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambientLight);

// ============================================================================
// STARS (from stars.js)
// ============================================================================
const stars = getStarfield({ numStars: 5000 });
scene.add(stars);

// ============================================================================
// ANIMATION LOOP
// ============================================================================
const EARTH_ROTATION_SPEED = 0.0015;

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();

    // Raycasting for markers
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(countryMarkers);

    if (intersects.length > 0) {
        if (hoveredCountry !== intersects[0].object) {
            if (hoveredCountry) {
                new TWEEN.Tween(hoveredCountry.scale)
                    .to({ x: 1, y: 1, z: 1 }, 200)
                    .start();
            }
            hoveredCountry = intersects[0].object;
            new TWEEN.Tween(hoveredCountry.scale)
                .to({ x: 1.5, y: 1.5, z: 1.5 }, 200)
                .start();
            tooltip.style.display = 'block';
            tooltip.innerHTML = `<strong>${hoveredCountry.userData.name}</strong><br>Population: ${hoveredCountry.userData.population}`;
        }
        tooltip.style.left = mouseClientX + 15 + 'px';
        tooltip.style.top = mouseClientY + 15 + 'px';
    } else {
        if (hoveredCountry) {
            new TWEEN.Tween(hoveredCountry.scale)
                .to({ x: 1, y: 1, z: 1 }, 200)
                .start();
            hoveredCountry = null;
        }
        tooltip.style.display = 'none';
    }

    // Rotations
    earthGroup.rotation.y += EARTH_ROTATION_SPEED;
    cloudsMesh.rotation.y += 0.0001;
    stars.rotation.y -= 0.0001;

    controls.update();
    renderer.render(scene, camera);
}

animate();
createCountryMarkers();

// ============================================================================
// RESIZE HANDLER
// ============================================================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});