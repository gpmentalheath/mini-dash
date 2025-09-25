// Configurações e constantes globais
const CONFIG = {
    // Variáveis que devem ser selecionadas automaticamente
    autoSelectedVariables: [
        'Authentic', 'sociable', 'openness', 'organized', 
        'cautious', 'humble', 'assertive', 'adventurous'
    ],
    
    // Dados de importância das variáveis
    importanceWeights: {
        'intellectual': 80,
        'imaginative': 75,
        'sociable': 70,
        'Reatividade': 85,
        'self_conscious': 78,
        'agreeableness': 72,
        'openness': 73,
        'organized': 68,
        'cautious': 35,
        'artistic': 30,
        'humble': 20,
        'assertive': 90,
        'adventurous': 80
    },
    
    // Configurações do gráfico FFT
    fft: {
        X_MIN: -5,
        X_MAX: 5,
        N: 200,
        sigma: 1.4
    },
    
    // Regiões do gráfico FFT
    fftRegions: [
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
    ]
};

// Variáveis globais
let allData = [];
let fileNames = [];
let selectedVariables = [...CONFIG.autoSelectedVariables];
let selectedFileIndex = null;
let visibleRespondents = [];
let benchmarkData = null;
let benchmarkAverages = {};
let benchmarkRanks = {};
let selectedBenchmarkRow = null;
let benchmarkRows = [];