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
  onClose,
  icon = 'warning',
  type = 'warning',
  customButtons = false
}) => {
  if (!open) return null;

  const getIconColor = () => {
    switch (type) {
      case 'danger': return '#ef4444';
      case 'success': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'info': return '#0ea5e9';
      default: return '#0ea5e9';
    }
  };

  const getIconName = () => {
    switch (type) {
      case 'danger': return 'error';
      case 'success': return 'check';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content animate-scale-in relative">
        <div className="p-8">
          {/* Close button for custom dialogs */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
              aria-label="Close dialog"
            >
              <Icon name="close" className="w-4 h-4 text-neutral-600" />
            </button>
          )}

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
          {customButtons ? (
            // Custom button layout for payment method selection
            <div className="flex justify-center gap-4">
              <button
                className="btn-success px-8 py-4 text-base font-semibold flex items-center gap-2 min-w-[140px] justify-center"
                onClick={onConfirm}
                autoFocus
              >
                <Icon name="money" size="sm" />
                {confirmText}
              </button>
              <button
                className="btn-primary px-8 py-4 text-base font-semibold flex items-center gap-2 min-w-[140px] justify-center"
                onClick={onCancel}
              >
                <Icon name="creditCard" size="sm" />
                {cancelText}
              </button>
            </div>
          ) : (
            // Standard button layout
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 