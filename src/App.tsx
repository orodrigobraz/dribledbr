import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import PlayerGame from './components/PlayerGame';
import { Jogador, JogadoresData } from './types/Jogador';
import './App.css';

const PlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  useEffect(() => {
    const loadJogadores = async () => {
      try {
        const response = await fetch(process.env.PUBLIC_URL + '/jogadores.json');
        if (!response.ok) {
          throw new Error('Erro ao carregar jogadores');
        }
        const data: JogadoresData = await response.json();
        setJogadores(data.jogadores);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setLoading(false);
      }
    };

    loadJogadores();
  }, []);

  const handleNext = () => {
    if (isNavigating) return; // Evitar duplo clique
    
    if (id) {
      setIsNavigating(true);
      const currentId = parseInt(id);
      const currentIndex = jogadores.findIndex(j => j.jogador_id === currentId);
      if (currentIndex < jogadores.length - 1) {
        const nextJogador = jogadores[currentIndex + 1];
        navigate(`/${nextJogador.jogador_id}`);
      }
      setTimeout(() => setIsNavigating(false), 300);
    }
  };

  const handlePrevious = () => {
    if (isNavigating) return; // Evitar duplo clique
    
    if (id) {
      setIsNavigating(true);
      const currentId = parseInt(id);
      const currentIndex = jogadores.findIndex(j => j.jogador_id === currentId);
      if (currentIndex > 0) {
        const prevJogador = jogadores[currentIndex - 1];
        navigate(`/${prevJogador.jogador_id}`);
      }
      setTimeout(() => setIsNavigating(false), 300);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <h2>Carregando jogadores...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>Erro: {error}</h2>
          <p>Verifique se o arquivo jogadores.json está na pasta public.</p>
        </div>
      </div>
    );
  }

  if (jogadores.length === 0) {
    return (
      <div className="app">
        <div className="no-movies">
          <h2>Nenhum jogador encontrado</h2>
          <p>Adicione jogadores ao arquivo jogadores.json</p>
        </div>
      </div>
    );
  }

  // Verificar se o ID é válido (número) ou se deve redirecionar
  const isValidId = id && !isNaN(parseInt(id));
  
  // Em desenvolvimento, se o ID for "dribledbr", tratar como se não houvesse ID
  const shouldRedirect = !id || !isValidId || (process.env.NODE_ENV !== 'production' && id === 'dribledbr');
  
  // Redirecionar para o último jogador se não houver ID válido na URL
  if (shouldRedirect && jogadores.length > 0) {
    const lastJogador = jogadores[jogadores.length - 1];
    navigate(`/${lastJogador.jogador_id}`, { replace: true });
    return null;
  }

  const currentJogador = jogadores.find(j => j.jogador_id === parseInt(id || '0'));
  
  if (!currentJogador && isValidId) {
    return (
      <div className="app">
        <div className="error">
          <h2>Jogador não encontrado</h2>
          <p>O jogador com ID {id} não existe.</p>
        </div>
      </div>
    );
  }

  const currentIndex = jogadores.findIndex(j => j.jogador_id === parseInt(id || '0'));

  const goToLastJogador = () => {
    const lastJogador = jogadores[jogadores.length - 1];
    navigate(`/${lastJogador.jogador_id}`);
  };

  // Se não há jogador atual (caso de redirecionamento), não renderizar nada ainda
  if (!currentJogador) {
    return null;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <button 
            onClick={goToLastJogador}
            className="title-link"
          >
            Dribledbr
          </button>
        </h1>
      </header>

      <main className="app-main">
        <PlayerGame
          jogador={currentJogador}
          jogadores={jogadores}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isFirst={currentIndex === 0}
          isLast={currentIndex === jogadores.length - 1}
        />
      </main>
    </div>
  );
};

function App() {
  // Detectar se está em produção (GitHub Pages) ou desenvolvimento
  const isProduction = process.env.NODE_ENV === 'production';
  const basename = isProduction ? '/dribledbr' : '/';

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/" element={<PlayerPage />} />
        <Route path="/:id" element={<PlayerPage />} />
      </Routes>
    </Router>
  );
}

export default App;
