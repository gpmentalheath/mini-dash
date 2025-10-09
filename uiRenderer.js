// Renderização de elementos da UI
class UIRenderer {
    static renderCheckboxes() {
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


    static renderLearningTopics() {
        const section = document.getElementById('learning-topics-section');
        const content = document.getElementById('learning-topics-content');
        
        if (!section || !content) return;
        
        if (selectedFileIndex === null || !visibleRespondents[selectedFileIndex]) {
            section.style.display = 'none';
            return;
        }
        
        const selectedData = allData[selectedFileIndex][0];
        const selectedName = fileNames[selectedFileIndex];
        
        // Verificar se existem learning topics
        const learningTopics = selectedData.learning_topics;
        
        if (!learningTopics || learningTopics.trim() === '') {
            content.innerHTML = `
                <div class="info-box">
                    <strong>${selectedName}</strong> não possui tópicos de aprendizado definidos.
                </div>
            `;
            section.style.display = 'block';
            return;
        }
        
        // Processar os learning topics
        const topicsArray = UIRenderer.parseLearningTopics(learningTopics);
        
        let topicsHTML = `
            <div class="learning-topics-header">
                <h4>Tópicos de Aprendizado - ${selectedName}</h4>
                <p class="topics-count">${topicsArray.length} tópico(s) encontrado(s)</p>
            </div>
            <div class="topics-container">
        `;
        
        topicsArray.forEach((topic, index) => {
            topicsHTML += `
                <div class="topic-item">
                    <div class="topic-number">${index + 1}</div>
                    <div class="topic-content">${topic.trim()}</div>
                </div>
            `;
        });
        
        topicsHTML += `</div>`;
        
        content.innerHTML = topicsHTML;
        section.style.display = 'block';
    }
    
    static parseLearningTopics(learningTopics) {
        if (!learningTopics) return [];
        
        // Separar por | e filtrar itens vazios
        return learningTopics.split('|')
            .map(topic => topic.trim())
            .filter(topic => topic !== '');
    }
    
    static renderRespondentCheckboxes() {
        if (allData.length === 0) return;
        
        const container = document.getElementById('respondent-checkboxes');
        container.innerHTML = fileNames.map((name, index) => `
            <label class="checkbox-label">
                <input type="checkbox" value="${index}" ${visibleRespondents[index] ? 'checked' : ''} onchange="toggleRespondent(${index})">
                ${name}
            </label>
        `).join('');
    }
    
    static renderFileSelector() {
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
    
    static renderComparisonTable() {
        const averagesContainer = document.getElementById('averages');
        averagesContainer.style.display = 'block';

        if (allData.length === 0) {
            averagesContainer.innerHTML = '<p>Nenhum dado disponível.</p>';
            return;
        }

        const averages = DataCalculator.getVariableAverages();
        const selectedFileName = selectedFileIndex !== null ? fileNames[selectedFileIndex] : '-';

        // Filtrar variáveis que têm média diferente de 0
        const filteredVariables = Object.keys(averages).filter(key => {
            const avg = averages[key].sum / averages[key].count;
            return avg !== 0 && !isNaN(avg);
        });

        // Ordenar as variáveis por nome para melhor organização
        filteredVariables.sort();

        const tableRows = filteredVariables.map(key => {
            const avg = (averages[key].sum / averages[key].count).toFixed(2);
            let fileValue = '-';
            let cellClass = '';
            
            if (selectedFileIndex !== null) {
                const selectedData = allData[selectedFileIndex][0];
                if (selectedData[key] !== undefined) {
                    fileValue = selectedData[key].toFixed(2);
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

        // Adicionar contador de variáveis filtradas
        const totalVariables = Object.keys(averages).length;
        const filteredCount = filteredVariables.length;
        const hiddenCount = totalVariables - filteredCount;

        const summaryText = hiddenCount > 0 
            ? ` (${filteredCount} de ${totalVariables} variáveis - ${hiddenCount} ocultas por terem média 0)`
            : ` (${totalVariables} variáveis)`;

        averagesContainer.innerHTML = `
            <h3>Métricas${selectedFileIndex !== null ? ' - ' + selectedFileName : ''}${summaryText}</h3>
            <table>
                <thead>
                    <tr>
                        <th>Variável</th>
                        <th>Média do Grupo</th>
                        <th>${selectedFileIndex !== null ? selectedFileName : 'Arquivo Selecionado'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
            ${hiddenCount > 0 ? `
                <div class="info-box" style="margin-top: 10px; font-size: 12px;">
                    <strong>Nota:</strong> ${hiddenCount} variáveis com média 0 foram ocultadas para melhor visualização.
                </div>
            ` : ''}
        `;
    }
    
    static renderBenchmarkComparison() {
        const container = document.getElementById('benchmark-results');
        if (!container) return;
        
        if (!benchmarkData || allData.length === 0) {
            container.innerHTML = '<p>Nenhum dado disponível para comparação.</p>';
            return;
        }
        
        const groupAverages = DataCalculator.calculateGroupAverages();
        
        let tableHTML = `
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
        
        selectedVariables.forEach(variable => {
            if (benchmarkAverages[variable] !== undefined && groupAverages[variable] !== undefined) {
                const groupAvg = groupAverages[variable];
                const benchAvg = benchmarkAverages[variable];
                const difference = groupAvg - benchAvg;
                const rank = BenchmarkCalculator.getRankForVariable(variable, groupAvg);
                
                let diffClass = difference > 0 ? 'above-average' : difference < 0 ? 'below-average' : '';
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
    
    static renderBenchmarkRowSelector() {
        const benchmarkSection = document.getElementById('benchmark-section');
        if (!benchmarkSection) return;
        
        // Preencher o seletor de respondentes
        const respondentSelector = document.getElementById('respondentSelector');
        if (respondentSelector) {
            let options = '<option value="">Selecione um respondente</option>';
            fileNames.forEach((name, index) => {
                if (visibleRespondents[index]) {
                    options += `<option value="${index}">${name}</option>`;
                }
            });
            respondentSelector.innerHTML = options;
        }
        
        // Preencher o seletor de benchmark
        const benchmarkSelector = document.getElementById('benchmarkSelector');
        if (benchmarkSelector) {
            let options = '<option value="">Selecione benchmark</option>';
            options += '<option value="average">Média do Benchmark</option>';
            
            benchmarkRows.forEach((row, index) => {
                const identifier = row.Name || row.codigo_pesquisa || row.externalId || `Linha ${index + 1}`;
                options += `<option value="${index}">${identifier}</option>`;
            });
            
            benchmarkSelector.innerHTML = options;
        }
    }
    
    static renderOneToOneComparison(respondentIndex, benchmarkIndex) {
        const container = document.getElementById('comparison-details');
        if (!container) return;
        
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
                
                let diffClass = difference > 0 ? 'above-average' : difference < 0 ? 'below-average' : '';
                let variationClass = variation > 10 ? 'above-average' : variation < -10 ? 'below-average' : '';
                
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
    // ... outros métodos permanecem iguais ...
}