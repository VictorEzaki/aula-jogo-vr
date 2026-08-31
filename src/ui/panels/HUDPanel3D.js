import * as THREE from 'three';
import { createTextPanel } from './TextPanelFactory.js';

function drawBoard(ctx, canvas, label, value) {
  ctx.fillStyle = '#1a1030';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = '#4dd0e1';
  ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, canvas.width / 2, 56);

  ctx.fillStyle = '#ffe14d';
  ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
  ctx.fillText(value, canvas.width / 2, 128);
}

/**
 * HUD em espaço 3D: dois quadros presos à barraca, um com a pontuação
 * e outro com o tempo restante — a mesma linguagem visual dos
 * quadros "SCORE / AMMO" de uma barraca de tiro real. Diferente do
 * HUD em DOM do jogo original, este funciona idêntico em desktop e
 * dentro do headset, porque é geometria da cena, não overlay de tela.
 */
export class HUDPanel3D {
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.visible = false;
    parent.add(this.group);

    this._lastScore = null;
    this._lastTime = null;

    this.scorePanel = createTextPanel({
      width: 1.3,
      height: 0.65,
      canvasWidth: 400,
      canvasHeight: 200,
      draw: (ctx, canvas) => drawBoard(ctx, canvas, 'PONTUAÇÃO', '0'),
    });
    this.scorePanel.mesh.position.set(-2.7, 3.5, -0.35);
    this.group.add(this.scorePanel.mesh);

    this.timePanel = createTextPanel({
      width: 1.3,
      height: 0.65,
      canvasWidth: 400,
      canvasHeight: 200,
      draw: (ctx, canvas) => drawBoard(ctx, canvas, 'TEMPO', '60'),
    });
    this.timePanel.mesh.position.set(2.7, 3.5, -0.35);
    this.group.add(this.timePanel.mesh);
  }

  show() {
    this.group.visible = true;
    this._lastScore = null;
    this._lastTime = null;
  }

  hide() {
    this.group.visible = false;
  }

  /** Só redesenha o canvas quando o valor realmente muda (evita custo de textura todo frame). */
  update(score, timeLeft) {
    const roundedTime = Math.ceil(timeLeft);

    if (score !== this._lastScore) {
      this._lastScore = score;
      this.scorePanel.redraw((ctx, canvas) => drawBoard(ctx, canvas, 'PONTUAÇÃO', String(score)));
    }

    if (roundedTime !== this._lastTime) {
      this._lastTime = roundedTime;
      this.timePanel.redraw((ctx, canvas) => drawBoard(ctx, canvas, 'TEMPO', String(roundedTime)));
    }
  }
}
