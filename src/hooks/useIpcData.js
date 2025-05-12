import { useEffect } from 'react';
import { loadData, saveData } from '../services/ipcService';
import { isElectron } from '../services/environmentService';

// Custom hook to sync state with electron's main process
export const useIpcData = (lists, setLists, reminders, setReminders) => {
  // Load data on initial mount
  useEffect(() => {
    let isMounted = true;
  
    const fetchData = async () => {
      if (isElectron()) {
        const data = await loadData();
        if (isMounted && data) {
          if (data.lists && data.lists.length > 0) {
            setLists(data.lists);
          }
          if (data.reminders && data.reminders.length > 0) {
            setReminders(
              data.reminders.map((reminder) => ({
                ...reminder,
                date: reminder.date ? new Date(reminder.date).getTime() : null,
              }))
            );
          }
        }
      } else {
        try {
          const savedLists = localStorage.getItem('lists');
          const savedReminders = localStorage.getItem('reminders');
          if (isMounted) {
            if (savedLists) {
              setLists(JSON.parse(savedLists));
            }
            if (savedReminders) {
              setReminders(
                JSON.parse(savedReminders).map((reminder) => ({
                  ...reminder,
                  date: reminder.date ? new Date(reminder.date).getTime() : null,
                }))
              );
            }
          }
        } catch (error) {
          console.error('Error loading data from localStorage:', error);
        }
      }
    };
  
    fetchData();
  
    return () => {
      isMounted = false; // Evita atualizações de estado após desmontagem
    };
  }, [setLists, setReminders]);
  
  useEffect(() => {
    let isMounted = true;
  
    const persistData = async () => {
      if (isElectron()) {
        if (isMounted) {
          await saveData({ lists, reminders });
        }
      } else {
        try {
          if (isMounted) {
            localStorage.setItem('lists', JSON.stringify(lists));
            localStorage.setItem('reminders', JSON.stringify(reminders));
          }
        } catch (error) {
          console.error('Error saving data to localStorage:', error);
        }
      }
    };
  
    persistData();
  
    return () => {
      isMounted = false;
    };
  }, [lists, reminders]);
}; // <-- Adicione esta chave de fechamento