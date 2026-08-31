import * as THREE from 'three';

/**
 * Arminha de pressão estilo parque de diversões, presa à câmera
 * (canto inferior direito da tela). Possui uma pequena animação
 * de recuo ao disparar.
 */
export class Gun {
  constructor(camera) {
    this.camera = camera;
    this.group = this._buildMesh();

    // Posição de repouso relativa à câmera
    this.restPosition = new THREE.Vector3(0.45, -0.42, -0.9);
    this.restRotation = new THREE.Euler(0, -0.15, 0.05);
    this.group.position.copy(this.restPosition);
    this.group.rotation.copy(this.restRotation);

    camera.add(this.group);

    this._recoilTime = 0;
    this._recoilDuration = 0.18;
    this._isRecoiling = false;

    this._muzzleFlash = this._buildMuzzleFlash();
    this.group.add(this._muzzleFlash);
    this._muzzleFlashTime = 0;
  }

  _buildMesh() {
    const group = new THREE.Group();

    // Cabo (madeira/plástico)
    const gripGeo = new THREE.BoxGeometry(0.12, 0.32, 0.14);
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.7 });
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.15, 0.15);
    grip.rotation.x = -0.35;
    group.add(grip);

    // Corpo principal
    const bodyGeo = new THREE.BoxGeometry(0.16, 0.16, 0.55);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, roughness: 0.5 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, -0.1);
    group.add(body);

    // Cano
    const barrelGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.5, 12);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -0.5);
    group.add(barrel);

    // Gatilho
    const triggerGeo = new THREE.TorusGeometry(0.045, 0.012, 8, 12, Math.PI);
    const triggerMat = new THREE.MeshStandardMaterial({ color: 0xffe14d, roughness: 0.6 });
    const trigger = new THREE.Mesh(triggerGeo, triggerMat);
    trigger.position.set(0, -0.08, 0.05);
    trigger.rotation.z = Math.PI;
    group.add(trigger);

    group.traverse((child) => {
      if (child.isMesh) child.castShadow = false;
    });

    return group;
  }

  _buildMuzzleFlash() {
    const geo = new THREE.SphereGeometry(0.06, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0 });
    const flash = new THREE.Mesh(geo, mat);
    flash.position.set(0, 0.03, -0.78);
    return flash;
  }

  fire() {
    this._isRecoiling = true;
    this._recoilTime = 0;
    this._muzzleFlashTime = 0.08;
  }

  update(dt) {
    if (this._isRecoiling) {
      this._recoilTime += dt;
      const t = Math.min(this._recoilTime / this._recoilDuration, 1);
      // Vai para trás rapidamente e depois volta (curva triangular)
      const kick = t < 0.4 ? t / 0.4 : 1 - (t - 0.4) / 0.6;
      this.group.position.z = this.restPosition.z + kick * 0.12;
      this.group.rotation.x = this.restRotation.x - kick * 0.12;

      if (t >= 1) {
        this._isRecoiling = false;
        this.group.position.copy(this.restPosition);
        this.group.rotation.copy(this.restRotation);
      }
    }

    if (this._muzzleFlashTime > 0) {
      this._muzzleFlashTime -= dt;
      this._muzzleFlash.material.opacity = Math.max(this._muzzleFlashTime / 0.08, 0);
    } else {
      this._muzzleFlash.material.opacity = 0;
    }
  }
}
