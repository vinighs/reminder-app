import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import ReminderModal from './ReminderModal';

const ReminderItem = ({ reminder, formattedDate, inputRef }) => {
  const { toggleReminderCompleted, toggleReminderFlagged, deleteReminder, updateReminder } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState(reminder.title);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const previousTitleRef = useRef(reminder.title);

  const handleCheckboxChange = () => {
    toggleReminderCompleted(reminder.id);
  };

  const handleFlagToggle = () => {
    toggleReminderFlagged(reminder.id);
    setShowMenu(false);
  };

  const handleDelete = () => {
    deleteReminder(reminder.id);
    setShowMenu(false);
  };

  const handleEditClick = () => {
    setIsModalOpen(true);
    setShowMenu(false);
  };

  // Atualiza o título quando o componente recebe um novo lembrete
  useEffect(() => {
    setTitle(reminder.title);
    previousTitleRef.current = reminder.title;
  }, [reminder.title]);

  // Salva o título quando o input perde o foco
  const handleTitleBlur = () => {
    if (title !== previousTitleRef.current) {
      saveTitle();
    }
  };

  // Salva o título quando o usuário pressiona Enter
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
      saveTitle();
    }
  };

  // Função para salvar o título
  const saveTitle = () => {
    if (title !== previousTitleRef.current) {
      updateReminder({
        ...reminder,
        title: title
      });
      previousTitleRef.current = title;
    }
  };

  const getRecurrenceText = () => {
    switch (reminder.recurrence) {
      case 'daily': return 'Every day';
      case 'weekdays': return 'Every weekday';
      case 'weekly': return 'Every week';
      case 'monthly': return 'Every month';
      case 'yearly': return 'Every year';
      default: return '';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Verifica se o lembrete está vencido (data no passado e não concluído)
  const isOverdue = reminder.date && new Date(reminder.date).getTime() < new Date().getTime() && !reminder.completed;

  return (
    <>
      <div 
        className={`reminder-item ${reminder.completed ? 'completed-reminder' : ''}`}
      >
        <input
          type="checkbox"
          checked={reminder.completed}
          onChange={handleCheckboxChange}
          className="reminder-checkbox"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="reminder-info">
          <input
            type="text"
            ref={reminder.title === '' ? inputRef : null}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            placeholder="New Reminder..."
            className="reminder-title-input"
          />
          <div className="reminder-details">
            {formattedDate && (
              <div className={`reminder-date ${isOverdue ? 'overdue-date-text' : ''}`}>
                {formattedDate}
              </div>
            )}
            {reminder.recurrence && (
              <div className="reminder-recurrence">{getRecurrenceText()}</div>
            )}
            {/* Comentado para ocultar a localização por enquanto */}
            {/* {reminder.location && (
              <div className="reminder-location">📍 {reminder.location}</div>
            )} */}
          </div>
        </div>

        <div className="menu-container" ref={menuRef}>
  {/* Ícone de flag vermelho, exibido apenas se o lembrete estiver flagged */}
  {reminder.flagged && (
    <i 
      className="bi bi-flag-fill" 
      style={{ color: 'red', marginRight: '8px', cursor: 'default', fontSize: '1.5rem'}}
    ></i>
  )}
  <i 
    className="bi bi-three-dots menu-icon"
    onClick={(e) => {
      e.stopPropagation();
      setShowMenu(!showMenu);
    }}
  ></i>
  {showMenu && (
    <div className="menu-dropdown">
      <button className="menu-item" onClick={handleEditClick}>Edit</button>
      <button className="menu-item" onClick={handleFlagToggle}>
        {reminder.flagged ? 'Unflag' : 'Flag'}
      </button>
      <button className="menu-item" onClick={handleDelete}>Delete</button>
    </div>
  )}
</div>
      </div>

      <ReminderModal 
        reminder={reminder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ReminderItem;