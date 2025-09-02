let allData = []; // Armazenará os dados de todos os arquivos JSON
let selectedVariables = ['Cognition', 'Tone', 'custom_wellness_adjusted', 'Authentic']; // Variáveis pré-selecionadas
let showAverages = false; // Controle se mostra médias
let selectedFileIndex = null; // Arquivo selecionado para comparação

function processFiles() {
    const files = document.getElementById('fileInput').files;
    allData = []; // Limpar dados anteriores
    selectedFileIndex = null;
    showAverages = false;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function(e) {
            const jsonData = JSON.parse(e.target.result);
            allData.push(jsonData);

            if (allData.length === files.length) {
                calculateAverages();
                renderCheckboxes();
                renderFileSelector();
                generateBarChart();
                generateRadarChart();
            }
        };
        reader.readAsText(file);
    }
}

// Calcula as médias
function calculateAverages() {
    const averages = {};
    allData.forEach(data => {
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

    const averagesHTML = Object.keys(averages).map(key => {
        const avg = averages[key].sum / averages[key].count;
        return `<li><strong>${key}</strong>: ${avg.toFixed(2)}</li>`;
    }).join('');

    document.getElementById('averages').innerHTML = `<ul>${averagesHTML}</ul>`;
}

// Renderiza checkboxes das variáveis
function renderCheckboxes() {
    const variables = Object.keys(allData[0][0]);
    const container = document.getElementById('checkboxes');
    container.innerHTML = variables.map(v => `
        <label class="checkbox-label">
            <input type="checkbox" value="${v}" ${selectedVariables.includes(v) ? 'checked' : ''} onchange="toggleVariable('${v}')">
            ${v}
        </label>
    `).join('');

    // Checkbox para mostrar médias
    container.innerHTML += `
        <label class="checkbox-label">
            <input type="checkbox" onchange="toggleAverages(this)">
            Mostrar Médias
        </label>
    `;
}

// Renderiza dropdown para selecionar um arquivo
function renderFileSelector() {
    let selectorHTML = '<label>Comparar com arquivo:</label><select onchange="selectFile(this)">';
    selectorHTML += '<option value="">Nenhum</option>';
    allData.forEach((_, index) => {
        selectorHTML += `<option value="${index}">Arquivo ${index + 1}</option>`;
    });
    selectorHTML += '</select>';
    document.getElementById('averages').insertAdjacentHTML('beforebegin', selectorHTML);
}

// Alterna seleção de variáveis
function toggleVariable(variable) {
    const idx = selectedVariables.indexOf(variable);
    if (idx === -1) selectedVariables.push(variable);
    else selectedVariables.splice(idx, 1);

    generateBarChart();
    generateRadarChart();
    renderComparisonTable();
}

// Alterna exibição das médias
function toggleAverages(checkbox) {
    showAverages = checkbox.checked;
    renderComparisonTable();
}

// Seleciona arquivo para comparação
function selectFile(select) {
    const val = select.value;
    selectedFileIndex = val === '' ? null : parseInt(val);
    renderComparisonTable();
}

// Renderiza tabela de comparação
function renderComparisonTable() {
    if (!showAverages && selectedFileIndex === null) {
        document.getElementById('averages').style.display = 'none';
        return;
    }

    document.getElementById('averages').style.display = 'block';

    const averages = {};
    allData.forEach(data => {
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

    const tableRows = Object.keys(averages).map(key => {
        const avg = (averages[key].sum / averages[key].count).toFixed(2);
        const fileValue = selectedFileIndex !== null ? 
            (allData[selectedFileIndex][0][key] !== undefined ? allData[selectedFileIndex][0][key].toFixed(2) : '-') : '-';
        return `<tr><td>${key}</td><td>${avg}</td><td>${fileValue}</td></tr>`;
    }).join('');

    document.getElementById('averages').innerHTML = `
        <table border="1" cellpadding="5" cellspacing="0">
            <thead>
                <tr>
                    <th>Variável</th>
                    <th>Média</th>
                    <th>Arquivo Selecionado</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}

// Funções de gráfico continuam como antes
function generateBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (window.barChartInstance) window.barChartInstance.destroy();

    const variableNames = Object.keys(allData[0][0]);
    const datasets = selectedVariables.map(variable => {
        const dataPoints = allData.map(data => {
            const values = data.map(item => item[variable]);
            return values.reduce((a,b)=>a+b,0)/values.length;
        });
        const color = getRandomColor();
        return {
            label: variable,
            data: dataPoints,
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1
        };
    });

    window.barChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: allData.map((_,i)=>`Arquivo ${i+1}`),
            datasets
        },
        options: {
            responsive: true,
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
            scales: { y: { beginAtZero: true } }
        }
    });
}

function generateRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    if (window.radarChartInstance) window.radarChartInstance.destroy();

    const variableNames = Object.keys(allData[0][0]);
    const datasets = selectedVariables.map(variable => {
        const dataPoints = allData.map(data => {
            const values = data.map(item => item[variable]);
            return values.reduce((a,b)=>a+b,0)/values.length;
        });
        const color = getRandomColor();
        return {
            label: variable,
            data: dataPoints,
            borderColor: color,
            backgroundColor: color + '33', // transparente
            pointBackgroundColor: color,
            fill: true
        };
    });

    window.radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: allData.map((_,i)=>`Arquivo ${i+1}`),
            datasets
        },
        options: {
            responsive: true,
            scales: {
                r: { angleLines: { display: false }, suggestedMin: 0, suggestedMax: 100 }
            },
            plugins: { legend: { position: 'top' } }
        }
    });
}

function getRandomColor() {
    return '#'+Math.floor(Math.random()*16777215).toString(16);
}
