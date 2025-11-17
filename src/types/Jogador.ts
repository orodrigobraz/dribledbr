export interface ImagensClubes {
  [key: string]: string;
}

export interface Jogador {
  jogador_id: number;
  nome_completo: string;
  nome_esportivo: string;
  nacionalidade: string;
  data_nascimento: string;
  idade: number;
  altura_m: number;
  posicao_principal: string;
  foto_perfil: string;
  imagens_clubes: ImagensClubes;
}

export interface JogadoresData {
  jogadores: Jogador[];
}

export interface GameState {
  attempts: number;
  guess: string;
  isCorrect: boolean;
  showPlayer: boolean;
  guesses: string[];
}

