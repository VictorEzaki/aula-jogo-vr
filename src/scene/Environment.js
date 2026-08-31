import * as THREE from 'three';

/**
 * Ambiente ao redor da barraca: chão, tendas estilizadas de fundo e
 * bandeirinhas decorativas. Mantido simples de propósito, para que a
 * atenção (e o orçamento de performance, importante em VR) fique
 * concentrada na barraca e nos alvos.
 */
export class Environment {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);

    this._createGround();
    this._createBackdrop();
    this._createBunting();
  }

  _createGround() {
    const groundGeo = new THREE.CircleGeometry(20, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x2e2350, roughness: 1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  _createBackdrop() {
    const tentColors = [0xff6bcb, 0x4dd0e1, 0xffb347];
    for (let i = 0; i < 3; i++) {
      const tent = this._createTent(tentColors[i]);
      tent.position.set(-10 + i * 10, 0, -9);
      this.group.add(tent);
    }
  }

  _createTent(color) {
    const tent = new THREE.Group();

    const coneGeo = new THREE.ConeGeometry(2.4, 2.6, 8);
    const coneMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 3.6;
    tent.add(cone);

    const bodyGeo = new THREE.CylinderGeometry(2.4, 2.4, 2.4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x241a3d, roughness: 0.9 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    tent.add(body);

    return tent;
  }

  _createBunting() {
    const colors = [0xff6b6b, 0xffe14d, 0x4dd0e1, 0x8ce99a, 0xff9ff3];
    const shape = new THREE.Shape();
    shape.moveTo(-0.18, 0);
    shape.lineTo(0.18, 0);
    shape.lineTo(0, -0.28);
    shape.closePath();
    const flagGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });

    const count = 14;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide,
      });
      const flag = new THREE.Mesh(flagGeo, mat);
      const t = i / (count - 1);
      flag.position.set(-4.5 + t * 9, 4.9 - Math.sin(t * Math.PI) * 0.25, -4.4);
      this.group.add(flag);
    }
  }
}
