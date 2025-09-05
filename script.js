let allData = [];
let fileNames = [];
let selectedVariables = ['custom_wellness_adjusted', 'Authentic'];
let selectedFileIndex = null;
let visibleRespondents = []; // Array para controlar quais respondentes estão visíveis

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
                    renderCheckboxes();
                    renderRespondentCheckboxes();
                    renderFileSelector();
                    renderComparisonTable(); 
                    generateBarChart();
                    generateRadarChart();
                    generateFFTChart();
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
}

function toggleRespondent(index) {
    visibleRespondents[index] = !visibleRespondents[index];
    renderFileSelector();
    generateBarChart();
    generateRadarChart();
    generateFFTChart();
}

function selectFile(select) {
    const val = select.value;
    selectedFileIndex = val === '' ? null : parseInt(val);
    renderComparisonTable();
    generateFFTChart();
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

// ======= UTIL =======
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i=0;i<6;i++) color += letters[Math.floor(Math.random()*16)];
    return color;
}