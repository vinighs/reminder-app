import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

const ReminderModal = ({ reminder, isOpen, onClose }) => {
  const { updateReminder, lists } = useAppContext();
  const [title, setTitle] = useState('');
  const [dateEnabled, setDateEnabled] = useState(false);
  const [date, setDate] = useState(''); // Should store 'YYYY-MM-DD'
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [time, setTime] = useState(''); // Should store 'HH:mm'
  const [selectedList, setSelectedList] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  
  // Logs para depuração do problema de timezone
  const logTimezoneInfo = () => {
    console.log("---- TIMEZONE DEBUG INFO ----");
    console.log(`Local timezone offset: ${new Date().getTimezoneOffset() / -60} hours`);
    console.log(`Current local time: ${new Date().toLocaleString()}`);
    if (reminder && reminder.date) {
      console.log(`Reminder timestamp: ${reminder.date}`);
      console.log(`Reminder date in local time: ${new Date(reminder.date).toLocaleString()}`);
    }
    console.log("----------------------------");
  };

  // Atualiza os campos quando o modal é aberto com um lembrete
  useEffect(() => {
    if (isOpen && reminder) {
      // Log para debug
      logTimezoneInfo();
      
      // Definir título e lista
      setTitle(reminder.title || '');
      setSelectedList(reminder.listId || '');

      if (reminder.date) {
        setDateEnabled(true);
        
        // Criar objeto Date com o timestamp
        const reminderDate = new Date(reminder.date);
        
        // Extrair componentes de data locais (não UTC)
        const year = reminderDate.getFullYear();
        const month = (reminderDate.getMonth() + 1).toString().padStart(2, '0');
        const day = reminderDate.getDate().toString().padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
        
        // Extrair componentes de hora locais
        const hours = reminderDate.getHours();
        const minutes = reminderDate.getMinutes();
        const hasTime = hours !== 0 || minutes !== 0;
        
        setTimeEnabled(hasTime);
        if (hasTime) {
          const hoursStr = hours.toString().padStart(2, '0');
          const minutesStr = minutes.toString().padStart(2, '0');
          setTime(`${hoursStr}:${minutesStr}`);
        } else {
          setTime('');
        }
        
        // Debug log
        console.log(`[ReminderModal] Date set to: ${year}-${month}-${day}, time: ${hasTime ? `${hours}:${minutes}` : 'not set'}`);
      } else {
        setDateEnabled(false);
        setDate('');
        setTimeEnabled(false);
        setTime('');
      }

      setRecurrence(reminder.recurrence || 'none');
    }
  }, [reminder, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    let timestamp = null;
    if (dateEnabled && date) {
      // Parse date and time components
      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = timeEnabled && time ? time.split(':').map(Number) : [0, 0];

      // Criar objeto Date local (não UTC)
      const localDateTime = new Date(year, month - 1, day, hours, minutes);
      timestamp = localDateTime.getTime();
      
      // Debug log
      console.log(`[ReminderModal] Submitting reminder with date: ${localDateTime.toLocaleString()}`);
      console.log(`[ReminderModal] Timestamp value: ${timestamp}`);
    }

    const updatedReminder = {
      ...reminder,
      title,
      date: timestamp,
      listId: selectedList,
      recurrence: recurrence !== 'none' ? recurrence : null,
    };

    updateReminder(updatedReminder);
    onClose();
  };

  const formatDateDisplay = (dateStr) => {
    // dateStr is expected to be in 'YYYY-MM-DD' format
    if (!dateStr) return 'Select a date';
    try {
      // Parse date components
      const [year, month, day] = dateStr.split('-').map(Number);
      
      // Create date object using local timezone
      const date = new Date(year, month - 1, day);

      const days = ['sun.', 'mon.', 'tue.', 'wed.', 'thu.', 'fri.', 'sat.'];
      const dayName = days[date.getDay()];

      // Format: dia. DD/MM/YYYY
      return `${dayName} ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", dateStr, error);
      return 'Data inválida';
    }
  };

  const toggleDateEnabled = () => {
    const enabling = !dateEnabled;
    setDateEnabled(enabling);
    if (enabling && !date) {
      // Set to today's local date
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay dark">
      <div className="reminder-modal-content">
        <h2 className="reminder-modal-title">Details</h2>
        <button
          className="flag-button"
          onClick={() => updateReminder({...reminder, flagged: !reminder.flagged})}
        >
          <i className={`bi bi-flag${reminder.flagged ? '-fill' : ''}`}></i>
        </button>

        <form onSubmit={handleSubmit} className="reminder-form">
          <div className="reminder-form-group title-input">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="reminder-title-field"
              autoFocus
            />
          </div>

          <div className="reminder-form-group reminder-toggle-group">
            <label>Remind me on a day</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={dateEnabled}
                onChange={toggleDateEnabled}
                id="date-toggle"
                className="toggle-input"
              />
              <label htmlFor="date-toggle" className="toggle-label"></label>
            </div>
          </div>

          {dateEnabled && (
            <div className="reminder-form-group date-time-group">
              <label>Date</label>
              <div className="date-display">
                <span>{formatDateDisplay(date)}</span>
                <i className="bi bi-calendar calendar-icon"></i>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
          )}

          {dateEnabled && (
            <div className="reminder-form-group time-group">
              <div className="time-checkbox-container">
                <input
                  type="checkbox"
                  checked={timeEnabled}
                  onChange={() => setTimeEnabled(!timeEnabled)}
                  id="time-checkbox"
                  className="time-checkbox"
                />
                <label htmlFor="time-checkbox">Time</label>
              </div>

              {timeEnabled && (
                <div className="time-input-container">
                  <div className="time-display">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="time-input"
                    />
                    <i className="bi bi-clock time-icon"></i>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="reminder-form-group">
            <label>Repeat</label>
            <div className="select-container">
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="display-select"
              >
                <option value="none">Never</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <i className="bi bi-chevron-down select-arrow"></i>
            </div>
          </div>

          {/* Ocultar a seleção de lista por enquanto */}
          {/* <div className="reminder-form-group">
            <label>List</label>
              <div className="select-container">
                <select
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  className="display-select"
                  aria-label="Select list"
                >
                  {lists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                  ))}
                </select>
                <i className="bi bi-chevron-down select-arrow"></i>
              </div>
            </div> 
          */}

          <div className="reminder-button-group">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReminderModal;