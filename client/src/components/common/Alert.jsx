import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import './Alert.css';

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={18} className="alert-icon success" />,
    warning: <AlertTriangle size={18} className="alert-icon warning" />,
    danger: <AlertCircle size={18} className="alert-icon danger" />,
    info: <Info size={18} className="alert-icon info" />
  };

  return (
    <div className={`alert-box alert-${type}`}>
      <div className="alert-body">
        {icons[type]}
        <div className="alert-message">{message}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="alert-close" aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
