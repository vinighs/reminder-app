// src/services/notificationService.js
import { isElectron } from './environmentService';

// Função para verificar se as notificações são suportadas
export const areNotificationsSupported = async () => {
  // No Electron, sempre assumimos que as notificações são suportadas
  if (isElectron()) {
    console.log('[Notification] Ambiente Electron detectado, assumindo suporte a notificações');
    return true;
  }
  
  // No navegador, verificamos a API Notification
  if ('Notification' in window) {
    console.log('[Notification] API de notificações encontrada no navegador');
    return true;
  }
  
  console.log('[Notification] Notificações não são suportadas neste ambiente');
  return false;
};

// Solicitar permissão para notificações
export const requestNotificationPermission = async () => {
  // No Electron, assumimos que temos permissão
  if (isElectron()) {
    console.log('[Notification] Ambiente Electron, permissão assumida');
    return true;
  }
  
  // No navegador, solicitamos permissão
  if ('Notification' in window) {
    try {
      console.log('[Notification] Verificando permissão atual:', Notification.permission);
      
      if (Notification.permission === 'granted') {
        return true;
      } else if (Notification.permission !== 'denied') {
        // Solicita permissão apenas se não estiver já negada
        console.log('[Notification] Solicitando permissão para notificações');
        const permission = await Notification.requestPermission();
        console.log('[Notification] Permissão recebida:', permission);
        return permission === 'granted';
      } else {
        console.log('[Notification] Permissão negada anteriormente');
        return false;
      }
    } catch (error) {
      console.error('[Notification] Erro ao solicitar permissão:', error);
      return false;
    }
  }
  
  return false;
};

// Função para enviar notificação
export const sendNotification = async (title, options = {}) => {
  console.log(`[Notification] Tentando enviar notificação: "${title}"`);
  
  try {
    // Verifica se notificações são suportadas
    const isSupported = await areNotificationsSupported();
    if (!isSupported) {
      console.warn('[Notification] Notificações não são suportadas');
      return false;
    }
    
    // Garantir que temos permissão
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('[Notification] Sem permissão para mostrar notificações');
      return false;
    }

    // Verifica por título válido
    if (!title || typeof title !== 'string') {
      console.error('[Notification] Título inválido para notificação');
      return false;
    }

    if (isElectron()) {
      // No Electron, usamos a API do IPC para pedir ao processo principal
      console.log('[Notification] Ambiente Electron, enviando notificação via IPC');
      
      // Verifica se a API do Electron está disponível
      if (!window.electronAPI || !window.electronAPI.showMainNotification) {
        console.error('[Notification] API do Electron não está disponível');
        return false;
      }
      
      try {
        // Preparar dados específicos para o Windows se necessário
        const notificationData = {
          title,
          body: options.body || '',
          id: options.id || Date.now().toString(),
          // No Windows, notificações precisam persistir para serem mais visíveis
          timeoutType: 'never', // Tenta fazer com que a notificação permaneça até ser clicada
          silent: false // Garante que o som seja reproduzido
        };
        
        // Formato de data legível para o log
        const now = new Date();
        console.log(`[Notification] Enviando notificação às ${now.toLocaleTimeString()}:`, notificationData);
        
        const result = await window.electronAPI.showMainNotification(notificationData);
        console.log('[Notification] Resultado da notificação Electron:', result);
        return result;
      } catch (error) {
        console.error('[Notification] Erro ao enviar notificação via Electron:', error);
        return false;
      }
    } else {
      // Em ambiente web, usamos a API de Notification do navegador
      console.log('[Notification] Ambiente web, mostrando notificação do navegador');
      try {
        const notification = new Notification(title, {
          body: options.body || '',
          icon: options.icon || '/icon.png',
          tag: options.id || Date.now().toString(),
          requireInteraction: true // Faz a notificação permanecer até o usuário interagir
        });

        // Manipular cliques na notificação
        notification.onclick = () => {
          console.log('[Notification] Notificação clicada');
          if (typeof options.onClick === 'function') {
            options.onClick();
          }
          window.focus();
          notification.close();
        };

        return true;
      } catch (error) {
        console.error('[Notification] Erro ao criar notificação do navegador:', error);
        return false;
      }
    }
  } catch (error) {
    console.error('[Notification] Erro ao enviar notificação:', error);
    return false;
  }
};

// Função específica para notificações de lembretes
export const sendReminderNotification = async (reminder) => {
  if (!reminder || !reminder.title) {
    console.error('[Notification] Tentativa de enviar notificação para lembrete inválido');
    return false;
  }

  console.log(`[Notification] Enviando notificação para lembrete: "${reminder.title}" (ID: ${reminder.id})`);
  
  const title = 'Lembrete';  // Título mais genérico para notificação do Windows
  const options = {
    body: reminder.title,    // O título do lembrete vai no corpo da notificação
    id: reminder.id,
    // Torna a notificação mais notável no Windows
    requireInteraction: true,
    onClick: () => {
      console.log('[Notification] Notificação de lembrete clicada:', reminder.id);
    }
  };

  return sendNotification(title, options);
};