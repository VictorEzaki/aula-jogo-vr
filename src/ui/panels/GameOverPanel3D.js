import * as THREE from 'three';
import { createTextPanel } from './TextPanelFactory.js';

function drawTitleAndScore(ctx, canvas, score) {
  ctx.fillStyle = '#1a1030';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffb347';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = '#ff6bcb';
  ctx.font = 'bold 46px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PARTIDA ENCERRADA', canvas.width / 2, 70);

  ctx.fillStyle = '#cbd5f5';
  ctx.font = '28px "Trebuchet MS", sans-serif';
  ctx.fillText('Pontuação final', canvas.width / 2, 130);

  ctx.fillStyle = '#ffe14d';
  ctx.font = 'bold 72px "Trebuchet MS", sans-serif';
  ctx.fillText(String(score), canvas.width / 2, 210);
}

function drawButton(ctx, canvas, label, hovered) {
  ctx.fillStyle = hovered ? '#1d9e75' : '#0f6e56';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = hovered ? '#ffe14d' : '#4dd0e1';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

  ctx.fillStyle = '#fff6da';
  ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
}

/**
 * Painel 3D de fim de jogo. Diferente do menu inicial (que precisa de
 * teclado e por isso é DOM), aqui não há nenhuma entrada de texto —
 * só duas escolhas — então faz sentido ser 100% espaço 3D, clicável
 * pelo mesmo raio genérico (mouse ou controle VR) usado no tiro.
 */
export class GameOverPanel3D {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    this.group.position.set(0, 1.6, -3);
    scene.add(this.group);

    this._onRetry = null;
    this._onBackToMenu = null;

    this.scorePanel = createTextPanel({
      width: 1.6,
      height: 0.8,
      canvasWidth: 480,
      canvasHeight: 240,
      draw: (ctx, canvas) => drawTitleAndScore(ctx, canvas, 0),
    });
    this.scorePanel.mesh.position.set(0, 0.55, 0);
    this.group.add(this.scorePanel.mesh);

    this.retryButton = this._buildButton('TENTAR NOVAMENTE', -0.55, () => this._onRetry?.());
    this.menuButton = this._buildButton('VOLTAR AO MENU', 0.55, () => this._onBackToMenu?.());

    this._raycaster = new THREE.Raycaster();
  }

  _buildButton(label, x, onClick) {
    const panel = createTextPanel({
      width: 0.9,
      height: 0.35,
      canvasWidth: 360,
      canvasHeight: 140,
      draw: (ctx, canvas) => drawButton(ctx, canvas, label, false),
    });
    panel.mesh.position.set(x, -0.35, 0);
    panel.mesh.userData.isButton = true;
    panel.mesh.userData.label = label;
    panel.mesh.userData.onClick = onClick;
    panel.mesh.userData.hovered = false;
    panel.mesh.userData.redrawButton = (hovered) =>
      panel.redraw((ctx, canvas) => drawButton(ctx, canvas, label, hovered));
    this.group.add(panel.mesh);
    return panel.mesh;
  }

  /** @param {{ onRetry: () => void, onBackToMenu: () => void }} handlers */
  show(finalScore, { onRetry, onBackToMenu }) {
    this._onRetry = onRetry;
    this._onBackToMenu = onBackToMenu;
    this.scorePanel.redraw((ctx, canvas) => drawTitleAndScore(ctx, canvas, finalScore));
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  get buttons() {
    return [this.retryButton, this.menuButton];
  }

  /** Chamado a cada frame para destacar visualmente o botão mirado. */
  updateHover(rays) {
    if (!this.group.visible) return;

    this.buttons.forEach((button) => {
      const isHovered = rays.some((ray) => this._intersects(ray, button));
      if (isHovered !== button.userData.hovered) {
        button.userData.hovered = isHovered;
        button.userData.redrawButton(isHovered);
      }
    });
  }

  /** Chamado quando o jogador dispara (clique/gatilho). Retorna true se acertou um botão. */
  handleSelect(ray) {
    if (!this.group.visible) return false;

    for (const button of this.buttons) {
      if (this._intersects(ray, button)) {
        button.userData.onClick();
        return true;
      }
    }
    return false;
  }

  _intersects(ray, mesh) {
    this._raycaster.set(ray.origin, ray.direction);
    return this._raycaster.intersectObject(mesh, false).length > 0;
  }
}
