import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// Importação de sons para feedback auditivo
import correctSound from './sounds/correct.mp3';
import incorrectSound from './sounds/incorrect.mp3';

// Constante de tempo total do jogo
const TIME_TOTAL = 10;

// Componente para a barra de progresso
const ProgressBar = ({ progress, total }) => {
  const progressPercentage = (progress / total) * 100;
  return (
    <div className="progress-bar-container">
      <div
        className="progress-bar"
        style={{ width: `${progressPercentage}%`, backgroundColor: progressPercentage > 20 ? 'green' : 'red' }}
      ></div>
    </div>
  );
};

// Função para gerar a sequência de letras aleatórias
const generateSequence = (length) => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = [];
  for (let i = 0; i < length; i++) {
    result.push(letters[Math.floor(Math.random() * letters.length)]);
  }
  return result;
};

const App = () => {
  // Estados do componente
  const [sequence, setSequence] = useState([]); // Sequência de letras a serem pressionadas
  const [currentIndex, setCurrentIndex] = useState(0); // Índice atual na sequência
  const [timeLeft, setTimeLeft] = useState(TIME_TOTAL); // Tempo restante no jogo
  const [message, setMessage] = useState(''); // Mensagem de feedback para o jogador
  const [gameActive, setGameActive] = useState(false); // Indica se o jogo está ativo
  const [playerName, setPlayerName] = useState(''); // Nome do jogador
  const [gameOver, setGameOver] = useState(false); // Indica se o jogo acabou
  const [typedLetters, setTypedLetters] = useState(Array(5).fill(null)); // Array de letras digitadas pelo jogador
  const [profileImage, setProfileImage] = useState(''); // Imagem do perfil do jogador
  const [rankings, setRankings] = useState([]); // Ranking dos melhores tempos
  const [startTime, setStartTime] = useState(0); // Tempo de início do jogo

  // Lista de imagens de perfil disponíveis
  const profileImages = [
    './images/profile1.png',
    './images/profile2.png',
    './images/profile3.png',
    './images/profile4.png',
    './images/profile5.png'
  ];

  // Referências aos elementos de áudio
  const correctAudioRef = useRef(null);
  const incorrectAudioRef = useRef(null);

  // Carregar sons e rankings ao iniciar
  useEffect(() => {
    correctAudioRef.current = new Audio(correctSound);
    incorrectAudioRef.current = new Audio(incorrectSound);
    loadRankings(); // Carrega os rankings salvos
  }, []);

  // Contagem regressiva do tempo de jogo
  useEffect(() => {
    if (gameActive) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000); // Decrementa o tempo restante a cada segundo
        return () => clearTimeout(timer); // Limpa o timer quando o componente é desmontado ou quando o jogo é interrompido
      } else {
        endGame('Tempo esgotado! Você perdeu.'); // Fim do jogo devido ao tempo esgotado
      }
    }
  }, [timeLeft, gameActive]);

  // Detecção de teclas pressionadas durante o jogo
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (gameActive) {
        const keyPressed = event.key.toUpperCase(); // Obtém a tecla pressionada em caixa alta
        if (keyPressed === sequence[currentIndex]) { // Verifica se a tecla pressionada está correta
          const updatedTypedLetters = [...typedLetters];
          updatedTypedLetters[currentIndex] = 'correct';
          setTypedLetters(updatedTypedLetters);
          setCurrentIndex(currentIndex + 1);
          if (currentIndex + 1 === sequence.length) { // Verifica se todas as teclas foram pressionadas na ordem correta
            endGame('Você acertou a sequência!');
          }
          if (correctAudioRef.current) {
            correctAudioRef.current.currentTime = 0;
            correctAudioRef.current.play(); // Reproduz o som de correto
          }
        } else {
          const updatedTypedLetters = [...typedLetters];
          updatedTypedLetters[currentIndex] = 'incorrect';
          setTypedLetters(updatedTypedLetters);
          endGame('Tecla errada! Você perdeu.'); // Fim do jogo devido à tecla errada
          if (incorrectAudioRef.current) {
            incorrectAudioRef.current.currentTime = 0;
            incorrectAudioRef.current.play(); // Reproduz o som de incorreto
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyPress); // Adiciona um event listener para as teclas pressionadas
    return () => document.removeEventListener('keydown', handleKeyPress); // Remove o event listener quando o componente é desmontado
  }, [currentIndex, sequence, gameActive, typedLetters]);

  // Iniciar o jogo
  const startGame = () => {
    if (playerName.trim() !== '') { // Verifica se o nome do jogador foi inserido
      const newSequence = generateSequence(5); // Gera uma nova sequência de letras
      setSequence(newSequence);
      setCurrentIndex(0);
      setTimeLeft(TIME_TOTAL);
      setMessage('');
      setGameActive(true);
      setGameOver(false);
      setTypedLetters(Array(5).fill(null)); // Reseta as letras digitadas pelo jogador
      setStartTime(Date.now()); // Registra o tempo de início do jogo
      if (!profileImage) {
        const randomImage = profileImages[Math.floor(Math.random() * profileImages.length)]; // Escolhe uma imagem de perfil aleatória se não for selecionada
        setProfileImage(randomImage);
      }
    } else {
      setMessage('Por favor, insira seu nome para iniciar o jogo.'); // Exibe uma mensagem se o nome do jogador não for inserido
    }
  };

  // Manipulação das alterações no campo de nome do jogador
  const handleNameChange = (e) => {
    setPlayerName(e.target.value); // Atualiza o nome do jogador ao digitar no campo de entrada
  };

  // Selecionar imagem de perfil
  const handleImageClick = (image) => {
    setProfileImage(image); // Atualiza a imagem de perfil quando clicada
  };

  // Submeter o nome do jogador e iniciar o jogo
  const handleNameSubmit = (e) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário
    if (playerName.trim() !== '') {
      startGame(); // Inicia o jogo se o nome do jogador for inserido
    } else {
      setMessage('Por favor, insira seu nome para iniciar o jogo.'); // Exibe uma mensagem se o nome do jogador não for inserido
    }
  };

  // Finalizar o jogo
  const endGame = useCallback((msg) => {
    setGameActive(false);
    setGameOver(true);
    setMessage(msg);

    if (msg === 'Você acertou a sequência!') {
      const elapsedTime = Math.round((Date.now() - startTime) / 1000); // Calcula o tempo total decorrido
      saveRanking({ name: playerName, image: profileImage, time: elapsedTime }); // Salva o ranking se o jogador acertar a sequência
    }
  }, [startTime, playerName, profileImage]);

  // Resetar o jogo
  const resetGame = () => {
    setSequence([]);
    setCurrentIndex(0);
    setTimeLeft(TIME_TOTAL);
    setMessage('');
    setGameActive(false);
    setGameOver(false);
    setProfileImage('');
    setPlayerName('');
  };

  // Reiniciar o jogo
  const restartGame = () => {
    startGame(); // Reinicia o jogo
  };

  // Salvar o ranking no localStorage
  const saveRanking = (newRank) => {
    const updatedRankings = [...rankings, newRank].sort((a, b) => a.time - b.time).slice(0, 5); // Ordena os rankings e mantém apenas os 5 melhores tempos
    setRankings(updatedRankings);
    localStorage.setItem('rankings', JSON.stringify(updatedRankings)); // Salva os rankings no armazenamento local
  };

  // Carregar rankings do localStorage
  const loadRankings = () => {
    const storedRankings = localStorage.getItem('rankings');
    if (storedRankings) {
      setRankings(JSON.parse(storedRankings)); // Carrega os rankings salvos do armazenamento local
    }
  };

  // Limpar rankings do localStorage
  const clearRankings = () => {
    setRankings([]); // Limpa os rankings
    localStorage.removeItem('rankings'); // Remove os rankings do armazenamento local
  };

  return (
    <div className="main-container">
      <div className="container">
        {/* Renderização condicional baseada nos estados do jogo */}
        <h1>MINI-GAME</h1>
        {!gameActive && !gameOver ? ( // Se o jogo não estiver ativo e não tiver terminado
          <form onSubmit={handleNameSubmit}> 
            <h3>Escolha seu personagem</h3>
            {/* Exibe as miniaturas de perfil disponíveis */}
            <div className="profile-thumbnail-container">
              {profileImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Profile ${index + 1}`}
                  className={`profile-thumbnail ${profileImage === image ? 'profile-thumbnail-selected' : ''}`}
                  onClick={() => handleImageClick(image)}
                />
              ))}
            </div>
            {/* Campo para inserir o nome do jogador */}
            <input
              type="text"
              placeholder="Digite seu nome"
              value={playerName}
              onChange={handleNameChange}
            />
            {/* Botão para iniciar o jogo */}
            <button className='btn' type="submit">Iniciar</button>
            {/* Exibe mensagens de feedback */}
            <div id="feedback">{message}</div>
          </form>
        ) : (
          <>
            {/* Renderiza informações do jogador */}
            <div className='namehide'>
              <h2>{playerName}</h2>
              <img src={profileImage} alt="Profile" className="profile-image" />
            </div>
            {/* Exibe a sequência de teclas */}
            <h4>Pressione a sequência de teclas na ordem.</h4>
            <div id="sequence">
              {sequence.map((letter, index) => (
                <div key={index} className={`letter-box ${typedLetters[index]}`}>{letter}</div>
              ))}
            </div>

            {/* Exibe a barra de progresso se o jogo estiver ativo */}
            {gameActive && (
              <ProgressBar progress={timeLeft} total={TIME_TOTAL} />
            )}
            {/* Exibe mensagem de fim de jogo e botões de ação */}
            {gameOver && (
              <>
                <div id="feedback" className="game-over">{message}</div>
                <button className='btn' onClick={resetGame}>Sair</button>
                <button className='btn' onClick={restartGame}>Jogar novamente</button>
              </>
            )}
          </>
        )}
        {/* Reproduz os sons de feedback */}
        <audio ref={correctAudioRef} src={correctSound} />
        <audio ref={incorrectAudioRef} src={incorrectSound} />
      </div>
      {/* Exibe o ranking dos melhores tempos */}
      <div className="ranking-container">
        <h2>Top 5 Melhores Tempos</h2>
        <table className="ranking-table">
          <tbody>
            {rankings.map((rank, index) => (
              <tr key={index}>
                <td>{index + 1}°</td>
                <td><img src={rank.image} alt={rank.name} className="ranking-image" /></td>
                <td>{rank.name}</td>
                <td>{rank.time}s</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Botão para limpar o ranking */}
        <button className="btn btn-clearrank" onClick={clearRankings}>Limpar Ranking</button>
      </div>
    </div>
  );
};

export default App;