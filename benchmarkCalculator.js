// Cálculos relacionados ao benchmark
class BenchmarkCalculator {
    static calculateBenchmarkAverages() {
        if (!benchmarkData || benchmarkData.length === 0) return;
        
        benchmarkAverages = {};
        
        Object.keys(benchmarkData[0]).forEach(key => {
            if (key === 'codigo_pesquisa' || key === 'externalId' || key === 'code') return;
            
            const values = benchmarkData.map(row => parseFloat(row[key])).filter(val => !isNaN(val));
            if (values.length > 0) {
                benchmarkAverages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
            }
        });
    }
    
    static calculateBenchmarkRanks() {
        if (!benchmarkData || benchmarkData.length === 0) return;
        
        benchmarkRanks = {};
        
        Object.keys(benchmarkData[0]).forEach(key => {
            if (key === 'codigo_pesquisa' || key === 'externalId' || key === 'code') return;
            
            const values = benchmarkData.map(row => parseFloat(row[key])).filter(val => !isNaN(val));
            if (values.length > 0) {
                values.sort((a, b) => a - b);
                benchmarkRanks[key] = values;
            }
        });
    }
    
    static getRankForVariable(variable, value) {
        if (!benchmarkRanks[variable] || benchmarkRanks[variable].length === 0) return 0;
        return Utils.calculateRank(benchmarkRanks[variable], value);
    }
}