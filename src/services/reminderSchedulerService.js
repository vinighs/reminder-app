// src/services/reminderSchedulerService.js
import { sendReminderNotification } from './notificationService';

class ReminderScheduler {
  constructor() {
    this.scheduledReminders = new Map(); // Armazena os IDs dos timeouts por ID do lembrete
    this.checkInterval = 30000; // 30 segundos de intervalo para verificação
    this.checkTimer = null;
    this.DEBUG = true; // Ativar logs detalhados
  }

  // Agenda um único lembrete
  scheduleReminder(reminder) {
    if (!reminder || !reminder.id || reminder.completed) {
      if (this.DEBUG) console.log('[ReminderScheduler] Ignorando lembrete inválido ou já concluído');
      return;
    }

    // Primeiro cancele qualquer agendamento existente para este lembrete
    this.cancelSchedule(reminder.id);

    const now = Date.now();
    
    // Se não houver data, não podemos agendar
    if (!reminder.date) {
      if (this.DEBUG) console.log(`[ReminderScheduler] Lembrete sem data, não agendado: ${reminder.title}`);
      return;
    }

    const reminderTime = new Date(reminder.date).getTime();
    
    // Apenas agende se a data estiver no futuro
    if (reminderTime <= now) {
      if (this.DEBUG) {
        console.log(`[ReminderScheduler] Lembrete no passado, não agendado: ${reminder.title}`);
        console.log(`  - Data do lembrete: ${new Date(reminderTime).toLocaleString()}`);
        console.log(`  - Agora: ${new Date(now).toLocaleString()}`);
      }
      return;
    }

    // Calcula o tempo até o lembrete em milissegundos
    const timeToReminder = reminderTime - now;
    
    // Registra uma mensagem com informações sobre o agendamento
    console.log(`[ReminderScheduler] Agendando lembrete: "${reminder.title}"`);
    console.log(`  - ID: ${reminder.id}`);
    console.log(`  - Data/hora: ${new Date(reminderTime).toLocaleString()}`);
    console.log(`  - Tempo restante: ${Math.round(timeToReminder / 60000)} minutos`);

    // Para tempos muito longos, usamos uma abordagem diferente
    if (timeToReminder > 2147483647) {
      // setTimeout tem um limite de cerca de 24.8 dias (2^31-1 ms)
      if (this.DEBUG) console.log(`[ReminderScheduler] Tempo muito longo, agendando verificação periódica`);
      this.ensureCheckTimerRunning();
    } else {
      // Cria um temporizador para a notificação
      const timerId = setTimeout(async () => {
        this.scheduledReminders.delete(reminder.id);
        if (this.DEBUG) console.log(`[ReminderScheduler] DISPARANDO lembrete: "${reminder.title}"`);
        
        try {
          // Envia a notificação quando o temporizador disparar
          const result = await sendReminderNotification(reminder);
          console.log(`[ReminderScheduler] Resultado da notificação: ${result ? 'sucesso' : 'falha'}`);
        } catch (error) {
          console.error('[ReminderScheduler] Erro ao enviar notificação:', error);
        }
      }, timeToReminder);
      
      // Armazena o ID do temporizador para poder cancelar se necessário
      this.scheduledReminders.set(reminder.id, timerId);
    }
  }

  // Cancela um agendamento de lembrete
  cancelSchedule(reminderId) {
    if (this.scheduledReminders.has(reminderId)) {
      if (this.DEBUG) console.log(`[ReminderScheduler] Cancelando agendamento de lembrete ID: ${reminderId}`);
      clearTimeout(this.scheduledReminders.get(reminderId));
      this.scheduledReminders.delete(reminderId);
      return true;
    }
    return false;
  }

  // Limpa todos os agendamentos
  clearAllSchedules() {
    if (this.DEBUG) console.log(`[ReminderScheduler] Limpando todos os ${this.scheduledReminders.size} agendamentos`);
    
    // Cancela cada timeout individualmente
    for (const timerId of this.scheduledReminders.values()) {
      clearTimeout(timerId);
    }
    
    // Limpa o mapa
    this.scheduledReminders.clear();
    
    // Para o timer de verificação se estiver rodando
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  // Agenda todos os lembretes
  scheduleAllReminders(reminders) {
    if (!reminders || !Array.isArray(reminders)) {
      console.warn('[ReminderScheduler] Lista de lembretes inválida');
      return;
    }

    // Primeiro limpa todos os agendamentos existentes
    this.clearAllSchedules();
    
    if (this.DEBUG) console.log(`[ReminderScheduler] Agendando ${reminders.length} lembretes`);
    
    // Agenda cada lembrete que não esteja concluído e tenha uma data
    let agendados = 0;
    for (const reminder of reminders) {
      if (!reminder.completed && reminder.date) {
        this.scheduleReminder(reminder);
        agendados++;
      }
    }
    
    console.log(`[ReminderScheduler] Total de ${agendados} lembretes agendados`);
    
    // Se houver lembretes com datas muito distantes, inicia o timer de verificação
    if (this.scheduledReminders.size < reminders.filter(r => !r.completed && r.date).length) {
      this.ensureCheckTimerRunning();
    }
  }

  // Lida com atualização de um lembrete (reagenda ou cancela)
  handleReminderUpdated(reminder) {
    if (!reminder) return;
    
    // Cancela o agendamento atual
    this.cancelSchedule(reminder.id);
    
    // Reagenda se não estiver concluído e tiver uma data
    if (!reminder.completed && reminder.date) {
      this.scheduleReminder(reminder);
    }
  }

  // Inicia um timer que verifica periodicamente lembretes que estão muito no futuro
  ensureCheckTimerRunning() {
    if (this.checkTimer) return; // Já está rodando
    
    if (this.DEBUG) console.log('[ReminderScheduler] Iniciando verificação periódica de lembretes');
    
    this.checkTimer = setInterval(() => {
      if (this.DEBUG) console.log('[ReminderScheduler] Executando verificação periódica de lembretes');
      // Implementação futura para verificar lembretes muito distantes
    }, this.checkInterval);
  }
}

// Exporta uma única instância do serviço
export const reminderScheduler = new ReminderScheduler();