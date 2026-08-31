import * as THREE from 'three';

/**
 * Estrutura de madeira da barraca de tiro (tema "StarShot Arcade"):
 * balcão, laterais, teto listrado e placa neon. As latas ficam sobre
 * a prateleira central, criada pelo TargetManager.
 */
export class ShootingStand {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);

    this._createFrame();
    this._createCounter();
    this._createRoof();
    this._createSign();
    this._createSideDecor();
  }

  _woodMaterial(color = 0xb5651d) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  }

  _createFrame() {
    const postGeo = new THREE.BoxGeometry(0.25, 3.2, 0.25);
    const postMat = this._woodMaterial(0x5a3a1e);

    const positions = [
      [-3.2, 1.6, -1.6],
      [3.2, 1.6, -1.6],
      [-3.2, 1.6, 1.2],
      [3.2, 1.6, 1.2],
    ];
    positions.forEach(([x, y, z]) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, y, z);
      post.castShadow = true;
      post.receiveShadow = true;
      this.group.add(post);
    });

    const backWallGeo = new THREE.BoxGeometry(6.6, 3.2, 0.2);
    const backWallMat = this._woodMaterial(0x8a5a2b);
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 1.6, -1.65);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    const shelfGeo = new THREE.BoxGeometry(4.6, 0.12, 1.4);
    const shelfMat = this._woodMaterial(0xc98a4b);
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, 0.9, -0.9);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    this.group.add(shelf);
  }

  _createCounter() {
    const counterGeo = new THREE.BoxGeometry(6.8, 0.9, 0.6);
    const counterMat = this._woodMaterial(0x6b4020);
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 0.45, 1.3);
    counter.castShadow = true;
    counter.receiveShadow = true;
    this.group.add(counter);

    const topGeo = new THREE.BoxGeometry(7.0, 0.1, 0.7);
    const topMat = this._woodMaterial(0xe0a15c);
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.set(0, 0.95, 1.3);
    top.castShadow = true;
    this.group.add(top);
  }

  _createRoof() {
    const roofGeo = new THREE.BoxGeometry(7.4, 0.2, 2.6);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x7b2d6b, roughness: 0.7 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 3.25, -0.2);
    roof.castShadow = true;
    this.group.add(roof);

    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffe14d, roughness: 0.7 });
    for (let i = -3; i <= 3; i++) {
      if (i % 2 === 0) continue;
      const stripeGeo = new THREE.BoxGeometry(0.9, 0.22, 2.62);
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(i * 0.95, 3.26, -0.2);
      this.group.add(stripe);
    }
  }

  _createSign() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a1030';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    ctx.fillStyle = '#ff6bcb';
    ctx.font = 'bold 56px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff6bcb';
    ctx.shadowBlur = 18;
    ctx.fillText('STARSHOT', canvas.width / 2, 58);
    ctx.fillStyle = '#4dd0e1';
    ctx.shadowColor = '#4dd0e1';
    ctx.font = 'bold 40px "Trebuchet MS", sans-serif';
    ctx.fillText('ARCADE', canvas.width / 2, 112);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const signGeo = new THREE.PlaneGeometry(3.4, 1.05);
    const signMat = new THREE.MeshStandardMaterial({
      map: texture,
      emissiveMap: texture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.6,
      roughness: 0.9,
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 3.95, -0.2);
    this.group.add(sign);
  }

  _createSideDecor() {
    const boxColors = [0x4dd0e1, 0xff9ff3, 0x8ce99a];
    boxColors.forEach((color, i) => {
      const geo = new THREE.BoxGeometry(0.45, 0.45, 0.45);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      const box = new THREE.Mesh(geo, mat);
      box.position.set(-3.9, 0.25 + i * 0.02, 1.6 - i * 0.5);
      box.rotation.y = i * 0.5;
      box.castShadow = true;
      box.receiveShadow = true;
      this.group.add(box);
    });

    const balloonColors = [0xff6b6b, 0xffe14d, 0x4dd0e1];
    balloonColors.forEach((color, i) => {
      const geo = new THREE.SphereGeometry(0.28, 12, 12);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
      const balloon = new THREE.Mesh(geo, mat);
      balloon.position.set(3.7 + i * 0.05, 2.6 + i * 0.35, 1.4 - i * 0.3);
      balloon.castShadow = true;
      this.group.add(balloon);
    });
  }
}
