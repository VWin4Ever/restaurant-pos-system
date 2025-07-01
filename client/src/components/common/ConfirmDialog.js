import React from 'react';

const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  icon
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        {icon && (
          <div className="flex justify-center mb-2 text-3xl">{icon}</div>
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">{title}</h2>
        {message && <p className="text-gray-700 mb-6 text-center">{message}</p>}
        <div className="flex justify-center gap-4">
          <button
            className="btn-secondary px-4 py-2 rounded font-medium"
            onClick={onCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            className="btn-primary px-4 py-2 rounded font-medium"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 