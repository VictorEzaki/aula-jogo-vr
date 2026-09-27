import * as THREE from 'three';
import { createTextPanel } from './TextPanelFactory.js';

// Fica na parte de baixo do balcão de prêmios, na altura do
// "retângulo"/vitrine do balcão, perto de onde ficaria o balcão
// físico (~1.3m). Ajuste Y depois de conferir no navegador se a
// altura bate com o retângulo do modelo do balcão (ver
// BOOTH_POSITION em PrizeBoothModel.js: x=0, z=-4).
const SCORE_POSITION = { x: 0, y: 0.3, z: -3 };
const SCORE_WIDTH = 0.6;
const SCORE_HEIGHT = 0.2;
const SCORE_TILT_DEGREES = 20;

function drawScore(ctx, canvas, score) {
  ctx.fillStyle = '#1a1030';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  
  ctx.fillStyle = '#4dd0e1';
  ctx.font = 'bold 42px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PONTOS', canvas.width / 2, 62);
  
  ctx.fillStyle = '#ffe14d';
  ctx.font = 'bold 120px "Trebuchet MS", sans-serif';
  ctx.fillText(String(score), canvas.width / 2, 185);
}

/**
* Placar da partida em espaço 3D, pendurado na parte de baixo do
* balcão de prêmios — mesma técnica de canvas-texture usada pelo
* resto da UI (TextPanelFactory), numa posição próxima ao
* retângulo/vitrine do balcão.
*/
export class MatchScorePanel3D {
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.visible = false;
    parent.add(this.group);
    
    this._lastScore = null;
    
    this.panel = createTextPanel({
      width: SCORE_WIDTH,
      height: SCORE_HEIGHT,
      canvasWidth: 460,
      canvasHeight: 240,
      draw: (ctx, canvas) => drawScore(ctx, canvas, 0),
    });
    this.panel.mesh.position.set(SCORE_POSITION.x, SCORE_POSITION.y, SCORE_POSITION.z);
    this.panel.mesh.rotation.x = THREE.MathUtils.degToRad(-SCORE_TILT_DEGREES);
    this.group.add(this.panel.mesh);
  }
  
  show() {
    this.group.visible = true;
    this._lastScore = null;
  }
  
  hide() {
    this.group.visible = false;
  }
  
  /** Só redesenha o canvas quando a pontuação exibida realmente muda (evita custo de textura todo frame). */
  update(score) {
    if (score === this._lastScore) return;
    this._lastScore = score;
    this.panel.redraw((ctx, canvas) => drawScore(ctx, canvas, score));
  }
}
