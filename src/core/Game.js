import { VRButton } from 'three/addons/webxr/VRButton.js';

import { SceneManager } from '../scene/SceneManager.js';
import { Lighting } from '../scene/Lighting.js';
import { loadCircusEnvironment } from '../scene/CircusEnvironmentModel.js';
import { loadPrizeBoothModel } from '../scene/PrizeBoothModel.js';
import { loadSky, followCamera } from '../scene/SkyModel.js';

import { Collision } from '../gameplay/Collision.js';
import { BalloonSpawner } from '../gameplay/balloons/BalloonSpawner.js';
import { preloadBalloonModels } from '../gameplay/balloons/BalloonModelLoader.js';
import { BalloonTypeId } from '../gameplay/balloons/BalloonTypes.js';

import { InputManager } from '../input/InputManager.js';
import { UIManager } from '../ui/UIManager.js';
import { MuteButton } from '../ui/MuteButton.js';

import { GameStateMachine, GameStates } from './GameStateMachine.js';
import { GameLoop } from './GameLoop.js';
import { ScoreService } from '../services/ScoreService.js';
import { AudioManager } from './../audio/AudioManager.js';
import { CountdownController } from './../CountdownController.js';

// "A arma deve conter um delay de meio segundo" — aplicado por fonte
// de disparo (mouse, ou cada controle VR individualmente), não
// globalmente. Ver _canShoot/_registerShot.
const SHOT_COOLDOWN_MS = 0;

// Feedback tátil ao estourar um balão, aplicado só no controle que
// disparou (ver Game._handleShot/InputManager.triggerHaptic). Balões
// que somam pontuação vibram curto e leve; o balão de penalidade
// vibra mais forte e por mais tempo, para reforçar que foi um erro.
const HAPTIC_POSITIVE = { intensity: 0.3, durationMs: 40 };
const HAPTIC_PENALTY = { intensity: 1.0, durationMs: 220 };

/**
 * Ponto central que conecta todos os sistemas do jogo. Mantém o fluxo
 * de "mirar e atirar" desacoplado de qual dispositivo gerou o raio
 * (mouse ou um dos dois controles VR) — ver InputManager e Collision.
 *
 * Fluxo de telas:
 *   MENU (DOM)  --Jogar-->  PLAYING (HUD 3D)  --tempo zera-->  GAMEOVER (painel 3D)
 *        ^                                                          |
 *        '--------------------- Voltar ao menu -----------------'
 *                              (Tentar novamente volta para PLAYING)
 */
export class Game {
  constructor() {
    const canvas = document.getElementById('game-canvas');
    this.crosshairEl = document.getElementById('crosshair');

    this.sceneManager = new SceneManager(canvas);
    const { scene, worldGroup, camera, playerRig, renderer } = this.sceneManager;

    new Lighting(scene);

    // Os dois GLBs são carregados em paralelo. Guardamos a Promise
    // combinada para esperar por ela antes de liberar a partida (ver
    // _handlePlay), em vez de travar a construção do Game inteiro.
    //
    // As latas foram removidas por enquanto — o modelo de alvos ainda
    // vai ser definido, então TargetManager/Collision seguem no
    // projeto prontos para o próximo modelo, mas não instanciados.
    // Os balões (ver gameplay/balloons/) são o alvo principal agora.
    this.sky = null;
    this.modelReadyPromise = Promise.all([
      loadCircusEnvironment(worldGroup),
      loadPrizeBoothModel(worldGroup),
      loadSky(scene),
      preloadBalloonModels(),
    ])
      .then(([, , sky]) => {
        this.sky = sky;
      })
      .catch((err) => {
        console.error('Falha ao carregar os modelos 3D da cena:', err);
      });

    this.collision = new Collision();
    this.balloonSpawner = new BalloonSpawner(worldGroup);

    // Timestamp do último disparo por fonte ('mouse', 'xr-controller-0',
    // 'xr-controller-1'), para o cooldown de meio segundo ser
    // individual por mira.
    this._lastShotAt = new Map();

    this.input = new InputManager({ renderer, camera, playerRig, domElement: canvas });
    this.ui = new UIManager({ scene, worldGroup });
    this.state = new GameStateMachine();

    this.loop = new GameLoop(renderer, (dt) => this.update(dt));

    this.audioManager = new AudioManager();
    this.audioManager.initTheme(); // começa tocando mutada assim que a página carrega

    // Botão do canto superior direito: única forma confiável de
    // desbloquear áudio com som tanto em desktop quanto dentro do
    // headset (ver comentário em AudioManager.initTheme).
    this.muteButton = new MuteButton({
      initialMuted: this.audioManager.isMuted(),
      onToggle: (muted) => this.audioManager.setMuted(muted),
    });

    this.countdown = new CountdownController({
      onTick: (text) => this._onCountdownTick(text),
      onComplete: () => this._onCountdownComplete(),
    });
    this._pendingPlayerName = '';

    this._setupVRButton(renderer);
    this._wireEvents();
    this.ui.showMenu();
  }

  _onCountdownTick(text) {
    this.ui.updateCountdownText(text);
  }

  /** Chamado quando a contagem 3-2-1 termina — é aqui que a partida de fato começa. */
  _onCountdownComplete() {
    this.ui.hideCountdown();
    this.state.startMatch(this._pendingPlayerName);
    this.balloonSpawner.reset();
    this.ui.showHUD();
  }

  _setupVRButton(renderer) {
    const vrButton = VRButton.createButton(renderer);
    document.body.appendChild(vrButton);

    renderer.xr.addEventListener('sessionstart', () => {
      this.crosshairEl.classList.add('hidden');
    });
  }

  _wireEvents() {
    this.ui.menu.onPlay((playerName) => this._handlePlay(playerName));
    this.input.onSelect((ray, sourceId) => this._handleSelect(ray, sourceId));

    this.state.onGameOver(({ playerName, score }) => {
      // Ponto de integração com o backend: disparado automaticamente
      // ao fim de toda partida, incluindo em "Tentar novamente".
      ScoreService.saveScore(playerName, score);
      this.audioManager.restoreThemeVolume();

      this.ui.showGameOver(score, {
        onRetry: () => this._handleRetry(),
        onBackToMenu: () => this._handleBackToMenu(),
      });
    });
  }

  async _handlePlay(playerName) {
    this.ui.menu.setBusy(true);
    await this.modelReadyPromise;
    this.ui.menu.setBusy(false);

    this._pendingPlayerName = playerName;
    this.ui.hideMenu();
    this._startCountdown();
  }

  _handleRetry() {
    // Mantém o mesmo nome de jogador (mesmo espírito de restartMatch()),
    // mas o início efetivo só acontece quando a contagem terminar
    // (ver _onCountdownComplete), então usamos startMatch lá.
    this._pendingPlayerName = this.state.playerName;
    this._startCountdown();
  }

  /** Abaixa a música gradualmente e inicia o 3-2-1 antes da partida (usado por "Jogar" e "Tentar novamente"). */
  _startCountdown() {
    this.audioManager.duckThemeForGameplay();
    this.ui.showCountdown();
    this.countdown.start();
  }

  _handleBackToMenu() {
    const { renderer } = this.sceneManager;
    if (renderer.xr.isPresenting) {
      renderer.xr.getSession().end();
    }
    this.audioManager.restoreThemeVolume();
    this.state.backToMenu();
    this.ui.showMenu(); // já busca o leaderboard atualizado no ScoreService
  }

  _handleSelect(ray, sourceId) {
    switch (this.state.state) {
      case GameStates.PLAYING:
        // O delay de disparo só se aplica ao tiro em si — cliques nos
        // painéis de UI (GAMEOVER) continuam instantâneos.
        if (!this._canShoot(sourceId)) return;
        this._registerShot(sourceId);
        this._handleShot(ray, sourceId);
        break;
      case GameStates.GAMEOVER:
        this.ui.handleSelect(ray);
        break;
      default:
        // MENU: interação é via DOM, não via raio 3D.
        break;
    }
  }

  _canShoot(sourceId) {
    const lastShot = this._lastShotAt.get(sourceId) ?? -Infinity;
    return performance.now() - lastShot >= SHOT_COOLDOWN_MS;
  }

  _registerShot(sourceId) {
    this._lastShotAt.set(sourceId, performance.now());
  }

  _handleShot(ray, sourceId) {
    const hittable = this.balloonSpawner.getHittableMeshes();
    const hit = this.collision.raycastFromRay(ray, hittable);
    if (!hit) return;

    const balloon = this.balloonSpawner.resolveBalloon(hit.object);
    if (!balloon) return;

    const typeId = balloon.typeId;
    const popPosition = balloon.mesh.position.clone();
    const points = this.balloonSpawner.popBalloon(balloon);
    if (points !== 0) this.audioManager.playBalloonPopSfx(points);
    this.state.addScore(points);
    this._triggerPopHaptic(sourceId, typeId);
    this.ui.spawnScorePopup(popPosition, points);
  }

  /**
   * Vibra apenas o controle que estourou o balão (sourceId vem do
   * InputManager/XRInputHandler, então já identifica qual dos dois
   * controles foi). Balão de penalidade usa um pulso mais forte e
   * mais longo; os demais (que somam pontuação) usam um pulso curto.
   */
  _triggerPopHaptic(sourceId, typeId) {
    const { intensity, durationMs } =
      typeId === BalloonTypeId.PENALTY ? HAPTIC_PENALTY : HAPTIC_POSITIVE;
    this.input.triggerHaptic(sourceId, intensity, durationMs);
  }

  _updateCrosshair() {
    const { renderer } = this.sceneManager;
    const shouldShow = !renderer.xr.isPresenting && this.state.state === GameStates.PLAYING;
    this.crosshairEl.classList.toggle('hidden', !shouldShow);
    if (shouldShow) {
      const { x, y } = this.input.mouse.screenPosition;
      this.crosshairEl.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    }
  }

  update(dt) {
    const { renderer, camera } = this.sceneManager;
    const isPresenting = renderer.xr.isPresenting;

    if (this.sky) {
      followCamera(this.sky, camera);
    }

    if (this.state.state === GameStates.PLAYING) {
      this.state.tick(dt);
      this.balloonSpawner.update(dt);
      this.ui.updateHUD(this.state.score, this.state.timeLeft);
      this.ui.updateScorePopups(dt, camera);
    }

    if (this.state.state === GameStates.GAMEOVER) {
      this.ui.updateInteractionHover(this.input.getActiveRays(isPresenting));
    }

    this._updateCrosshair();
    this.sceneManager.render();
  }

  start() {
    this.loop.start();
  }
}
