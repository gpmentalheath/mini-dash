// Registro e gerenciamento de instâncias de gráficos
class ChartRegistry {
    constructor() {
        this.instances = {};
    }
    
    register(chartName, instance) {
        this.instances[chartName] = instance;
    }
    
    get(chartName) {
        return this.instances[chartName];
    }
    
    destroy(chartName) {
        if (this.instances[chartName]) {
            this.instances[chartName].destroy();
            delete this.instances[chartName];
        }
    }
    
    destroyAll() {
        Object.keys(this.instances).forEach(chartName => {
            this.destroy(chartName);
        });
    }
}

// Instância global do registry
const chartRegistry = new ChartRegistry();

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