import * as THREE from 'three';

const NORMAL_COLORS = [0xe63946, 0x4dd0e1, 0x8ce99a, 0xffb347, 0xff9ff3];
const SPECIAL_COLOR = 0xffe14d;

let nextId = 1;

/**
 * Representa uma única lata: posição, estado, pontuação e a
 * pequena animação de queda ao ser atingida.
 */
export class Target {
  constructor(basePosition, options = {}) {
    this.id = nextId++;
    this.basePosition = basePosition.clone();
    this.isSpecial = !!options.special;
    this.scoreValue = this.isSpecial ? 250 : 100;

    this.active = true; // ainda "em pé" e pode ser atingida
    this.falling = false;
    this.fallTime = 0;
    this.fallDuration = 0.5;

    this.respawnDelay = 2.2 + Math.random() * 1.2;
    this.respawnTimer = 0;

    this.mesh = this._buildMesh();
    this.mesh.position.copy(this.basePosition);
    this.mesh.userData.target = this;
  }

  _buildMesh() {
    const group = new THREE.Group();

    const color = this.isSpecial ? SPECIAL_COLOR : this._randomColor();
    const bodyGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.55, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.15,
      emissive: this.isSpecial ? new THREE.Color(0x554400) : new THREE.Color(0x000000),
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Tampa/topo com cor levemente diferente para dar acabamento cartoon
    const capGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.06, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const topCap = new THREE.Mesh(capGeo, capMat);
    topCap.position.y = 0.28;
    group.add(topCap);

    // Estrela decorativa simples (um pequeno cone achatado) no corpo da lata
    const starGeo = new THREE.ConeGeometry(0.08, 0.05, 5);
    const starMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const star = new THREE.Mesh(starGeo, starMat);
    star.rotation.x = Math.PI / 2;
    star.position.set(0, 0.02, 0.23);
    group.add(star);

    return group;
  }

  _randomColor() {
    return NORMAL_COLORS[Math.floor(Math.random() * NORMAL_COLORS.length)];
  }

  /** Chamado quando o raycaster acerta esta lata. Retorna false se já estava inativa. */
  hit() {
    if (!this.active) return false;
    this.active = false;
    this.falling = true;
    this.fallTime = 0;
    this.respawnTimer = 0;

    // Direção de queda aleatória para variar a animação
    this._fallDirection = Math.random() > 0.5 ? 1 : -1;
    this._fallAxis = Math.random() > 0.5 ? 'x' : 'z';

    return true;
  }

  update(dt) {
    if (this.falling) {
      this.fallTime += dt;
      const t = Math.min(this.fallTime / this.fallDuration, 1);
      const eased = 1 - Math.pow(1 - t, 2);

      // Gira e cai para trás/lado, descendo levemente
      if (this._fallAxis === 'x') {
        this.mesh.rotation.z = eased * this._fallDirection * (Math.PI / 2);
      } else {
        this.mesh.rotation.x = eased * this._fallDirection * (Math.PI / 2);
      }
      this.mesh.position.y = this.basePosition.y - eased * 0.22;
      this.mesh.position.z = this.basePosition.z - eased * 0.15 * this._fallDirection * 0.4;

      if (t >= 1) {
        this.falling = false;
      }
      return;
    }

    if (!this.active && !this.falling) {
      this.respawnTimer += dt;
      if (this.respawnTimer >= this.respawnDelay) {
        this.respawn();
      }
    }
  }

  respawn() {
    this.active = true;
    this.falling = false;
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.position.copy(this.basePosition);
  }
}
