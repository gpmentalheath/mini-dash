// Geração de gráficos
class ChartGenerators {
    static generateBarChart() {
        const ctx = document.getElementById('barChart').getContext('2d');
        chartRegistry.destroy('barChart');

        const datasets = selectedVariables.map(variable => {
            const dataPoints = allData.map((data, index) => {
                if (!visibleRespondents[index]) return null;
                
                const values = data.map(item => item[variable]).filter(v => typeof v === 'number');
                return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            }).filter(v => v !== null);
            
            const color = Utils.getRandomColor();
            return {
                label: variable,
                data: dataPoints,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 1
            };
        });

        const visibleLabels = DataCalculator.getVisibleFileNames();

        const instance = new Chart(ctx, {
            type: 'bar',
            data: { labels: visibleLabels, datasets },
            options: this.getBarChartOptions()
        });
        
        chartRegistry.register('barChart', instance);
    }
    
    static generateRadarChart() {
        const ctx = document.getElementById('radarChart').getContext('2d');
        chartRegistry.destroy('radarChart');

        const datasets = selectedVariables.map(variable => {
            const dataPoints = allData.map((data, index) => {
                if (!visibleRespondents[index]) return null;
                
                const values = data.map(item => item[variable]).filter(v => typeof v === 'number');
                return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            }).filter(v => v !== null);
            
            const color = Utils.getRandomColor();
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

        const visibleLabels = DataCalculator.getVisibleFileNames();

        const instance = new Chart(ctx, {
            type: 'radar',
            data: { labels: visibleLabels, datasets },
            options: this.getRadarChartOptions()
        });
        
        chartRegistry.register('radarChart', instance);
    }
    
    static generateFFTChart() {
        const ctx = document.getElementById('fftChart').getContext('2d');
        chartRegistry.destroy('fftChart');

        const { X_MIN, X_MAX, N, sigma } = CONFIG.fft;
        const f = x => Math.exp(-0.5 * Math.pow(x/sigma, 2));

        const xValues = [];
        const yValues = [];
        for (let k = 0; k <= N; k++) {
            const x = X_MIN + k*(X_MAX-X_MIN)/N;
            xValues.push(x);
            yValues.push(f(x));
        }

        const curveDataset = {
            label: 'Curva cogproc',
            data: xValues.map((x, i) => ({x, y: yValues[i]})),
            borderColor: '#64ffda',
            backgroundColor: 'rgba(100, 255, 218, 0.1)',
            fill: true,
            pointRadius: 0,
            tension: 0.3
        };

        const meanPoints = allData.map((data, idx) => {
            if (!visibleRespondents[idx]) return null;
            
            const cogprocValues = data.map(item => item['cogproc']).filter(v => typeof v === 'number');
            if(cogprocValues.length === 0) return null;
            
            const cogprocMean = cogprocValues.reduce((a, b) => a + b, 0) / cogprocValues.length;
            const i = Utils.mapCogProcToI(cogprocMean);

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

        let selectedPoint = null;
        if (selectedFileIndex !== null && visibleRespondents[selectedFileIndex]) {
            const selectedData = allData[selectedFileIndex][0];
            if (selectedData && typeof selectedData['cogproc'] === 'number') {
                const cogproc = selectedData['cogproc'];
                const i = Utils.mapCogProcToI(cogproc);
                
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

        const annotations = CONFIG.fftRegions.map(region => ({
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
                font: { size: 9, weight: 'bold' }
            }
        }));

        const instance = new Chart(ctx, {
            type: 'line',
            data: { 
                datasets: [
                    curveDataset, 
                    meanPointsDataset, 
                    ...(selectedPoint ? [selectedPointDataset] : [])
                ] 
            },
            options: this.getFFTChartOptions(annotations)
        });
        
        chartRegistry.register('fftChart', instance);
        this.addRegionLegend(CONFIG.fftRegions);
    }
    
    static generateImportanceChart() {
        const ctx = document.getElementById('importanceChart').getContext('2d');
        chartRegistry.destroy('importanceChart');

        if (selectedFileIndex === null || !visibleRespondents[selectedFileIndex]) {
            const instance = new Chart(ctx, {
                type: 'scatter',
                data: { datasets: [] },
                options: this.getEmptyImportanceChartOptions()
            });
            chartRegistry.register('importanceChart', instance);
            return;
        }

        const selectedData = allData[selectedFileIndex][0];
        const selectedName = fileNames[selectedFileIndex];
        
        const availableMetrics = Object.keys(CONFIG.importanceWeights).filter(variable => 
            selectedData[variable] !== undefined && typeof selectedData[variable] === 'number'
        );

        const metricsContainer = document.getElementById('metrics-checkboxes-container');
        if (metricsContainer) metricsContainer.remove();

        const datasets = availableMetrics.map(variable => {
            const color = Utils.getColorForMetric(variable);
            return {
                label: variable,
                data: [{
                    x: CONFIG.importanceWeights[variable],
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

        const instance = new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: this.getImportanceChartOptions(selectedName)
        });
        
        chartRegistry.register('importanceChart', instance);
    }
    
    static generateBenchmarkChart() {
        const ctx = document.getElementById('benchmarkChart').getContext('2d');
        chartRegistry.destroy('benchmarkChart');
        
        const groupAverages = DataCalculator.calculateGroupAverages();
        const labels = selectedVariables.filter(v => 
            benchmarkAverages[v] !== undefined && groupAverages[v] !== undefined
        );
        
        const chartContainer = document.querySelector('#benchmarkChart').closest('.chart-container');
        if (labels.length === 0) {
            chartContainer.style.display = 'none';
            return;
        }
        
        chartContainer.style.display = 'block';
        
        const groupData = labels.map(v => groupAverages[v]);
        const benchmarkData = labels.map(v => benchmarkAverages[v]);
        
        const instance = new Chart(ctx, {
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
            options: this.getBenchmarkChartOptions()
        });
        
        chartRegistry.register('benchmarkChart', instance);
    }
    
    static generateOneToOneChart(respondentIndex, benchmarkIndex) {
        console.log('generateOneToOneChart chamado com:', { respondentIndex, benchmarkIndex });
        
        const canvas = document.getElementById('oneToOneChart');
        if (!canvas) {
            console.error('Canvas oneToOneChart não encontrado!');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Não foi possível obter o contexto do canvas');
            return;
        }
        
        chartRegistry.destroy('oneToOneChart');
        
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
        
        console.log('Variáveis para gráfico:', labels);
        
        const respondentValues = labels.map(v => respondentData[v]);
        const benchmarkValues = labels.map(v => benchmarkData[v]);
        
        const instance = new Chart(ctx, {
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
            options: this.getOneToOneChartOptions(respondentName, benchmarkName)
        });
        
        chartRegistry.register('oneToOneChart', instance);
        console.log('Gráfico 1x1 gerado com sucesso');
    }
    
    static generateOneToOneImportanceChart(respondentIndex, benchmarkIndex) {
        console.log('generateOneToOneImportanceChart chamado com:', { respondentIndex, benchmarkIndex });
        
        const canvas = document.getElementById('oneToOneImportanceChart');
        if (!canvas) {
            console.error('Canvas oneToOneImportanceChart não encontrado!');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        chartRegistry.destroy('oneToOneImportanceChart');
        
        // Obter dados do respondente
        const respondentData = allData[respondentIndex][0];
        const respondentName = fileNames[respondentIndex];
        
        // Obter dados do benchmark
        let benchmarkName, benchmarkData;
        if (benchmarkIndex === 'average') {
            benchmarkName = 'Média do Bench';
            benchmarkData = benchmarkAverages;
        } else {
            const benchRow = benchmarkRows[parseInt(benchmarkIndex)];
            benchmarkName = benchRow.Name || benchRow.codigo_pesquisa || benchRow.externalId || `Bench ${parseInt(benchmarkIndex) + 1}`;
            benchmarkData = benchRow;
        }
        
        // Criar pesos baseados no benchmark
        const benchmarkWeights = {};
        Object.keys(benchmarkData).forEach(key => {
            if (typeof benchmarkData[key] === 'number' && benchmarkData[key] >= 0 && benchmarkData[key] <= 100) {
                benchmarkWeights[key] = benchmarkData[key];
            }
        });
        
        // Filtrar variáveis disponíveis em ambos
        const availableMetrics = Object.keys(benchmarkWeights).filter(variable => 
            respondentData[variable] !== undefined && typeof respondentData[variable] === 'number'
        );
        
        if (availableMetrics.length === 0) {
            const instance = new Chart(ctx, {
                type: 'scatter',
                data: { datasets: [] },
                options: this.getEmptyImportanceChartOptions()
            });
            chartRegistry.register('oneToOneImportanceChart', instance);
            return;
        }
        
        // Dataset para o Benchmark (linha diagonal)
        const benchmarkPoints = availableMetrics.map(variable => ({
            x: benchmarkWeights[variable],
            y: benchmarkWeights[variable], // y = x para formar a diagonal
            variable: variable
        }));
        
        const benchmarkDataset = {
            label: `${benchmarkName} (Benchmark)`,
            data: benchmarkPoints,
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            pointRadius: 6,
            pointHoverRadius: 8,
            showLine: true,
            lineTension: 0,
            fill: false
        };
        
        // Dataset para o Respondente
        const respondentPoints = availableMetrics.map(variable => ({
            x: benchmarkWeights[variable], // Peso = valor no benchmark
            y: respondentData[variable],   // Nota = valor do respondente
            variable: variable
        }));
        
        const respondentDataset = {
            label: `${respondentName} (Respondente)`,
            data: respondentPoints,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
        };
        
        const instance = new Chart(ctx, {
            type: 'scatter',
            data: { 
                datasets: [benchmarkDataset, respondentDataset] 
            },
            options: this.getOneToOneImportanceChartOptions(respondentName, benchmarkName)
        });
        
        chartRegistry.register('oneToOneImportanceChart', instance);
        console.log('Gráfico de Importância 1x1 gerado com sucesso');
    }
    
    // Métodos auxiliares para opções dos gráficos
    static getBarChartOptions() {
        return {
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
                    title: { display: true, text: 'Valor' }
                },
                x: {
                    title: { display: true, text: 'Respondentes' }
                }
            }
        };
    }
    
    static getRadarChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'top' } 
            },
            scales: {
                r: {
                    angleLines: { display: true },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        };
    }
    
    static getFFTChartOptions(annotations) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'top',
                    labels: { usePointStyle: true }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + 
                                   (context.raw.label || `x=${context.raw.x.toFixed(2)}, y=${context.raw.y.toFixed(3)}`);
                        }
                    }
                },
                annotation: { annotations }
            },
            scales: {
                x: { 
                    type: 'linear', 
                    min: CONFIG.fft.X_MIN, 
                    max: CONFIG.fft.X_MAX, 
                    title: { display: true, text: 'Nivel de Estresse' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                },
                y: { 
                    min: 0, 
                    max: 1.05, 
                    title: { display: true, text: 'Engajamento' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' }
                }
            }
        };
    }
    
    static getImportanceChartOptions(selectedName) {
        const verticalLine = {
            type: 'line',
            xMin: 50,
            xMax: 50,
            yMin: 0,
            yMax: 100,
            borderColor: 'rgba(0, 0, 0, 0.7)',
            borderWidth: 2
        };

        const horizontalLine = {
            type: 'line',
            xMin: 0,
            xMax: 100,
            yMin: 50,
            yMax: 50,
            borderColor: 'rgba(0, 0, 0, 0.7)',
            borderWidth: 2
        };

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

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        generateLabels: function(chart) {
                            return chart.data.datasets.map((dataset) => {
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
                    font: { size: 16 }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Importância (Peso)' },
                    grid: {
                        color: function(context) {
                            return context.tick.value === 50 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                },
                y: {
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Desempenho (Nota)' },
                    grid: {
                        color: function(context) {
                            return context.tick.value === 50 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                }
            }
        };
    }
    
    static getOneToOneImportanceChartOptions(respondentName, benchmarkName) {
        const verticalLine = {
            type: 'line',
            xMin: 50,
            xMax: 50,
            yMin: 0,
            yMax: 100,
            borderColor: 'rgba(0, 0, 0, 0.7)',
            borderWidth: 2
        };

        const horizontalLine = {
            type: 'line',
            xMin: 0,
            xMax: 100,
            yMin: 50,
            yMax: 50,
            borderColor: 'rgba(0, 0, 0, 0.7)',
            borderWidth: 2
        };

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

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        generateLabels: function(chart) {
                            return chart.data.datasets.map((dataset) => {
                                return {
                                    text: dataset.label,
                                    fillStyle: dataset.backgroundColor,
                                    strokeStyle: dataset.borderColor,
                                    lineWidth: 1,
                                    pointStyle: dataset.showLine ? 'line' : 'circle',
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
                            if (context.dataset.label.includes('Benchmark')) {
                                return `${point.variable} (Peso: ${point.x.toFixed(2)}, Nota: ${point.y.toFixed(2)}) - Benchmark`;
                            } else {
                                return `${point.variable} (Peso: ${point.x.toFixed(2)}, Nota: ${point.y.toFixed(2)}) - Respondente`;
                            }
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
                    text: `Importância vs. Desempenho: ${respondentName} vs ${benchmarkName}`,
                    font: { size: 16 }
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
                        text: 'Importância (Valor no Benchmark)' 
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
                        text: 'Desempenho (Nota do Respondente)' 
                    },
                    grid: {
                        color: function(context) {
                            return context.tick.value === 50 ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                }
            }
        };
    }
    
    static getEmptyImportanceChartOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Selecione um respondente na tabela para visualizar'
                }
            }
        };
    }
    
    static getBenchmarkChartOptions() {
        return {
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
                    title: { display: true, text: 'Valor' }
                }
            }
        };
    }
    
    static getOneToOneChartOptions(respondentName, benchmarkName) {
        return {
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
                    font: { size: 16 }
                }
            },
            scales: { 
                y: { 
                    beginAtZero: true,
                    title: { display: true, text: 'Valor' }
                }
            }
        };
    }
    
    static addRegionLegend(regions) {
        const existingLegend = document.getElementById('region-legend');
        if (existingLegend) existingLegend.remove();

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

        const chartContainer = document.querySelector('#fftChart').parentNode;
        chartContainer.style.position = 'relative';
        chartContainer.appendChild(legend);
    }
}