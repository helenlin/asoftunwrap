import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FirstPersonControls } from "./FirstPersonControls.js";






// create variables and make them available globally
let scene, myRenderer, camera;
let textureLoader;
// keep track of which frame we are on
let frameCount = 0;

let artworks = [
  {
      "url": "assets/sm/gardenofoysters.glb", 
      "sizeX": 1,
      "sizeY": 1,
      "sizeZ": 1,
      "x": 1, 
      "y": 1, 
      "z": 1, 
      "title": "garden of oysters", 
      "walltext": "title: garden of oysters\nartist: helen lin"
  }
]


// wall text variables
const popupText = document.getElementById('popupText');
let textVisible = false;







let viewers = [];

// keep track of our controls so we can update them in the draw loop
let controls;

let socket;

function setupMySocket(){
  socket = io();
  socket.on('msg', updateLocation);
}

function addModels() {

  for (let i = 0; i < artworks.length; i++) {

    console.log(artworks[i].url);

    
    let modelLoader = new GLTFLoader();
    let myUrl = artworks[i].url;
    modelLoader.load(myUrl, function ( gltf ) {
    
      let mesh = gltf.scene;
      mesh.position.set(artworks[i].x, artworks[i].y, artworks[i].z);
      mesh.position.set(artworks[i].sizeX, artworks[i].sizeY, artworks[i].sizeZ);
      
      scene.add(mesh);
    
    
    });

  
  }
}

function createNewAvatar(msg){

  let geo = new THREE.SphereGeometry(0.25, 20, 20);
  let mat = new THREE.MeshNormalMaterial();
  let newMesh = new THREE.Mesh(geo, mat);

  viewers.push(
    {id: msg.id,
    mesh: newMesh});

  newMesh.position.set(msg.x,msg.y,msg.z);
  scene.add(newMesh);
}

function updateLocation(msg){
  //console.log(msg);
  let myMesh;
  for(let i = 0; i < viewers.length; i++){
    if (viewers[i].id == msg.id) { 
      myMesh = viewers[i].mesh;
      myMesh.position.set(msg.x,msg.y,msg.z);
    }
  }
  if (myMesh == null) {
    createNewAvatar(msg);
  }
  
}

function onKeyDown(ev){
  if ((ev.key === "w") ||
  (ev.key === "a") ||
  (ev.key === "s") ||
  (ev.key === "d"))
    {
      /*
    let myMessage = {
      id: socket.id,
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    socket.emit('msg', myMessage);
    */
  }
}

function init() {

  // create a scene and give it a background color
  scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(20,20,20)");

  // create the renderer which will actually draw our scene and add it to the document
  myRenderer = new THREE.WebGLRenderer();
  myRenderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(myRenderer.domElement);

  // create our camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(-6, 0, 0);
  camera.lookAt(6, 0, 0);

  // add orbit controls so we can navigate our scene while testing
  controls = new FirstPersonControls(scene, camera, myRenderer);

  // mesh
  let grid = new THREE.GridHelper(300, 100);
  scene.add(grid);
  scene.background = new THREE.Color("rgb(186,230,190)");


  // walls and space
  let wallGeo = new THREE.BoxGeometry(100,10,0.25);
  let regMat = new THREE.MeshBasicMaterial({ color: 0xffeae0 });

  let wallMesh1 = new THREE.Mesh(wallGeo, regMat);
  wallMesh1.position.set(6,5,6);
  wallMesh1.layers.enable(3);
  let wallMesh2 = new THREE.Mesh(wallGeo, regMat);
  wallMesh2.position.set(6,5,-6);
  wallMesh2.layers.enable(3);
  scene.add(wallMesh1);
  scene.add(wallMesh2);

  // Add artwork models
  addModels();


  // add websocket support
  setupMySocket();

  // try adding some lights
  let ambientLight = new THREE.AmbientLight(0xf3f5d0);
  scene.add(ambientLight);

  // White directional light at half intensity shining from the top.
  let directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(directionalLight);

  window.addEventListener('keydown', onKeyDown);

  // start the draw loop
  draw();
}

function draw() {
  controls.update();
  frameCount = frameCount + 1;

  checkTrigger(); 
  
  let myMessage = {
    id: socket.id,
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  };
  socket.emit('msg', myMessage);


  myRenderer.render(scene, camera);

  // ask the browser to render another frame when it is ready
  window.requestAnimationFrame(draw);
}

// get everything started by calling init
init();











function checkTrigger() {
  // Check if camera is inside the trigger box

  let camX = camera.position.x; 
  let camY = camera.position.y;
  let camZ = camera.position.z;
  let tDist = 3;


  for (let i = 0; i < artworks.length; i++) {
    let item = artworks[i];

    if (
      camX >= item.x-tDist && camX <= item.x+tDist &&
      camY >= item.y-tDist && camY <= item.y+tDist &&
      camZ >= item.z-tDist && camZ <= item.z+tDist
    ) {
      if (!textVisible) {
        let wText = item.walltext;
        popupText.innerHTML = wText.replace(/\n/g, "<br>");;
        popupText.style.display = 'block';
        textVisible = true;
        break;
      }
    } else {
      if (textVisible) {
        popupText.style.display = 'none';
        textVisible = false;
      }
    }

  }

}