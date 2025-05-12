// src/services/environmentService.js

/**
 * Verifica se o aplicativo está rodando no ambiente Electron
 * @returns {boolean} Verdadeiro se estiver no Electron, falso caso contrário
 */
export const isElectron = () => {
  // Verifica se temos acesso à API do Electron via preload
  return window && window.electronAPI !== undefined;
};

/**
 * Obtém informações sobre o ambiente de execução
 * @returns {Object} Objeto com propriedades do ambiente
 */
export const getEnvironmentInfo = () => {
  const isElectronEnv = isElectron();
  
  // Informações básicas do ambiente
  const info = {
    isElectron: isElectronEnv,
    inBrowser: !isElectronEnv,
    storageType: isElectronEnv ? 'file' : 'localStorage',
    platform: 'unknown'
  };
  
  // Tenta obter informações sobre a plataforma
  if (isElectronEnv) {
    // Em uma aplicação real, poderíamos expandir isso usando IPC
    // para obter informações do processo principal
    if (navigator && navigator.userAgent) {
      if (navigator.userAgent.includes('Windows')) {
        info.platform = 'windows';
      } else if (navigator.userAgent.includes('Mac')) {
        info.platform = 'macos';
      } else if (navigator.userAgent.includes('Linux')) {
        info.platform = 'linux';
      }
    }
  } else {
    info.platform = 'browser';
  }
  
  return info;
};

// Exporta outras funções relacionadas ao ambiente conforme necessário