import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const UserLists = () => {
  const { 
    lists, 
    reminders, 
    activeListId, 
    setActiveListId,
    deleteList
  } = useAppContext();

  // Estado para controlar qual item da lista está sendo hover
  const [hoveredListId, setHoveredListId] = useState(null);

  const handleDelete = async (e, listId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this list?')) {
      try {
        await deleteList(listId);
      } catch (error) {
        console.error('Failed to delete the list:', error);
      }
    }
  };

  return (
    <div className="my-lists">
      <div className="section-header">My Lists</div>
      {lists.map((list) => {
        const count = reminders.filter(
          reminder => reminder.listId === list.id && !reminder.completed
        ).length;

        return (
          <div
            key={list.id}
            className={`my-list-item ${activeListId === list.id ? 'active' : ''}`}
            onClick={() => setActiveListId(list.id)}
            role="button"
            tabIndex="0"
            onKeyDown={(e) => e.key === 'Enter' && setActiveListId(list.id)}
            onMouseEnter={() => setHoveredListId(list.id)}
            onMouseLeave={() => setHoveredListId(null)}
          >
            <div className="my-list-content">
              <div className="circle-icon" style={{ backgroundColor: list.color }}>
                <i className={`bi ${list.icon}`}></i>
              </div>
              <span className="my-list-item-title">{list.name}</span>
            </div>
            <div className="my-list-right">
              <span className="my-list-item-count">{count}</span>
              {hoveredListId === list.id && (
                <button 
                  className="delete-list-btn"
                  onClick={(e) => handleDelete(e, list.id)}
                  title="Delete list"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserLists;