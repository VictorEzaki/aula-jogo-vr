import * as THREE from 'three';
import { createTextPanel } from './TextPanelFactory.js';

// Pendurado acima do balcão de prêmios (ver BOOTH_POSITION em
// PrizeBoothModel.js: x=0, z=-4, altura total ~2.2m). Fica bem maior
// e mais alto que os placares de PONTUAÇÃO/TEMPO do HUDPanel3D (que
// ficam coladinhos no jogador) — a ideia é dar pra ver o tempo restante
// de longe, olhando para a barraca, sem precisar checar os placares
// próximos. Ajuste Y se a marquise do balcão parecer muito perto/longe
// depois de conferir no navegador.
const CLOCK_POSITION = { x: 0, y: 3.1, z: -3.9 };
const CLOCK_WIDTH = 1.7;
const CLOCK_HEIGHT = 0.9;

// Nos últimos 10s o número vira vermelho — reforço visual de urgência
// sem precisar de outro elemento na tela (mesma ideia dos popups de
// pontuação, mas para o relógio).
const URGENT_THRESHOLD_SECONDS = 10;

function drawClock(ctx, canvas, seconds) {
  ctx.fillStyle = '#1a1030';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  ctx.fillStyle = '#4dd0e1';
  ctx.font = 'bold 46px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TEMPO', canvas.width / 2, 66);

  ctx.fillStyle = seconds <= URGENT_THRESHOLD_SECONDS ? '#ff5252' : '#ffe14d';
  ctx.font = 'bold 130px "Trebuchet MS", sans-serif';
  ctx.fillText(String(seconds), canvas.width / 2, 195);
}

/**
 * Cronômetro da partida em espaço 3D, pendurado acima do balcão de
 * prêmios — mesma técnica de canvas-texture usada por HUDPanel3D,
 * GameOverPanel3D e CountdownPanel3D, só que numa posição diferente
 * (longe do jogador, junto ao cenário) e com dígitos bem maiores para
 * continuar legível à distância.
 */
export class MatchClockPanel3D {
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.visible = false;
    parent.add(this.group);

    this._lastSeconds = null;

    this.panel = createTextPanel({
      width: CLOCK_WIDTH,
      height: CLOCK_HEIGHT,
      canvasWidth: 480,
      canvasHeight: 240,
      draw: (ctx, canvas) => drawClock(ctx, canvas, 60),
    });
    this.panel.mesh.position.set(CLOCK_POSITION.x, CLOCK_POSITION.y, CLOCK_POSITION.z);
    this.group.add(this.panel.mesh);
  }

  show() {
    this.group.visible = true;
    this._lastSeconds = null;
  }

  hide() {
    this.group.visible = false;
  }

  /** Só redesenha o canvas quando o segundo exibido realmente muda (evita custo de textura todo frame). */
  update(timeLeft) {
    const seconds = Math.max(0, Math.ceil(timeLeft));
    if (seconds === this._lastSeconds) return;
    this._lastSeconds = seconds;
    this.panel.redraw((ctx, canvas) => drawClock(ctx, canvas, seconds));
  }
}
