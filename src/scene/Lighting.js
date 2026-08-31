import * as THREE from 'three';

/**
 * Configura a iluminação da cena. Recebe a `scene` diretamente (não o
 * worldGroup) porque luzes não precisam ser deslocadas junto com o
 * cenário — elas iluminam tudo independentemente da posição relativa
 * do jogador.
 */
export class Lighting {
  constructor(scene) {
    const hemi = new THREE.HemisphereLight(0x9fb8ff, 0x2a1a44, 0.9);
    scene.add(hemi);

    const ambient = new THREE.AmbientLight(0x3a2d6b, 0.4);
    scene.add(ambient);

    const marqueeLight = new THREE.PointLight(0xffe14d, 1.1, 20);
    marqueeLight.position.set(0, 4.2, -4.5);
    scene.add(marqueeLight);

    const fill = new THREE.DirectionalLight(0xfff6e0, 0.8);
    fill.position.set(4, 8, 2);
    fill.castShadow = true;
    fill.shadow.mapSize.set(2048, 2048);
    fill.shadow.camera.left = -10;
    fill.shadow.camera.right = 10;
    fill.shadow.camera.top = 10;
    fill.shadow.camera.bottom = -10;
    fill.shadow.camera.near = 1;
    fill.shadow.camera.far = 30;
    fill.shadow.bias = -0.0025;
    scene.add(fill);
  }
}
