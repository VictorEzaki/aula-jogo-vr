import * as THREE from 'three';
import { createTextPanel } from './TextPanelFactory.js';

function drawCountdown(ctx, canvas, text) {
  ctx.fillStyle = 'rgba(26, 16, 48, 0.88)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  ctx.fillStyle = '#ffe14d';
  ctx.font = 'bold 160px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

/**
 * Painel 3D com a contagem regressiva (3, 2, 1, JOGAR!), exibido entre o
 * clique em "Jogar"/"Tentar novamente" e o início efetivo da partida.
 * Preso à `scene` (não ao worldGroup) — mesmo padrão do GameOverPanel3D —
 * então fica sempre centralizado na frente do jogador, tanto em desktop
 * quanto dentro do headset, independente de onde o worldGroup está.
 */
export class CountdownPanel3D {
  constructor(scene) {
    this.panel = createTextPanel({
      width: 1.2,
      height: 1.2,
      canvasWidth: 400,
      canvasHeight: 400,
      draw: (ctx, canvas) => drawCountdown(ctx, canvas, '3'),
    });
    this.panel.mesh.position.set(0, 1.6, -2.5);
    this.panel.mesh.visible = false;
    scene.add(this.panel.mesh);
  }

  show() {
    this.panel.mesh.visible = true;
  }

  hide() {
    this.panel.mesh.visible = false;
  }

  setText(text) {
    this.panel.redraw((ctx, canvas) => drawCountdown(ctx, canvas, text));
  }
}
