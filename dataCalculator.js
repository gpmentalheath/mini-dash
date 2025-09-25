// Cálculos de dados gerais
class DataCalculator {
    static calculateGroupAverages() {
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
        
        const result = {};
        Object.keys(averages).forEach(key => {
            result[key] = averages[key].sum / averages[key].count;
        });
        
        return result;
    }
    
    static getVariableAverages() {
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
        
        return averages;
    }
    
    static getVisibleData() {
        return allData.filter((_, index) => visibleRespondents[index]);
    }
    
    static getVisibleFileNames() {
        return fileNames.filter((_, index) => visibleRespondents[index]);
    }
}