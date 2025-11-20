import React, { useState, useEffect, useRef } from 'react';
import { Jogador, GameState } from '../types/Jogador';
import './PlayerGame.css';

interface PlayerGameProps {
  jogador: Jogador;
  jogadores: Jogador[];
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const PlayerGame: React.FC<PlayerGameProps> = ({ 
  jogador, 
  jogadores,
  onNext, 
  onPrevious, 
  isFirst, 
  isLast 
}) => {
  const [gameState, setGameState] = useState<GameState>({
    attempts: 0,
    guess: '',
    isCorrect: false,
    showPlayer: false,
    guesses: []
  });

  const [feedback, setFeedback] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentHintIndex, setCurrentHintIndex] = useState<number>(0);
  const previousHintsCountRef = useRef<number>(0);

  // Função para extrair o nome do clube a partir do caminho da imagem
  const getClubName = (imagePath: string): string => {
    // Extrair o nome do arquivo do caminho
    const fileName = imagePath.split('/').pop() || '';
    // Remover a extensão (.svg, .png, .jpg, .jpeg, .gif, .webp, .bmp, etc.)
    const nameWithoutExt = fileName.replace(/\.(svg|png|jpg|jpeg|gif|webp|bmp|ico)$/i, '');
    // Substituir underscores por espaços
    const nameWithSpaces = nameWithoutExt.replace(/_/g, ' ');
    // Capitalizar primeira letra de cada palavra
    return nameWithSpaces
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Obtém os escudos dos clubes do jogador
  const clubesEscudos = (): string[] => {
    const escudos: string[] = [];
    
    // Obter todas as chaves do objeto imagens_clubes
    const keys = Object.keys(jogador.imagens_clubes);
    
    // Ordenar as chaves numericamente (clube1, clube2, clube3, etc.)
    const sortedKeys = keys.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    
    // Adicionar os escudos na ordem correta
    sortedKeys.forEach(key => {
      const escudo = jogador.imagens_clubes[key];
      if (escudo && escudo.trim() !== '') {
        escudos.push(escudo);
      }
    });
    
    return escudos;
  };

  const generateSuggestions = (input: string) => {
    if (input.length < 1) {
      setSuggestions([]);
      return;
    }

    const inputLower = input.toLowerCase();

    // Criar lista de sugestões usando nome_esportivo
    const filteredJogadores = jogadores
      .filter((j: Jogador) => 
        j.nome_esportivo.toLowerCase().includes(inputLower) ||
        j.nome_completo.toLowerCase().includes(inputLower)
      )
      .map((j: Jogador) => j.nome_esportivo);

    // Remover duplicatas, ordenar alfabeticamente e limitar a 10
    const uniqueSuggestions = Array.from(new Set(filteredJogadores));
    const sortedSuggestions = uniqueSuggestions
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .slice(0, 10);

    setSuggestions(sortedSuggestions);
  };

  // Normaliza o nome para comparação (remove acentos, espaços extras, etc)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  };

  const handleGuess = () => {
    if (isProcessing) return; // Evitar duplo clique
    
    setIsProcessing(true);

    const rawGuess = gameState.guess.trim();
    const displayGuess = rawGuess.length === 0 ? 'Pulou' : gameState.guess;
    
    // Limpar o input após qualquer chute
    setGameState(prev => ({ ...prev, guess: '' }));
    setSuggestions([]);
    
    // Se o input estiver vazio, apenas registrar como "Pulou" e incrementar tentativas
    if (rawGuess.length === 0) {
      const newAttempts = gameState.attempts + 1;
      setGameState(prev => ({
        ...prev,
        attempts: newAttempts,
        guesses: [...prev.guesses, '⏭️ ' + displayGuess]
      }));
      
      if (newAttempts >= 5) {
        setFeedback(`❌ Que pena! O jogador era: ${jogador.nome_esportivo}`);
        setGameState(prev => ({ ...prev, showPlayer: true }));
      }
      
      setTimeout(() => setIsProcessing(false), 300);
      return;
    }

    // Se houver um palpite, validar
    const normalizedGuess = normalizeName(rawGuess);
    const normalizedCorrectName = normalizeName(jogador.nome_completo);
    const normalizedEsportivo = normalizeName(jogador.nome_esportivo);

    // Verifica se o palpite contém o nome completo, nome esportivo ou partes significativas
    const guessWords = normalizedGuess.split(' ');
    const correctWords = normalizedCorrectName.split(' ');
    const esportivoWords = normalizedEsportivo.split(' ');
    
    // Verifica se pelo menos o último nome está correto (mais comum)
    const lastCorrectName = correctWords[correctWords.length - 1];
    const lastEsportivoName = esportivoWords[esportivoWords.length - 1];
    const isCorrectGuess = normalizedGuess.includes(lastCorrectName) || 
                           normalizedCorrectName.includes(normalizedGuess) ||
                           normalizedGuess.includes(lastEsportivoName) ||
                           normalizedEsportivo.includes(normalizedGuess);
    
    if (isCorrectGuess) {
      setGameState(prev => ({
        ...prev,
        isCorrect: true,
        showPlayer: true,
        attempts: prev.attempts + 1,
        guesses: [...prev.guesses, '✅ ' + displayGuess]
      }));
      setFeedback('🎉 Parabéns! Você acertou!');
    } else {
      const newAttempts = gameState.attempts + 1;
      setGameState(prev => ({
        ...prev,
        attempts: newAttempts,
        guesses: [...prev.guesses, '❌ ' + displayGuess]
      }));
      
      if (newAttempts >= 5) {
        setFeedback(`❌ Que pena! O jogador era: ${jogador.nome_completo}`);
        setGameState(prev => ({ ...prev, showPlayer: true }));
      } else {
        setFeedback('❌ Tente novamente!');
      }
    }
    
    // Liberar o processamento após um pequeno delay
    setTimeout(() => setIsProcessing(false), 300);
  };

  const resetGame = () => {
    setGameState({
      attempts: 0,
      guess: '',
      isCorrect: false,
      showPlayer: false,
      guesses: []
    });
    setFeedback('');
    setSuggestions([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Se há sugestões disponíveis, inserir a primeira
      if (suggestions.length > 0) {
        setGameState(prev => ({ ...prev, guess: suggestions[0] }));
        setSuggestions([]);
      } else {
        // Se não há sugestões, fazer o chute
        handleGuess();
      }
    }
  };

  // Função para obter todas as dicas disponíveis baseadas no número de tentativas
  const getAvailableHints = (): string[] => {
    const hints: string[] = [];
    const currentAttempt = gameState.attempts;
    
    // Tentativa 2 (attempts = 1): data de nascimento - Dica 1
    if (currentAttempt >= 1) {
      hints.push(`💡 Dica 1 - Data de nascimento: ${jogador.data_nascimento}`);
    }
    
    // Tentativa 3 (attempts = 2): posição - Dica 2
    if (currentAttempt >= 2) {
      hints.push(`💡 Dica 2 - Posição: ${jogador.posicao_principal}`);
    }
    
    // Tentativa 4 (attempts = 3): nacionalidade - Dica 3
    if (currentAttempt >= 3) {
      hints.push(`💡 Dica 3 - Nacionalidade: ${jogador.nacionalidade}`);
    }
    
    // Tentativa 5 (attempts = 4): inicial do nome esportivo - Dica 4
    if (currentAttempt >= 4) {
      const primeiraLetra = jogador.nome_esportivo.charAt(0).toUpperCase();
      hints.push(`💡 Dica 4 - Inicial do nome: ${primeiraLetra}`);
    }
    
    return hints;
  };

  useEffect(() => {
    resetGame();
    setCurrentHintIndex(0);
    previousHintsCountRef.current = 0;
  }, [jogador.jogador_id]);

  // Atualizar o índice quando novas dicas ficarem disponíveis
  useEffect(() => {
    const availableHints = getAvailableHints();
    const currentHintsCount = availableHints.length;
    const previousCount = previousHintsCountRef.current;
    
    // Se uma nova dica foi desbloqueada, ir automaticamente para a última dica
    if (currentHintsCount > previousCount && currentHintsCount > 0) {
      setCurrentHintIndex(currentHintsCount - 1);
    }
    // Se o índice atual for maior que o número de dicas disponíveis, ajustar
    else {
      setCurrentHintIndex((prevIndex) => {
        if (prevIndex >= currentHintsCount && currentHintsCount > 0) {
          return currentHintsCount - 1;
        }
        return prevIndex;
      });
    }
    
    // Atualizar o contador anterior
    previousHintsCountRef.current = currentHintsCount;
  }, [gameState.attempts]);

  // Função para navegar para a dica anterior
  const goToPreviousHint = () => {
    setCurrentHintIndex((prev) => Math.max(0, prev - 1));
  };

  // Função para navegar para a próxima dica
  const goToNextHint = () => {
    const availableHints = getAvailableHints();
    setCurrentHintIndex((prev) => Math.min(availableHints.length - 1, prev + 1));
  };

  const escudos = clubesEscudos();
  const availableHints = getAvailableHints();
  const currentHint = availableHints.length > 0 ? availableHints[currentHintIndex] : null;

  return (
    <div className="player-game">
      {/* LADO ESQUERDO — ESCUDOS DOS TIMES */}
      <div className="main-frame">
        <div className="current-clubs">
          <div className="clubs-container">
            <div className="clubs-grid">
              {escudos.map((escudo, index) => (
                <div key={index} className="club-item">
                  <div className="club-image-wrapper">
                    <img
                      src={process.env.PUBLIC_URL + escudo}
                      alt={`Escudo do clube ${index + 1}`}
                      className="club-image"
                      title={getClubName(escudo)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <span className="club-tooltip">{getClubName(escudo)}</span>
                  </div>
                  {index < escudos.length - 1 && (
                    <div className="club-arrow">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {!gameState.showPlayer && (
            <div className="attempts-indicator">
              {availableHints.length > 0 && (
                <div className="hint-carousel">
                  <button
                    className="hint-nav-button hint-prev"
                    onClick={goToPreviousHint}
                    disabled={currentHintIndex === 0}
                    aria-label="Dica anterior"
                  >
                    ‹
                  </button>
                  <div className="hint-content">
                    <p className="hint-text">{currentHint}</p>
                    {availableHints.length > 1 && (
                      <p className="hint-counter">
                        {currentHintIndex + 1} / {availableHints.length}
                      </p>
                    )}
                  </div>
                  <button
                    className="hint-nav-button hint-next"
                    onClick={goToNextHint}
                    disabled={currentHintIndex === availableHints.length - 1}
                    aria-label="Próxima dica"
                  >
                    ›
                  </button>
                </div>
              )}
              <p>Tentativa {Math.min(gameState.attempts + 1, 5)} de 5</p>
            </div>
          )}
        </div>
      </div>

      {/* LADO DIREITO — INFO E CONTROLES */}
      <div className="side-panel">
        {/* CABEÇALHO DO JOGADOR - NO TOPO */}
        <div className="player-header">
          <h2>Jogador #{jogador.jogador_id}</h2>
        </div>

        {/* SEÇÃO CENTRAL - INPUT E BOTÃO CHUTAR */}
        <div className="center-section">
          {!gameState.showPlayer && (
            <div className="guess-section">
              <div className="input-container">
                <input
                  type="text"
                  value={gameState.guess}
                  onChange={(e) => {
                    const value = e.target.value;
                    setGameState((prev) => ({ ...prev, guess: value }));
                    generateSuggestions(value);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite o nome do jogador..."
                  className="guess-input"
                />
                {suggestions.length > 0 && (
                  <div className="suggestions">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="suggestion-item"
                        onClick={() => {
                          setGameState((prev) => ({
                            ...prev,
                            guess: suggestion,
                          }));
                          setSuggestions([]);
                        }}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handleGuess} className="guess-button">
                Chutar
              </button>
            </div>
          )}

          <div className="feedback-container">
            {feedback && (
              <div
                className={`feedback ${gameState.isCorrect ? "correct" : "incorrect"}`}
              >
                {feedback}
              </div>
            )}
          </div>

          {gameState.showPlayer && (
            <div className="player-details">
              <div className="player-profile-section">
                <img
                  src={process.env.PUBLIC_URL + jogador.foto_perfil}
                  alt={jogador.nome_esportivo}
                  className="player-profile-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <h3>{jogador.nome_esportivo}</h3>
              </div>
              <p>
                <strong>Nome Completo:</strong> {jogador.nome_completo}
              </p>
              <p>
                <strong>Nacionalidade:</strong> {jogador.nacionalidade}
              </p>
              <p>
                <strong>Data de Nascimento:</strong> {jogador.data_nascimento}
              </p>
              <p>
                <strong>Idade:</strong> {jogador.idade} anos
              </p>
              <p>
                <strong>Altura:</strong> {jogador.altura_m}m
              </p>
              <p>
                <strong>Posição:</strong> {jogador.posicao_principal}
              </p>
              <p>
                <strong>Tentativas:</strong> {gameState.attempts}
              </p>
            </div>
          )}
        </div>

        {/* NAVEGAÇÃO - NO FINAL */}
        <div className="navigation">
          <button
            onClick={onPrevious}
            disabled={isFirst}
            className="nav-button prev"
          >
            ←
          </button>
          <button
            onClick={onNext}
            disabled={isLast}
            className="nav-button next"
          >
            →
          </button>
        </div>
        {
          gameState.guesses.length === 0 ? '' :
          <div className="guessesContainer">
            <h3>Tentativas Anteriores:</h3>
            {gameState.guesses.map((x, index) => 
              <div key={index} className="previousGuesses">
                <p>
                  {x.slice(0, 1)}
                </p>
                <p>
                  {x.slice(2, x.length)}
                </p>
                <p></p>
              </div>
            )}
          </div>
        }
      </div>
    </div>
  );
};

export default PlayerGame;

