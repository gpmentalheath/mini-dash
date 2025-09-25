let allData = [];
let fileNames = [];
// Variáveis que devem ser selecionadas automaticamente
const autoSelectedVariables = [
    'Authentic', 'sociable', 'openness', 'organized', 
    'cautious', 'humble', 'assertive', 'adventurous'
];
let selectedVariables = [...autoSelectedVariables];
let selectedFileIndex = null;
let visibleRespondents = []; // Array para controlar quais respondentes estão visíveis
let benchmarkData = null;
let benchmarkAverages = {};
let benchmarkRanks = {};
let selectedBenchmarkRow = null;
let benchmarkRows = [];

// Dados de importância das variáveis
const importanceWeights = {
  'intellectual': 80,
  'imaginative': 75,
  'sociable': 70,
  'Reatividade': 85,
  'self_conscious': 78,
  'agreeableness': 72,
  'openness': 73,
  'organized': 68,
  'cautious': 35,
  'artistic': 30,
  'humble': 20,
  'assertive': 90,
  'adventurous': 80
};

// Registrar o plugin de annotation
Chart.register({
    id: 'annotation',
    beforeDraw: function(chart) {
        if (chart.options.plugins.annotation && chart.options.plugins.annotation.annotations) {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;
            
            chart.options.plugins.annotation.annotations.forEach(annotation => {
                if (annotation.type === 'box') {
                    const xMin = xAxis.getPixelForValue(annotation.xMin);
                    const xMax = xAxis.getPixelForValue(annotation.xMax);
                    const yTop = yAxis.top;
                    const yBottom = yAxis.bottom;
                    
                    ctx.save();
                    ctx.fillStyle = annotation.backgroundColor;
                    ctx.fillRect(xMin, yTop, xMax - xMin, yBottom - yTop);
                    
                    // Adicionar texto se especificado
                    if (annotation.label) {
                        ctx.font = annotation.label.font || '12px Arial';
                        ctx.fillStyle = annotation.label.color || '#000';
                        ctx.textAlign = 'left';
                        ctx.fillText(annotation.label.content, xMin + 5, yTop + 15);
                    }
                    
                    ctx.restore();
                }
            });
        }
    }
});

// Inicializar eventos após o carregamento do DOM
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fileInput').addEventListener('change', processFiles);
    document.getElementById('benchmarkFileInput').addEventListener('change', processBenchmarkFile);
    document.getElementById('metricsToggleBtn').addEventListener('click', toggleMetrics);
    document.getElementById('respondentsToggleBtn').addEventListener('click', toggleRespondents);
});

function toggleMetrics() {
    const container = document.getElementById('metricsContainer');
    const btn = document.getElementById('metricsToggleBtn');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.textContent = 'Ocultar Métricas ▲';
        // Ajustar o espaçamento quando as métricas são exibidas
        document.querySelector('.header-spacer').style.height = '280px';
    } else {
        container.style.display = 'none';
        btn.textContent = 'Seleção Métricas ▼';
        // Restaurar o espaçamento padrão
        document.querySelector('.header-spacer').style.height = '220px';
    }
}

function toggleRespondents() {
    const container = document.getElementById('respondentsContainer');
    const btn = document.getElementById('respondentsToggleBtn');
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.textContent = 'Ocultar Respondentes ▲';
        // Ajustar o espaçamento quando os respondentes são exibidos
        document.querySelector('.header-spacer').style.height = '280px';
    } else {
        container.style.display = 'none';
        btn.textContent = 'Seleção Respondentes ▼';
        // Restaurar o espaçamento padrão
        document.querySelector('.header-spacer').style.height = '220px';
    }
}

function processFiles() {
    const files = document.getElementById('fileInput').files;
    allData = [];
    fileNames = [];
    selectedFileIndex = null;
    visibleRespondents = []; // Resetar os respondentes visíveis

    if (files.length === 0) {
        alert("Por favor, selecione pelo menos um arquivo JSON.");
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                // Verificar se os dados contêm a variável cogproc
                const firstItem = Array.isArray(jsonData) ? jsonData[0] : jsonData;
                if (!firstItem || !('cogproc' in firstItem)) {
                    alert(`Arquivo ${files[i].name} não contém a variável 'cogproc'.`);
                    return;
                }
                
                allData.push(Array.isArray(jsonData) ? jsonData : [jsonData]);
                fileNames.push(firstItem?.name_if_id || files[i].name.replace('.json', ''));
                // Inicialmente todos os respondentes estão visíveis
                visibleRespondents.push(true);

                if (allData.length === files.length) {
                    // Selecionar automaticamente as variáveis especificadas
                    selectedVariables = [...autoSelectedVariables];
                    
                    renderCheckboxes();
                    renderRespondentCheckboxes();
                    renderFileSelector();
                    renderComparisonTable(); 
                    generateBarChart();
                    generateRadarChart();
                    generateFFTChart();
                    generateImportanceChart();
                    
                    // Atualizar benchmark se estiver ativo
                    if (benchmarkData) {
                        renderBenchmarkComparison();
                        generateBenchmarkChart();
                        renderBenchmarkRowSelector(); // Atualizar seletor de benchmark
                    }
                }
            } catch (error) {
                console.error("Erro ao processar arquivo:", error);
                alert("Erro ao processar arquivo " + files[i].name + ": " + error.message);
            }
        };
        reader.readAsText(files[i]);
    }
}

function renderCheckboxes() {
    if (allData.length === 0) return;
    
    const variables = Object.keys(allData[0][0]).filter(key => 
        key !== 'name_if_id' && typeof allData[0][0][key] === 'number'
    );
    
    const container = document.getElementById('checkboxes');
    
    container.innerHTML = variables.map(v => `
        <label class="checkbox-label">
            <input type="checkbox" value="${v}" ${selectedVariables.includes(v) ? 'checked' : ''} onchange="toggleVariable('${v}')">
            ${v}
        </label>
    `).join('');
}

function renderRespondentCheckboxes() {
    if (allData.length === 0) return;
    
    const container = document.getElementById('respondent-checkboxes');
    
    container.innerHTML = fileNames.map((name, index) => `
        <label class="checkbox-label">
            <input type="checkbox" value="${index}" ${visibleRespondents[index] ? 'checked' : ''} onchange="toggleRespondent(${index})">
            ${name}
        </label>
    `).join('');
}

function renderFileSelector() {
    let selectorHTML = '<label>Comparar com respondente:</label><select onchange="selectFile(this)">';
    selectorHTML += '<option value="">Nenhum</option>';
    fileNames.forEach((name, index) => {
        if (visibleRespondents[index]) {
            selectorHTML += `<option value="${index}">${name}</option>`;
        }
    });
    selectorHTML += '</select>';
    document.getElementById('file-selector-container').innerHTML = selectorHTML;
}

function toggleVariable(variable) {
    const idx = selectedVariables.indexOf(variable);
    if (idx === -1) {
        selectedVariables.push(variable);
    } else {
        selectedVariables.splice(idx, 1);
    }

    generateBarChart();
    generateRadarChart();
    generateFFTChart();
    
    // Atualizar benchmark se estiver ativo
    if (benchmarkData) {
        renderBenchmarkComparison();
        generateBenchmarkChart();
        updateOneToOneComparison(); // Atualizar comparação 1x1 se estiver ativa
    }
}

function toggleRespondent(index) {
    visibleRespondents[index] = !visibleRespondents[index];
    renderFileSelector();
    generateBarChart();
    generateRadarChart();
    generateFFTChart();
    generateImportanceChart();
    
    // Atualizar benchmark se estiver ativo
    if (benchmarkData) {
        renderBenchmarkComparison();
        generateBenchmarkChart();
        renderBenchmarkRowSelector(); // Atualizar seletor de benchmark
        updateOneToOneComparison(); // Atualizar comparação 1x1 se estiver ativa
    }
}

function selectFile(select) {
    const val = select.value;
    selectedFileIndex = val === '' ? null : parseInt(val);
    renderComparisonTable();
    generateFFTChart();
    generateImportanceChart();
    updateOneToOneComparison(); // Atualizar comparação 1x1 se estiver ativa
}

function renderComparisonTable() {
    const averagesContainer = document.getElementById('averages');
    averagesContainer.style.display = 'block';

    if (allData.length === 0) {
        averagesContainer.innerHTML = '<p>Nenhum dado disponível.</p>';
        return;
    }

    const averages = {};
    allData.forEach((data, idx) => {
        if (!visibleRespondents[idx]) return; // Pular respondentes ocultos
        
        data.forEach(item => {
            for (const key in item) {
                if (typeof item[key] === 'number') {
                    if (!averages[key]) averages[key] = { sum: 0, count: 0 };
                    averages[key].sum += item[key];
                    averages[key].count += 1;
                }
            }
        });
    });

    const selectedFileName = selectedFileIndex !== null ? fileNames[selectedFileIndex] : '-';

    // Mostrar TODAS as variáveis numéricas, não apenas as selecionadas
    const tableRows = Object.keys(averages).map(key => {
        const avg = (averages[key].sum / averages[key].count).toFixed(2);
        let fileValue = '-';
        let cellClass = '';
        
        if (selectedFileIndex !== null) {
            const selectedData = allData[selectedFileIndex][0];
            if (selectedData[key] !== undefined) {
                fileValue = selectedData[key].toFixed(2);
                // Determinar se está acima ou abaixo da média
                if (selectedData[key] > parseFloat(avg)) {
                    cellClass = 'above-average';
                } else if (selectedData[key] < parseFloat(avg)) {
                    cellClass = 'below-average';
                }
            }
        }
        
        return `<tr>
            <td>${key}</td>
            <td>${avg}</td>
            <td class="${cellClass}">${fileValue}</td>
        </tr>`;
    }).join('');

    averagesContainer.innerHTML = `
        <h3>Métricas${selectedFileIndex !== null ? ' - ' + selectedFileName : ''}</h3>
        <table>
            <thead>
                <tr>
                    <th>Variável</th>
                    <th>Média</th>
                    <th>${selectedFileIndex !== null ? selectedFileName : 'Arquivo Selecionado'}</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

function generateBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (window.barChartInstance) window.barChartInstance.destroy();

    const datasets = selectedVariables.map(variable => {
        const dataPoints = allData.map((data, index) => {
            if (!visibleRespondents[index]) return null; // Pular respondentes ocultos
            
            const values = data.map(item => item[variable]).filter(v => typeof v === 'number');
            return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        }).filter(v => v !== null); // Remover valores nulos
        
        const color = getRandomColor();
        return {
            label: variable,
            data: dataPoints,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1
        };
    });

    // Filtrar labels para mostrar apenas os respondentes visíveis
    const visibleLabels = fileNames.filter((_, index) => visibleRespondents[index]);

    window.barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: visibleLabels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            return tooltipItem.dataset.label + ': ' + tooltipItem.raw.toFixed(2);
                        }
                    }
                }
            },
            scales: { 
                y: { 
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Respondentes'
                    }
                }
            }
        }
    });
}

function generateRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    if (window.radarChartInstance) window.radarChartInstance.destroy();

    const datasets = selectedVariables.map(variable => {
        const dataPoints = allData.map((data, index) => {
            if (!visibleRespondents[index]) return null; // Pular respondentes ocultos
            
            const values = data.map(item => item[variable]).filter(v => typeof v === 'number');
            return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        }).filter(v => v !== null); // Remover valores nulos
        
        const color = getRandomColor();
        return {
            label: variable,
            data: dataPoints,
            fill: true,
            backgroundColor: color + '33',
            borderColor: color,
            pointBackgroundColor: color,
            pointRadius: 4
        };
    });

    // Filtrar labels para mostrar apenas os respondentes visíveis
    const visibleLabels = fileNames.filter((_, index) => visibleRespondents[index]);

    window.radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: visibleLabels,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'top' } 
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
}

// Função para mapear cogproc para valores de i
function mapCogProcToI(cogproc) {
    if (cogproc >= 0 && cogproc < 9) {
        // Mapear 0-9 para -5 a -1.5
        return -5 + (cogproc / 9) * 3.5;
    } else if (cogproc >= 9 && cogproc < 10.5) {
        // Mapear 9-10.5 para -1.5 a 0
        return -1.5 + ((cogproc - 9) / 1.5) * 1.5;
    } else if (cogproc >= 10.5 && cogproc < 12.5) {
        // Mapear 10.5-12.5 para 0 a 1.5
        return 0 + ((cogproc - 10.5) / 2) * 1.5;
    } else if (cogproc >= 12.5 && cogproc <= 15) {
        // Mapear 12.5-15 para 1.5 a 5
        return 1.5 + ((cogproc - 12.5) / 2.5) * 3.5;
    }
    return 0; // Valor padrão se estiver fora do intervalo
}

// Gráfico FFT com curva gaussiana e regiões coloridas
function generateFFTChart() {
    const ctx = document.getElementById('fftChart').getContext('2d');
    if (window.fftChartInstance) window.fftChartInstance.destroy();

    // Domínio de i
    const X_MIN = -5, X_MAX = 5;
    const N = 200; 
    const sigma = 1.4;

    // Função gaussiana
    const f = x => Math.exp(-0.5 * Math.pow(x/sigma, 2));

    // Gerar pontos para a curva
    const xValues = [];
    const yValues = [];
    for (let k = 0; k <= N; k++) {
        const x = X_MIN + k*(X_MAX-X_MIN)/N;
        xValues.push(x);
        yValues.push(f(x));
    }

    // Dataset da curva FFT
    const curveDataset = {
        label: 'Curva cogproc',
        data: xValues.map((x, i) => ({x, y: yValues[i]})),
        borderColor: '#64ffda',
        backgroundColor: 'rgba(100, 255, 218, 0.1)',
        fill: true,
        pointRadius: 0,
        tension: 0.3
    };

    // Pontos das médias de cogproc de todos os arquivos visíveis
    const meanPoints = allData.map((data, idx) => {
        if (!visibleRespondents[idx]) return null; // Pular respondentes ocultos
        
        const cogprocValues = data.map(item => item['cogproc']).filter(v => typeof v === 'number');
        if(cogprocValues.length === 0) return null;
        
        const cogprocMean = cogprocValues.reduce((a, b) => a + b, 0) / cogprocValues.length;
        const i = mapCogProcToI(cogprocMean);

        return { 
            x: i, 
            y: f(i), 
            label: `${fileNames[idx]} (Média: ${cogprocMean.toFixed(2)})` 
        };
    }).filter(p => p !== null);

    const meanPointsDataset = {
        label: 'Média Respondentes',
        data: meanPoints,
        borderColor: '#4caf50',
        backgroundColor: '#4caf50',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'circle',
        showLine: false
    };

    // Ponto do respondente selecionado (se houver e estiver visível)
    let selectedPoint = null;
    if (selectedFileIndex !== null && visibleRespondents[selectedFileIndex]) {
        const selectedData = allData[selectedFileIndex][0];
        if (selectedData && typeof selectedData['cogproc'] === 'number') {
            const cogproc = selectedData['cogproc'];
            const i = mapCogProcToI(cogproc);
            
            selectedPoint = { 
                x: i, 
                y: f(i), 
                label: `${fileNames[selectedFileIndex]} (Individual: ${cogproc.toFixed(2)})` 
            };
        }
    }

    const selectedPointDataset = {
        label: 'Respondente Selecionado',
        data: selectedPoint ? [selectedPoint] : [],
        borderColor: '#ff3e96',
        backgroundColor: '#ff3e96',
        pointRadius: 8,
        pointHoverRadius: 10,
        pointStyle: 'circle',
        showLine: false
    };

    // Definir as regiões com suas cores e rótulos
    const regions = [
        {
            xMin: -5,
            xMax: -1.5,
            cogprocMin: 0,
            cogprocMax: 9,
            backgroundColor: 'rgba(238, 130, 238, 0.2)',
            label: 'Baixo Engajamento'
        },
        {
            xMin: -1.5,
            xMax: 0,
            cogprocMin: 9,
            cogprocMax: 10.5,
            backgroundColor: 'rgba(0, 0, 255, 0.2)',
            label: 'Processamento Moderado'
        },
        {
            xMin: 0,
            xMax: 1.5,
            cogprocMin: 10.5,
            cogprocMax: 12.5,
            backgroundColor: 'rgba(60, 179, 113, 0.2)',
            label: 'Alta Motivação'
        },
        {
            xMin: 1.5,
            xMax: 5,
            cogprocMin: 12.5,
            cogprocMax: 15,
            backgroundColor: 'rgba(255, 113, 0, 0.2)',
            label: 'Sobrecarga Cognitiva'
        }
    ];

    // Criar anotações para as regiões
    const annotations = regions.map(region => ({
        type: 'box',
        xMin: region.xMin,
        xMax: region.xMax,
        backgroundColor: region.backgroundColor,
        borderWidth: 0,
        label: {
            display: true,
            content: region.label,
            position: 'start',
            xAdjust: 0,
            yAdjust: -5,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#000',
            font: {
                size: 9,
                weight: 'bold'
            }
        }
    }));

    window.fftChartInstance = new Chart(ctx, {
        type: 'line',
        data: { 
            datasets: [
                curveDataset, 
                meanPointsDataset, 
                ...(selectedPoint ? [selectedPointDataset] : [])
            ] 
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + 
                                   (context.raw.label || `x=${context.raw.x.toFixed(2)}, y=${context.raw.y.toFixed(3)}`);
                        }
                    }
                },
                annotation: {
                    annotations: annotations
                }
            },
            scales: {
                x: { 
                    type: 'linear', 
                    min: X_MIN, 
                    max: X_MAX, 
                    title: { 
                        display: true, 
                        text: 'Nivel de Estresse' 
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: { 
                    min: 0, 
                    max: 1.05, 
                    title: { 
                        display: true, 
                        text: 'Engajamento' 
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });

    // Adicionar legenda das regiões
    addRegionLegend(regions);
}

// Adicionar legenda das regiões
function addRegionLegend(regions) {
    // Remover legenda anterior se existir
    const existingLegend = document.getElementById('region-legend');
    if (existingLegend) {
        existingLegend.remove();
    }

    const legend = document.createElement('div');
    legend.id = 'region-legend';
    legend.className = 'region-legend';
    
    regions.forEach(region => {
        const item = document.createElement('div');
        item.className = 'region-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'region-color';
        colorBox.style.backgroundColor = region.backgroundColor.replace('0.2', '0.8');
        
        const text = document.createElement('span');
        text.textContent = region.label;
        
        item.appendChild(colorBox);
        item.appendChild(text);
        legend.appendChild(item);
    });

    // Adicionar a legenda ao container do gráfico
    const chartContainer = document.querySelector('#fftChart').parentNode;
    chartContainer.style.position = 'relative';
    chartContainer.appendChild(legend);
}

// Gerar gráfico de importância
function generateImportanceChart() {
    const ctx = document.getElementById('importanceChart').getContext('2d');
    if (window.importanceChartInstance) window.importanceChartInstance.destroy();

    // Verificar se há um respondente selecionado
    if (selectedFileIndex === null || !visibleRespondents[selectedFileIndex]) {
        // Limpar o gráfico se não houver respondente selecionado
        window.importanceChartInstance = new Chart(ctx, {
            type: 'scatter',
            data: { datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Selecione um respondente na tabela para visualizar'
                    }
                }
            }
        });
        return;
    }

    // Obter dados do respondente selecionado
    const selectedData = allData[selectedFileIndex][0];
    const selectedName = fileNames[selectedFileIndex];
    
    // Criar array de métricas disponíveis (apenas as que existem nos dados e têm peso definido)
    const availableMetrics = Object.keys(importanceWeights).filter(variable => 
        selectedData[variable] !== undefined && typeof selectedData[variable] === 'number'
    );

    // Remover o container de checkboxes de métricas se existir
    const metricsContainer = document.getElementById('metrics-checkboxes-container');
    if (metricsContainer) {
        metricsContainer.remove();
    }

    // Criar datasets individuais para cada variável (para ter legendas separadas)
    const datasets = availableMetrics.map(variable => {
        const color = getColorForMetric(variable);
        return {
            label: variable,
            data: [{
                x: importanceWeights[variable],
                y: selectedData[variable],
                variable: variable
            }],
            backgroundColor: color,
            borderColor: color,
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
        };
    });

    // Linhas divisórias para os quadrantes
    const verticalLine = {
        type: 'line',
        xMin: 50,
        xMax: 50,
        yMin: 0,
        yMax: 100,
        borderColor: 'rgba(0, 0, 0, 0.7)',
        borderWidth: 2,
        label: {
            content: 'Eixo Y',
            enabled: true,
            position: 'center'
        }
    };

    const horizontalLine = {
        type: 'line',
        xMin: 0,
        xMax: 100,
        yMin: 50,
        yMax: 50,
        borderColor: 'rgba(0, 0, 0, 0.7)',
        borderWidth: 2,
        label: {
            content: 'Eixo X',
            enabled: true,
            position: 'center'
        }
    };

    // Anotações para os quadrantes
    const quadrantAnnotations = [
        {
            type: 'label',
            xValue: 25,
            yValue: 75,
            content: 'Q1: Força no Passado',
            backgroundColor: 'rgba(255, 255, 0, 0.2)',
            font: { size: 12, weight: 'bold' }
        },
        {
            type: 'label',
            xValue: 75,
            yValue: 75,
            content: 'Q2: Time Preparado para o Futuro',
            backgroundColor: 'rgba(0, 255, 0, 0.2)',
            font: { size: 12, weight: 'bold' }
        },
        {
            type: 'label',
            xValue: 25,
            yValue: 25,
            content: 'Q3: Baixa Prioridade',
            backgroundColor: 'rgba(255, 165, 0, 0.2)',
            font: { size: 12, weight: 'bold' }
        },
        {
            type: 'label',
            xValue: 75,
            yValue: 25,
            content: 'Q4: Alerta de Desenvolvimento',
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            font: { size: 12, weight: 'bold' }
        }
    ];

    window.importanceChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        generateLabels: function(chart) {
                            // Personalizar as labels da legenda para mostrar as variáveis
                            return chart.data.datasets.map((dataset, i) => {
                                return {
                                    text: dataset.label,
                                    fillStyle: dataset.backgroundColor,
                                    strokeStyle: dataset.borderColor,
                                    lineWidth: 1,
                                    pointStyle: 'circle',
                                    hidden: false
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const point = context.raw;
                            return `${context.dataset.label} (Peso: ${point.x}, Nota: ${point.y.toFixed(2)})`;
                        }
                    }
                },
                annotation: {
                    annotations: {
                        verticalLine,
                        horizontalLine,
                        ...quadrantAnnotations.reduce((acc, annotation, index) => {
                            acc[`quadrant${index + 1}`] = annotation;
                            return acc;
                        }, {})
                    }
                },
                title: {
                    display: true,
                    text: `Análise de Importância vs. Desempenho - ${selectedName}`,
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Importância (Peso)'
                    },
                    grid: {
                        color: function(context) {
                            return context.tick.value === 50 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Desempenho (Nota)'
                    },
                    grid: {
                        color: function(context) {
                            return context.tick.value === 50 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                }
            }
        }
    });
}

// Função auxiliar para obter cor consistente para cada métrica
function getColorForMetric(metric) {
    if (!window.metricColors) window.metricColors = {};
    if (!window.metricColors[metric]) {
        window.metricColors[metric] = getRandomColor();
    }
    return window.metricColors[metric];
}

// Função para processar o arquivo de benchmark
function processBenchmarkFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Mostrar loader
    document.getElementById('benchmark-loader').style.display = 'block';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Supondo que os dados estão na primeira planilha
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Converter para JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length > 0) {
                benchmarkData = jsonData;
                benchmarkRows = jsonData; // Armazenar todas as linhas
                calculateBenchmarkAverages();
                calculateBenchmarkRanks();
                document.getElementById('benchmark-section').style.display = 'block';
                renderBenchmarkComparison();
                generateBenchmarkChart();
                renderBenchmarkRowSelector(); // Nova função para selecionar linha do bench
            }
        } catch (error) {
            console.error("Erro ao processar arquivo de benchmark:", error);
            alert("Erro ao processar arquivo de benchmark: " + error.message);
        } finally {
            // Esconder loader
            document.getElementById('benchmark-loader').style.display = 'none';
        }
    };
    reader.readAsArrayBuffer(file);
}

// Calcular médias do benchmark
function calculateBenchmarkAverages() {
    if (!benchmarkData || benchmarkData.length === 0) return;
    
    benchmarkAverages = {};
    
    // Para cada coluna numérica, calcular a média
    Object.keys(benchmarkData[0]).forEach(key => {
        if (key === 'codigo_pesquisa' || key === 'externalId' || key === 'code') return;
        
        const values = benchmarkData.map(row => parseFloat(row[key])).filter(val => !isNaN(val));
        if (values.length > 0) {
            benchmarkAverages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
        }
    });
}

// Calcular ranks do benchmark
function calculateBenchmarkRanks() {
    if (!benchmarkData || benchmarkData.length === 0) return;
    
    benchmarkRanks = {};
    
    // Para cada coluna numérica, calcular o rank
    Object.keys(benchmarkData[0]).forEach(key => {
        if (key === 'codigo_pesquisa' || key === 'externalId' || key === 'code') return;
        
        const values = benchmarkData.map(row => parseFloat(row[key])).filter(val => !isNaN(val));
        if (values.length > 0) {
            // Ordenar valores para calcular percentis
            values.sort((a, b) => a - b);
            benchmarkRanks[key] = values;
        }
    });
}

// Calcular o rank de um valor específico
function calculateRank(variable, value) {
    if (!benchmarkRanks[variable] || benchmarkRanks[variable].length === 0) return 0;
    
    const values = benchmarkRanks[variable];
    // Contar quantos valores são menores que o valor fornecido
    const countBelow = values.filter(v => v < value).length;
    
    // Calcular rank (posição percentual)
    return (countBelow / values.length) * 100;
}

// Nova função para renderizar seletor de linha do benchmark
function renderBenchmarkRowSelector() {
    const benchmarkSection = document.getElementById('benchmark-section');
    
    // Adicionar seletor de linha do benchmark
    let selectorHTML = `
        <div style="margin-bottom: 20px;">
            <h4>Comparação Individual 1x1</h4>
            <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                <div>
                    <label>Selecionar Respondente:</label>
                    <select id="respondentSelector" onchange="updateOneToOneComparison()">
                        <option value="">Nenhum</option>
    `;
    
    fileNames.forEach((name, index) => {
        if (visibleRespondents[index]) {
            selectorHTML += `<option value="${index}">${name}</option>`;
        }
    });
    
    selectorHTML += `
                    </select>
                </div>
                <div>
                    <label>Selecionar Bench:</label>
                    <select id="benchmarkSelector" onchange="updateOneToOneComparison()">
                        <option value="">Nenhum</option>
                        <option value="average">Média do Bench (Todos)</option>
    `;
    
    // Adicionar opções para cada linha do benchmark
    benchmarkRows.forEach((row, index) => {
        const identifier = row.Name || row.codigo_pesquisa || row.externalId || `Linha ${index + 1}`;
        selectorHTML += `<option value="${index}">${identifier}</option>`;
    });
    
    selectorHTML += `
                    </select>
                </div>
            </div>
        </div>
        <div id="one-to-one-comparison" style="display: none;">
            <h4>Comparação Detalhada 1x1</h4>
            <div id="comparison-details"></div>
            <div class="chart-container">
                <canvas id="oneToOneChart"></canvas>
            </div>
        </div>
    `;
    
    // Inserir após o título da seção de benchmark
    const existingContent = benchmarkSection.innerHTML;
    benchmarkSection.innerHTML = selectorHTML + existingContent;
}

// Nova função para atualizar comparação 1x1
function updateOneToOneComparison() {
    const respondentIndex = document.getElementById('respondentSelector').value;
    const benchmarkIndex = document.getElementById('benchmarkSelector').value;
    const comparisonSection = document.getElementById('one-to-one-comparison');
    
    if (respondentIndex === '' || benchmarkIndex === '') {
        comparisonSection.style.display = 'none';
        return;
    }
    
    comparisonSection.style.display = 'block';
    renderOneToOneComparison(parseInt(respondentIndex), benchmarkIndex);
    generateOneToOneChart(parseInt(respondentIndex), benchmarkIndex);
}

// Nova função para renderizar comparação detalhada 1x1
function renderOneToOneComparison(respondentIndex, benchmarkIndex) {
    const container = document.getElementById('comparison-details');
    
    if (respondentIndex === null || benchmarkIndex === null) {
        container.innerHTML = '<p>Selecione um respondente e um benchmark para comparar.</p>';
        return;
    }
    
    const respondentData = allData[respondentIndex][0];
    const respondentName = fileNames[respondentIndex];
    
    let benchmarkName, benchmarkData;
    
    if (benchmarkIndex === 'average') {
        benchmarkName = 'Média do Bench';
        benchmarkData = benchmarkAverages;
    } else {
        const benchRow = benchmarkRows[parseInt(benchmarkIndex)];
        benchmarkName = benchRow.Name || benchRow.codigo_pesquisa || benchRow.externalId || `Bench ${parseInt(benchmarkIndex) + 1}`;
        benchmarkData = benchRow;
    }
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Variável</th>
                    <th>${respondentName}</th>
                    <th>${benchmarkName}</th>
                    <th>Diferença</th>
                    <th>Variação %</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    selectedVariables.forEach(variable => {
        if (respondentData[variable] !== undefined && benchmarkData[variable] !== undefined) {
            const respondentValue = respondentData[variable];
            const benchmarkValue = benchmarkData[variable];
            const difference = respondentValue - benchmarkValue;
            const variation = benchmarkValue !== 0 ? (difference / benchmarkValue) * 100 : 0;
            
            let diffClass = '';
            if (difference > 0) diffClass = 'above-average';
            else if (difference < 0) diffClass = 'below-average';
            
            let variationClass = '';
            if (variation > 10) variationClass = 'above-average';
            else if (variation < -10) variationClass = 'below-average';
            
            tableHTML += `
                <tr>
                    <td>${variable}</td>
                    <td>${respondentValue.toFixed(2)}</td>
                    <td>${benchmarkValue.toFixed(2)}</td>
                    <td class="${diffClass}">${difference > 0 ? '+' : ''}${difference.toFixed(2)}</td>
                    <td class="${variationClass}">${variation > 0 ? '+' : ''}${variation.toFixed(1)}%</td>
                </tr>
            `;
        }
    });
    
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

// Calcular médias do grupo atual
function calculateGroupAverages() {
    const averages = {};
    
    allData.forEach((data, idx) => {
        if (!visibleRespondents[idx]) return;
        
        data.forEach(item => {
            for (const key in item) {
                if (typeof item[key] === 'number') {
                    if (!averages[key]) averages[key] = { sum: 0, count: 0 };
                    averages[key].sum += item[key];
                    averages[key].count += 1;
                }
            }
        });
    });
    
    // Calcular médias finais
    const result = {};
    Object.keys(averages).forEach(key => {
        result[key] = averages[key].sum / averages[key].count;
    });
    
    return result;
}

// Gerar gráfico de comparação com benchmark (CORRIGIDA)
function generateBenchmarkChart() {
    const ctx = document.getElementById('benchmarkChart').getContext('2d');
    if (window.benchmarkChartInstance) window.benchmarkChartInstance.destroy();
    
    const groupAverages = calculateGroupAverages();
    
    // Verificar se há dados para exibir
    const labels = selectedVariables.filter(v => 
        benchmarkAverages[v] !== undefined && groupAverages[v] !== undefined
    );
    
    // Se não há dados válidos, ocultar o container do gráfico
    const chartContainer = document.querySelector('#benchmarkChart').closest('.chart-container');
    if (labels.length === 0) {
        chartContainer.style.display = 'none';
        return;
    }
    
    // Mostrar o container do gráfico
    chartContainer.style.display = 'block';
    
    const groupData = labels.map(v => groupAverages[v]);
    const benchmarkData = labels.map(v => benchmarkAverages[v]);
    
    window.benchmarkChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Média do Grupo',
                    data: groupData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Média do Bench',
                    data: benchmarkData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw.toFixed(2);
                        }
                    }
                }
            },
            scales: { 
                y: { 
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor'
                    }
                }
            }
        }
    });
}

// Nova função para gerar gráfico 1x1
function generateOneToOneChart(respondentIndex, benchmarkIndex) {
    const ctx = document.getElementById('oneToOneChart').getContext('2d');
    if (window.oneToOneChartInstance) window.oneToOneChartInstance.destroy();
    
    const respondentData = allData[respondentIndex][0];
    const respondentName = fileNames[respondentIndex];
    
    let benchmarkName, benchmarkData;
    
    if (benchmarkIndex === 'average') {
        benchmarkName = 'Média do Bench';
        benchmarkData = benchmarkAverages;
    } else {
        const benchRow = benchmarkRows[parseInt(benchmarkIndex)];
        benchmarkName = benchRow.Name || benchRow.codigo_pesquisa || benchRow.externalId || `Bench ${parseInt(benchmarkIndex) + 1}`;
        benchmarkData = benchRow;
    }
    
    const labels = selectedVariables.filter(v => 
        respondentData[v] !== undefined && benchmarkData[v] !== undefined
    );
    
    const respondentValues = labels.map(v => respondentData[v]);
    const benchmarkValues = labels.map(v => benchmarkData[v]);
    
    window.oneToOneChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: respondentName,
                    data: respondentValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: benchmarkName,
                    data: benchmarkValues,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw.toFixed(2);
                        }
                    }
                },
                title: {
                    display: true,
                    text: `Comparação 1x1: ${respondentName} vs ${benchmarkName}`,
                    font: {
                        size: 16
                    }
                }
            },
            scales: { 
                y: { 
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor'
                    }
                }
            }
        }
    });
}

// Modificar a função renderBenchmarkComparison para incluir ambas as visualizações
function renderBenchmarkComparison() {
    const container = document.getElementById('benchmark-results');
    
    if (!benchmarkData || allData.length === 0) {
        container.innerHTML = '<p>Nenhum dado disponível para comparação.</p>';
        return;
    }
    
    // Calcular médias do grupo atual
    const groupAverages = calculateGroupAverages();
    
    // Criar tabela comparativa (comparação de grupo vs bench)
    let tableHTML = `
        <h4>Comparação Grupo vs Bench (Todos)</h4>
        <table>
            <thead>
                <tr>
                    <th>Variável</th>
                    <th>Média do Grupo</th>
                    <th>Média do Bench</th>
                    <th>Diferença</th>
                    <th>Ranking</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Para cada variável selecionada, mostrar comparação
    selectedVariables.forEach(variable => {
        if (benchmarkAverages[variable] !== undefined && groupAverages[variable] !== undefined) {
            const groupAvg = groupAverages[variable];
            const benchAvg = benchmarkAverages[variable];
            const difference = groupAvg - benchAvg;
            const rank = calculateRank(variable, groupAvg);
            
            let diffClass = '';
            if (difference > 0) diffClass = 'above-average';
            else if (difference < 0) diffClass = 'below-average';
            
            // Classificar o rank
            let rankClass = '';
            let rankText = '';
            if (rank >= 80) {
                rankClass = 'percentile-high';
                rankText = `Top ${Math.round(100 - rank)}%`;
            } else if (rank >= 50) {
                rankClass = 'percentile-medium';
                rankText = `Acima da média (${Math.round(rank)}%)`;
            } else {
                rankClass = 'percentile-low';
                rankText = `Abaixo da média (${Math.round(rank)}%)`;
            }
            
            tableHTML += `
                <tr>
                    <td>${variable}</td>
                    <td>${groupAvg.toFixed(2)}</td>
                    <td>${benchAvg.toFixed(2)}</td>
                    <td class="${diffClass}">${difference > 0 ? '+' : ''}${difference.toFixed(2)}</td>
                    <td class="${rankClass}">${rankText}</td>
                </tr>
            `;
        }
    });
    
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

// ======= UTIL =======
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i=0;i<6;i++) color += letters[Math.floor(Math.random()*16)];
    return color;
}