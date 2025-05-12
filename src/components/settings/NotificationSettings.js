// src/components/settings/NotificationSettings.js
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { requestNotificationPermission, areNotificationsSupported } from '../../services/notificationService';

const NotificationSettings = () => {
  const { notificationsEnabled, setNotificationsEnabled } = useAppContext();
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = await areNotificationsSupported();
      setSupported(isSupported);
    };
    checkSupport();
  }, []);

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      if (!granted) {
        alert('Para receber notificações, você precisa conceder permissão nas configurações do seu navegador ou sistema operacional.');
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  if (!supported) {
    return (
      <div className="notification-settings">
        <h3>Notificações</h3>
        <p>As notificações não são suportadas neste ambiente.</p>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>Notificações</h3>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={notificationsEnabled}
          onChange={handleToggleNotifications}
        />
        <span className="toggle-slider"></span>
        <span className="toggle-label">
          {notificationsEnabled ? 'Notificações ativadas' : 'Notificações desativadas'}
        </span>
      </label>
      <p className="notification-info">
        {notificationsEnabled 
          ? 'Você receberá notificações quando seus lembretes atingirem a data programada.' 
          : 'Ative as notificações para ser lembrado dos seus compromissos.'}
      </p>
    </div>
  );
};

export default NotificationSettings;