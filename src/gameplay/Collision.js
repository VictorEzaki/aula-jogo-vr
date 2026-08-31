import * as THREE from 'three';

/**
 * Fina camada sobre THREE.Raycaster. É o único lugar do jogo que sabe
 * fazer "intersecção de raio com objetos" — tanto o tiro nas latas
 * quanto os cliques em botões dos painéis 3D de UI passam por aqui,
 * usando sempre a mesma representação de raio: { origin, direction }.
 *
 * Isso é o que permite que mouse (raio a partir da câmera) e os dois
 * controles VR (raio a partir da pose de cada controle) compartilhem
 * exatamente a mesma lógica de "o que foi atingido".
 */
export class Collision {
  constructor() {
    this.raycaster = new THREE.Raycaster();
  }

  /** Interseção a partir de um raio genérico { origin: Vector3, direction: Vector3 }. */
  raycastFromRay(ray, objects) {
    this.raycaster.set(ray.origin, ray.direction);
    const intersections = this.raycaster.intersectObjects(objects, false);
    return intersections.length > 0 ? intersections[0] : null;
  }

  /**
   * Atalho para o caso do mouse: converte NDC (-1 a 1) + câmera em um
   * raio genérico e delega para raycastFromRay.
   */
  raycastFromCameraNDC(camera, ndc, objects) {
    this.raycaster.setFromCamera(ndc, camera);
    const intersections = this.raycaster.intersectObjects(objects, false);
    return intersections.length > 0 ? intersections[0] : null;
  }
}
