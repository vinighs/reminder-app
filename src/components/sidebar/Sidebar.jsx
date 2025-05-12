import React from 'react';
import { useAppContext } from '../../context/AppContext';
import CategoryList from './CategoryList';
import UserLists from './UserLists';
import AddListButton from './AddListButton';

const Sidebar = () => {
  const { searchTerm, setSearchTerm } = useAppContext();

  return (
    <div className="sidebar">
      {/* Controles de janela */}
      <div className="window-controls">
        <div className="control red"></div>
        <div className="control yellow"></div>
        <div className="control green"></div>
      </div>
      
      {/* Barra de pesquisa */}
      <div className="search-container">
      <i className="bi bi-search search-icon"></i> {/* Ícone de pesquisa */}
        <input
          type="text"
          placeholder="Search"
          className="search-bar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <CategoryList />
      <UserLists />
      <div style={{marginTop: 'auto'}}>
        <AddListButton />
      </div>
    </div>
  );
};

export default Sidebar;