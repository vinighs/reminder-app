import React from 'react';
import ReminderItem from './ReminderItem';
import { useAppContext } from '../../context/AppContext';

const ReminderList = ({ reminders, inputRef }) => { // Adicionado inputRef como prop
  const { reorderReminders } = useAppContext();

  // Função formatDate atualizada para usar o horário local do usuário
  const formatDate = (timestamp) => {
    if (!timestamp) return ''; // Retorna string vazia se não houver timestamp

    try {
      const date = new Date(timestamp); // Cria o objeto Date a partir do timestamp.
                                        // Por padrão, os métodos getHours(), getMinutes(), etc., usarão o fuso horário local.

      // Extrai os componentes da data e hora usando o fuso horário local
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mês é 0-indexado
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      // Verifica se a hora é meia-noite (00:00) no horário local.
      // Isso acontece se o usuário definiu apenas uma data, sem hora específica, 
      // pois o ReminderModal salva 00:00 local nesse caso.
      const isMidnightLocal = date.getHours() === 0 && date.getMinutes() === 0;

      // Formata a data como DD/MM/YYYY
      const datePart = `${day}/${month}/${year}`;

      // Se não for meia-noite local (ou seja, uma hora foi especificada), adiciona a hora HH:mm
      if (!isMidnightLocal) {
        return `${datePart}, ${hours}:${minutes}`;
      }

      // Se for meia-noite UTC, retorna apenas a data
      return datePart;

    } catch (error) {
      console.error("Error formatting date in ReminderList:", timestamp, error);
      return 'Data inválida'; // Mensagem de erro ou padrão
    }
  };


  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('reminderIndex', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    const dragIndex = parseInt(e.dataTransfer.getData('reminderIndex'));
    if (dragIndex === dropIndex) return;

    const reordered = [...reminders];
    const [removed] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, removed);

    reorderReminders(reordered);
  };

  return (
    <div className="reminder-list">
      {reminders.map((reminder, index) => (
        <div
          key={reminder.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          <ReminderItem
            reminder={reminder}
            // Passa a data formatada corretamente usando a função atualizada
            formattedDate={reminder.date ? formatDate(reminder.date) : ''}
            inputRef={inputRef} // Passando inputRef para ReminderItem
          />
        </div>
      ))}
    </div>
  );
};

export default ReminderList;
