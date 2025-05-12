// ipcService.js
import { isElectron } from './environmentService';

// Load data from the main process
export const loadData = async () => {
  if (isElectron()) {
    try {
      return await window.electronAPI.loadData();
    } catch (error) {
      console.error('Error loading data via IPC:', error);
      return { lists: [], reminders: [] };
    }
  }
  return { lists: [], reminders: [] };
};

export const saveData = async (data) => {
  if (isElectron()) {
    try {
      return await window.electronAPI.saveData(data);
    } catch (error) {
      console.error('Error saving data via IPC:', error);
      return false;
    }
  }
  return false;
};

