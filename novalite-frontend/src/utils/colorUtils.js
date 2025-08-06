// Em: src/utils/colorUtils.js (Versão Padronizada)

// 1. DEFINIMOS UM ÚNICO LUGAR COM TODAS AS INFORMAÇÕES DE STATUS
export const STATUS_CONFIG = {
    PLANEJAMENTO: { 
        label: 'Em Planejamento', 
        chipColor: 'secondary', 
        calendarColor: '#9c27b0' // Roxo
    },
    AGUARDANDO_CONFERENCIA: { 
        label: 'Aguardando Conferência', 
        chipColor: 'info', 
        calendarColor: '#f2fa02' // Amarelo 
    },
    AGUARDANDO_SAIDA: { 
        label: 'Aguardando Saída', 
        chipColor: 'warning', 
        calendarColor: '#ed6c02' // Laranja
    },
    EM_ANDAMENTO: { 
        label: 'Em Andamento', 
        chipColor: 'primary', 
        calendarColor: '#1976d2' // Azul
    },
    FINALIZADO: { 
        label: 'Finalizado', 
        chipColor: 'success', 
        calendarColor: '#2e7d32' // Verde
    },
    CANCELADO: { 
        label: 'Cancelado', 
        chipColor: 'error', 
        calendarColor: '#fa0202' // Vermelho
    },
    DEFAULT: {
        label: 'Desconhecido',
        chipColor: 'default',
        calendarColor: '#bdbdbd' // Cinza
    }
};

// 2. AS FUNÇÕES AGORA LEEM DO OBJETO CENTRAL
export const getStatusChipColor = (status) => {
    return STATUS_CONFIG[status]?.chipColor || STATUS_CONFIG.DEFAULT.chipColor;
};

export const getStatusCalendarColor = (status) => {
    return STATUS_CONFIG[status]?.calendarColor || STATUS_CONFIG.DEFAULT.calendarColor;
};

// Mapeia os status de MANUTENÇÃO para as cores do tema do Material-UI
export const getMaintenanceStatusChipColor = (status) => {
    const colors = {
        AGUARDANDO_AVALIACAO: "warning",
        EM_REPARO: "info",
        AGUARDANDO_PECAS: "secondary",
        REPARADO: "success",
    };
    return colors[status] || "default";
};