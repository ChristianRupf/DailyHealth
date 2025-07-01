// ============== CONFIGURAÇÕES BÁSICAS ==============
const nomesHabitos = {
  agua: "🥤 Água",
  exercicio: "🏃 Exercício",
  sono: "😴 Dormiu bem",
};

// Variável global para o gráfico
let graficoHumor;
let historico = JSON.parse(localStorage.getItem('historicoHumor')) || [];
let habitosDisponiveis = ['agua', 'exercicio', 'sono'];
const HABITOS_KEY = 'habitosSalvos';

// ===== NOVO: SISTEMA DE HÁBITOS =====
let habitos = {
  'agua': { nome: 'Água', icone: 'droplet' },
  'exercicio': { nome: 'Exercício', icone: 'activity' },
  'sono': { nome: 'Sono', icone: 'bed' },
  'meditacao': { nome: 'Meditação', icone: 'zap' },
  'leitura': { nome: 'Leitura', icone: 'book' }
};

// ============== UTILITÁRIOS ========================
function obterDataHoje() {
  return new Date().toISOString().split("T")[0];
}

function obterDataSelecionada() {
  const input = document.getElementById("data-selecionada");
  return input?.value || obterDataHoje();
}

function carregarDias() {
  return JSON.parse(localStorage.getItem("dias")) || {};
}

function salvarDias(dados) {
  localStorage.setItem("dias", JSON.stringify(dados));
}

function atualizarIcones() {
  if (window.lucide) lucide.createIcons();
}

function formatarData(dataStr) {
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  return new Date(dataStr).toLocaleDateString('pt-BR', options);
}

function traduzirHumor(humor) {
  const humores = { feliz: '😀 Feliz', neutro: '😐 Neutro', triste: '😢 Triste' };
  return humores[humor] || humor;
}

// ============== FUNÇÕES DE HÁBITOS ================
function carregarHabitos() {
  const salvos = localStorage.getItem(HABITOS_KEY);
  if (salvos) habitosDisponiveis = JSON.parse(salvos);
}

function adicionarHabitoPersonalizado() {
  const input = document.getElementById('novo-habito');
  const novoHabito = input.value.trim().toLowerCase().replace(/\s+/g, '-');
  
  if (novoHabito && !habitosDisponiveis.includes(novoHabito)) {
    habitosDisponiveis.push(novoHabito);
    localStorage.setItem(HABITOS_KEY, JSON.stringify(habitosDisponiveis));
    renderizarHabitos();
    input.value = '';
  }
}

function obterIconeHabito(habito) {
  const icones = {
    'agua': 'droplet',
    'exercicio': 'activity',
    'sono': 'bed-double'
  };
  return icones[habito] || 'check';
}

function renderizarHabitos() {
  const container = document.getElementById('habitos-container');
  container.innerHTML = '';
  
  habitosDisponiveis.forEach(habito => {
    const btn = document.createElement('button');
    btn.innerHTML = `<i data-lucide="${obterIconeHabito(habito)}"></i>`;
    btn.onclick = () => alternarHabito(habito);
    btn.setAttribute('aria-label', nomesHabitos[habito] || habito);
    container.appendChild(btn);
  });
  
  atualizarIcones();
}

// ============== FUNÇÕES PRINCIPAIS ================
function salvarHumor(humor) {
  const dataAtual = obterDataSelecionada();
  const entrada = {
    data: dataAtual,
    humor: humor,
    valor: humor === 'feliz' ? 3 : humor === 'neutro' ? 2 : 1
  };
  
  // Atualiza o histórico
  historico = historico.filter(item => item.data !== dataAtual);
  historico.push(entrada);
  localStorage.setItem('historicoHumor', JSON.stringify(historico));
  
  // Atualiza os dados dos dias
  const dados = carregarDias();
  if (!dados[dataAtual]) dados[dataAtual] = { habitos: [] };
  dados[dataAtual].humor = humor;
  salvarDias(dados);
  
  // Atualiza a interface
  document.getElementById('humor-salvo').textContent = `Humor salvo: ${traduzirHumor(humor)}`;
  renderizar();
  atualizarGraficos();
}

function alternarHabito(habitoId) {
  const data = obterDataSelecionada();
  const dados = carregarDias();

  if (!dados[data]) dados[data] = { habitos: [] };

  const index = dados[data].habitos.indexOf(habitoId);
  if (index >= 0) {
    dados[data].habitos.splice(index, 1);
  } else {
    dados[data].habitos.push(habitoId);
  }

  salvarDias(dados);
  renderizar();
}

// ============== FUNÇÕES DE GRÁFICOS ==============
function obterDadosHumor(dias) {
  const hoje = new Date();
  const dadosFiltrados = historico.filter(entrada => {
    const dataEntrada = new Date(entrada.data);
    const diffTime = hoje - dataEntrada;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= dias;
  }).sort((a, b) => new Date(a.data) - new Date(b.data));
  
  // Preenche dias faltantes com null
  const resultado = [];
  for (let i = dias; i >= 0; i--) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    const dataStr = data.toISOString().split('T')[0];
    
    const entrada = dadosFiltrados.find(item => item.data === dataStr);
    resultado.push(entrada ? entrada.valor : null);
  }
  
  return {
    valores: resultado.slice(-dias),
    datas: Array.from({length: dias}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - dias + i + 1);
      return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
    })
  };
}

function atualizarGraficos() {
  const periodo = parseInt(document.getElementById('periodo').value);
  const dados = obterDadosHumor(periodo);
  
  // Configuração otimizada para qualidade
  const config = {
    type: 'bar',
    data: {
      labels: dados.datas,
      datasets: [{
        label: 'Humor',
        data: dados.valores,
        backgroundColor: dados.valores.map(val => 
          val === 3 ? '#10b981' : val === 2 ? '#fbbf24' : val === 1 ? '#ef4444' : '#e5e7eb'
        ),
        borderWidth: 1,
        borderRadius: 4, // Bordas arredondadas nas barras
        borderSkipped: false, // Bordas em todos os lados
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Permite controle total das dimensões
      devicePixelRatio: 2, // Dobra a qualidade em dispositivos HiDPI
      animation: {
        duration: 300, // Animação mais suave
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 3,
          ticks: {
            callback: function(value) {
              const humores = ['', 'Triste', 'Neutro', 'Feliz'];
              return humores[value];
            },
            font: {
              size: 12, // Tamanho da fonte aumentado
            }
          },
          grid: {
            color: '#e5e7eb', // Cor mais suave para as linhas
          }
        },
        x: {
          grid: {
            display: false, // Remove linhas de grade verticais
          },
          ticks: {
            font: {
              size: 12, // Tamanho da fonte aumentado
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false, // Oculta a legenda se não for necessária
        },
        tooltip: {
          backgroundColor: '#1f2937', // Fundo escuro para contraste
          bodyColor: '#f9fafb', // Texto claro
          titleColor: '#f9fafb',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              if (context.raw === null) return 'Sem registro';
              const humores = ['', 'Triste', 'Neutro', 'Feliz'];
              return humores[context.raw];
            }
          }
        }
      }
    }
  };
  
  // Destrói e recria o gráfico com alta qualidade
  if (graficoHumor) graficoHumor.destroy();
  
  const canvas = document.getElementById('humorSemanal');
  const ctx = canvas.getContext('2d');
  
  // Ajuste de qualidade para dispositivos HiDPI
  const scale = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * scale;
  canvas.height = canvas.offsetHeight * scale;
  ctx.scale(scale, scale);
  
  graficoHumor = new Chart(ctx, config);
}

// ============== FUNÇÕES DE RENDERIZAÇÃO ==========
function mostrarHumorSalvo() {
  const data = obterDataSelecionada();
  const dados = carregarDias();
  const humor = dados[data]?.humor;
  const frase = document.getElementById("humor-salvo");

  frase.textContent = humor 
    ? `Humor salvo: ${traduzirHumor(humor)}` 
    : `Nenhum humor registrado para ${data}`;
}

function mostrarHabitos() {
  const data = obterDataSelecionada();
  const dados = carregarDias();
  const habitosDoDia = dados[data]?.habitos || [];
  const lista = document.getElementById("habitos-salvos");

  lista.innerHTML = habitosDoDia.length
    ? habitosDoDia.map(id => `<li>${habitos[id]?.nome || id}</li>`).join("")
    : "<li>Nenhum hábito marcado.</li>";
}

function mostrarHistorico() {
  const dados = carregarDias();
  const container = document.getElementById("historico");
  container.innerHTML = "<h2>Histórico</h2>";

  Object.entries(dados)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([data, info]) => {
      const bloco = document.createElement("div");
      bloco.className = "dia-bloco";
      bloco.innerHTML = `
        <strong>${formatarData(data)}</strong><br/>
        Humor: ${traduzirHumor(info.humor)}<br/>
        Hábitos: ${info.habitos?.map(h => nomesHabitos[h] || h).join(', ') || 'Nenhum'}<br/>
        <div class="acoes-dia">
          <button onclick="editarDia('${data}')"><i data-lucide="pencil"></i></button>
          <button onclick="apagarDia('${data}')"><i data-lucide='trash-2'></i></button>
        </div>
      `;
      container.appendChild(bloco);
    });
}

function renderizar() {
  mostrarHumorSalvo();
  mostrarHabitos();
  mostrarHistorico();
  atualizarIcones();
}

// ============== FUNÇÕES DE EDIÇÃO ================
function editarDia(data) {
  const dados = carregarDias();
  const dia = dados[data];
  if (!dia) return;

  const novoHumor = prompt("Novo humor (feliz, neutro, triste):", dia.humor);
  if (novoHumor && !["feliz", "neutro", "triste"].includes(novoHumor)) {
    return alert("Humor inválido!");
  }

  if (novoHumor) {
    dia.humor = novoHumor;
    // Atualiza o histórico também
    historico = historico.filter(item => item.data !== data);
    historico.push({
      data: data,
      humor: novoHumor,
      valor: novoHumor === 'feliz' ? 3 : novoHumor === 'neutro' ? 2 : 1
    });
    localStorage.setItem('historicoHumor', JSON.stringify(historico));
  }

  const novosHabitos = prompt(
    "Novos hábitos separados por vírgula:",
    dia.habitos.join(",")
  );

  if (novosHabitos !== null) {
    dia.habitos = novosHabitos
      .split(",")
      .map(h => h.trim().toLowerCase().replace(/\s+/g, '-'))
      .filter(Boolean);
  }

  salvarDias(dados);
  renderizar();
  atualizarGraficos();
}

function apagarDia(data) {
  if (!confirm(`Apagar dados de ${formatarData(data)}?`)) return;

  const dados = carregarDias();
  delete dados[data];
  salvarDias(dados);
  
  // Remove do histórico também
  historico = historico.filter(item => item.data !== data);
  localStorage.setItem('historicoHumor', JSON.stringify(historico));
  
  renderizar();
  atualizarGraficos();
}

// ===== NOVAS FUNÇÕES =====
function carregarHabitosSalvos() {
  const salvos = localStorage.getItem('habitosPersonalizados');
  if (salvos) {
    const personalizados = JSON.parse(salvos);
    Object.assign(habitos, personalizados);
  }
}

function salvarHabitosNoLocalStorage() {
  const personalizados = {};
  for (const [id, habito] of Object.entries(habitos)) {
    if (!['agua', 'exercicio', 'sono'].includes(id)) {
      personalizados[id] = habito;
    }
  }
  localStorage.setItem('habitosPersonalizados', JSON.stringify(personalizados));
}

function adicionarNovoHabito() {
  const input = document.getElementById('novo-habito-input');
  const nomeHabito = input.value.trim();
  
  if (nomeHabito) {
    const id = nomeHabito.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-');
    
    if (!habitos[id]) {
      habitos[id] = { nome: nomeHabito, icone: 'check' };
      salvarHabitosNoLocalStorage();
      renderizarBotoesHabitos();
      input.value = '';
    } else {
      alert('Este hábito já existe!');
    }
  }
}

function renderizarBotoesHabitos() {
  const container = document.getElementById('habitos-container');
  container.innerHTML = '';
  
  for (const [id, habito] of Object.entries(habitos)) {
    const button = document.createElement('button');
    button.innerHTML = `<i data-lucide="${habito.icone}"></i> ${habito.nome}`;
    button.onclick = () => alternarHabito(id);
    container.appendChild(button);
  }
  lucide.createIcons();
}

// ===== SISTEMA DE ABAS =====
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove classe active de todas as abas
      document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Adiciona apenas na aba clicada
      tab.classList.add('active');
      const tabId = tab.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      // Atualiza gráficos quando volta para aba de hábitos
      if (tabId === 'habitos') {
        atualizarGraficos();
      }
    });
  });
}

// ===== POMODORO TIMER =====
let pomodoroInterval;
let minutes = 25;
let seconds = 0;
let isRunning = false;
let cyclesCompleted = 0;
let isBreakTime = false;

function updatePomodoroDisplay() {
  const display = document.querySelector('.timer-display');
  display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Atualiza cor do timer
  if (isBreakTime) {
    display.style.color = '#10b981'; // Verde para descanso
  } else {
    display.style.color = '#ef4444'; // Vermelho para trabalho
  }
}

function startPomodoro() {
  if (isRunning) return;
  
  isRunning = true;
  const statusElement = document.querySelector('.pomodoro-status');
  statusElement.textContent = isBreakTime ? "Descanso... 🌿" : "Foco no trabalho! 💻";
  
  pomodoroInterval = setInterval(() => {
    if (seconds === 0) {
      if (minutes === 0) {
        completePomodoroCycle();
        return;
      }
      minutes--;
      seconds = 59;
    } else {
      seconds--;
    }
    updatePomodoroDisplay();
  }, 1000);
}

function pausePomodoro() {
  clearInterval(pomodoroInterval);
  isRunning = false;
  document.querySelector('.pomodoro-status').textContent = "Pausado ⏸️";
}

function resetPomodoro() {
  clearInterval(pomodoroInterval);
  isRunning = false;
  isBreakTime = false;
  minutes = 25;
  seconds = 0;
  updatePomodoroDisplay();
  document.querySelector('.pomodoro-status').textContent = "Pronto para começar";
}

function completePomodoroCycle() {
  clearInterval(pomodoroInterval);
  isRunning = false;
  
  if (!isBreakTime) {
    // Completo um ciclo de trabalho
    cyclesCompleted++;
    document.querySelector('.pomodoro-cycles span').textContent = cyclesCompleted;
    isBreakTime = true;
    minutes = 5; // Pausa curta
    document.querySelector('.pomodoro-status').textContent = "Ciclo completo! 🎉 Hora de descansar";
    
    // Notificação
    if (Notification.permission === 'granted') {
      new Notification('Tempo acabou!', {
        body: 'Hora de uma pausa de 5 minutos'
      });
    }
    
    // Auto-inicia a pausa
    setTimeout(() => startPomodoro(), 1000);
  } else {
    // Fim do descanso
    isBreakTime = false;
    minutes = 25; // Volta ao tempo de trabalho
    document.querySelector('.pomodoro-status').textContent = "Pronto para mais um ciclo!";
  }
  
  updatePomodoroDisplay();
}

// ============== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
  // Configura data padrão
  document.getElementById("data-selecionada").value = obterDataHoje();
  document.getElementById("data-selecionada").addEventListener("change", renderizar);
  
  // Carrega dados
  carregarHabitosSalvos();  
  historico = JSON.parse(localStorage.getItem('historicoHumor')) || [];
  
  // Inicializa componentes
  renderizar();
  renderizarBotoesHabitos();  
  atualizarGraficos();
  setupTabs();
  
  // Inicializa Pomodoro
  updatePomodoroDisplay();
  document.getElementById('start-pomodoro').addEventListener('click', startPomodoro);
  document.getElementById('pause-pomodoro').addEventListener('click', pausePomodoro);
  document.getElementById('reset-pomodoro').addEventListener('click', resetPomodoro);
  
  // Solicita permissão para notificações
  if ('Notification' in window) {
    Notification.requestPermission();
  }
  
  // Atualiza ícones
  lucide.createIcons();
});

// Atualiza o gráfico quando a janela é redimensionada
window.addEventListener('resize', function() {
  if (graficoHumor) {
    atualizarGraficos();
  }
});
