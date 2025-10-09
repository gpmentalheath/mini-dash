// Manipulação de arquivos
class FileHandlers {
    static processFiles(files, callback) {
        allData = [];
        fileNames = [];
        selectedFileIndex = null;
        visibleRespondents = [];

        if (files.length === 0) {
            alert("Por favor, selecione pelo menos um arquivo JSON ou CSV.");
            return;
        }

        let processedCount = 0;

        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    let jsonData;
                    const fileName = files[i].name.toLowerCase();
                    
                    if (fileName.endsWith('.csv')) {
                        // Processar arquivo CSV
                        jsonData = FileHandlers.processCSVFile(e.target.result);
                    } else if (fileName.endsWith('.json')) {
                        // Processar arquivo JSON
                        jsonData = JSON.parse(e.target.result);
                    } else {
                        alert(`Formato não suportado: ${files[i].name}. Use JSON ou CSV.`);
                        return;
                    }
                    
                    if (!Utils.validateFileData(jsonData)) {
                        alert(`Arquivo ${files[i].name} não contém dados válidos ou falta a variável 'cogproc'.`);
                        return;
                    }
                    
                    allData.push(Array.isArray(jsonData) ? jsonData : [jsonData]);
                    const firstItem = Array.isArray(jsonData) ? jsonData[0] : jsonData;
                    
                    // Extrair nome do arquivo - priorizar user_email se disponível
                    let displayName = files[i].name.replace(/\.(json|csv)$/i, '');
                    if (firstItem.user_email) {
                        displayName = firstItem.user_email;
                    } else if (firstItem.name_if_id) {
                        displayName = firstItem.name_if_id;
                    }
                    
                    fileNames.push(displayName);
                    visibleRespondents.push(true);

                    processedCount++;
                    
                    if (processedCount === files.length) {
                        selectedVariables = [...CONFIG.autoSelectedVariables];
                        callback();
                    }
                } catch (error) {
                    console.error("Erro ao processar arquivo:", error);
                    alert("Erro ao processar arquivo " + files[i].name + ": " + error.message);
                }
            };
            reader.readAsText(files[i]);
        }
    }
    
    static processCSVFile(csvContent) {
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            throw new Error('Arquivo CSV vazio ou incompleto');
        }
        
        const headers = lines[0].split(',').map(header => header.trim());
        const jsonData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = FileHandlers.parseCSVLine(lines[i]);
            const row = {};
            
            headers.forEach((header, index) => {
                if (values[index] !== undefined) {
                    // Converter para número se possível
                    const numValue = parseFloat(values[index]);
                    row[header] = isNaN(numValue) ? values[index] : numValue;
                }
            });
            
            jsonData.push(row);
        }
        
        return jsonData;
    }
    
    static parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }
    
    static processBenchmarkFile(file, callback) {
        if (!file) return;

        // Mostrar loader
        const loader = document.getElementById('benchmark-loader');
        if (loader) loader.style.display = 'block';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const fileName = file.name.toLowerCase();
                let jsonData;
                
                if (fileName.endsWith('.csv')) {
                    // Processar benchmark CSV
                    jsonData = FileHandlers.processCSVFile(e.target.result);
                } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                    // Processar benchmark Excel (código existente)
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    jsonData = XLSX.utils.sheet_to_json(worksheet);
                } else {
                    alert('Formato de benchmark não suportado. Use CSV ou Excel.');
                    return;
                }
                
                if (jsonData.length > 0) {
                    benchmarkData = jsonData;
                    benchmarkRows = jsonData;
                    BenchmarkCalculator.calculateBenchmarkAverages();
                    BenchmarkCalculator.calculateBenchmarkRanks();
                    
                    // Mostrar a seção de benchmark
                    const benchmarkSection = document.getElementById('benchmark-section');
                    if (benchmarkSection) {
                        benchmarkSection.style.display = 'block';
                    }
                    
                    callback();
                }
            } catch (error) {
                console.error("Erro ao processar arquivo de benchmark:", error);
                alert("Erro ao processar arquivo de benchmark: " + error.message);
            } finally {
                // Esconder loader
                if (loader) loader.style.display = 'none';
            }
        };
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }
}