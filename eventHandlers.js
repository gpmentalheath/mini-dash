// Manipuladores de eventos
class EventHandlers {
    static init() {
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('fileInput').addEventListener('change', EventHandlers.handleFileInput);
            document.getElementById('benchmarkFileInput').addEventListener('change', EventHandlers.handleBenchmarkFileInput);
            document.getElementById('metricsToggleBtn').addEventListener('click', EventHandlers.toggleMetrics);
            document.getElementById('respondentsToggleBtn').addEventListener('click', EventHandlers.toggleRespondents);
        });
    }

    static handleFileInput(event) {
        const files = event.target.files;
        FileHandlers.processFiles(files, EventHandlers.refreshAllChartsAndUI);
    }

    static handleBenchmarkFileInput(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('Processando arquivo de benchmark:', file.name);
            FileHandlers.processBenchmarkFile(file, EventHandlers.refreshBenchmarkRelatedUI);
        }
    }

static toggleMetrics() {
    const container = document.getElementById('metricsContainer');
    const btn = document.getElementById('metricsToggleBtn');
    const headerSpacer = document.querySelector('.header-spacer');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.textContent = 'Ocultar Métricas ▲';
        // A altura será controlada pelo CSS
    } else {
        container.style.display = 'none';
        btn.textContent = 'Seleção Métricas ▼';
        // A altura será controlada pelo CSS
    }
    
    // Reajustar tooltips após toggle
    setTimeout(adjustTooltipPosition, 100);
}

static toggleRespondents() {
    const container = document.getElementById('respondentsContainer');
    const btn = document.getElementById('respondentsToggleBtn');
    const headerSpacer = document.querySelector('.header-spacer');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.textContent = 'Ocultar Respondentes ▲';
        // A altura será controlada pelo CSS
    } else {
        container.style.display = 'none';
        btn.textContent = 'Seleção Respondentes ▼';
        // A altura será controlada pelo CSS
    }
    
    // Reajustar tooltips após toggle
    setTimeout(adjustTooltipPosition, 100);
}

    static refreshAllChartsAndUI() {
    console.log('Atualizando todas as charts e UI');
    UIRenderer.renderCheckboxes();
    UIRenderer.renderRespondentCheckboxes();
    UIRenderer.renderFileSelector();
    UIRenderer.renderComparisonTable();
    UIRenderer.renderLearningTopics();

    ChartGenerators.generateBarChart();
    ChartGenerators.generateRadarChart();
    ChartGenerators.generateFFTChart();
    ChartGenerators.generateImportanceChart();

    // Adicionar tooltips aos gráficos
    ChartGenerators.addChartTooltips();

    if (benchmarkData) {
        console.log('Benchmark data encontrado, atualizando UI relacionada');
        EventHandlers.refreshBenchmarkRelatedUI();
    }
    }

    static refreshBenchmarkRelatedUI() {
        console.log('Atualizando UI do benchmark');
        
        // Garantir que a seção está visível
        const benchmarkSection = document.getElementById('benchmark-section');
        if (benchmarkSection) {
            benchmarkSection.style.display = 'block';
            console.log('Seção benchmark definida como visível');
        }
        
        UIRenderer.renderBenchmarkComparison();
        ChartGenerators.generateBenchmarkChart();
        UIRenderer.renderBenchmarkRowSelector();
        
        // Esconder a mensagem inicial e mostrar área de comparação se houver seleção
        EventHandlers.updateOneToOneComparison();
    }

    static updateOneToOneComparison() {
        console.log('updateOneToOneComparison chamado');
        
        const respondentSelector = document.getElementById('respondentSelector');
        const benchmarkSelector = document.getElementById('benchmarkSelector');
        const comparisonSection = document.getElementById('one-to-one-comparison');
        const noComparisonMessage = document.getElementById('no-comparison-message');

        if (!respondentSelector || !benchmarkSelector || !comparisonSection || !noComparisonMessage) {
            console.log('Elementos não encontrados, saindo...');
            return;
        }

        const respondentIndex = respondentSelector.value;
        const benchmarkIndex = benchmarkSelector.value;

        if (!respondentIndex || !benchmarkIndex || respondentIndex === '' || benchmarkIndex === '') {
            console.log('Valores inválidos, ocultando seção de comparação');
            comparisonSection.style.display = 'none';
            noComparisonMessage.style.display = 'block';
            return;
        }

        console.log('Renderizando comparação 1x1 completa');
        comparisonSection.style.display = 'block';
        noComparisonMessage.style.display = 'none';
        
        // Renderizar ambos os gráficos
        UIRenderer.renderOneToOneComparison(parseInt(respondentIndex), benchmarkIndex);
        ChartGenerators.generateOneToOneChart(parseInt(respondentIndex), benchmarkIndex);
        ChartGenerators.generateOneToOneImportanceChart(parseInt(respondentIndex), benchmarkIndex);
    }
}

// Funções globais que precisam ser acessadas pelo HTML
function toggleVariable(variable) {
    const idx = selectedVariables.indexOf(variable);
    if (idx === -1) {
        selectedVariables.push(variable);
    } else {
        selectedVariables.splice(idx, 1);
    }

    ChartGenerators.generateBarChart();
    ChartGenerators.generateRadarChart();
    ChartGenerators.generateFFTChart();

    if (benchmarkData) {
        UIRenderer.renderBenchmarkComparison();
        ChartGenerators.generateBenchmarkChart();
        EventHandlers.updateOneToOneComparison();
    }
}

function toggleRespondent(index) {
    visibleRespondents[index] = !visibleRespondents[index];
    UIRenderer.renderFileSelector();

    ChartGenerators.generateBarChart();
    ChartGenerators.generateRadarChart();
    ChartGenerators.generateFFTChart();
    ChartGenerators.generateImportanceChart();

    if (benchmarkData) {
        UIRenderer.renderBenchmarkComparison();
        ChartGenerators.generateBenchmarkChart();
        UIRenderer.renderBenchmarkRowSelector();
        EventHandlers.updateOneToOneComparison();
    }
}

function selectFile(select) {
    const val = select.value;
    selectedFileIndex = val === '' ? null : parseInt(val);
    UIRenderer.renderComparisonTable();
    UIRenderer.renderLearningTopics(); // NOVA LINHA
    ChartGenerators.generateFFTChart();
    ChartGenerators.generateImportanceChart();
    EventHandlers.updateOneToOneComparison();
}

function selectBenchmarkRow(select) {
    selectedBenchmarkRow = select.value;
    if (benchmarkData) {
        UIRenderer.renderBenchmarkComparison();
        ChartGenerators.generateBenchmarkChart();
        EventHandlers.updateOneToOneComparison();
    }
}


// Esta função precisa estar disponível globalmente para ser chamada pelo HTML
function updateOneToOneComparison() {
    EventHandlers.updateOneToOneComparison();
}

// Função para ajustar automaticamente a posição dos tooltips
function adjustTooltipPosition() {
  document.querySelectorAll('.tooltip').forEach(tooltip => {
    const tooltipText = tooltip.querySelector('.tooltiptext');
    if (!tooltipText) return;
    
    tooltip.addEventListener('mouseenter', function() {
      const rect = tooltip.getBoundingClientRect();
      const tooltipRect = tooltipText.getBoundingClientRect();
      
      // Remover classes de posição existentes
      tooltipText.classList.remove('tooltip-top', 'tooltip-bottom', 'tooltip-left', 'tooltip-right');
      
      // Verificar espaço disponível em todas as direções
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      
      // Escolher a direção com mais espaço
      if (spaceBelow >= tooltipRect.height || spaceBelow >= spaceAbove) {
        tooltipText.classList.add('tooltip-bottom');
      } else if (spaceAbove >= tooltipRect.height) {
        tooltipText.classList.add('tooltip-top');
      } else if (spaceRight >= tooltipRect.width) {
        tooltipText.classList.add('tooltip-right');
      } else if (spaceLeft >= tooltipRect.width) {
        tooltipText.classList.add('tooltip-left');
      } else {
        // Fallback para bottom
        tooltipText.classList.add('tooltip-bottom');
      }
    });
  });
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  adjustTooltipPosition();
  
  // Reajustar quando a janela for redimensionada
  window.addEventListener('resize', adjustTooltipPosition);
});

// Inicializar eventos
EventHandlers.init();