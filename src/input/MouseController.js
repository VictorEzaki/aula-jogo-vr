import * as THREE from 'three';

/**
 * Controlador de entrada baseado em mouse. Única classe que conhece
 * "mouse" e "tela" — expõe para o resto do jogo apenas um raio
 * genérico { origin, direction }, exatamente na mesma forma que o
 * XRInputHandler expõe para os controles VR. É essa forma comum que
 * permite trocar (ou combinar) as fontes de entrada sem tocar em
 * Collision, TargetManager ou nos painéis de UI 3D.
 */
export class MouseController {
  constructor(domElement, camera) {
    this.domElement = domElement;
    this.camera = camera;
    this.enabled = true;

    this._ndc = new THREE.Vector2(0, 0);
    this._raycaster = new THREE.Raycaster();

    this._onSelect = null;
    this.screenPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    window.addEventListener('mousemove', (e) => this._handleMouseMove(e));
    window.addEventListener('mousedown', (e) => this._handleMouseDown(e));
  }

  onSelect(callback) {
    this._onSelect = callback;
  }

  _handleMouseMove(e) {
    this.screenPosition = { x: e.clientX, y: e.clientY };
    this._ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
    this._ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  _handleMouseDown(e) {
    if (!this.enabled) return;
    if (e.button !== 0) return;
    if (this._onSelect) this._onSelect(this.getRay(), 'mouse');
  }

  /** Retorna o raio atual (origem na câmera, direção pelo NDC do mouse). */
  getRay() {
    this._raycaster.setFromCamera(this._ndc, this.camera);
    return {
      origin: this._raycaster.ray.origin.clone(),
      direction: this._raycaster.ray.direction.clone(),
    };
  }
}
