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
 * HUD em espaço 3D preso à barraca, com a pontuação do jogador. O
 * tempo restante não é mais mostrado como número exato aqui — virou
 * as barras visuais laterais do balcão (ver MatchTimeBarsPanel3D).
 * Diferente do HUD em DOM do jogo original, este funciona idêntico em
 * desktop e dentro do headset, porque é geometria da cena, não
 * overlay de tela.
 */
export class HUDPanel3D {
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.visible = false;
    parent.add(this.group);

    this._lastScore = null;

    this.scorePanel = createTextPanel({
      width: 1.3,
      height: 0.65,
      canvasWidth: 400,
      canvasHeight: 200,
      draw: (ctx, canvas) => drawBoard(ctx, canvas, 'PONTUAÇÃO', '0'),
    });
    this.scorePanel.mesh.position.set(0, 2.7, 0.5);
    this.group.add(this.scorePanel.mesh);
  }

  show() {
    this.group.visible = true;
    this._lastScore = null;
  }

  hide() {
    this.group.visible = false;
  }

  /** Só redesenha o canvas quando o valor realmente muda (evita custo de textura todo frame). */
  update(score) {
    if (score === this._lastScore) return;
    this._lastScore = score;
    this.scorePanel.redraw((ctx, canvas) => drawBoard(ctx, canvas, 'PONTUAÇÃO', String(score)));
  }
}
