import * as THREE from 'three';

export default function getStarfield({ numStars = 500 } = {}) {
    function randomSpherePoint() {
        const radius = Math.random() * 25 + 25;
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        return {
            pos: new THREE.Vector3(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            ),
            hue: 0.6,
        };
    }

    const vertices = [];
    const colors = [];

    for (let i = 0; i < numStars; i++) {
        const { pos, hue } = randomSpherePoint();
        const color = new THREE.Color().setHSL(hue, 0.2, Math.random() * 0.5 + 0.2);
        vertices.push(pos.x, pos.y, pos.z);
        colors.push(color.r, color.g, color.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.2,
        vertexColors: true,
        map: new THREE.TextureLoader().load('img/circle.png'),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    return new THREE.Points(geometry, material);
}