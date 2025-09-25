// Funções utilitárias
class Utils {
    static getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
    
    static getColorForMetric(metric) {
        if (!window.metricColors) window.metricColors = {};
        if (!window.metricColors[metric]) {
            window.metricColors[metric] = Utils.getRandomColor();
        }
        return window.metricColors[metric];
    }
    
    // Função para mapear cogproc para valores de i
    static mapCogProcToI(cogproc) {
        if (cogproc >= 0 && cogproc < 9) {
            return -5 + (cogproc / 9) * 3.5;
        } else if (cogproc >= 9 && cogproc < 10.5) {
            return -1.5 + ((cogproc - 9) / 1.5) * 1.5;
        } else if (cogproc >= 10.5 && cogproc < 12.5) {
            return 0 + ((cogproc - 10.5) / 2) * 1.5;
        } else if (cogproc >= 12.5 && cogproc <= 15) {
            return 1.5 + ((cogproc - 12.5) / 2.5) * 3.5;
        }
        return 0;
    }
    
    // Calcular rank de um valor específico
    static calculateRank(values, value) {
        if (!values || values.length === 0) return 0;
        
        const countBelow = values.filter(v => v < value).length;
        return (countBelow / values.length) * 100;
    }
    
    // Validar dados do arquivo
    static validateFileData(jsonData) {
        const firstItem = Array.isArray(jsonData) ? jsonData[0] : jsonData;
        return firstItem && ('cogproc' in firstItem);
    }
}