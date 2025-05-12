// src/components/notification/NotificationScheduler.jsx
import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { reminderScheduler } from '../../services/reminderSchedulerService';
import { areNotificationsSupported, requestNotificationPermission } from '../../services/notificationService';

/**
 * Componente responsável por gerenciar o agendamento de notificações
 * Este componente não renderiza nada visualmente, mas manipula
 * efeitos colaterais relacionados às notificações
 */
const NotificationScheduler = () => {
  const { reminders, notificationsEnabled, setNotificationsEnabled } = useAppContext();
  
  // Verifica suporte a notificações e solicita permissão ao montar o componente
  useEffect(() => {
    const checkNotificationsSupport = async () => {
      const isSupported = await areNotificationsSupported();
      console.log(`[NotificationScheduler] Notifications supported: ${isSupported}`);
      
      if (isSupported && notificationsEnabled) {
        const permission = await requestNotificationPermission();
        console.log(`[NotificationScheduler] Notification permission: ${permission}`);
        
        // Atualiza o estado se a permissão foi negada
        if (!permission && notificationsEnabled) {
          setNotificationsEnabled(false);
        }
      }
    };
    
    checkNotificationsSupport();
  }, []);
  
  // Reagenda todas as notificações quando os lembretes mudam ou quando
  // o estado de notificações é alterado
  useEffect(() => {
    console.log(`[NotificationScheduler] Notification state changed: ${notificationsEnabled}`);
    
    if (notificationsEnabled) {
      console.log(`[NotificationScheduler] Scheduling ${reminders.length} reminders`);
      reminderScheduler.scheduleAllReminders(reminders);
    } else {
      console.log(`[NotificationScheduler] Notifications disabled, clearing all schedules`);
      reminderScheduler.clearAllSchedules();
    }
    
    // Limpa os agendamentos quando o componente é desmontado
    return () => {
      reminderScheduler.clearAllSchedules();
    };
  }, [reminders, notificationsEnabled]);
  
  // Este componente não renderiza nada visualmente
  return null;
};

export default NotificationScheduler;