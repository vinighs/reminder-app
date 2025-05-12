import React, { createContext, useContext, useState, useEffect } from 'react';
import { useIpcData } from '../hooks/useIpcData';
import { generateNextRecurringReminder } from '../utils/recurringUtils';
import { requestNotificationPermission } from '../services/notificationService';
import { reminderScheduler } from '../services/reminderSchedulerService';

const AppContext = createContext();

// Dados iniciais (mantidos como estavam)
const initialLists = [
  { id: 'family', name: 'Family', icon: '📋', color: 'blue' },
  { id: 'work', name: 'Work tasks', icon: '📋', color: 'red' },
  { id: 'shopping', name: 'Shopping list', icon: '📋', color: 'green' },
];

const initialReminders = [
  {
    id: '1',
    title: 'Take out the trash',
    completed: false,
    date: new Date().setHours(18, 0, 0, 0), // Mantém, pois setHours retorna timestamp
    listId: 'family',
    flagged: false,
    recurrence: null, // Exemplo: 'daily', 'weekly', null
    // location: null,
  },
  {
    id: '2',
    title: 'Clean kitchen',
    completed: false,
    // Usando getTime() para consistência
    date: new Date(2026, 4, 10, 10, 0).getTime(), // Exemplo: 10 de Maio de 2024, 10:00
    listId: 'family',
    flagged: false,
    recurrence: null,
    // location: null,
  },
  {
    id: '3',
    title: "Movie night with friends",
    completed: false,
    // Usando getTime() para consistência
    date: new Date(2024, 4, 15, 20, 0).getTime(), // Exemplo: 15 de Maio de 2024, 20:00
    listId: 'family',
    flagged: true, // Exemplo: Marcado
    recurrence: 'weekly', // Exemplo: Recorrente semanalmente
    // location: 'Cinema X', // Exemplo: Localização
  },
];

export const AppProvider = ({ children }) => {
  const [lists, setLists] = useState(initialLists);
  const [reminders, setReminders] = useState(initialReminders);
  const [activeListId, setActiveListId] = useState('today'); // 'today', 'scheduled', 'all', 'flagged', ou um ID de lista
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Hook para carregar/salvar dados (Electron ou localStorage)
  useIpcData(lists, setLists, reminders, setReminders);

  // Efeito para solicitar permissão de notificação e configurar notificações
  useEffect(() => {
    const setupNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      setNotificationsEnabled(hasPermission);
      
      if (hasPermission) {
        // Agenda todos os lembretes existentes
        reminderScheduler.scheduleAllReminders(reminders);
      }
    };
    
    setupNotifications();
    
    // Limpeza ao desmontar o componente
    return () => {
      reminderScheduler.clearAllSchedules();
    };
  }, []);
  
  // Efeito para reagendar lembretes sempre que a lista de lembretes mudar
  useEffect(() => {
    if (notificationsEnabled) {
      reminderScheduler.scheduleAllReminders(reminders);
    }
  }, [reminders, notificationsEnabled]);

  const addList = (newList) => {
    setLists([...lists, { ...newList, id: Date.now().toString() }]); // Adiciona ID único
  };

  const addReminder = (newReminder) => {
    // Garante que o lembrete tenha um ID único se não tiver
    const reminderWithId = { ...newReminder, id: newReminder.id || Date.now().toString() };
    setReminders(prevReminders => [...prevReminders, reminderWithId]);
    
    // Se o lembrete tiver uma data e estiver no futuro, agenda uma notificação
    if (notificationsEnabled && reminderWithId.date && !reminderWithId.completed) {
      reminderScheduler.scheduleReminder(reminderWithId);
    }
  };

  const toggleReminderCompleted = (id) => {
  setReminders(prevReminders => {
    const reminderBeingToggled = prevReminders.find(rem => rem.id === id);

    if (!reminderBeingToggled) {
      console.warn(`[AppContext] Tentativa de alternar lembrete inexistente: ${id}`);
      return prevReminders; // Retorna o estado anterior se o lembrete não for encontrado
    }

    // Determina se o lembrete está sendo marcado como concluído (antes era !completed)
    const isBeingMarkedAsCompleted = !reminderBeingToggled.completed;
    let newNextRecurringInstance = null; // Para armazenar o lembrete recorrente gerado, se houver

    // 1. Mapeia os lembretes para atualizar o estado 'completed' do lembrete alvo
    const updatedRemindersList = prevReminders.map(currentReminder => {
      if (currentReminder.id === id) {
        // Cria a versão atualizada do lembrete com o status 'completed' invertido
        const updatedToggledReminder = { ...currentReminder, completed: !currentReminder.completed };

        // Atualiza o agendamento de notificações para este lembrete
        if (notificationsEnabled) {
          reminderScheduler.handleReminderUpdated(updatedToggledReminder);
        }

        // 2. Se o lembrete está sendo MARCADO COMO CONCLUÍDO e possui configuração de recorrência
        if (isBeingMarkedAsCompleted && currentReminder.recurrence) {
          // Obter a data do lembrete atual
          const currentReminderDate = new Date(currentReminder.date);
          
          // 3. Verifica se uma próxima instância (não concluída) já existe para este lembrete
          // Melhorada para verificar TODAS as instâncias futuras derivadas deste lembrete
          // E não apenas olhando para o previousInstanceId direto
          const existingFutureInstance = prevReminders.find(r => {
            // Verificação 1: Verificamos se não está concluído
            const isNotCompleted = !r.completed;
            
            // Verificação 2: É derivado diretamente deste lembrete OU de alguma cadeia que leva a este lembrete
            let isPartOfChain = false;
            // Verificamos se este lembrete é derivado do lembrete atual (diretamente ou indiretamente)
            let checkReminder = r;
            const checkedIds = new Set(); // Para evitar loops infinitos
            
            // Subimos a cadeia de lembretes até encontrar o lembrete atual ou até que não possamos mais subir
            while (checkReminder && checkReminder.previousInstanceId && !checkedIds.has(checkReminder.id)) {
              checkedIds.add(checkReminder.id);
              
              // Se esta instância é derivada do lembrete atual
              if (checkReminder.previousInstanceId === currentReminder.id) {
                isPartOfChain = true;
                break;
              }
              
              // Continue subindo na cadeia
              checkReminder = prevReminders.find(pr => pr.id === checkReminder.previousInstanceId);
            }
            
            // Verificação 3: A data é futura em relação ao lembrete atual
            const reminderDate = r.date ? new Date(r.date) : null;
            const isFutureDate = reminderDate && currentReminderDate && 
                                 reminderDate.getTime() > currentReminderDate.getTime();
                                 
            // Todos os critérios devem ser satisfeitos
            return isNotCompleted && isPartOfChain && isFutureDate;
          });

          if (!existingFutureInstance) {
            // 4. Se não houver próxima instância existente que se encaixe nos critérios, gere uma nova.
            try {
              // Passamos o lembrete que acabou de ser marcado como concluído (`updatedToggledReminder`)
              // para que `generateNextRecurringReminder` possa usar seu ID como `previousInstanceId`.
              newNextRecurringInstance = generateNextRecurringReminder(
                updatedToggledReminder,
                new Date() // Data de referência para gerar o próximo (hoje)
              );

              if (notificationsEnabled && newNextRecurringInstance) {
                reminderScheduler.scheduleReminder(newNextRecurringInstance);
              }
              console.log('[AppContext] Novo lembrete recorrente gerado:', newNextRecurringInstance);
            } catch (error) {
              console.error("[AppContext] Erro ao gerar próximo lembrete recorrente:", error, currentReminder);
            }
          } else {
            console.log(`[AppContext] Próxima instância para ${currentReminder.id} (${currentReminder.title}) já existe (${existingFutureInstance.id}). Não gerando duplicata.`);
          }
        }
        return updatedToggledReminder; // Retorna o lembrete com o 'completed' atualizado
      }
      return currentReminder; // Retorna outros lembretes sem modificação
    });

    // 5. Adiciona o novo lembrete recorrente gerado (se houver) à lista de lembretes
    if (newNextRecurringInstance) {
      // Verificação defensiva para não adicionar se um lembrete com o mesmo ID já existir
      if (!updatedRemindersList.some(r => r.id === newNextRecurringInstance.id)) {
        return [...updatedRemindersList, newNextRecurringInstance];
      }
      console.warn(`[AppContext] ID duplicado (${newNextRecurringInstance.id}) ao tentar adicionar novo lembrete recorrente. Pulando adição.`);
      return updatedRemindersList; // Retorna a lista sem a nova instância duplicada
    } else {
      return updatedRemindersList; // Retorna a lista atualizada sem nova instância recorrente
    }
  });
};

  const toggleReminderFlagged = (id) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, flagged: !r.flagged } : r));
  };

  const deleteReminder = (id) => {
    // Cancela qualquer notificação agendada antes de remover o lembrete
    if (notificationsEnabled) {
      reminderScheduler.cancelSchedule(id);
    }
    
    setReminders(reminders.filter(r => r.id !== id));
  };

  const updateReminder = (updatedReminder) => {
    setReminders(prevReminders => 
      prevReminders.map(r => {
        if (r.id === updatedReminder.id) {
          // Se as notificações estiverem habilitadas, atualiza o agendamento
          if (notificationsEnabled) {
            reminderScheduler.handleReminderUpdated(updatedReminder);
          }
          return updatedReminder;
        }
        return r;
      })
    );
  };

  const reorderReminders = (reorderedReminders) => {
    setReminders(currentReminders => {
      const reorderedIds = new Set(reorderedReminders.map(r => r.id));
      const result = [];
      
      // Manter a ordem original dos lembretes não reordenados
      currentReminders.forEach(reminder => {
        if (!reorderedIds.has(reminder.id)) {
          result.push(reminder);
        }
      });
      
      // Adicionar os lembretes reordenados
      reorderedReminders.forEach(reminder => {
        result.push(reminder);
      });
      
      return result;
    });
  };

  // Filtragem de lembretes (mantida como estava)
  const filteredReminders = reminders.filter((reminder) => {
    const matchesSearch = !searchTerm || reminder.title.toLowerCase().includes(searchTerm.toLowerCase());
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Início do dia atual

    const reminderDate = reminder.date ? new Date(reminder.date) : null;
    if (reminderDate) {
      reminderDate.setHours(0, 0, 0, 0); // Normaliza a data do lembrete para comparar apenas o dia
    }

    if (activeListId === 'today') {
      // Inclui apenas lembretes COM data E que a data seja hoje
      return (reminderDate && reminderDate.getTime() === today.getTime()) && matchesSearch;
    }
    if (activeListId === 'scheduled') {
      // Inclui apenas lembretes com data definida
      return !!reminderDate && matchesSearch;
    }
    if (activeListId === 'all') return matchesSearch;
    if (activeListId === 'flagged') return reminder.flagged && matchesSearch;

    // Filtra pela lista específica selecionada
    return reminder.listId === activeListId && matchesSearch;
  });

  const completedReminders = filteredReminders.filter((r) => r.completed);
  const incompleteReminders = filteredReminders.filter((r) => !r.completed);

  const deleteList = (listId) => {
    setLists((prevLists) => {
      const updatedLists = prevLists.filter((list) => list.id !== listId);

      // Atualiza o activeListId se a lista excluída for a ativa
      // Muda para 'today' ou para a primeira lista restante
      if (activeListId === listId) {
        setActiveListId(updatedLists.length > 0 ? updatedLists[0].id : 'today');
      }

      return updatedLists;
    });

    // Remove os lembretes associados à lista e cancela suas notificações
    setReminders((prevReminders) => {
      // Encontra lembretes que serão removidos
      const removedReminders = prevReminders.filter(reminder => reminder.listId === listId);
      
      // Cancela notificações para lembretes que serão removidos
      if (notificationsEnabled) {
        removedReminders.forEach(reminder => {
          reminderScheduler.cancelSchedule(reminder.id);
        });
      }
      
      // Retorna apenas os lembretes que não pertencem à lista excluída
      return prevReminders.filter(reminder => reminder.listId !== listId);
    });
  };

  // Valor fornecido pelo contexto
  const value = {
    lists,
    reminders,
    activeListId,
    showCompleted,
    searchTerm,
    notificationsEnabled,
    filteredReminders, // Lembretes filtrados pela lista ativa e busca
    completedReminders, // Lembretes concluídos DENTRO da lista/filtro ativo
    incompleteReminders, // Lembretes incompletos DENTRO da lista/filtro ativo
    setActiveListId,
    setShowCompleted,
    setSearchTerm,
    setNotificationsEnabled, // Permite que componentes ativem/desativem notificações
    addList,
    addReminder,
    toggleReminderCompleted,
    toggleReminderFlagged,
    deleteReminder,
    updateReminder,
    deleteList,
    reorderReminders,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook para usar o contexto
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};