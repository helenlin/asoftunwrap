import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FirstPersonControls } from "./FirstPersonControls.js";

let artworks = []; 



// create variables and make them available globally
let scene, myRenderer, camera;
let textureLoader;
// keep track of which frame we are on
let frameCount = 0;

let viewers = [];

// keep track of our controls so we can update them in the draw loop
let controls;

let socket;

function setupMySocket(){
  socket = io();
  socket.on('msg', updateLocation);
}

function addModels() {
  let modelLoader = new GLTFLoader();
  let url = "assets/sm/gardenofoysters.glb";

  modelLoader.load(url, placeBear);
}

function placeBear(gltf) {
  let mesh = gltf.scene;
  mesh.position.set(2, 0, 2);
  mesh.scale.set(1, 1, 1);
  
  // create our texture and load in an image file
  //let baseColor = new THREE.Color("rgb(0,0,0)");
  
  // create a normal texture
  //let normColor = textureLoader.load("assets/mat/Watermarked_normal.png");
  
  //mesh.material = new THREE.MeshPhongMaterial( {map: baseColor, normalMap: normColor} );
  
  scene.add(mesh);

}

function createNewMesh(msg){

  addModels();
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
  console.log(msg);
  let myMesh;
  for(let i = 0; i < viewers.length; i++){
    if (viewers[i].id == msg.id) { 
      myMesh = viewers[i].mesh;
      myMesh.position.set(msg.x,msg.y,msg.z);
    }
  }
  if (myMesh == null) {
    createNewMesh(msg);
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
  let wallMesh2 = new THREE.Mesh(wallGeo, regMat);
  wallMesh2.position.set(6,5,-6);
  scene.add(wallMesh1);
  scene.add(wallMesh2);

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