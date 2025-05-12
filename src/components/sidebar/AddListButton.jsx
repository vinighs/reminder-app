import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import AddListModal from './AddListModal';

const AddListButton = () => {
  const { addList } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddList = (newList) => {
    addList(newList);
    setIsModalOpen(false);
  };

  return (
    <div className="add-list">
      <div 
        onClick={() => setIsModalOpen(true)}
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
      >
        <i className="bi bi-plus-circle me-2"></i>
        <span>  Add list</span>
      </div>
      
      {isModalOpen && (
        <AddListModal
          onClose={() => setIsModalOpen(false)}
          onAddList={handleAddList}
        />
      )}
    </div>
  );
};

export default AddListButton;