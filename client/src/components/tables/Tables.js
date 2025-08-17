import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import websocketService from '../../services/websocket';
import { useAuth } from '../../contexts/AuthContext';

const Tables = () => {
  const { isAdmin, hasPermission } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [newTable, setNewTable] = useState({ number: '', capacity: 4 });
  const [editingTable, setEditingTable] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTable, setHistoryTable] = useState(null);
  const [tableHistory, setTableHistory] = useState({ orders: [], stats: {} });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Auto-refresh interval (30 seconds)
  const REFRESH_INTERVAL = 30000;

  const fetchTables = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsRefreshing(true);
    }
    
    try {
      const response = await axios.get('/api/tables');
      setTables(response.data.data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTables(true);
  }, [fetchTables]);

  // Auto-refresh setup
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTables();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchTables]);

  // WebSocket setup
  useEffect(() => {
    // Subscribe to table updates
    const unsubscribeMessage = websocketService.subscribe('message', (data) => {
      if (data.type === 'table_update') {
        // Update specific table
        setTables(prevTables => 
          prevTables.map(table => 
            table.id === data.table.id ? data.table : table
          )
        );
        toast.info(`Table ${data.table.number} status updated to ${data.table.status}`);
      } else if (data.type === 'tables_refresh') {
        // Refresh all tables
        fetchTables();
      }
    });

    // Subscribe to connection status
    const unsubscribeConnection = websocketService.subscribe('connection', (data) => {
      if (data.status === 'disconnected') {
        toast.warning('Real-time updates disconnected');
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [fetchTables]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchTables(true);
    toast.info('Refreshing tables...');
  };

  // Format last updated time


  const updateTableStatus = async (tableId, newStatus) => {
    try {
      const response = await axios.patch(`/api/tables/${tableId}/status`, { status: newStatus });
      
      toast.success('Table status updated successfully');
      fetchTables();
      setShowStatusModal(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Failed to update table status:', error);
      
      // Handle specific error cases
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        
        if (errorMessage.includes('active order') || errorMessage.includes('already occupied')) {
          toast.error(
            'Cannot update table status. There is an active order for this table. Please complete or cancel the order first.',
            { autoClose: 5000 }
          );
        } else {
          toast.error(errorMessage);
        }
      } else {
        toast.error('Failed to update table status');
      }
    }
  };

  const addTable = async () => {
    try {
      await axios.post('/api/tables', newTable);
      toast.success('Table added successfully');
      fetchTables();
      setShowAddModal(false);
      setNewTable({ number: '', capacity: 4 });
    } catch (error) {
      console.error('Failed to add table:', error);
      toast.error('Failed to add table');
    }
  };

  const updateTable = async () => {
    try {
      await axios.put(`/api/tables/${editingTable.id}`, editingTable);
      toast.success('Table updated successfully');
      fetchTables();
      setShowEditModal(false);
      setEditingTable({});
    } catch (error) {
      console.error('Failed to update table:', error);
      toast.error('Failed to update table');
    }
  };

  const deleteTable = async () => {
    try {
      await axios.delete(`/api/tables/${selectedTable.id}`);
      toast.success('Table deleted successfully');
      fetchTables();
      setShowDeleteDialog(false);
      setSelectedTable(null);
    } catch (error) {
      console.error('Failed to delete table:', error);
      toast.error('Failed to delete table');
    }
  };

  const getStatusBadge = (status, maintenance = false) => {
    if (maintenance) {
      return (
        <span className="table-status bg-gray-200 text-red-700 flex items-center gap-1">
          <span>⚠️</span> OUT OF SERVICE
        </span>
      );
    }
    const statusClasses = {
      AVAILABLE: 'table-status-available',
      OCCUPIED: 'table-status-occupied',
      RESERVED: 'table-status-reserved'
    };
    const statusIcons = {
      AVAILABLE: '🟢',
      OCCUPIED: '🟡',
      RESERVED: '🔵'
    };
    return (
      <span className={`table-status ${statusClasses[status]} flex items-center gap-1`}>
        <span>{statusIcons[status]}</span> {status}
      </span>
    );
  };

  const getStatusIcon = (status) => {
    const icons = {
      AVAILABLE: '🟢',
      OCCUPIED: '🟡',
      RESERVED: '🔵'
    };
    return icons[status] || '⚪';
  };

  // Get unique groups from tables
  const allGroups = Array.from(new Set(tables.map(t => t.group || 'General')));

  // Filtered tables by group
  const filteredTables = tables.filter(table => {
    const matchesStatus = filterStatus === 'ALL' || table.status === filterStatus;
    const matchesSearch = table.number.toString().includes(searchTerm);
    const matchesGroup = groupFilter === 'ALL' || (table.group || 'General') === groupFilter;
    return matchesStatus && matchesSearch && matchesGroup;
  });

  const getStatusCount = (status) => {
    return tables.filter(t => t.status === status).length;
  };

  // Bulk selection handlers
  const isTableSelected = (id) => selectedTableIds.includes(id);
  const toggleTableSelection = (id) => {
    setSelectedTableIds((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };
  const selectAllTables = () => {
    setSelectedTableIds(filteredTables.map((t) => t.id));
  };
  const clearSelection = () => {
    setSelectedTableIds([]);
  };
  const bulkChangeStatus = async (status) => {
    try {
      await Promise.all(
        selectedTableIds.map((id) =>
          axios.patch(`/api/tables/${id}/status`, { status })
        )
      );
      toast.success(`Status changed to ${status} for selected tables`);
      fetchTables();
      clearSelection();
    } catch (error) {
      toast.error('Failed to change status for some tables');
    }
  };

  const openHistoryModal = async (table) => {
    setHistoryTable(table);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const res = await axios.get(`/api/tables/${table.id}/history`);
      setTableHistory(res.data.data);
    } catch (e) {
      toast.error('Failed to load table history');
      setTableHistory({ orders: [], stats: {} });
    } finally {
      setHistoryLoading(false);
    }
  };
  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setHistoryTable(null);
    setTableHistory({ orders: [], stats: {} });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
            {/* Header */}
      <div className="card-gradient p-4 sm:p-6 animate-slide-down sticky top-0 z-30 bg-white shadow">
        {/* Status Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Tables</p>
                <p className="text-3xl font-bold">{tables.length}</p>
              </div>
              <div className="text-4xl">🪑</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Available</p>
                <p className="text-3xl font-bold">{getStatusCount('AVAILABLE')}</p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Occupied</p>
                <p className="text-3xl font-bold">{getStatusCount('OCCUPIED')}</p>
              </div>
              <div className="text-4xl">🟡</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Reserved</p>
                <p className="text-3xl font-bold">{getStatusCount('RESERVED')}</p>
              </div>
              <div className="text-4xl">🔵</div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="btn-secondary flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
            >
              <span className={isRefreshing ? 'animate-spin mr-2' : 'mr-2'}>
                {isRefreshing ? '🔄' : '🔄'}
              </span>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <span className="mr-2">🔍</span>
              Filters
            </button>
            {hasPermission('tables.create') && (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
              >
                <span className="mr-2">➕</span>
                Add Table
              </button>
            )}
          </div>
        </div>
      </div>



      {/* Filters */}
      {showFilters && (
        <div className="card-gradient p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Tables</label>
              <input
                type="text"
                placeholder="Search by table number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input"
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="ALL">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Group/Area</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="input"
              >
                <option value="ALL">All Groups</option>
                {allGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedTableIds.length > 0 && hasPermission('tables.edit') && (
        <div className="card-gradient p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-2 border-primary-200 bg-primary-50 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-medium text-primary-700">{selectedTableIds.length} table(s) selected</span>
            <button onClick={selectAllTables} className="btn btn-secondary btn-xs">Select All</button>
            <button onClick={clearSelection} className="btn btn-secondary btn-xs">Clear</button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-700">Change status to:</span>
            <button onClick={() => bulkChangeStatus('AVAILABLE')} className="btn btn-success btn-xs">Available</button>
            <button onClick={() => bulkChangeStatus('OCCUPIED')} className="btn btn-warning btn-xs">Occupied</button>
            <button onClick={() => bulkChangeStatus('RESERVED')} className="btn btn-primary btn-xs">Reserved</button>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div style={{maxHeight: 'calc(3 * 240px + 2rem)', overflowY: 'auto'}} className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className={`card-gradient p-4 text-center cursor-pointer transition-all duration-200 hover:shadow-lg focus-within:shadow-lg hover:border-primary-300 focus-within:border-primary-400 min-h-[220px] flex flex-col justify-between ${
                table.status === 'AVAILABLE' 
                  ? 'hover:bg-green-50 border-green-200' 
                  : table.status === 'OCCUPIED'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
              onClick={() => {
                setSelectedTable(table);
                setShowStatusModal(true);
              }}
            >
              <div className="flex items-center justify-between mb-2">
                {hasPermission('tables.edit') && (
                  <input
                    type="checkbox"
                    checked={isTableSelected(table.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleTableSelection(table.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mr-2"
                  />
                )}
                <div className="text-3xl">{getStatusIcon(table.status)}</div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                Table {table.number}
              </div>
              <div className="mb-2">
                {getStatusBadge(table.status, table.maintenance)}
              </div>
              <div className={`text-xs text-gray-500 mb-3 flex flex-col gap-1`}>
                <span>Capacity: {table.capacity} people <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">{table.group || 'General'}</span></span>
                {table.notes && <span className="italic text-gray-400">📝 {table.notes}</span>}
              </div>
              <div className="flex justify-center gap-1">
                {hasPermission('tables.edit') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTable(table);
                      setShowEditModal(true);
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded focus:ring-2 focus:ring-primary-400"
                  >
                    Edit
                  </button>
                )}
                {hasPermission('tables.delete') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTable(table);
                      setShowDeleteDialog(true);
                    }}
                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded focus:ring-2 focus:ring-primary-400"
                  >
                    Delete
                  </button>
                )}
                {hasPermission('tables.view') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openHistoryModal(table);
                    }}
                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded focus:ring-2 focus:ring-primary-400"
                  >
                    History
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredTables.length === 0 && (
        <div className="card-gradient p-8 text-center">
          <div className="text-4xl mb-4">🪑</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Change Table {selectedTable.number} Status
            </h3>
            
            {/* Current Status Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Current Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedTable.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                  selectedTable.status === 'OCCUPIED' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {selectedTable.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {['AVAILABLE', 'OCCUPIED', 'RESERVED'].map((status) => (
                <button
                  key={status}
                  onClick={() => updateTableStatus(selectedTable.id, status)}
                  className={`w-full p-3 rounded-lg border transition-colors ${
                    selectedTable.status === status
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{getStatusIcon(status)} {status}</span>
                    {selectedTable.status === status && <span>✓</span>}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Help Text */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Table status changes may be restricted if there are active orders. 
                Complete or cancel existing orders first to change status.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedTable(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md modal-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Table</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                <input
                  type="number"
                  value={newTable.number}
                  onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                  className="input"
                  placeholder="Enter table number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
                  className="input"
                  placeholder="Enter capacity"
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group/Area</label>
                <input
                  type="text"
                  value={newTable.group || ''}
                  onChange={(e) => setNewTable({ ...newTable, group: e.target.value })}
                  className="input"
                  placeholder="e.g. Indoor, Outdoor, VIP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={newTable.notes || ''}
                  onChange={(e) => setNewTable({ ...newTable, notes: e.target.value })}
                  className="input"
                  placeholder="e.g. Needs cleaning, broken chair, etc."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!newTable.maintenance}
                  onChange={(e) => setNewTable({ ...newTable, maintenance: e.target.checked })}
                  id="add-maintenance"
                />
                <label htmlFor="add-maintenance" className="text-sm font-medium text-gray-700">Out of Service (Maintenance)</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTable({ number: '', capacity: 4 });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={addTable}
                disabled={!newTable.number || !newTable.capacity}
                className="btn btn-primary disabled:opacity-50"
              >
                Add Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {showEditModal && editingTable.id && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md modal-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Table {editingTable.number}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                <input
                  type="number"
                  value={editingTable.number}
                  onChange={(e) => setEditingTable({ ...editingTable, number: parseInt(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                <input
                  type="number"
                  value={editingTable.capacity}
                  onChange={(e) => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) })}
                  className="input"
                  min="1"
                  max="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group/Area</label>
                <input
                  type="text"
                  value={editingTable.group || ''}
                  onChange={(e) => setEditingTable({ ...editingTable, group: e.target.value })}
                  className="input"
                  placeholder="e.g. Indoor, Outdoor, VIP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={editingTable.notes || ''}
                  onChange={(e) => setEditingTable({ ...editingTable, notes: e.target.value })}
                  className="input"
                  placeholder="e.g. Needs cleaning, broken chair, etc."
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!editingTable.maintenance}
                  onChange={(e) => setEditingTable({ ...editingTable, maintenance: e.target.checked })}
                  id="edit-maintenance"
                />
                <label htmlFor="edit-maintenance" className="text-sm font-medium text-gray-700">Out of Service (Maintenance)</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTable({});
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={updateTable}
                className="btn btn-primary"
              >
                Update Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedTable(null);
        }}
        onConfirm={deleteTable}
        title="Delete Table"
        message={`Are you sure you want to delete Table ${selectedTable?.number}? This action cannot be undone.`}
        confirmText="Delete"
        confirmClass="btn-danger"
      />



      {/* Table History Modal */}
      {showHistoryModal && historyTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeHistoryModal}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Table {historyTable.number} History & Stats</h3>
              <button onClick={closeHistoryModal} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            <div className="mb-4">
              <span className="font-medium">Group/Area:</span> {historyTable.group || 'General'}<br/>
              <span className="font-medium">Capacity:</span> {historyTable.capacity} people<br/>
              {historyTable.notes && <span className="font-medium">Notes:</span>} <span className="italic text-gray-500">{historyTable.notes}</span><br/>
              {historyTable.maintenance && <span className="text-red-600 font-bold">⚠️ Out of Service</span>}
            </div>
            {historyLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="card-gradient p-3 text-center">
                    <div className="text-xs text-gray-500">Total Orders</div>
                    <div className="text-xl font-bold">{tableHistory.stats.totalOrders || 0}</div>
                  </div>
                  <div className="card-gradient p-3 text-center">
                    <div className="text-xs text-gray-500">Total Revenue</div>
                    <div className="text-xl font-bold">${parseFloat(tableHistory.stats.totalRevenue || 0).toFixed(2)}</div>
                  </div>
                  <div className="card-gradient p-3 text-center">
                    <div className="text-xs text-gray-500">Avg Order Value</div>
                    <div className="text-xl font-bold">${parseFloat(tableHistory.stats.avgOrderValue || 0).toFixed(2)}</div>
                  </div>
                  <div className="card-gradient p-3 text-center">
                    <div className="text-xs text-gray-500">Orders Today</div>
                    <div className="text-xl font-bold">{tableHistory.stats.ordersToday || 0}</div>
                  </div>
                  <div className="card-gradient p-3 text-center">
                    <div className="text-xs text-gray-500">Revenue Today</div>
                    <div className="text-xl font-bold">${parseFloat(tableHistory.stats.revenueToday || 0).toFixed(2)}</div>
                  </div>
                </div>
                {/* Order History */}
                <div>
                  <h4 className="text-md font-semibold mb-2">Recent Orders</h4>
                  {tableHistory.orders.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">No orders found for this table.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm border">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-3 py-2 border">Order #</th>
                            <th className="px-3 py-2 border">Status</th>
                            <th className="px-3 py-2 border">Total</th>
                            <th className="px-3 py-2 border">Created</th>
                            <th className="px-3 py-2 border">Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableHistory.orders.map(order => (
                            <tr key={order.id} className="border-b">
                              <td className="px-3 py-2 border font-mono">{order.orderNumber}</td>
                              <td className="px-3 py-2 border">{order.status}</td>
                              <td className="px-3 py-2 border">${parseFloat(order.total).toFixed(2)}</td>
                              <td className="px-3 py-2 border">{new Date(order.createdAt).toLocaleString()}</td>
                              <td className="px-3 py-2 border">{new Date(order.updatedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables; 