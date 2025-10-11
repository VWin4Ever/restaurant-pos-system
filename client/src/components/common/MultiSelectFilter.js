import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

const MultiSelectFilter = ({ 
  label, 
  icon, 
  options = [], 
  selectedIds = [], 
  onChange,
  placeholder = "Select items...",
  colorClass = "blue"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Color classes for different filter types
  const colorClasses = {
    blue: { 
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      hover: 'hover:bg-blue-50',
      button: 'text-blue-600 hover:text-blue-800'
    },
    green: { 
      badge: 'bg-green-100 text-green-800 border-green-200',
      hover: 'hover:bg-green-50',
      button: 'text-green-600 hover:text-green-800'
    },
    purple: { 
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      hover: 'hover:bg-purple-50',
      button: 'text-purple-600 hover:text-purple-800'
    },
    orange: { 
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
      hover: 'hover:bg-orange-50',
      button: 'text-orange-600 hover:text-orange-800'
    }
  };

  const colors = colorClasses[colorClass] || colorClasses.blue;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (id) => {
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id];
    onChange(newSelectedIds);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(option => option.id));
    }
  };

  const getSelectedNames = () => {
    if (selectedIds.length === 0) return placeholder;
    if (selectedIds.length === 1) {
      const selected = options.find(opt => opt.id === selectedIds[0]);
      return selected?.name || selected?.username || placeholder;
    }
    return `${selectedIds.length} selected`;
  };

  const isAllSelected = selectedIds.length === options.length && options.length > 0;

  return (
    <div className="flex flex-col" ref={dropdownRef}>
      <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
        <span className="text-lg mr-2">{icon}</span>
        {label} {options.length > 0 && `(${options.length})`}
      </label>
      
      <div className="relative">
        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white hover:bg-gray-50 flex items-center justify-between"
        >
          <span className={selectedIds.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
            {getSelectedNames()}
          </span>
          <Icon 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size="sm" 
            className="text-gray-400"
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {/* Select All Option */}
            {options.length > 0 && (
              <div
                onClick={handleSelectAll}
                className={`px-4 py-2 border-b border-gray-200 cursor-pointer transition-colors ${
                  isAllSelected 
                    ? `${colors.badge} font-semibold`
                    : `${colors.hover} text-gray-700`
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {isAllSelected ? '✓ Deselect All' : 'Select All'}
                  </span>
                  {isAllSelected && (
                    <Icon name="check" size="sm" className="text-current" />
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => handleToggle(option.id)}
                    className={`px-4 py-2 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? `${colors.badge} font-medium border-l-4`
                        : `${colors.hover} text-gray-700 border-l-4 border-transparent`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm">
                          {option.name || option.username}
                        </span>
                        {option.shift && (
                          <span className="ml-2 text-xs opacity-75">
                            ({option.shift.name})
                          </span>
                        )}
                        {option.startTime && option.endTime && (
                          <span className="ml-2 text-xs opacity-75">
                            ({option.startTime} - {option.endTime})
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Icon name="check" size="sm" className="text-current font-bold" />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Items Chips */}
      {selectedIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedIds.map(id => {
            const option = options.find(opt => opt.id === id);
            if (!option) return null;
            return (
              <span
                key={id}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors.badge}`}
              >
                {option.name || option.username}
                <button
                  onClick={() => handleToggle(id)}
                  className={`ml-1.5 ${colors.button} font-bold`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
