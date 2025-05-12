import { v4 as uuidv4 } from 'uuid';

export const generateNextRecurringReminder = (reminder, referenceDate = new Date()) => {
  if (!reminder || typeof reminder !== 'object' || !reminder.recurrence || isNaN(new Date(reminder.date).getTime())) {
    throw new Error('Invalid reminder object');
  }
  if (!reminder.completed) return null;

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  let nextDate = new Date(reminder.date);
  const originalHour = nextDate.getHours();
  const originalMinute = nextDate.getMinutes();

  const advanceDate = (date) => {
    const newDate = new Date(date);
    switch (reminder.recurrence) {
      case 'daily':
        return new Date(newDate.setDate(newDate.getDate() + 1));
      case 'weekdays': {
        do {
          newDate.setDate(newDate.getDate() + 1);
        } while ([0, 6].includes(newDate.getDay())); // 0 = domingo, 6 = sábado
        return newDate;
      }
      case 'weekly':
        return new Date(newDate.setDate(newDate.getDate() + 7));
      case 'monthly': {
        const currentDay = newDate.getDate();
        const currentMonth = newDate.getMonth();
        const currentYear = newDate.getFullYear();
        
        // Avançar para o próximo mês
        newDate.setMonth(currentMonth + 1);
        
        // Verificar se o dia existe no próximo mês
        const daysInNextMonth = new Date(currentYear, currentMonth + 1 + 1, 0).getDate();
        if (currentDay > daysInNextMonth) {
          // Se o dia não existir no próximo mês, usar o último dia do próximo mês
          newDate.setDate(daysInNextMonth);
        } else {
          // Garantir que estamos no mesmo dia do mês
          newDate.setDate(currentDay);
        }
        
        return newDate;
      }
      case 'yearly':
        return new Date(newDate.setFullYear(newDate.getFullYear() + 1));
      default:
        return null;
    }
  };

  // Modificação: Sempre avançar pelo menos uma vez, independentemente da data atual
  let nextDateNoTime = advanceDate(nextDate);
  nextDateNoTime.setHours(0, 0, 0, 0);

  // Continuar avançando se a data ainda for anterior ou igual a hoje
  while (nextDateNoTime <= today) {
    nextDateNoTime = advanceDate(nextDateNoTime);
  }

  const finalDate = new Date(nextDateNoTime);
  // Usar setHours para preservar a hora local original
  finalDate.setHours(originalHour, originalMinute, 0, 0);

  const uniqueId = uuidv4(); // Gera um novo ID único

  return {
    ...reminder,
    id: uniqueId, // Usa o ID gerado
    date: finalDate.getTime(), // Armazena o timestamp UTC
    completed: false,
    previousInstanceId: reminder.id, // Adiciona o ID da instância que gerou este lembrete
  };
};