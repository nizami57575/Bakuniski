import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, carModel;
let speed = 0, rpm = 800, gear = 0, isClutch = false, peredok = 0.2;
let tilt = 0, lastTurnTime = 0, lastDir = null;
let inputs = { gas: false, left: false, right: false };

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 2));

    // Yol (Sonsuzluq effekti üçün sadə müstəvi)
    const roadGeo = new THREE.PlaneGeometry(20, 1000);
    const roadMat = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    scene.add(road);

    camera.position.set(0, 3, 7);
    camera.lookAt(0, 0, 0);

    loadCar();
    animate();
}

function loadCar() {
    // Modelin yoxdursa bura müvəqqəti qutu əlavə edirik
    const loader = new GLTFLoader();
    // loader.load('assets/models/vaz2107.glb', (gltf) => { carModel = gltf.scene; scene.add(carModel); });
    
    // Test üçün müvəqqəti maşın (Box)
    const geometry = new THREE.BoxGeometry(1.5, 1, 3);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    carModel = new THREE.Mesh(geometry, material);
    carModel.position.y = 0.5;
    scene.add(carModel);
}

// Global funksiyalar (window-a bağlayırıq ki HTML-dən işləsin)
window.adjustPeredok = () => { peredok += 0.1; carModel.rotation.x = -peredok * 0.2; };
window.startGame = () => {
    document.getElementById('garage-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
};
window.setGear = (g) => { 
    if(isClutch) { gear = g; document.getElementById('gear-indicator').innerText = "Ötürmə: " + g; }
    else { alert("XIRRR! Muftaya bas!"); }
};

// Mobil düymələri dinləyək
const setupMobile = () => {
    document.getElementById('btn-gas').ontouchstart = () => inputs.gas = true;
    document.getElementById('btn-gas').ontouchend = () => inputs.gas = false;
    document.getElementById('btn-left').ontouchstart = () => { inputs.left = true; checkTwoWheels('L'); };
    document.getElementById('btn-left').ontouchend = () => inputs.left = false;
    document.getElementById('btn-right').ontouchstart = () => { inputs.right = true; checkTwoWheels('R'); };
    document.getElementById('btn-right').ontouchend = () => inputs.right = false;
    document.getElementById('btn-clutch').ontouchstart = () => { isClutch = true; document.getElementById('btn-clutch').classList.add('clutch-btn-active'); };
    document.getElementById('btn-clutch').ontouchend = () => { isClutch = false; document.getElementById('btn-clutch').classList.remove('clutch-btn-active'); };
};

// İki təkər alqoritmi
function checkTwoWheels(dir) {
    let now = Date.now();
    if (lastDir && lastDir !== dir && now - lastTurnTime < 300 && speed > 50) {
        tilt = (speed / 100); // Sürət çoxdursa daha çox qalxır
    }
    lastDir = dir; lastTurnTime = now;
}

function animate() {
    requestAnimationFrame(animate);

    if(carModel) {
        // Fizika hesablama
        if(inputs.gas && gear > 0) speed += (gear * 0.1);
        else speed *= 0.99; // Sürtünmə

        if(inputs.left) carModel.position.x -= speed * 0.001;
        if(inputs.right) carModel.position.x += speed * 0.001;

        // İki təkər effekti (Z oxu ətrafında fırlanma)
        tilt *= 0.95; // Zamanla təkər yerə düşür
        carModel.rotation.z = THREE.MathUtils.lerp(carModel.rotation.z, (inputs.left ? -tilt : (inputs.right ? tilt : 0)), 0.1);

        // UI yenilə
        document.getElementById('speedometer').innerText = Math.floor(speed) + " KM/H";
        document.getElementById('rpm-meter').innerText = "RPM: " + Math.floor(800 + (speed * 20 / (gear || 1)));
    }

    renderer.render(scene, camera);
}

init();
setupMobile();

