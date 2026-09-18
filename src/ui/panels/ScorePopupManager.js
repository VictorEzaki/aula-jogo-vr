import { createTextPanel } from './TextPanelFactory.js';

// Curto e discreto de propósito: sobe pouco, dura pouco, letra
// pequena — é um reforço rápido, não pode competir com a mira nem
// com os próprios balões.
const LIFETIME_SECONDS = 0.6;
const RISE_DISTANCE = 0.25; // metros que o texto sobe durante a animação
const PANEL_WIDTH = 0.45;
const PANEL_HEIGHT = 0.22;
const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 150;

const COLOR_POSITIVE = '#4ddb6a';
const COLOR_NEGATIVE = '#ff5252';

function drawScoreText(ctx, canvas, text, color) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = 'bold 60px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Contorno escuro fino só para garantir leitura sobre qualquer
  // fundo (céu, lona do circo, balões coloridos), sem virar uma caixa
  // chamativa.
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

/**
 * Feedback rápido de pontuação: um "+50"/"-10" que nasce na posição
 * do balão estourado, sobe alguns centímetros, esmaece e some. Sem
 * pool de objetos — a taxa de estouro é baixa o bastante (no máximo
 * poucos por segundo) para não justificar a complexidade extra; cada
 * popup descarta sua própria geometria/textura ao terminar, mesmo
 * padrão de descarte usado em outras partes do projeto.
 *
 * Fica no worldGroup (mesmo espaço dos balões e do HUD), então a
 * posição recebida em spawn() pode ser copiada direto de
 * balloon.mesh.position sem nenhuma conversão de espaço.
 */
export class ScorePopupManager {
  constructor(parent) {
    this.parent = parent;
    this.active = [];
  }

  /**
   * @param {THREE.Vector3} position - posição (no espaço do parent) onde o balão estourou
   * @param {number} points - valor a exibir; sinal decide cor (verde/vermelho) e prefixo "+"
   */
  spawn(position, points) {
    if (!points) return;

    const text = points > 0 ? `+${points}` : `${points}`;
    const color = points > 0 ? COLOR_POSITIVE : COLOR_NEGATIVE;

    const panel = createTextPanel({
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      canvasWidth: CANVAS_WIDTH,
      canvasHeight: CANVAS_HEIGHT,
      draw: (ctx, canvas) => drawScoreText(ctx, canvas, text, color),
    });

    panel.mesh.position.copy(position);
    panel.mesh.renderOrder = 10; // desenha por cima dos balões/ambiente
    this.parent.add(panel.mesh);

    this.active.push({ panel, age: 0, baseY: position.y });
  }

  /** Remove e descarta todos os popups ativos (ex: ao reiniciar a partida). */
  clear() {
    for (const entry of this.active) {
      this._dispose(entry);
    }
    this.active.length = 0;
  }

  _dispose(entry) {
    this.parent.remove(entry.panel.mesh);
    entry.panel.mesh.geometry.dispose();
    entry.panel.mesh.material.map.dispose();
    entry.panel.mesh.material.dispose();
  }

  /**
   * @param {number} dt
   * @param {THREE.Camera} [camera] - usado para o texto sempre encarar o jogador
   */
  update(dt, camera) {
    if (this.active.length === 0) return;

    for (let i = this.active.length - 1; i >= 0; i--) {
      const entry = this.active[i];
      entry.age += dt;
      const t = Math.min(entry.age / LIFETIME_SECONDS, 1);

      entry.panel.mesh.position.y = entry.baseY + RISE_DISTANCE * t;
      entry.panel.mesh.material.opacity = 1 - t;

      if (camera) {
        camera.getWorldQuaternion(entry.panel.mesh.quaternion);
      }

      if (t >= 1) {
        this._dispose(entry);
        this.active.splice(i, 1);
      }
    }
  }
}
