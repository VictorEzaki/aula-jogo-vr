import * as THREE from 'three';

/**
 * Cria um THREE.Mesh (plano) cujo material é uma textura de canvas 2D.
 * É a técnica padrão para exibir texto dentro de uma cena WebGL sem
 * depender de DOM (que, dentro do headset, não é composto sobre a
 * cena 3D). Usado pelo HUD (placar/tempo) e pelo painel de Game Over.
 *
 * @param {object} options
 * @param {number} options.width - largura do plano no mundo (metros)
 * @param {number} options.height - altura do plano no mundo (metros)
 * @param {number} [options.canvasWidth=512]
 * @param {number} [options.canvasHeight=256]
 * @param {(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void} options.draw
 *        função que desenha o conteúdo inicial/atual no canvas
 */
export function createTextPanel({ width, height, canvasWidth = 512, canvasHeight = 256, draw }) {
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);

  function redraw(drawFn) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    (drawFn || draw)(ctx, canvas);
    texture.needsUpdate = true;
  }

  redraw(draw);

  return { mesh, canvas, ctx, texture, redraw };
}
