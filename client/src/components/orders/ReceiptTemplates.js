import React, { useState, useMemo } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import Icon from '../common/Icon';

const ReceiptTemplates = ({ onClose, onTemplateSelect }) => {
  const { getTaxRate } = useSettings();
  const [selectedTemplate, setSelectedTemplate] = useState('standard');

  const templates = [
    {
      id: 'standard',
      name: 'Standard Receipt',
      description: 'Classic receipt format with business info, items, and totals',
      features: ['Business header', 'Order details', 'Itemized list', 'Payment info', 'Footer'],
      preview: 'Standard format suitable for most businesses'
    },
    {
      id: 'minimal',
      name: 'Minimal Receipt',
      description: 'Clean, simple receipt with essential information only',
      features: ['Order number', 'Items', 'Total', 'Date'],
      preview: 'Minimal design for quick transactions'
    },
    {
      id: 'detailed',
      name: 'Detailed Receipt',
      description: 'Comprehensive receipt with all order and business details',
      features: ['Full business info', 'Detailed items', 'VAT breakdown', 'Payment methods', 'QR code', 'Terms'],
      preview: 'Comprehensive format for detailed records'
    },
    {
      id: 'kitchen',
      name: 'Kitchen Receipt',
      description: 'Kitchen-focused receipt for food preparation',
      features: ['Order number', 'Table info', 'Items with notes', 'Special instructions', 'Prep time'],
      preview: 'Optimized for kitchen staff and food preparation'
    },
    {
      id: 'manager',
      name: 'Manager Copy',
      description: 'Management copy with administrative details',
      features: ['Full order details', 'Cashier info', 'Payment breakdown', 'Business metrics', 'Audit trail'],
      preview: 'Administrative copy for management records'
    },
    {
      id: 'tax',
      name: 'VAT Receipt',
      description: 'VAT-compliant receipt for accounting purposes',
      features: ['VAT ID', 'Business registration', 'VAT breakdown', 'Compliance info', 'Legal footer'],
      preview: 'VAT-compliant format for accounting and legal requirements'
    }
  ];

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    if (onTemplateSelect) {
      onTemplateSelect(templateId);
    }
  };

  const selectedTemplateData = useMemo(() => {
    return templates.find(t => t.id === selectedTemplate) || templates[0];
  }, [selectedTemplate]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Icon name="template" className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Receipt Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Template List */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Template</h3>
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedTemplate === template.id && (
                      <Icon name="check" className="w-5 h-5 text-blue-600 ml-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Preview */}
          <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Preview</h3>
            
            {/* Preview Container */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="text-center mb-4">
                <h4 className="text-lg font-bold text-gray-900">{selectedTemplateData.name}</h4>
                <p className="text-sm text-gray-600">{selectedTemplateData.preview}</p>
              </div>

              {/* Template-specific preview content */}
              {selectedTemplate === 'standard' && (
                <div className="space-y-3 text-sm">
                  <div className="text-center border-b border-gray-300 pb-2">
                    <div className="font-bold">RESTAURANT NAME</div>
                    <div className="text-xs text-gray-600">123 Main St, City</div>
                    <div className="text-xs text-gray-600">Tel: (555) 123-4567</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Receipt #:</span>
                      <span className="font-bold">ORD-001</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>Dec 15, 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Table:</span>
                      <span>Table 5</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between">
                      <span>2x Burger</span>
                      <span>$24.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x Fries</span>
                      <span>$5.00</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>$29.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({getTaxRate()}%):</span>
                      <span>$2.90</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                      <span>TOTAL:</span>
                      <span>$31.90</span>
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-600 pt-2">
                    Thank you for your business!
                  </div>
                </div>
              )}

              {selectedTemplate === 'minimal' && (
                <div className="space-y-2 text-sm">
                  <div className="text-center font-bold">#ORD-001</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Burger x2</span>
                      <span>$24.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fries</span>
                      <span>$5.00</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-1">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>$31.90</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedTemplate === 'detailed' && (
                <div className="space-y-3 text-sm">
                  <div className="text-center border-b border-gray-300 pb-2">
                    <div className="font-bold text-lg">RESTAURANT NAME</div>
                    <div className="text-xs">123 Main Street, City, State 12345</div>
                    <div className="text-xs">Phone: (555) 123-4567 | Email: info@restaurant.com</div>
                    <div className="text-xs">Website: www.restaurant.com</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold">Order Information</div>
                      <div className="space-y-1 text-xs">
                        <div>Receipt #: ORD-001</div>
                        <div>Date: Dec 15, 2024</div>
                        <div>Time: 2:30 PM</div>
                        <div>Table: Table 5</div>
                        <div>Cashier: John Doe</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Customer Information</div>
                      <div className="space-y-1 text-xs">
                        <div>Name: Walk-in Customer</div>
                        <div>Phone: N/A</div>
                        <div>Email: N/A</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Order Items</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>2x Classic Burger</span>
                        <span>$24.00</span>
                      </div>
                      <div className="text-xs text-gray-600 ml-4">- No onions, Extra cheese</div>
                      <div className="flex justify-between">
                        <span>1x French Fries</span>
                        <span>$5.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>$29.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({getTaxRate()}%):</span>
                      <span>$2.90</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Service Charge:</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                      <span>TOTAL:</span>
                      <span>$31.90</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Payment Information</div>
                    <div className="text-xs space-y-1">
                      <div>Payment Method: Cash</div>
                      <div>Amount Paid: $35.00</div>
                      <div>Change: $3.10</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600 mb-2">Scan QR code for order details</div>
                    <div className="bg-gray-100 p-2 rounded text-xs font-mono">QR_CODE_DATA</div>
                  </div>
                  <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
                    <div>Thank you for your business!</div>
                    <div>Visit us again soon</div>
                    <div>Generated: Dec 15, 2024 2:30 PM</div>
                  </div>
                </div>
              )}

              {selectedTemplate === 'kitchen' && (
                <div className="space-y-3 text-sm">
                  <div className="text-center border-b-2 border-orange-300 pb-2">
                    <div className="font-bold text-lg text-orange-700">KITCHEN ORDER</div>
                    <div className="text-xs">#ORD-001 | Table 5 | 2:30 PM</div>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">
                      <div className="font-semibold">2x Classic Burger</div>
                      <div className="text-xs text-gray-600">- No onions, Extra cheese</div>
                      <div className="text-xs text-orange-600 font-semibold">Priority: High</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded border-l-4 border-green-400">
                      <div className="font-semibold">1x French Fries</div>
                      <div className="text-xs text-gray-600">- Regular size</div>
                      <div className="text-xs text-green-600 font-semibold">Ready in: 5 min</div>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-2">
                    <div className="text-xs">
                      <div className="font-semibold">Special Instructions:</div>
                      <div>Customer prefers well-done burger</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTemplate === 'manager' && (
                <div className="space-y-3 text-sm">
                  <div className="text-center border-b border-gray-300 pb-2">
                    <div className="font-bold text-lg">MANAGER COPY</div>
                    <div className="text-xs">Order #ORD-001 | Dec 15, 2024</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-semibold">Order Details</div>
                      <div className="space-y-1 text-xs">
                        <div>Table: Table 5</div>
                        <div>Cashier: John Doe (ID: 001)</div>
                        <div>Start Time: 2:25 PM</div>
                        <div>End Time: 2:30 PM</div>
                        <div>Duration: 5 minutes</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">Financial Details</div>
                      <div className="space-y-1 text-xs">
                        <div>Subtotal: $29.00</div>
                        <div>VAT: $2.90</div>
                        <div>Total: $31.90</div>
                        <div>Payment: Cash</div>
                        <div>Change: $3.10</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">Items Sold</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Classic Burger x2</span>
                        <span>$24.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>French Fries x1</span>
                        <span>$5.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-2">
                    <div className="text-xs">
                      <div className="font-semibold">Audit Information:</div>
                      <div>Order created: Dec 15, 2024 2:25 PM</div>
                      <div>Order completed: Dec 15, 2024 2:30 PM</div>
                      <div>System: POS v2.1.0</div>
                      <div>Transaction ID: TXN-001234</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedTemplate === 'tax' && (
                <div className="space-y-3 text-sm">
                  <div className="text-center border-b border-gray-300 pb-2">
                    <div className="font-bold text-lg">TAX RECEIPT</div>
                    <div className="text-xs">VAT ID: TX-123456789</div>
                    <div className="text-xs">Business Registration: BR-987654321</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Receipt #:</span>
                      <span className="font-bold">ORD-001</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>Dec 15, 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>2:30 PM</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-2">
                    <div className="font-semibold mb-2">Items</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>2x Classic Burger</span>
                        <span>$24.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x French Fries</span>
                        <span>$5.00</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>$29.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT ({getTaxRate()}%):</span>
                      <span>$2.90</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
                      <span>TOTAL:</span>
                      <span>$31.90</span>
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
                    <div>This receipt is valid for tax purposes</div>
                    <div>Keep this receipt for your records</div>
                    <div>For questions, contact: (555) 123-4567</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onTemplateSelect(selectedTemplate)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Icon name="check" className="w-4 h-4" />
            <span>Use Template</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptTemplates;

