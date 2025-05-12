import React from 'react';
import { useAppContext } from '../../context/AppContext';

const CategoryList = () => {
  const { 
    reminders, 
    activeListId, 
    setActiveListId 
  } = useAppContext();

  // Count reminders for each category
  const todayCount = reminders.filter(reminder => {
    const today = new Date().setHours(0, 0, 0, 0);
    const reminderDate = new Date(reminder.date).setHours(0, 0, 0, 0);
    return reminderDate === today && !reminder.completed;
  }).length;

  const scheduledCount = reminders.filter(reminder => 
    reminder.date && !reminder.completed
  ).length;

  const allCount = reminders.filter(reminder => !reminder.completed).length;

  const flaggedCount = reminders.filter(reminder => 
    reminder.flagged && !reminder.completed
  ).length;

  const categories = [
    { id: 'today', name: 'Today', count: todayCount, icon: 'bi-calendar-date', color: 'blue-icon' },
    { id: 'scheduled', name: 'Scheduled', count: scheduledCount, icon: 'bi-calendar3', color: 'red-icon' },
    { id: 'all', name: 'All', count: allCount, icon: 'bi-inbox-fill', color: 'gray-icon' },
    { id: 'flagged', name: 'Flagged', count: flaggedCount, icon: 'bi-flag-fill', color: 'orange-icon' },
  ];

  return (
    <div className="quick-lists">
      {categories.map(category => (
        <div 
          key={category.id}
          className={`list-item ${activeListId === category.id ? 'active' : ''}`}
          onClick={() => setActiveListId(category.id)}
        >
          <div className={`list-item-icon ${category.color}`}>
            <i className={`bi ${category.icon}`}></i>
          </div>
          <div className="list-item-content">
            <div className="list-item-count">{category.count}</div>
            <div className="list-item-title">{category.name}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryList;