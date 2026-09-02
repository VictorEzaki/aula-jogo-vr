import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

/**
 * Gerencia os dois controles WebXR (Meta Quest 3 usa exatamente esse
 * modelo de duas mãos rastreadas). Cada controle vira um "gatilho"
 * independente: ambos podem mirar e disparar ao mesmo tempo, o que
 * atende ao requisito de suportar os dois controles.
 *
 * Assim como o MouseController, esta classe expõe apenas raios
 * genéricos { origin, direction } — quem consome (Game, UIManager)
 * não precisa saber que a origem é um XRInputSource.
 */
export class XRInputHandler {
  constructor(renderer, playerRig) {
    this.renderer = renderer;
    this.playerRig = playerRig;
    this.enabled = true;

    this._onSelect = null;
    this.controllers = [0, 1].map((index) => this._buildController(index));
  }

  onSelect(callback) {
    this._onSelect = callback;
  }

  _buildController(index) {
    const sourceId = `xr-controller-${index}`;
    const controller = this.renderer.xr.getController(index);
    controller.addEventListener('selectstart', () => {
      if (!this.enabled) return;
      if (this._onSelect) this._onSelect(this._rayFromController(controller), sourceId);
    });
    this.playerRig.add(controller);

    // Ponteiro laser visível saindo do controle, para o jogador ver
    // onde está mirando dentro do headset.
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5),
    ]);
    const line = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.8 })
    );
    line.name = 'laser-pointer';
    controller.add(line);

    // Modelo 3D do próprio controle (renderizado pelo navegador/SO),
    // para o jogador ver a "arminha" nas mãos dentro do VR.
    const controllerModelFactory = new XRControllerModelFactory();
    const grip = this.renderer.xr.getControllerGrip(index);
    grip.add(controllerModelFactory.createControllerModel(grip));
    this.playerRig.add(grip);

    return controller;
  }

  _rayFromController(controller) {
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3(0, 0, -1);

    controller.getWorldPosition(origin);
    direction.applyQuaternion(controller.getWorldQuaternion(new THREE.Quaternion()));

    return { origin, direction };
  }

  /** Raios atuais dos dois controles, usados para destacar botões ao mirar (hover). */
  getActiveRays() {
    return this.controllers.map((c) => this._rayFromController(c));
  }
}
