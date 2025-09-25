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
        if (container.style.display === 'none') {
            container.style.display = 'block';
            btn.textContent = 'Ocultar Métricas ▲';
            document.querySelector('.header-spacer').style.height = '280px';
        } else {
            container.style.display = 'none';
            btn.textContent = 'Seleção Métricas ▼';
            document.querySelector('.header-spacer').style.height = '220px';
        }
    }

    static toggleRespondents() {
        const container = document.getElementById('respondentsContainer');
        const btn = document.getElementById('respondentsToggleBtn');
        if (container.style.display === 'none') {
            container.style.display = 'block';
            btn.textContent = 'Ocultar Respondentes ▲';
            document.querySelector('.header-spacer').style.height = '280px';
        } else {
            container.style.display = 'none';
            btn.textContent = 'Seleção Respondentes ▼';
            document.querySelector('.header-spacer').style.height = '220px';
        }
    }

    static refreshAllChartsAndUI() {
        console.log('Atualizando todas as charts e UI');
        UIRenderer.renderCheckboxes();
        UIRenderer.renderRespondentCheckboxes();
        UIRenderer.renderFileSelector();
        UIRenderer.renderComparisonTable();

        ChartGenerators.generateBarChart();
        ChartGenerators.generateRadarChart();
        ChartGenerators.generateFFTChart();
        ChartGenerators.generateImportanceChart();

        if (benchmarkData) {
            console.log('Benchmark data encontrado, atualizando UI relacionada');
            EventHandlers.refreshBenchmarkRelatedUI();
        }
    }

    static refreshBenchmarkRelatedUI() {
        console.log('Atualizando UI do benchmark');
        console.log('benchmarkData:', benchmarkData);
        console.log('benchmarkAverages:', benchmarkAverages);
        
        // Garantir que a seção está visível
        const benchmarkSection = document.getElementById('benchmark-section');
        if (benchmarkSection) {
            benchmarkSection.style.display = 'block';
            console.log('Seção benchmark definida como visível');
        }
        
        UIRenderer.renderBenchmarkComparison();
        ChartGenerators.generateBenchmarkChart();
        UIRenderer.renderBenchmarkRowSelector();
        EventHandlers.updateOneToOneComparison();
    }

    static updateOneToOneComparison() {
        console.log('updateOneToOneComparison chamado');
        
        const respondentSelector = document.getElementById('respondentSelector');
        const benchmarkSelector = document.getElementById('benchmarkSelector');
        const comparisonSection = document.getElementById('one-to-one-comparison');

        console.log('Selectors encontrados:', {
            respondentSelector: !!respondentSelector,
            benchmarkSelector: !!benchmarkSelector,
            comparisonSection: !!comparisonSection
        });

        if (!respondentSelector || !benchmarkSelector || !comparisonSection) {
            console.log('Elementos não encontrados, saindo...');
            return;
        }

        const respondentIndex = respondentSelector.value;
        const benchmarkIndex = benchmarkSelector.value;

        console.log('Valores selecionados:', {
            respondentIndex,
            benchmarkIndex
        });

        if (!respondentIndex || !benchmarkIndex || respondentIndex === '' || benchmarkIndex === '') {
            console.log('Valores inválidos, ocultando seção');
            comparisonSection.style.display = 'none';
            return;
        }

        console.log('Renderizando comparação 1x1');
        comparisonSection.style.display = 'block';
        UIRenderer.renderOneToOneComparison(parseInt(respondentIndex), benchmarkIndex);
        ChartGenerators.generateOneToOneChart(parseInt(respondentIndex), benchmarkIndex);
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
    ChartGenerators.generateFFTChart();
    ChartGenerators.generateImportanceChart();
    EventHandlers.updateOneToOneComparison();
}

// Esta função precisa estar disponível globalmente para ser chamada pelo HTML
function updateOneToOneComparison() {
    EventHandlers.updateOneToOneComparison();
}

// Inicializar eventos
EventHandlers.init();