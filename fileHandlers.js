// Manipulação de arquivos
class FileHandlers {
    static processFiles(files, callback) {
        allData = [];
        fileNames = [];
        selectedFileIndex = null;
        visibleRespondents = [];

        if (files.length === 0) {
            alert("Por favor, selecione pelo menos um arquivo JSON.");
            return;
        }

        let processedCount = 0;

        for (let i = 0; i < files.length; i++) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    
                    if (!Utils.validateFileData(jsonData)) {
                        alert(`Arquivo ${files[i].name} não contém a variável 'cogproc'.`);
                        return;
                    }
                    
                    allData.push(Array.isArray(jsonData) ? jsonData : [jsonData]);
                    const firstItem = Array.isArray(jsonData) ? jsonData[0] : jsonData;
                    fileNames.push(firstItem?.name_if_id || files[i].name.replace('.json', ''));
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
    
    static processBenchmarkFile(file, callback) {
        if (!file) return;

        // Mostrar loader
        const loader = document.getElementById('benchmark-loader');
        if (loader) loader.style.display = 'block';
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length > 0) {
                    benchmarkData = jsonData;
                    benchmarkRows = jsonData;
                    BenchmarkCalculator.calculateBenchmarkAverages();
                    BenchmarkCalculator.calculateBenchmarkRanks();
                    
                    // Mostrar a seção de benchmark - CORREÇÃO AQUI
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
        reader.readAsArrayBuffer(file);
    }
}