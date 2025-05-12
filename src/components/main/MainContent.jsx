import React, { useRef } from 'react'; // Adicionado useRef
import { useAppContext } from '../../context/AppContext';
import ReminderList from './ReminderList';
// import AddReminder from './AddReminder';

const MainContent = () => {
  const { 
    activeListId, 
    lists,
    completedReminders,
    incompleteReminders,
    showCompleted,
    setShowCompleted,
    addReminder // Certifique-se de que addReminder está disponível no contexto
  } = useAppContext();

  const inputRef = useRef(null); // Referência para o campo de título

  const handleNewReminder = () => {
    let reminderDateValue = null;
    if (activeListId === 'today' || activeListId === 'scheduled') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Define para meia-noite no horário local
      reminderDateValue = today.toISOString();
    }

    const newReminder = {
      id: Date.now().toString(),
      title: '',
      completed: false,
      date: reminderDateValue,
      listId: activeListId,
      flagged: false,
      recurrence: null,
      location: null,
    };

    addReminder(newReminder); // Adiciona o novo lembrete
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus(); // Foca no campo de título
      }
    }, 0);
  };

  const getListName = () => {
    if (activeListId === 'today') return 'Today';
    if (activeListId === 'scheduled') return 'Scheduled';
    if (activeListId === 'all') return 'All';
    if (activeListId === 'flagged') return 'Flagged';
    
    const currentList = lists.find(list => list.id === activeListId);
    return currentList ? currentList.name : '';
  };

  return (
    <div className="main-content">
      <div className="add-button-container">
        <button 
          className="add-button" 
          onClick={handleNewReminder}
        >
          +
        </button>
      </div>
  
      <div className="list-header">
        <div className="list-title-container">
          <h1 className="list-title">{getListName()}</h1>
          <span className="list-count">{incompleteReminders.length}</span>
        </div>
        
        <div className="completed-count">
          <span>{completedReminders.length} Completed</span>
          <button 
            className="show-button"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? 'Hide Completed' : 'Show Completed'}
          </button>
        </div>
      </div>
      
      <ReminderList reminders={incompleteReminders} inputRef={inputRef} />
      
      {showCompleted && completedReminders.length > 0 && (
        <ReminderList reminders={completedReminders} />
      )}
      
      
    </div>
  );
};

export default MainContent;