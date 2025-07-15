import React from 'react';
import Icon from './Icon';

const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  icon = 'warning',
  type = 'warning'
}) => {
  if (!open) return null;

  const getIconColor = () => {
    switch (type) {
      case 'danger': return '#ef4444';
      case 'success': return '#22c55e';
      case 'warning': return '#f59e0b';
      default: return '#0ea5e9';
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'danger': return 'error';
      case 'success': return 'check';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content animate-scale-in">
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`icon-container bg-gradient-to-br from-${type}-100 to-${type}-200`}>
              <Icon name={getIconName()} size="xl" color={getIconColor()} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-neutral-900 mb-4 text-center">
            {title}
          </h2>

          {/* Message */}
          {message && (
            <p className="text-neutral-600 mb-8 text-center text-lg leading-relaxed">
              {message}
            </p>
          )}

          {/* Buttons */}
          <div className="flex justify-center gap-4">
            <button
              className="btn-secondary px-6 py-3 text-base font-semibold"
              onClick={onCancel}
              autoFocus
            >
              <Icon name="close" size="sm" className="mr-2" />
              {cancelText}
            </button>
            <button
              className={`btn-${type} px-6 py-3 text-base font-semibold`}
              onClick={onConfirm}
            >
              <Icon name="check" size="sm" className="mr-2" />
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 