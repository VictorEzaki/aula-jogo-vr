import * as THREE from 'three';
import { createTextPanel } from './TextPanelFactory.js';
import { MATCH_DURATION } from '../../core/GameStateMachine.js';

// Duas barras verticais nas laterais do balcão de prêmios — fora da
// faixa de x ocupada pelos balões (COLUMNS_X em BalloonSlots.js vai
// de -1 a 1) e fora da largura do modelo do balcão já escalado (ver
// BOOTH_POSITION em PrizeBoothModel.js: x=0, z=-4). Ajuste
// BAR_X_OFFSET/BAR_Z depois de conferir no navegador se elas ficam
// realmente ao lado da barraca sem encostar nela.
const BAR_X_OFFSET = 2;
const BAR_Y_BOTTOM = 0;
const BAR_HEIGHT_WORLD = 2.0;
const BAR_Y_CENTER = BAR_Y_BOTTOM + BAR_HEIGHT_WORLD / 2;
const BAR_Z = -3.9;
const BAR_WIDTH_WORLD = 0.35;

const CANVAS_WIDTH = 120;
const CANVAS_HEIGHT = 480;

// Regra de cor: verde do tempo cheio até a metade da partida, amarelo
// da metade até faltarem 10s, vermelho a partir de 10s. A transição
// entre as cores é uma interpolação linear contínua (não um corte
// abrupto) para não incomodar o olho durante o jogo.
const HALF_DURATION = MATCH_DURATION / 2;
const URGENT_THRESHOLD_SECONDS = 10;

const COLOR_GREEN = new THREE.Color('#4caf50');
const COLOR_YELLOW = new THREE.Color('#ffe14d');
const COLOR_RED = new THREE.Color('#ff5252');

/** Verde -> amarelo -> vermelho, com mescla linear contínua nas transições. */
function getBarColor(timeLeft) {
  const color = new THREE.Color();

  if (timeLeft >= HALF_DURATION) {
    const span = MATCH_DURATION - HALF_DURATION;
    const t = span > 0 ? (MATCH_DURATION - timeLeft) / span : 1;
    color.lerpColors(COLOR_GREEN, COLOR_YELLOW, THREE.MathUtils.clamp(t, 0, 1));
  } else if (timeLeft >= URGENT_THRESHOLD_SECONDS) {
    const span = HALF_DURATION - URGENT_THRESHOLD_SECONDS;
    const t = span > 0 ? (HALF_DURATION - timeLeft) / span : 1;
    color.lerpColors(COLOR_YELLOW, COLOR_RED, THREE.MathUtils.clamp(t, 0, 1));
  } else {
    color.copy(COLOR_RED);
  }

  return color;
}

function drawBar(ctx, canvas, fraction, color) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Moldura, mesmo estilo visual dos outros painéis do balcão.
  ctx.fillStyle = '#1a1030';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = w * 0.06;
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);

  // Trilho vazio (fundo mais escuro dentro da moldura).
  const padding = w * 0.16;
  const trackX = padding;
  const trackY = padding;
  const trackW = w - padding * 2;
  const trackH = h - padding * 2;
  ctx.fillStyle = '#2a1f45';
  ctx.fillRect(trackX, trackY, trackW, trackH);

  // Preenchimento cresce de baixo pra cima, proporcional ao tempo
  // restante — "esvazia" de cima pra baixo conforme o tempo acaba.
  const fillH = trackH * THREE.MathUtils.clamp(fraction, 0, 1);
  ctx.fillStyle = `#${color.getHexString()}`;
  ctx.fillRect(trackX, trackY + (trackH - fillH), trackW, fillH);
}

/**
 * Duas barras verticais (uma de cada lado do balcão de prêmios) que
 * indicam o tempo restante de forma só visual: o preenchimento
 * diminui de cima pra baixo e a cor muda (verde -> amarelo ->
 * vermelho) conforme a partida se aproxima do fim. Mesma técnica de
 * canvas-texture do resto da UI (TextPanelFactory), sem nenhum
 * número — substitui o antigo painel numérico de tempo do balcão.
 */
export class MatchTimeBarsPanel3D {
  constructor(parent) {
    this.group = new THREE.Group();
    this.group.visible = false;
    parent.add(this.group);

    this._lastFillPixels = null;

    this.leftBar = this._createBar(-BAR_X_OFFSET);
    this.rightBar = this._createBar(BAR_X_OFFSET);
  }

  _createBar(x) {
    const panel = createTextPanel({
      width: BAR_WIDTH_WORLD,
      height: BAR_HEIGHT_WORLD,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      draw: (ctx, canvas) => drawBar(ctx, canvas, 1, COLOR_GREEN),
    });
    panel.mesh.position.set(x, BAR_Y_CENTER, BAR_Z);
    this.group.add(panel.mesh);
    return panel;
  }

  show() {
    this.group.visible = true;
    this._lastFillPixels = null;
  }

  hide() {
    this.group.visible = false;
  }

  /**
   * Só redesenha quando a altura preenchida (em pixels do canvas)
   * muda — mesma ideia de custo dos outros painéis. Com 480px de
   * altura para os 45s da partida, isso ainda redesenha a cada ~90ms,
   * suave o bastante pra não parecer "degrau".
   */
  update(timeLeft) {
    const fraction = THREE.MathUtils.clamp(timeLeft / MATCH_DURATION, 0, 1);
    const fillPixels = Math.round(fraction * CANVAS_HEIGHT);
    if (fillPixels === this._lastFillPixels) return;
    this._lastFillPixels = fillPixels;

    const color = getBarColor(timeLeft);
    const draw = (ctx, canvas) => drawBar(ctx, canvas, fraction, color);
    this.leftBar.redraw(draw);
    this.rightBar.redraw(draw);
  }
}
