import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-test-panorama',
  standalone: true,
  imports: [],
  templateUrl: './test-panorama.component.html',
  styleUrl: './test-panorama.component.css'
})
export class TestPanoramaComponent implements OnInit {
  ngOnInit() {
    this.init()
    this.animate2()
  }

  @ViewChild('container') container: ElementRef<HTMLDivElement>;
  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas: ElementRef<HTMLCanvasElement>;


  constructor(private ngZone: NgZone) {}

  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene; 
  renderer: THREE.WebGLRenderer;

  isUserInteracting = false;
  onPointerDownMouseX = 0;
  onPointerDownMouseY = 0;
  lon = 0;
  lat = 0;
  phi = 0;
  theta = 0;
  onPointerDownLon = 0
  onPointerDownLat = 0

  init() {

    const container = this.rendererCanvas.nativeElement

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);

    this.scene = new THREE.Scene();

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(- 1, 1, 1);

    const texture = new THREE.TextureLoader().load('./assets/images360/076HJQ41059007899.jpg');
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, material);

    // this.scene.add(this.camera)
    this.scene.add(mesh);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // this.renderer.setAnimationLoop(this.animate.bind(this));
    container.appendChild(this.renderer.domElement);

    container.style.touchAction = 'none';
    container.addEventListener('pointerdown', this.onPointerDown);

    document.addEventListener('wheel', this.onDocumentMouseWheel);

    window.addEventListener('resize', this.onWindowResize);

  }

onWindowResize() {

  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();

  this.renderer.setSize(window.innerWidth, window.innerHeight);

}

onPointerDown(event) {

  if (event.isPrimary === false) return;

  this.isUserInteracting = true;

  this.onPointerDownMouseX = event.clientX;
  this.onPointerDownMouseY = event.clientY;

  this.onPointerDownLon = this.lon;
  this.onPointerDownLat = this.lat;

  document.addEventListener('pointermove', this.onPointerMove);
  document.addEventListener('pointerup', this.onPointerUp);

}

onPointerMove(event) {

  if (event.isPrimary === false) return;

  this.lon = (this.onPointerDownMouseX - event.clientX) * 0.1 + this.onPointerDownLon;
  this.lat = (event.clientY - this.onPointerDownMouseY) * 0.1 + this.onPointerDownLat;

}

onPointerUp(event) {

  if (event.isPrimary === false) return;

  this.isUserInteracting = false;

  document.removeEventListener('pointermove', this.onPointerMove);
  document.removeEventListener('pointerup', this.onPointerUp);

}

onDocumentMouseWheel(event) {

  const fov = this.camera.fov + event.deltaY * 0.05;

  this.camera.fov = THREE.MathUtils.clamp(fov, 10, 75);

  this.camera.updateProjectionMatrix();

}

 animate = () => {

  if (this.isUserInteracting === false) {

    this.lon += 0.1;

  }

  this.lat = Math.max(- 85, Math.min(85, this.lat));
  this.phi = THREE.MathUtils.degToRad(90 - this.lat);
  this.theta = THREE.MathUtils.degToRad(this.lon);

  const x = 500 * Math.sin(this.phi) * Math.cos(this.theta);
  const y = 500 * Math.cos(this.phi);
  const z = 500 * Math.sin(this.phi) * Math.sin(this.theta);

  this.camera.lookAt(x, y, z);

  this.renderer.render(this.scene, this.camera);

}


animate2(): void {
  // We have to run this outside angular zones,
  // because it could trigger heavy changeDetection cycles.
  this.ngZone.runOutsideAngular(() => {
    if (document.readyState !== 'loading') {
      this.render2();
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        this.render2();
      });
    }

    window.addEventListener('resize', () => {
      this.resize();
    });
  });
}

frameId: number = null;
public render2(): void {
  this.frameId = requestAnimationFrame(() => {
    this.render2();
  });

  // this.cube.rotation.x += 0.01;
  // this.cube.rotation.y += 0.01;
  this.renderer.render(this.scene, this.camera);
}

public resize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;

  this.camera.aspect = width / height;
  this.camera.updateProjectionMatrix();

  this.renderer.setSize(width, height);
}

}
