import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const AddListModal = ({ onClose }) => {
  const { addList } = useAppContext(); // Use o hook ao invés do useContext
  const [listName, setListName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3478F6'); // Cor padrão
  const [selectedIcon, setSelectedIcon] = useState('bi-list-ul'); // Ícone padrão

  const colors = [
    '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#5ac8fa',
    '#3478F6', '#5856d6', '#ff2d55', '#af52de', '#a2845e',
    '#8e8e93', '#ff9aa2',
  ];

  const icons = [
    'bi-list-ul', 'bi-bookmark', 'bi-lightbulb', 'bi-gift',
    'bi-building', 'bi-mortarboard-fill', 'bi-briefcase', 'bi-journal',
    'bi-truck', 'bi-dice-5', 'bi-person-walking', 'bi-cup-hot',
    'bi-controller', 'bi-headphones', 'bi-chat-left', 'bi-megaphone',
    'bi-heart', 'bi-emoji-dizzy', 'bi-award', 'bi-emoji-smile-fill', 'bi-cart',
    'bi-basket', 'bi-bag', 'bi-box', 'bi-airplane', 'bi-star', 'bi-exclamation-circle', 'bi-flag',
    'bi-house-door', 'bi-lightbulb', 'bi-moon', 'bi-sun', 'bi-umbrella', 'bi-wrench',  'bi-lightning',
  ];

  const handleAdd = () => {
    if (listName.trim()) {
      const newList = {
        id: Date.now().toString(),
        name: listName,
        icon: selectedIcon,
        color: selectedColor,
        items: [],
      };
      addList(newList); // Adiciona a lista ao contexto global
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>New list</h2>
        <div className="preview">
          <div
            className="icon-preview"
            style={{ backgroundColor: selectedColor }}
          >
            <i className={`bi ${selectedIcon} text-white`}></i>
          </div>
        </div>
        <input
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="New list"
          className="list-name-input"
        />
        <div className="color-picker">
          <div className="color-options">
            {colors.map((color) => (
              <div
                key={color}
                className={`color-circle ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>
        <div className="icon-picker">
          <div className="icon-options">
            {icons.map((icon) => (
              <div
                key={icon}
                className={`icon-circle ${selectedIcon === icon ? 'selected' : ''}`}
                style={{ backgroundColor: '#333' }}
                onClick={() => setSelectedIcon(icon)}
              >
                <i className={`bi ${icon} text-white`}></i>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-actions" style={{marginTop: 'auto'}}>
          <button className="cancel-list-button" onClick={onClose}>Cancel</button>
          <button className="add-list-button" onClick={handleAdd}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default AddListModal;