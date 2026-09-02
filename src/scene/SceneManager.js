import * as THREE from 'three';

/**
 * Responsável por cena, câmera, renderer e pela organização espacial
 * necessária para VR funcionar corretamente.
 *
 * Padrão importante de WebXR: quando uma sessão VR está ativa, o
 * Three.js assume o controle da posição/rotação da câmera a partir do
 * rastreamento do headset, com origem (0,0,0) coincidindo com o chão
 * físico do jogador ('local-floor'). Ou seja: NÃO adianta mover a
 * câmera manualmente para "colocar o jogador na frente da barraca" —
 * isso seria sobrescrito pelo XR a cada frame.
 *
 * A solução correta é o inverso: a câmera (e os controles VR) ficam
 * perto da origem, dentro de um `playerRig`, e é o CENÁRIO
 * (`worldGroup`) que é deslocado para aparecer na posição relativa
 * correta. Assim, tanto no modo desktop (fallback) quanto dentro do
 * headset, a barraca aparece exatamente na mesma distância e altura
 * relativas ao jogador.
 */
export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1030);
    this.scene.fog = new THREE.Fog(0x0f1030, 14, 30);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.05,
      100
    );
    // Posição de repouso usada apenas quando NÃO há sessão XR ativa
    // (modo desktop). Dentro do headset o XR sobrescreve isso.
    this.camera.position.set(0, 1.6, 0);

    // Grupo que representa o jogador: câmera + (futuramente) controles
    // VR ficam aqui dentro, sempre perto da origem.
    this.playerRig = new THREE.Group();
    this.playerRig.add(this.camera);
    this.scene.add(this.playerRig);

    // Todo o cenário (agora o ambiente do circo carregado via GLB)
    // fica neste grupo. Diferente da versão anterior (barraca feita
    // com primitivas), não aplicamos mais um deslocamento fixo aqui:
    // CircusEnvironmentModel.js já reancora o próprio ambiente na
    // origem do mundo ao carregar.
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);

    // Olhar inicial em modo desktop, mirando a área do balcão de prêmios.
    this.camera.lookAt(0, 1.4, -4);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Habilita WebXR. Sem isso, renderer.xr.getController() e o
    // VRButton não funcionam.
    this.renderer.xr.enabled = true;

    window.addEventListener('resize', () => this.onResize());
  }

  /** Adiciona objetos ao cenário do jogo (não ao jogador). */
  addToWorld(object) {
    this.worldGroup.add(object);
  }

  /** Adiciona objetos ligados ao jogador (ex: controles VR, arma desktop). */
  addToPlayerRig(object) {
    this.playerRig.add(object);
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
