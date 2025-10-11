const express = require('express');
const { PrismaClient } = require('@prisma/client');
const dayjs = require('dayjs');
const { requirePermission } = require('../middleware/permissions');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Test PDF generation endpoint
router.get('/test-pdf', (req, res) => {
  try {
    console.log('Testing PDF generation with PDFKit...');
    console.log('PDFDocument available:', typeof PDFDocument);
    
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      console.log('Test PDF buffer created, size:', pdfData.length);
      
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const uniqueFilename = `test-${timestamp}.pdf`;
      
      // Set cache-busting headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${uniqueFilename}`);
      res.setHeader('Content-Length', pdfData.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(pdfData);
    });
    
    // Add content to PDF
    doc.fontSize(20).text('Hello World!', 50, 50);
    doc.fontSize(12).text('This is a test PDF generated with PDFKit', 50, 80);
    doc.text('PDFKit is working correctly!', 50, 100);
    
    doc.end();
  } catch (error) {
    console.error('Test PDF generation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to generate PDF content using PDFKit
const generatePDF = (reportData, sections, format) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting PDF generation with PDFKit, data:', reportData);
      console.log('PDFDocument available:', typeof PDFDocument);

      const doc = new PDFDocument({ 
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        console.log('PDF buffer created successfully, size:', pdfData.length);
        resolve(pdfData);
      });
      doc.on('error', (error) => {
        console.error('PDF generation error:', error);
        reject(error);
      });

      // Page dimensions
      const pageWidth = 612;
      const pageHeight = 792;
      const margin = 50;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin + 30;

      // Helper function to check if content fits on current page
      const checkPageBreak = (requiredHeight) => {
        if (currentY + requiredHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin + 20;
          return true;
        }
        return false;
      };

      // Helper function to add section header
      const addSectionHeader = (title, icon = '') => {
        checkPageBreak(30);
        doc.rect(margin, currentY - 5, contentWidth, 20).fill('#ecf0f1');
        const headerText = icon ? `${icon} ${title}` : title;
        doc.fillColor('#2c3e50').fontSize(12).font('Helvetica-Bold').text(headerText, margin + 10, currentY);
        currentY += 25;
      };

      // Clean and organized header design
      const headerHeight = 80;
      doc.rect(0, 0, pageWidth, headerHeight).fill('#2c3e50');
      
      // Logo - try to use actual logo, fallback to text-based logo
      const logoSize = 50;
      const logoPath = path.join(__dirname, '../uploads/logo.jpg');
      
      try {
        // Check if logo file exists and try to add it
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, margin, 15, { width: logoSize, height: logoSize });
        } else {
          throw new Error('Logo file not found');
        }
      } catch (error) {
        // Fallback to text-based logo
        console.log('Using fallback logo:', error.message);
        doc.rect(margin, 15, logoSize, logoSize).fill('#3498db').stroke('white');
        doc.fillColor('white').fontSize(14).font('Helvetica-Bold');
        const logoText = reportData.restaurantInfo.restaurantName.substring(0, 2).toUpperCase();
        doc.text(logoText, margin + (logoSize / 2) - 8, 15 + (logoSize / 2) - 6);
      }
      
      // Left section - Restaurant info
      const leftX = margin + logoSize + 20;
      doc.fillColor('white').fontSize(20).font('Helvetica-Bold').text(reportData.restaurantInfo.restaurantName, leftX, 18);
      doc.fontSize(14).font('Helvetica').text('Sales Report', leftX, 35);
      doc.fontSize(10).text('Comprehensive Analysis', leftX, 48);
      
      // Right section - Report details (cleaner alignment)
      const rightX = pageWidth - margin - 200;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Date Range: ${reportData.dateRange}`, rightX, 20);
      doc.text(`Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`, rightX, 32);
      doc.text(`Report Type: Sales Analysis`, rightX, 44);
      
      // Bottom section - Contact info (centered and spaced)
      const centerX = pageWidth / 2 - 100;
      doc.fontSize(9).font('Helvetica');
      doc.text(`${reportData.restaurantInfo.address}`, centerX, 60);
      doc.text(`${reportData.restaurantInfo.phone} • ${reportData.restaurantInfo.email}`, centerX, 70);

      currentY = headerHeight + 15;

      // Add decorative line
      doc.strokeColor('#3498db').lineWidth(2).moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
      currentY += 20;
      
      // Add Filter Summary section if any filters are applied
      const hasFilters = reportData.filterNames && (
        (reportData.filterNames.cashiers && reportData.filterNames.cashiers.length > 0) ||
        (reportData.filterNames.shifts && reportData.filterNames.shifts.length > 0) ||
        (reportData.filterNames.categories && reportData.filterNames.categories.length > 0) ||
        (reportData.filterNames.products && reportData.filterNames.products.length > 0)
      );
      
      if (hasFilters) {
        addSectionHeader('Applied Filters');
        
        checkPageBreak(60);
        
        // Filter summary box
        doc.rect(margin, currentY, contentWidth, 50).fill('#f8f9fa').stroke('#dee2e6');
        
        let filterY = currentY + 10;
        
        // Cashier filter
        if (reportData.filterNames.cashiers && reportData.filterNames.cashiers.length > 0) {
          doc.fillColor('#2c3e50').fontSize(10).font('Helvetica-Bold').text('Cashiers:', margin + 10, filterY);
          doc.fillColor('#495057').fontSize(9).text(reportData.filterNames.cashiers.join(', '), margin + 80, filterY);
          filterY += 12;
        }
        
        // Shift filter
        if (reportData.filterNames.shifts && reportData.filterNames.shifts.length > 0) {
          doc.fillColor('#2c3e50').fontSize(10).font('Helvetica-Bold').text('Shifts:', margin + 10, filterY);
          doc.fillColor('#495057').fontSize(9).text(reportData.filterNames.shifts.join(', '), margin + 80, filterY);
          filterY += 12;
        }
        
        // Category filter
        if (reportData.filterNames.categories && reportData.filterNames.categories.length > 0) {
          doc.fillColor('#2c3e50').fontSize(10).font('Helvetica-Bold').text('Categories:', margin + 10, filterY);
          doc.fillColor('#495057').fontSize(9).text(reportData.filterNames.categories.join(', '), margin + 80, filterY);
          filterY += 12;
        }
        
        // Product filter
        if (reportData.filterNames.products && reportData.filterNames.products.length > 0) {
          doc.fillColor('#2c3e50').fontSize(10).font('Helvetica-Bold').text('Products:', margin + 10, filterY);
          doc.fillColor('#495057').fontSize(9).text(reportData.filterNames.products.join(', '), margin + 80, filterY);
          filterY += 12;
        }
        
        currentY += 60;
      }
      
      // Add sections based on selection
      if (sections.includes('summary') || sections.length === 0) {
        addSectionHeader('Sales Summary');

        // Summary cards style
        const summaryData = [
          { label: 'Total Revenue', value: `$${reportData.totalRevenue.toFixed(2)}`, color: '#27ae60' },
          { label: 'Total Orders', value: reportData.totalOrders.toString(), color: '#3498db' },
          { label: 'Total Items', value: reportData.totalItems.toString(), color: '#e74c3c' },
          { label: 'Average Order', value: `$${reportData.averageOrder.toFixed(2)}`, color: '#f39c12' }
        ];

        checkPageBreak(100);
        
        summaryData.forEach((item, index) => {
          const x = margin + (index % 2) * (contentWidth / 2 + 10);
          const y = currentY + Math.floor(index / 2) * 50;
          
          // Card background
          doc.rect(x, y, contentWidth / 2 - 5, 45).fill('#f8f9fa').stroke('#dee2e6');
          
          // Label
          doc.fillColor('#6c757d').fontSize(9).font('Helvetica').text(item.label, x + 8, y + 8);
          
          // Value
          doc.fillColor(item.color).fontSize(14).font('Helvetica-Bold').text(item.value, x + 8, y + 22);
        });
        
        currentY += 110;
      }
      
      if (sections.includes('payment-methods') || sections.length === 0) {
        addSectionHeader('Payment Methods');
        
        if (reportData.paymentMethods && reportData.paymentMethods.length > 0) {
          // Group payment methods by currency
          const paymentMethodsByCurrency = {};
          reportData.paymentMethods.forEach(method => {
            if (!paymentMethodsByCurrency[method.currency]) {
              paymentMethodsByCurrency[method.currency] = [];
            }
            paymentMethodsByCurrency[method.currency].push(method);
          });

          // Calculate totals for each currency
          const currencyTotals = {};
          Object.keys(paymentMethodsByCurrency).forEach(currency => {
            currencyTotals[currency] = paymentMethodsByCurrency[currency]
              .reduce((sum, method) => sum + method.revenue, 0);
          });

          // Calculate grand total across all currencies
          const grandTotal = Object.values(currencyTotals).reduce((sum, total) => sum + total, 0);

          // Display currencies in order: Riel first, then USD
          const currencyOrder = ['Riel', 'USD'];
          const availableCurrencies = currencyOrder.filter(currency => 
            paymentMethodsByCurrency[currency] && paymentMethodsByCurrency[currency].length > 0
          );

          availableCurrencies.forEach(currency => {
            const methods = paymentMethodsByCurrency[currency];
            const totalAmount = currencyTotals[currency];
            
            // Currency header
            doc.fillColor('#2c3e50').fontSize(12).font('Helvetica-Bold').text(currency, margin, currentY);
            currentY += 25;
            
            checkPageBreak(30 + (methods.length * 25) + 30);
            
            // Table header for this currency
            doc.rect(margin, currentY, contentWidth, 20).fill('#34495e');
            doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
            doc.text('Method', margin + 10, currentY + 6);
            doc.text('Currency', margin + 120, currentY + 6);
            doc.text('Amount', margin + 220, currentY + 6);
            doc.text('Percentage', margin + 350, currentY + 6);
            currentY += 25;
            
            // Payment method rows for this currency
            methods.forEach((method, index) => {
              const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
              doc.rect(margin, currentY, contentWidth, 20).fill(bgColor);
              
              doc.fillColor('#2c3e50').fontSize(9).font('Helvetica');
              doc.text(method.method, margin + 10, currentY + 6);
              doc.text(method.currency, margin + 120, currentY + 6);
              doc.text(`$${method.revenue.toFixed(2)}`, margin + 220, currentY + 6);
              doc.text(`${method.percentage.toFixed(2)}%`, margin + 350, currentY + 6);
              
              currentY += 25;
            });
            
            // Total row for this currency
            const currencyPercentage = grandTotal > 0 ? (totalAmount / grandTotal) * 100 : 0;
            doc.rect(margin, currentY, contentWidth, 20).fill('#e8f5e8');
            doc.fillColor('#27ae60').fontSize(10).font('Helvetica-Bold');
            doc.text('Total:', margin + 10, currentY + 6);
            doc.text(currency, margin + 120, currentY + 6);
            doc.text(`$${totalAmount.toFixed(2)}`, margin + 220, currentY + 6);
            doc.text(`${currencyPercentage.toFixed(2)}%`, margin + 350, currentY + 6);
            
            currentY += 35;
          });
        }
      }
      
      // Add Discounts section
      if (sections.includes('discounts') || sections.length === 0) {
        addSectionHeader('Discounts');
        
        const totalDiscounts = reportData.totalDiscounts || 0;
        const discountPercentage = reportData.totalRevenue > 0 ? (totalDiscounts / reportData.totalRevenue) * 100 : 0;
        
        checkPageBreak(50);
        
        // Discount cards
        doc.rect(margin, currentY, contentWidth / 2 - 10, 40).fill('#fff3cd').stroke('#ffeaa7');
        doc.fillColor('#856404').fontSize(10).font('Helvetica-Bold').text('Total Discounts', margin + 10, currentY + 8);
        doc.fillColor('#e74c3c').fontSize(16).text(`$${totalDiscounts.toFixed(2)}`, margin + 10, currentY + 22);
        
        doc.rect(margin + contentWidth / 2 + 10, currentY, contentWidth / 2 - 10, 40).fill('#d1ecf1').stroke('#bee5eb');
        doc.fillColor('#0c5460').fontSize(10).font('Helvetica-Bold').text('Discount Percentage', margin + contentWidth / 2 + 20, currentY + 8);
        doc.fillColor('#17a2b8').fontSize(16).text(`${discountPercentage.toFixed(2)}%`, margin + contentWidth / 2 + 20, currentY + 22);
        
        currentY += 60;
        
        // Discount Details Table
        if (reportData.discountDetails && reportData.discountDetails.length > 0) {
          const rowsToShow = Math.min(reportData.discountDetails.length, 15);
          checkPageBreak(30 + (rowsToShow * 25));
          
          // Table header
          doc.rect(margin, currentY, contentWidth, 20).fill('#34495e');
          doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
          doc.text('Order ID', margin + 10, currentY + 6);
          doc.text('Staff', margin + 80, currentY + 6);
          doc.text('Discount (%)', margin + 180, currentY + 6);
          doc.text('Amount', margin + 280, currentY + 6);
          doc.text('Date', margin + 380, currentY + 6);
          currentY += 25;
          
          // Discount detail rows
          reportData.discountDetails.slice(0, 15).forEach((detail, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.rect(margin, currentY, contentWidth, 20).fill(bgColor);
            
            doc.fillColor('#2c3e50').fontSize(9).font('Helvetica');
            doc.text(detail.orderId, margin + 10, currentY + 6);
            doc.text(detail.staff, margin + 80, currentY + 6);
            doc.text(`${detail.discountPercentage.toFixed(1)}%`, margin + 180, currentY + 6);
            doc.text(`$${detail.discountAmount.toFixed(2)}`, margin + 280, currentY + 6);
            doc.text(dayjs(detail.date).format('MM/DD/YYYY'), margin + 380, currentY + 6);
            
            currentY += 25;
          });
          
          currentY += 15;
        }
      }
      
      // Add Menu Performance section
      if (sections.includes('menu-performance') || sections.length === 0) {
        addSectionHeader('Menu Performance');
        
        if (reportData.menuPerformance && reportData.menuPerformance.length > 0) {
          const rowsToShow = Math.min(reportData.menuPerformance.length, 10);
          checkPageBreak(30 + (rowsToShow * 25));
          
          // Table header
          doc.rect(margin, currentY, contentWidth, 20).fill('#34495e');
          doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
          doc.text('Product', margin + 10, currentY + 6);
          doc.text('Quantity', margin + 300, currentY + 6);
          doc.text('Revenue', margin + 400, currentY + 6);
          currentY += 25;
          
          // Menu items
          reportData.menuPerformance.slice(0, 10).forEach((item, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.rect(margin, currentY, contentWidth, 20).fill(bgColor);
            
            doc.fillColor('#2c3e50').fontSize(9).font('Helvetica');
            doc.text(item.product, margin + 10, currentY + 6);
            doc.text(item.quantity.toString(), margin + 300, currentY + 6);
            doc.text(`$${item.revenue.toFixed(2)}`, margin + 400, currentY + 6);
            
            currentY += 25;
          });
          currentY += 15;
        }
      }
      
      // Add Category Sales section
      if (sections.includes('category-sales') || sections.length === 0) {
        addSectionHeader('Category Sales');
        
        if (reportData.categorySales && reportData.categorySales.length > 0) {
          checkPageBreak(30 + (reportData.categorySales.length * 25));
          
          // Table header
          doc.rect(margin, currentY, contentWidth, 20).fill('#34495e');
          doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
          doc.text('Category', margin + 10, currentY + 6);
          doc.text('Quantity', margin + 300, currentY + 6);
          doc.text('Revenue', margin + 400, currentY + 6);
          currentY += 25;
          
          // Category rows
          reportData.categorySales.forEach((category, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.rect(margin, currentY, contentWidth, 20).fill(bgColor);
            
            doc.fillColor('#2c3e50').fontSize(9).font('Helvetica');
            doc.text(category.category, margin + 10, currentY + 6);
            doc.text(category.quantity.toString(), margin + 300, currentY + 6);
            doc.text(`$${category.revenue.toFixed(2)}`, margin + 400, currentY + 6);
            
            currentY += 25;
          });
          currentY += 15;
        }
      }
      
      // Add Table Performance section
      if (sections.includes('table-performance') || sections.length === 0) {
        addSectionHeader('Table Performance');
        
        if (reportData.tablePerformance && reportData.tablePerformance.length > 0) {
          checkPageBreak(30 + (reportData.tablePerformance.length * 25));
          
          // Table header
          doc.rect(margin, currentY, contentWidth, 20).fill('#34495e');
          doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
          doc.text('Table', margin + 10, currentY + 6);
          doc.text('Orders', margin + 120, currentY + 6);
          doc.text('Revenue', margin + 200, currentY + 6);
          doc.text('Avg Order', margin + 320, currentY + 6);
          currentY += 25;
          
          // Table rows
          reportData.tablePerformance.forEach((table, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.rect(margin, currentY, contentWidth, 20).fill(bgColor);
            
            doc.fillColor('#2c3e50').fontSize(9).font('Helvetica');
            doc.text(`Table ${table.table}`, margin + 10, currentY + 6);
            doc.text(table.orders.toString(), margin + 120, currentY + 6);
            doc.text(`$${table.revenue.toFixed(2)}`, margin + 200, currentY + 6);
            doc.text(`$${table.averageOrder.toFixed(2)}`, margin + 320, currentY + 6);
            
            currentY += 25;
          });
          currentY += 15;
        }
      }
      
      // Add Peak Hours section
      if (sections.includes('peak-hours') || sections.length === 0) {
        addSectionHeader('Peak Hours');
        
        if (reportData.peakHours && reportData.peakHours.length > 0) {
          checkPageBreak(30 + (reportData.peakHours.length * 25));
          
          // Table header
          doc.rect(margin, currentY, contentWidth, 20).fill('#34495e');
          doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
          doc.text('Hour', margin + 10, currentY + 6);
          doc.text('Orders', margin + 150, currentY + 6);
          doc.text('Revenue', margin + 250, currentY + 6);
          currentY += 25;
          
          // Hour rows
          reportData.peakHours.forEach((hour, index) => {
            const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
            doc.rect(margin, currentY, contentWidth, 20).fill(bgColor);
            
            doc.fillColor('#2c3e50').fontSize(9).font('Helvetica');
            doc.text(`${hour.hour}:00`, margin + 10, currentY + 6);
            doc.text(hour.orders.toString(), margin + 150, currentY + 6);
            doc.text(`$${hour.revenue.toFixed(2)}`, margin + 250, currentY + 6);
            
            currentY += 25;
          });
          currentY += 15;
        }
      }
      
      // Add footer on last page
      const footerY = pageHeight - 40;
      doc.rect(0, footerY, pageWidth, 30).fill('#2c3e50');
      doc.fillColor('white').fontSize(9).font('Helvetica').text(`Generated by ${reportData.restaurantInfo.restaurantName}`, margin, footerY + 10);
      doc.text(`Page ${doc.bufferedPageRange().count} of ${doc.bufferedPageRange().count}`, pageWidth - margin - 50, footerY + 10);

      console.log('PDF content added, ending document...');
      doc.end();
    } catch (error) {
      console.error('PDF generation error in generatePDF function:', error);
      console.error('Error stack:', error.stack);
      reject(error);
    }
  });
};

// Helper function for realistic cost price calculations
const getRealisticCostPrice = (product) => {
  // Use actual cost price if available
  if (product.costPrice && parseFloat(product.costPrice) > 0) {
    return parseFloat(product.costPrice);
  }
  
  // Category-based realistic estimates based on restaurant industry standards
  const categoryEstimates = {
    'Beverages': 0.25,    // 25% cost (drinks have high margins)
    'Coffee': 0.20,       // 20% cost (coffee has very high margins)
    'Tea': 0.15,          // 15% cost (tea has extremely high margins)
    'Food': 0.40,         // 40% cost (food has moderate margins)
    'Appetizers': 0.35,   // 35% cost (appetizers have good margins)
    'Main Course': 0.45,  // 45% cost (main courses have lower margins)
    'Desserts': 0.35,     // 35% cost (desserts have good margins)
    'Salads': 0.50,       // 50% cost (salads have lower margins due to freshness)
    'Soups': 0.30,        // 30% cost (soups have good margins)
    'Sandwiches': 0.42,   // 42% cost (sandwiches have moderate margins)
    'Pizza': 0.38,        // 38% cost (pizza has good margins)
    'Pasta': 0.35,        // 35% cost (pasta has good margins)
    'Seafood': 0.55,      // 55% cost (seafood has lower margins)
    'Meat': 0.50,         // 50% cost (meat has lower margins)
    'Vegetarian': 0.45,   // 45% cost (vegetarian has moderate margins)
    'Kids Menu': 0.40,    // 40% cost (kids menu has moderate margins)
    'Specials': 0.45      // 45% cost (specials have moderate margins)
  };
  
  const categoryName = product.category?.name || 'Food';
  const estimate = categoryEstimates[categoryName] || 0.40; // Default to 40% for unknown categories
  
  return parseFloat(product.price) * estimate;
};

// Helper function to get date range
// Helper function to parse multi-select filter arrays
const parseFilterArray = (filterParam) => {
  if (!filterParam) return [];
  // Handle both formats: 'key[]' and 'key'
  const filterArray = Array.isArray(filterParam) ? filterParam : [filterParam];
  return filterArray.filter(Boolean).map(id => {
    // Convert to integer, handling both string and number inputs
    const parsed = parseInt(id);
    return isNaN(parsed) ? null : parsed;
  }).filter(id => id !== null);
};

// Helper function to build filter where clause
const buildFilterWhereClause = (req) => {
  // Check both formats: 'cashierIds[]' and 'cashierIds'
  const cashierIds = parseFilterArray(req.query['cashierIds[]'] || req.query.cashierIds);
  const shiftIds = parseFilterArray(req.query['shiftIds[]'] || req.query.shiftIds);
  const categoryIds = parseFilterArray(req.query['categoryIds[]'] || req.query.categoryIds);
  const productIds = parseFilterArray(req.query['productIds[]'] || req.query.productIds);

  console.log('Parsed filter IDs:', { cashierIds, shiftIds, categoryIds, productIds });

  const whereClause = {};

  // Cashier filter
  if (cashierIds.length > 0) {
    whereClause.userId = { in: cashierIds };
  }

  // Shift filter - need to handle separately to avoid conflict with userId
  if (shiftIds.length > 0) {
    // If we already have userId filter, we need to combine it with shift
    if (whereClause.userId) {
      // Need to use AND logic - find users that match both userId AND shiftId
      whereClause.AND = [
        { userId: whereClause.userId },
        { user: { shiftId: { in: shiftIds } } }
      ];
      delete whereClause.userId; // Remove to avoid conflict
    } else {
      whereClause.user = {
        shiftId: { in: shiftIds }
      };
    }
  }

  // Category/Product filter
  if (categoryIds.length > 0 || productIds.length > 0) {
    const productFilter = {};
    if (categoryIds.length > 0) {
      productFilter.categoryId = { in: categoryIds };
    }
    if (productIds.length > 0) {
      productFilter.id = { in: productIds };
    }
    
    whereClause.orderItems = {
      some: {
        product: productFilter
      }
    };
  }

  return whereClause;
};

const getDateRange = (range = 'today', startDate, endDate) => {
  let start, end;
  const now = dayjs();
  
  if (startDate && endDate) {
    // Validate custom date inputs
    const startDateObj = dayjs(startDate);
    const endDateObj = dayjs(endDate);
    
    if (!startDateObj.isValid() || !endDateObj.isValid()) {
      throw new Error('Invalid date format provided');
    }
    
    if (startDateObj.isAfter(endDateObj)) {
      throw new Error('Start date cannot be after end date');
    }
    
    // Allow future dates - they just won't have any data
    // Cap end date at current time if it's in the future to avoid confusion
    const cappedEndDate = endDateObj.isAfter(now) ? now : endDateObj;
    
    start = startDateObj.startOf('day');
    end = cappedEndDate.endOf('day');
  } else {
    switch (range) {
      case 'all':
        // Return all data - no date restrictions
        start = null;
        end = null;
        break;
      case 'today':
        start = now.startOf('day');
        end = now.endOf('day');
        break;
      case 'yesterday':
        start = now.subtract(1, 'day').startOf('day');
        end = now.subtract(1, 'day').endOf('day');
        break;
      case 'week':
        start = now.startOf('week');
        end = now.endOf('week');
        break;
      case 'lastWeek':
        start = now.subtract(1, 'week').startOf('week');
        end = now.subtract(1, 'week').endOf('week');
        break;
      case 'month':
        start = now.startOf('month');
        end = now.endOf('month');
        break;
      case 'lastMonth':
        start = now.subtract(1, 'month').startOf('month');
        end = now.subtract(1, 'month').endOf('month');
        break;
      case 'year':
        start = now.startOf('year');
        end = now.endOf('year');
        break;
      default:
        start = now.startOf('day');
        end = now.endOf('day');
    }
  }
  
  return { start, end };
};

// Helper function to build date filter conditionally
const buildDateFilter = (start, end) => {
  if (start === null || end === null) {
    return {}; // No date filtering for 'all' option
  }
  return {
    gte: start.toDate(),
    lte: end.toDate()
  };
};

// Get dashboard summary with date range
router.get('/dashboard', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Sales for the period
    const periodSales = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      _sum: {
        total: true
      },
      _count: true
    });

    // Average order value
    const averageOrder = periodSales._count > 0 
      ? (periodSales._sum.total || 0) / periodSales._count 
      : 0;

    // Pending orders count
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING'
      }
    });

    // Available tables count
    const availableTables = await prisma.table.count({
      where: {
        status: 'AVAILABLE',
        isActive: true
      }
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        todaySales: {
          total: periodSales._sum.total || 0,
          count: periodSales._count
        },
        averageOrder,
        pendingOrders,
        availableTables
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard summary'
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Server is working' });
});

// Sales Reports Routes
// Sales Summary
router.get('/sales/summary', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    console.log('Full query params:', req.query);
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build where clause with multi-select filters
    const filterWhere = buildFilterWhereClause(req);
    console.log('Filter where clause:', JSON.stringify(filterWhere, null, 2));
    
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...filterWhere
    };
    
    console.log('Final where clause:', JSON.stringify(whereClause, null, 2));

    // Add user include only if we need shift filter info
    const includeClause = {
      orderItems: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      }
    };

    // Always include user info for debugging
    includeClause.user = {
      select: {
        id: true,
        name: true,
        username: true,
        shiftId: true
      }
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${orders.length} orders matching filters`);
    
    // Debug: Show which users' orders were found
    if (orders.length > 0) {
      const userIds = [...new Set(orders.map(o => o.user?.id))];
      const userNames = [...new Set(orders.map(o => o.user?.name))];
      console.log('Orders from users:', userIds, userNames);
    }

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    
    console.log(`Total Revenue: $${totalRevenue}, Total Orders: ${totalOrders}`);
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Daily sales trend
    const dailySales = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!dailySales[date]) {
        dailySales[date] = { date, revenue: 0 };
      }
      dailySales[date].revenue += parseFloat(order.total);
    });

    // Payment method breakdown
    const paymentMethodBreakdown = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'UNKNOWN';
      const currency = order.currency || 'USD';
      const key = `${method}_${currency}`;
      
      if (!paymentMethodBreakdown[key]) {
        paymentMethodBreakdown[key] = {
          method: method,
          currency: currency,
          count: 0,
          revenue: 0,
          percentage: 0
        };
      }
      paymentMethodBreakdown[key].count += 1;
      paymentMethodBreakdown[key].revenue += parseFloat(order.total);
    });

    // Calculate percentages
    Object.values(paymentMethodBreakdown).forEach(method => {
      method.percentage = totalRevenue > 0 ? (method.revenue / totalRevenue) * 100 : 0;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        dailySales: Object.values(dailySales),
        paymentMethods: Object.values(paymentMethodBreakdown),
        orders: orders // Include all orders based on filter
      }
    });
  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily summary'
    });
  }
});

// Sales by Category
router.get('/sales/category-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get filter IDs
    const cashierIds = parseFilterArray(req.query['cashierIds[]'] || req.query.cashierIds);
    const shiftIds = parseFilterArray(req.query['shiftIds[]'] || req.query.shiftIds);
    const categoryIds = parseFilterArray(req.query['categoryIds[]'] || req.query.categoryIds);
    const productIds = parseFilterArray(req.query['productIds[]'] || req.query.productIds);

    // Build where clause for order items
    const whereClause = {
      order: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      }
    };

    if (cashierIds.length > 0) {
      whereClause.order.userId = { in: cashierIds };
    }

    if (shiftIds.length > 0) {
      if (whereClause.order.userId) {
        whereClause.order.AND = [
          { userId: whereClause.order.userId },
          { user: { shiftId: { in: shiftIds } } }
        ];
        delete whereClause.order.userId;
      } else {
        whereClause.order.user = {
          shiftId: { in: shiftIds }
        };
      }
    }

    if (categoryIds.length > 0) {
      whereClause.product = {
        categoryId: { in: categoryIds }
      };
    }

    if (productIds.length > 0) {
      whereClause.productId = { in: productIds };
    }

    const orderItems = await prisma.orderItem.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    const categorySales = {};
    orderItems.forEach(item => {
      const categoryName = item.product.category?.name || 'Unknown';
      if (!categorySales[categoryName]) {
        categorySales[categoryName] = { name: categoryName, revenue: 0, quantity: 0 };
      }
      
      // Ensure proper number conversion and validation
      const subtotal = parseFloat(item.subtotal) || 0;
      const quantity = parseInt(item.quantity) || 0;
      
      categorySales[categoryName].revenue += subtotal;
      categorySales[categoryName].quantity += quantity;
    });

    const categorySalesArray = Object.values(categorySales)
      .filter(item => item.revenue > 0 || item.quantity > 0) // Filter out empty categories
      .sort((a, b) => b.revenue - a.revenue)
      .map(item => ({
        name: item.name,
        revenue: parseFloat(item.revenue.toFixed(2)), // Ensure proper decimal formatting
        quantity: parseInt(item.quantity)
      }));

    console.log('Category sales response:', JSON.stringify({
      success: true,
      data: {
        categorySales: categorySalesArray
      }
    }, null, 2));
    
    res.json({
      success: true,
      data: {
        categorySales: categorySalesArray
      }
    });
  } catch (error) {
    console.error('Category sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get category sales'
    });
  }
});

// Sales by Item
router.get('/sales/item-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        }
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    const itemSales = {};
    orderItems.forEach(item => {
      const productId = item.productId;
      if (!itemSales[productId]) {
        itemSales[productId] = {
          id: productId,
          name: item.product.name,
          category: item.product.category.name,
          quantity: 0,
          revenue: 0,
          averagePrice: 0
        };
      }
      itemSales[productId].quantity += item.quantity;
      itemSales[productId].revenue += parseFloat(item.subtotal);
    });

    // Calculate average price
    Object.values(itemSales).forEach(item => {
      item.averagePrice = item.quantity > 0 ? item.revenue / item.quantity : 0;
    });

    // Get top items for chart
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        items: Object.values(itemSales),
        topItems
      }
    });
  } catch (error) {
    console.error('Item sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get item sales'
    });
  }
});

// Sales by Table
router.get('/sales/table-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        table: true
      }
    });

    const tableSales = {};
    orders.forEach(order => {
      const tableId = order.tableId;
      if (!tableSales[tableId]) {
        tableSales[tableId] = {
          id: tableId,
          number: order.table.number,
          orderCount: 0,
          revenue: 0,
          averageOrder: 0
        };
      }
      tableSales[tableId].orderCount += 1;
      tableSales[tableId].revenue += parseFloat(order.total);
    });

    // Calculate average order and utilization
    Object.values(tableSales).forEach(table => {
      table.averageOrder = table.orderCount > 0 ? table.revenue / table.orderCount : 0;
      table.utilization = Math.round((table.orderCount / 24) * 100); // Assuming 24 hours
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        tableSales: Object.values(tableSales),
        tableDetails: Object.values(tableSales)
      }
    });
  } catch (error) {
    console.error('Table sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table sales'
    });
  }
});

// Hourly Sales Report
router.get('/sales/hourly-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      }
    });

    const hourlySales = {};
    for (let i = 0; i < 24; i++) {
      hourlySales[i] = { hour: i, revenue: 0 };
    }

    orders.forEach(order => {
      const hour = dayjs(order.createdAt).hour();
      hourlySales[hour].revenue += parseFloat(order.total);
    });

    const hourlyData = Object.values(hourlySales);
    const totalRevenue = hourlyData.reduce((sum, hour) => sum + hour.revenue, 0);
    const averageHourly = totalRevenue / 24;
    const peakHour = hourlyData.reduce((max, hour) => hour.revenue > max.revenue ? hour : max);
    const slowHour = hourlyData.reduce((min, hour) => hour.revenue < min.revenue ? hour : min);

    res.json({
      success: true,
      data: {
        hourlySales: hourlyData,
        peakHours: {
          peak: `${peakHour.hour}:00`,
          average: averageHourly,
          slow: `${slowHour.hour}:00`
        }
      }
    });
  } catch (error) {
    console.error('Hourly sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hourly sales'
    });
  }
});

// Discount Report
router.get('/sales/discount-report', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        discount: {
          gt: 0
        },
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const totalDiscounts = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.discount), 0);
    const averageDiscount = totalDiscounts > 0 ? totalAmount / totalDiscounts : 0;
    const staffCount = new Set(orders.map(order => order.userId)).size;

    const discountDetails = orders.map(order => ({
      id: order.id,
      orderNumber: order.id,
      staffName: order.user.name,
      amount: parseFloat(order.discount),
      reason: 'Discount applied', // Default reason since discountReason field doesn't exist
      date: order.createdAt
    }));

    res.json({
      success: true,
      data: {
        discountSummary: {
          totalDiscounts,
          totalAmount,
          averageDiscount,
          staffCount
        },
        discountDetails
      }
    });
  } catch (error) {
    console.error('Discount report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discount report'
    });
  }
});

// Cancelled Sales Report
router.get('/sales/cancelled-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const cancelledOrders = await prisma.order.findMany({
      where: {
        status: 'CANCELLED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        table: true,
        user: {
          select: {
            name: true
          }
        }
      }
    });

    const totalCancelled = cancelledOrders.length;
    const lostRevenue = cancelledOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const staffCount = new Set(cancelledOrders.map(order => order.userId)).size;

    // Calculate cancellation rate
    const totalOrders = await prisma.order.count({
      where: {
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      }
    });
    const cancellationRate = totalOrders > 0 ? (totalCancelled / totalOrders) * 100 : 0;

    const cancelledDetails = cancelledOrders.map(order => ({
      id: order.id,
      orderNumber: order.id,
      tableNumber: order.table.number,
      staffName: order.user.name,
      amount: parseFloat(order.total),
      reason: 'Order cancelled', // Default reason since cancelReason field doesn't exist
      date: order.createdAt
    }));

    res.json({
      success: true,
      data: {
        cancelledSummary: {
          totalCancelled,
          lostRevenue,
          cancellationRate,
          staffCount
        },
        cancelledDetails
      }
    });
  } catch (error) {
    console.error('Cancelled sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cancelled sales report'
    });
  }
});

// Comparative Analysis Report
router.get('/comparative/period-analysis', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate, compareWith, period1StartDate, period1EndDate, period2StartDate, period2EndDate } = req.query;
    
    let start, end, compareStart, compareEnd;
    
    if (compareWith === 'custom') {
      // Use custom periods
      if (period1StartDate && period1EndDate && period2StartDate && period2EndDate) {
        start = dayjs(period2StartDate).startOf('day');
        end = dayjs(period2EndDate).endOf('day');
        compareStart = dayjs(period1StartDate).startOf('day');
        compareEnd = dayjs(period1EndDate).endOf('day');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Custom periods require both start and end dates for both periods'
        });
      }
    } else {
      // Handle quick filter comparisons
      if (compareWith === 'today_vs_yesterday') {
        start = dayjs().startOf('day');
        end = dayjs().endOf('day');
        compareStart = dayjs().subtract(1, 'day').startOf('day');
        compareEnd = dayjs().subtract(1, 'day').endOf('day');
      } else if (compareWith === 'week_vs_last_week') {
        start = dayjs().startOf('week');
        end = dayjs().endOf('week');
        compareStart = dayjs().subtract(1, 'week').startOf('week');
        compareEnd = dayjs().subtract(1, 'week').endOf('week');
      } else if (compareWith === 'month_vs_last_month') {
        start = dayjs().startOf('month');
        end = dayjs().endOf('month');
        compareStart = dayjs().subtract(1, 'month').startOf('month');
        compareEnd = dayjs().subtract(1, 'month').endOf('month');
      } else if (compareWith === 'year_vs_last_year') {
        start = dayjs().startOf('year');
        end = dayjs().endOf('year');
        compareStart = dayjs().subtract(1, 'year').startOf('year');
        compareEnd = dayjs().subtract(1, 'year').endOf('year');
      } else {
        // Use existing logic for other predefined comparisons
        const dateRange = getDateRange(range, startDate, endDate);
        start = dateRange.start;
        end = dateRange.end;
        
        const periodLength = end.diff(start, 'day');
        
        if (compareWith === 'previous_period') {
          compareEnd = start.subtract(1, 'day');
          compareStart = compareEnd.subtract(periodLength, 'day');
        } else if (compareWith === 'same_period_last_year') {
          compareStart = start.subtract(1, 'year');
          compareEnd = end.subtract(1, 'year');
        } else {
          // Default to previous period
          compareEnd = start.subtract(1, 'day');
          compareStart = compareEnd.subtract(periodLength, 'day');
        }
      }
    }

    // Get current period data
    const currentOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    // Get comparison period data
    const comparisonOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(compareStart && compareEnd ? { createdAt: buildDateFilter(compareStart, compareEnd) } : {})
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    // Calculate metrics for both periods
    const calculateMetrics = (orders) => {
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const totalOrders = orders.length;
      const totalItems = orders.reduce((sum, order) => 
        sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate total cost from order items using product cost prices
      const totalCost = orders.reduce((sum, order) => 
        sum + order.orderItems.reduce((itemSum, item) => {
          const costPrice = getRealisticCostPrice(item.product);
          return itemSum + (costPrice * item.quantity);
        }, 0), 0
      );
      
      // Calculate profit and margin
      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      
      return { 
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        totalCost,
        totalProfit,
        profitMargin
      };
    };

    const currentMetrics = calculateMetrics(currentOrders);
    const comparisonMetrics = calculateMetrics(comparisonOrders);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const growthAnalysis = {
      revenueGrowth: calculateGrowth(currentMetrics.totalRevenue, comparisonMetrics.totalRevenue),
      ordersGrowth: calculateGrowth(currentMetrics.totalOrders, comparisonMetrics.totalOrders),
      itemsGrowth: calculateGrowth(currentMetrics.totalItems, comparisonMetrics.totalItems),
      averageOrderGrowth: calculateGrowth(currentMetrics.averageOrder, comparisonMetrics.averageOrder)
    };

    // Add context and benchmarks to growth metrics
    const getGrowthContext = (value, metric) => {
      const thresholds = {
        revenue: { excellent: 25, good: 15, moderate: 5, poor: -5 },
        orders: { excellent: 20, good: 10, moderate: 3, poor: -3 },
        items: { excellent: 20, good: 10, moderate: 3, poor: -3 },
        averageOrder: { excellent: 15, good: 8, moderate: 2, poor: -2 }
      };
      
      const t = thresholds[metric] || thresholds.revenue;
      if (value >= t.excellent) return { level: 'excellent', color: 'green', icon: '🚀' };
      if (value >= t.good) return { level: 'good', color: 'blue', icon: '📈' };
      if (value >= t.moderate) return { level: 'moderate', color: 'yellow', icon: '📊' };
      if (value >= t.poor) return { level: 'poor', color: 'orange', icon: '⚠️' };
      return { level: 'critical', color: 'red', icon: '🔻' };
    };

    const growthWithContext = {
      revenue: {
        ...growthAnalysis,
        revenueGrowth: growthAnalysis.revenueGrowth,
        context: getGrowthContext(growthAnalysis.revenueGrowth, 'revenue')
      },
      orders: {
        growth: growthAnalysis.ordersGrowth,
        context: getGrowthContext(growthAnalysis.ordersGrowth, 'orders')
      },
      items: {
        growth: growthAnalysis.itemsGrowth,
        context: getGrowthContext(growthAnalysis.itemsGrowth, 'items')
      },
      averageOrder: {
        growth: growthAnalysis.averageOrderGrowth,
        context: getGrowthContext(growthAnalysis.averageOrderGrowth, 'averageOrder')
      }
    };

    res.json({
      success: true,
      data: {
        currentPeriod: {
          ...currentMetrics,
          period: start && end ? `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}` : 'All Time'
        },
        comparisonPeriod: {
          ...comparisonMetrics,
          period: compareStart && compareEnd ? `${compareStart.format('YYYY-MM-DD')} to ${compareEnd.format('YYYY-MM-DD')}` : 'All Time'
        },
        growthAnalysis,
        growthWithContext,
        comparisonType: compareWith || 'previous_period'
      }
    });
  } catch (error) {
    console.error('Period analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get period analysis'
    });
  }
});

// Sales Trends Report
router.get('/sales/sales-trends', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        orderItems: true
      }
    });

    // Daily trends
    const dailyTrends = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!dailyTrends[date]) {
        dailyTrends[date] = { date, revenue: 0, orders: 0, items: 0 };
      }
      dailyTrends[date].revenue += parseFloat(order.total);
      dailyTrends[date].orders += 1;
      dailyTrends[date].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Weekly trends
    const weeklyTrends = {};
    orders.forEach(order => {
      const week = dayjs(order.createdAt).format('YYYY-[W]WW');
      if (!weeklyTrends[week]) {
        weeklyTrends[week] = { week, revenue: 0, orders: 0, items: 0 };
      }
      weeklyTrends[week].revenue += parseFloat(order.total);
      weeklyTrends[week].orders += 1;
      weeklyTrends[week].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Monthly trends
    const monthlyTrends = {};
    orders.forEach(order => {
      const month = dayjs(order.createdAt).format('YYYY-MM');
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { month, revenue: 0, orders: 0, items: 0 };
      }
      monthlyTrends[month].revenue += parseFloat(order.total);
      monthlyTrends[month].orders += 1;
      monthlyTrends[month].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Growth analysis
    const dailyArray = Object.values(dailyTrends).sort((a, b) => a.date.localeCompare(b.date));
    const weeklyArray = Object.values(weeklyTrends).sort((a, b) => a.week.localeCompare(b.week));
    const monthlyArray = Object.values(monthlyTrends).sort((a, b) => a.month.localeCompare(b.month));

    const growthAnalysis = {
      dailyGrowth: dailyArray.length > 1 ? 
        ((dailyArray[dailyArray.length - 1].revenue - dailyArray[0].revenue) / dailyArray[0].revenue) * 100 : 0,
      weeklyGrowth: weeklyArray.length > 1 ? 
        ((weeklyArray[weeklyArray.length - 1].revenue - weeklyArray[0].revenue) / weeklyArray[0].revenue) * 100 : 0,
      monthlyGrowth: monthlyArray.length > 1 ? 
        ((monthlyArray[monthlyArray.length - 1].revenue - monthlyArray[0].revenue) / monthlyArray[0].revenue) * 100 : 0
    };

    res.json({
      success: true,
      data: {
        dailyTrends: dailyArray,
        weeklyTrends: weeklyArray,
        monthlyTrends: monthlyArray,
        growthAnalysis
      }
    });
  } catch (error) {
    console.error('Sales trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales trends report'
    });
  }
});

// Legacy sales route for backward compatibility
router.get('/sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const { start, end } = getDateRange(range, null, null);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        table: true,
        user: {
          select: {
            id: true,
            name: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by date for chart
    const salesByDate = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          total: 0,
          orders: 0,
          average: 0
        };
      }
      salesByDate[date].total += parseFloat(order.total);
      salesByDate[date].orders += 1;
    });

    // Calculate averages
    Object.values(salesByDate).forEach(day => {
      day.average = day.orders > 0 ? day.total / day.orders : 0;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: Object.values(salesByDate)
    });
  } catch (error) {
    console.error('Get sales data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales data'
    });
  }
});

// Get top products with date range
router.get('/top-products', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    
    let startDate, endDate;
    const now = dayjs();
    
    switch (range) {
      case 'today':
        startDate = now.startOf('day');
        endDate = now.endOf('day');
        break;
      case 'week':
        startDate = now.startOf('week');
        endDate = now.endOf('week');
        break;
      case 'month':
        startDate = now.startOf('month');
        endDate = now.endOf('month');
        break;
      case 'year':
        startDate = now.startOf('year');
        endDate = now.endOf('year');
        break;
      default:
        startDate = now.startOf('day');
        endDate = now.endOf('day');
    }

    const where = {
      order: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        }
      }
    };

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where,
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    });

    // Get product details
    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            category: true
          }
        });

        return {
          id: product.id,
          name: product.name,
          category: product.category.name,
          quantity: item._sum.quantity,
          revenue: item._sum.subtotal
        };
      })
    );

    res.json({
      success: true,
      data: productsWithDetails
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top products'
    });
  }
});

// Financial Reports Routes


// Enhanced Profit Report with Real Data and Category Analysis
router.get('/financial/profit', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    let totalRevenue = 0;
    let totalCost = 0;
    const categoryAnalysis = {};

    orders.forEach(order => {
      // Use order.total for accurate revenue (includes taxes, discounts, etc.)
      const orderRevenue = parseFloat(order.total);
      const orderSubtotal = order.orderItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      totalRevenue += orderRevenue;

      // Calculate costs from order items
      order.orderItems.forEach(item => {
        const costPrice = getRealisticCostPrice(item.product);
        const actualCost = costPrice * item.quantity;
        totalCost += actualCost;

        // Category analysis
        const categoryName = item.product.category?.name || 'Unknown';
        if (!categoryAnalysis[categoryName]) {
          categoryAnalysis[categoryName] = {
            category: categoryName,
            revenue: 0,
            cost: 0,
            profit: 0,
            quantity: 0,
            margin: 0
          };
        }
        
        // Distribute order revenue proportionally based on item subtotal
        const itemSubtotal = parseFloat(item.subtotal);
        const proportionalRevenue = orderSubtotal > 0 ? (itemSubtotal / orderSubtotal) * orderRevenue : 0;
        const profit = proportionalRevenue - actualCost;
        
        categoryAnalysis[categoryName].revenue += proportionalRevenue;
        categoryAnalysis[categoryName].cost += actualCost;
        categoryAnalysis[categoryName].profit += profit;
        categoryAnalysis[categoryName].quantity += item.quantity;
      });
    });

    // Calculate margins for each category
    Object.values(categoryAnalysis).forEach(cat => {
      cat.margin = cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0;
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Generate profit trend chart (daily breakdown)
    const dailyData = {};
    
    if (start && end) {
      const daysDiff = end.diff(start, 'day');
      
      for (let i = 0; i <= daysDiff; i++) {
        const currentDate = start.add(i, 'day');
        const dateKey = currentDate.format('YYYY-MM-DD');
        dailyData[dateKey] = { date: dateKey, revenue: 0, costs: 0, profit: 0 };
      }
    } else {
      // For 'all' range, create daily data from actual order dates
      orders.forEach(order => {
        const orderDate = dayjs(order.createdAt).format('YYYY-MM-DD');
        if (!dailyData[orderDate]) {
          dailyData[orderDate] = { date: orderDate, revenue: 0, costs: 0, profit: 0 };
        }
      });
    }

    // Aggregate daily data using the orders we already fetched

    orders.forEach(order => {
      const orderDate = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (dailyData[orderDate]) {
        const orderRevenue = parseFloat(order.total);
        let orderCost = 0;
        
        order.orderItems.forEach(item => {
          const costPrice = getRealisticCostPrice(item.product);
          orderCost += costPrice * item.quantity;
        });
        
        dailyData[orderDate].revenue += orderRevenue;
        dailyData[orderDate].costs += orderCost;
        dailyData[orderDate].profit += (orderRevenue - orderCost);
      }
    });

    const profitChart = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        profitSummary: {
          totalRevenue,
          totalCosts: totalCost,
          netProfit: grossProfit,
          profitMargin: Math.round(profitMargin * 100) / 100,
          period: start && end ? `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}` : 'All Time'
        },
        categoryAnalysis: Object.values(categoryAnalysis),
        profitChart
      }
    });
  } catch (error) {
    console.error('Profit report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profit report'
    });
  }
});


// Export Routes for each report type
// Comprehensive export endpoints (must come before generic sales export)
router.get('/sales/comprehensive/export', requirePermission('reports.view'), async (req, res) => {
  try {
    console.log('=== COMPREHENSIVE EXPORT CALLED ===');
    console.log('Query params:', req.query);
    const { range, startDate, endDate, format = 'pdf', sections = [] } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);
    console.log('Date range:', { start: start?.format('YYYY-MM-DD'), end: end?.format('YYYY-MM-DD') });
    console.log('Sections:', sections);

    // Build where clause with multi-select filters
    const filterWhere = buildFilterWhereClause(req);
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...filterWhere
    };

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        table: {
          select: {
            id: true,
            number: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${orders.length} orders for comprehensive export`);
    console.log('Sample order:', orders[0] ? {
      id: orders[0].id,
      total: orders[0].total,
      paymentMethod: orders[0].paymentMethod,
      currency: orders[0].currency,
      user: orders[0].user?.name
    } : 'No orders found');

    // Generate comprehensive report based on selected sections
    let reportContent = '';
    const header = `Sales Report - Comprehensive\nDate Range: ${start?.format('YYYY-MM-DD') || 'All'} to ${end?.format('YYYY-MM-DD') || 'All'}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    // Calculate summary metrics
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate payment breakdown for PDF generation
    const paymentBreakdown = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'UNKNOWN';
      const currency = order.currency || 'USD';
      const key = `${method}_${currency}`;
      
      if (!paymentBreakdown[key]) {
        paymentBreakdown[key] = {
          method: method,
          currency: currency,
          count: 0,
          revenue: 0
        };
      }
      paymentBreakdown[key].count += 1;
      paymentBreakdown[key].revenue += parseFloat(order.total);
    });

    // Calculate percentages for payment methods
    Object.values(paymentBreakdown).forEach(method => {
      method.percentage = totalRevenue > 0 ? (method.revenue / totalRevenue) * 100 : 0;
    });

    // Include sections based on selection
    if (sections.includes('summary') || sections.length === 0) {
      reportContent += header + `=== SALES SUMMARY ===\n`;
      reportContent += `Total Revenue,${totalRevenue}\n`;
      reportContent += `Total Orders,${totalOrders}\n`;
      reportContent += `Total Items,${totalItems}\n`;
      reportContent += `Average Order,${averageOrder.toFixed(2)}\n\n`;
    }

    if (sections.includes('payment-methods') || sections.length === 0) {
      reportContent += `=== PAYMENT METHODS ===\n`;
      reportContent += 'Payment Method,Currency,Count,Revenue,Percentage\n';
      Object.values(paymentBreakdown).forEach(method => {
        reportContent += `${method.method},${method.currency},${method.count},${method.revenue},${method.percentage.toFixed(2)}%\n`;
      });
      reportContent += '\n';
    }

    if (sections.includes('discounts') || sections.length === 0) {
      reportContent += `=== DISCOUNTS ===\n`;
      const totalDiscounts = orders.reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);
      const discountPercentage = totalRevenue > 0 ? (totalDiscounts / totalRevenue) * 100 : 0;
      reportContent += `Total Discounts,${totalDiscounts}\n`;
      reportContent += `Discount Percentage,${discountPercentage.toFixed(2)}%\n\n`;
    }

    if (sections.includes('menu-performance') || sections.length === 0) {
      reportContent += `=== MENU PERFORMANCE ===\n`;
      const productSales = {};
      orders.forEach(order => {
        order.orderItems.forEach(item => {
          const productName = item.product.name;
          if (!productSales[productName]) {
            productSales[productName] = {
              quantity: 0,
              revenue: 0
            };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.quantity * item.price;
        });
      });

      reportContent += 'Product,Quantity Sold,Revenue\n';
      Object.entries(productSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .forEach(([product, data]) => {
          reportContent += `${product},${data.quantity},${data.revenue.toFixed(2)}\n`;
        });
      reportContent += '\n';
    }

    if (sections.includes('category-sales') || sections.length === 0) {
      reportContent += `=== CATEGORY SALES ===\n`;
      const categorySales = {};
      orders.forEach(order => {
        order.orderItems.forEach(item => {
          const categoryName = item.product.category?.name || 'Uncategorized';
          if (!categorySales[categoryName]) {
            categorySales[categoryName] = {
              quantity: 0,
              revenue: 0
            };
          }
          categorySales[categoryName].quantity += item.quantity;
          categorySales[categoryName].revenue += item.quantity * item.price;
        });
      });

      reportContent += 'Category,Quantity Sold,Revenue\n';
      Object.entries(categorySales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([category, data]) => {
          reportContent += `${category},${data.quantity},${data.revenue.toFixed(2)}\n`;
        });
      reportContent += '\n';
    }

    if (sections.includes('table-performance') || sections.length === 0) {
      reportContent += `=== TABLE PERFORMANCE ===\n`;
      const tableSales = {};
      orders.forEach(order => {
        const tableNumber = order.table?.number || 'N/A';
        if (!tableSales[tableNumber]) {
          tableSales[tableNumber] = {
            orders: 0,
            revenue: 0
          };
        }
        tableSales[tableNumber].orders += 1;
        tableSales[tableNumber].revenue += parseFloat(order.total);
      });

      reportContent += 'Table,Orders,Revenue,Average Order\n';
      Object.entries(tableSales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([table, data]) => {
          const avgOrder = data.orders > 0 ? data.revenue / data.orders : 0;
          reportContent += `${table},${data.orders},${data.revenue.toFixed(2)},${avgOrder.toFixed(2)}\n`;
        });
      reportContent += '\n';
    }

    if (sections.includes('peak-hours') || sections.length === 0) {
      reportContent += `=== PEAK HOURS ===\n`;
      const hourlySales = {};
      orders.forEach(order => {
        const hour = dayjs(order.createdAt).format('HH');
        if (!hourlySales[hour]) {
          hourlySales[hour] = {
            orders: 0,
            revenue: 0
          };
        }
        hourlySales[hour].orders += 1;
        hourlySales[hour].revenue += parseFloat(order.total);
      });

      reportContent += 'Hour,Orders,Revenue\n';
      Object.entries(hourlySales)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .forEach(([hour, data]) => {
          reportContent += `${hour}:00,${data.orders},${data.revenue.toFixed(2)}\n`;
        });
    }

    console.log('Report content length:', reportContent.length);
    console.log('Report content preview:', reportContent.substring(0, 200));

    // Set appropriate content type and generate proper format
    if (format === 'excel') {
      // For now, return CSV format for Excel (can be enhanced with proper Excel generation)
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=sales-comprehensive-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
      res.send(reportContent);
    } else if (format === 'pdf') {
      try {
        console.log('=== ATTEMPTING PDF GENERATION ===');
        console.log('Format:', format);
        console.log('Sections:', sections);
        
        // Calculate additional data for PDF
        const totalDiscounts = orders.reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);
        
        // Get discount details for PDF
        const discountDetails = orders
          .filter(order => parseFloat(order.discount || 0) > 0)
          .map(order => ({
            orderId: order.id.toString().slice(-6),
            staff: order.user?.name || 'Unknown',
            discountAmount: parseFloat(order.discount || 0),
            discountPercentage: order.subtotal > 0 ? ((parseFloat(order.discount || 0) / parseFloat(order.subtotal || order.total)) * 100) : 0,
            date: order.createdAt
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Menu Performance
        const productSales = {};
        orders.forEach(order => {
          order.orderItems.forEach(item => {
            const productName = item.product.name;
            if (!productSales[productName]) {
              productSales[productName] = { quantity: 0, revenue: 0 };
            }
            productSales[productName].quantity += item.quantity;
            productSales[productName].revenue += item.quantity * item.price;
          });
        });
        const menuPerformance = Object.entries(productSales)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .slice(0, 10)
          .map(([product, data]) => ({ product, ...data }));
        
        // Category Sales
        const categorySales = {};
        orders.forEach(order => {
          order.orderItems.forEach(item => {
            const categoryName = item.product.category?.name || 'Uncategorized';
            if (!categorySales[categoryName]) {
              categorySales[categoryName] = { quantity: 0, revenue: 0 };
            }
            categorySales[categoryName].quantity += item.quantity;
            categorySales[categoryName].revenue += item.quantity * item.price;
          });
        });
        const categorySalesArray = Object.entries(categorySales)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .map(([category, data]) => ({ category, ...data }));
        
        // Table Performance
        const tableSales = {};
        orders.forEach(order => {
          const tableNumber = order.table?.number || 'N/A';
          if (!tableSales[tableNumber]) {
            tableSales[tableNumber] = { orders: 0, revenue: 0 };
          }
          tableSales[tableNumber].orders += 1;
          tableSales[tableNumber].revenue += parseFloat(order.total);
        });
        const tablePerformance = Object.entries(tableSales)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .map(([table, data]) => ({
            table,
            orders: data.orders,
            revenue: data.revenue,
            averageOrder: data.orders > 0 ? data.revenue / data.orders : 0
          }));
        
        // Peak Hours
        const hourlySales = {};
        orders.forEach(order => {
          const hour = dayjs(order.createdAt).format('HH');
          if (!hourlySales[hour]) {
            hourlySales[hour] = { orders: 0, revenue: 0 };
          }
          hourlySales[hour].orders += 1;
          hourlySales[hour].revenue += parseFloat(order.total);
        });
        const peakHours = Object.entries(hourlySales)
          .sort((a, b) => b[1].revenue - a[1].revenue)
          .map(([hour, data]) => ({ hour, ...data }));

        // Get restaurant settings for PDF header
        const businessSettings = await prisma.settings.findUnique({
          where: { category: 'business' }
        });
        
        const restaurantInfo = businessSettings ? JSON.parse(businessSettings.data) : {
          restaurantName: 'Restaurant POS',
          address: '123 Main Street, City, State 12345',
          phone: '+1 (555) 123-4567',
          email: 'info@restaurant.com'
        };

        // Get filter information for display
        const getFilterIds = (queryParam) => {
          if (!queryParam) return [];
          if (Array.isArray(queryParam)) {
            return queryParam.map(id => parseInt(id)).filter(id => !isNaN(id));
          }
          return queryParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        };

        const filterInfo = {
          cashiers: getFilterIds(req.query.cashierIds),
          shifts: getFilterIds(req.query.shiftIds),
          categories: getFilterIds(req.query.categoryIds),
          products: getFilterIds(req.query.productIds)
        };

        // Fetch filter names for display
        const filterNames = {};
        if (filterInfo.cashiers.length > 0) {
          const cashiers = await prisma.user.findMany({
            where: { id: { in: filterInfo.cashiers } },
            select: { name: true }
          });
          filterNames.cashiers = cashiers.map(c => c.name);
        }
        
        if (filterInfo.shifts.length > 0) {
          const shifts = await prisma.shift.findMany({
            where: { id: { in: filterInfo.shifts } },
            select: { name: true }
          });
          filterNames.shifts = shifts.map(s => s.name);
        }
        
        if (filterInfo.categories.length > 0) {
          const categories = await prisma.category.findMany({
            where: { id: { in: filterInfo.categories } },
            select: { name: true }
          });
          filterNames.categories = categories.map(c => c.name);
        }
        
        if (filterInfo.products.length > 0) {
          const products = await prisma.product.findMany({
            where: { id: { in: filterInfo.products } },
            select: { name: true }
          });
          filterNames.products = products.map(p => p.name);
        }

        // Generate proper PDF
        const reportData = {
          dateRange: `${start?.format('YYYY-MM-DD') || 'All'} to ${end?.format('YYYY-MM-DD') || 'All'}`,
          totalRevenue,
          totalOrders,
          totalItems,
          averageOrder,
          totalDiscounts,
          discountDetails,
          paymentMethods: Object.values(paymentBreakdown || {}),
          menuPerformance,
          categorySales: categorySalesArray,
          tablePerformance,
          peakHours,
          restaurantInfo,
          filterNames
        };
        
        console.log('Generating PDF with data:', {
          totalRevenue,
          totalOrders,
          totalItems,
          averageOrder,
          paymentMethodsCount: Object.values(paymentBreakdown || {}).length
        });
        
        const pdfBuffer = await generatePDF(reportData, sections, format);
        
        console.log('PDF buffer generated successfully, size:', pdfBuffer.length);
        console.log('PDF buffer type:', typeof pdfBuffer);
        console.log('PDF buffer constructor:', pdfBuffer.constructor.name);
        
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const uniqueFilename = `sales-comprehensive-${range}-${dayjs().format('YYYY-MM-DD')}-${timestamp}.pdf`;
        
        // Set cache-busting headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${uniqueFilename}`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(pdfBuffer);
        
        console.log('PDF response sent successfully');
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        console.error('Error stack:', pdfError.stack);
        console.log('Falling back to CSV format');
        // Fallback to CSV if PDF generation fails
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=sales-comprehensive-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
        res.send(reportContent);
      }
    } else {
      // Default to CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=sales-comprehensive-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
      res.send(reportContent);
    }
  } catch (error) {
    console.error('Comprehensive export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export comprehensive report'
    });
  }
});

// Sales Reports Export
router.get('/sales/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build where clause with multi-select filters
    const filterWhere = buildFilterWhereClause(req);
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...filterWhere
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        table: {
          select: {
            id: true,
            number: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content based on report type
    let csvContent = '';
    const header = `Sales Report: ${reportType}\nDate Range: ${start?.format('YYYY-MM-DD') || 'All'} to ${end?.format('YYYY-MM-DD') || 'All'}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    if (reportType === 'summary') {
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const totalOrders = orders.length;
      const totalItems = orders.reduce((sum, order) => 
        sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      
      csvContent = header + `Total Revenue,${totalRevenue}\nTotal Orders,${totalOrders}\nTotal Items,${totalItems}\nAverage Order,${totalOrders > 0 ? totalRevenue / totalOrders : 0}\n\n`;
      
      // Add order details
      csvContent += 'Order ID,Date,Table,Cashier,Items,Total,Payment Method,Currency\n';
      orders.forEach(order => {
        const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        csvContent += `${order.id},${dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')},${order.table?.number || 'N/A'},${order.user?.name || 'Unknown'},${itemCount},${order.total},${order.paymentMethod},${order.currency || 'USD'}\n`;
      });
    } else if (reportType === 'payment-methods') {
      // Payment method breakdown
      const paymentBreakdown = {};
      orders.forEach(order => {
        const method = order.paymentMethod || 'UNKNOWN';
        const currency = order.currency || 'USD';
        const key = `${method}_${currency}`;
        
        if (!paymentBreakdown[key]) {
          paymentBreakdown[key] = {
            method: method,
            currency: currency,
            count: 0,
            revenue: 0
          };
        }
        paymentBreakdown[key].count += 1;
        paymentBreakdown[key].revenue += parseFloat(order.total);
      });

      csvContent = header + 'Payment Method,Currency,Count,Revenue,Percentage\n';
      Object.values(paymentBreakdown).forEach(method => {
        const percentage = totalRevenue > 0 ? (method.revenue / totalRevenue) * 100 : 0;
        csvContent += `${method.method},${method.currency},${method.count},${method.revenue},${percentage.toFixed(2)}%\n`;
      });
    } else {
      csvContent = header + `No specific data available for ${reportType} export\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Staff Reports Export
router.get('/staff/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const csvContent = `Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Inventory Reports Export
router.get('/inventory/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const csvContent = `Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Financial Reports Export
router.get('/financial/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get financial data
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let csvContent = '';
    const header = `Financial Report: ${reportType}\nDate Range: ${start?.format('YYYY-MM-DD') || 'All'} to ${end?.format('YYYY-MM-DD') || 'All'}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    if (reportType === 'profit') {
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const totalTax = orders.reduce((sum, order) => sum + parseFloat(order.tax || 0), 0);
      const totalDiscounts = orders.reduce((sum, order) => sum + parseFloat(order.discount || 0), 0);
      const netRevenue = totalRevenue - totalDiscounts;
      
      csvContent = header + `Total Revenue,${totalRevenue}\nTotal Tax,${totalTax}\nTotal Discounts,${totalDiscounts}\nNet Revenue,${netRevenue}\n\n`;
      
      // Add daily breakdown
      csvContent += 'Date,Revenue,Tax,Discounts,Net Revenue\n';
      const dailyData = {};
      orders.forEach(order => {
        const date = dayjs(order.createdAt).format('YYYY-MM-DD');
        if (!dailyData[date]) {
          dailyData[date] = { revenue: 0, tax: 0, discounts: 0 };
        }
        dailyData[date].revenue += parseFloat(order.total);
        dailyData[date].tax += parseFloat(order.tax || 0);
        dailyData[date].discounts += parseFloat(order.discount || 0);
      });
      
      Object.entries(dailyData).forEach(([date, data]) => {
        const netRevenue = data.revenue - data.discounts;
        csvContent += `${date},${data.revenue},${data.tax},${data.discounts},${netRevenue}\n`;
      });
    } else if (reportType === 'tax') {
      const totalTax = orders.reduce((sum, order) => sum + parseFloat(order.tax || 0), 0);
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const taxRate = totalRevenue > 0 ? (totalTax / totalRevenue) * 100 : 0;
      
      csvContent = header + `Total Tax Collected,${totalTax}\nTotal Revenue,${totalRevenue}\nEffective Tax Rate,${taxRate.toFixed(2)}%\n\n`;
      
      // Add tax breakdown by order
      csvContent += 'Order ID,Date,Revenue,Tax Amount,Tax Rate\n';
      orders.forEach(order => {
        const orderTaxRate = parseFloat(order.total) > 0 ? (parseFloat(order.tax || 0) / parseFloat(order.total)) * 100 : 0;
        csvContent += `${order.id},${dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')},${order.total},${order.tax || 0},${orderTaxRate.toFixed(2)}%\n`;
      });
    } else {
      csvContent = header + `No specific data available for ${reportType} export\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Summary Reports Export
router.get('/summary/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const csvContent = `Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Operational Reports Routes
// Table Performance Report
router.get('/operational/table-performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        table: true
      }
    });

    const tables = await prisma.table.findMany({
      where: { isActive: true }
    });

    const tablePerformance = {};
    tables.forEach(table => {
      tablePerformance[table.id] = {
        id: table.id,
        number: table.number,
        orderCount: 0,
        revenue: 0,
        utilization: 0,
        averageTurnTime: 0,
        status: table.status
      };
    });

    orders.forEach(order => {
      const tableId = order.tableId;
      if (tablePerformance[tableId]) {
        tablePerformance[tableId].orderCount += 1;
        tablePerformance[tableId].revenue += parseFloat(order.total);
      }
    });

    // Calculate utilization and average turn time with realistic business hours
    const BUSINESS_HOURS_PER_DAY = 12; // 12 hours operation (e.g., 10 AM - 10 PM)
    const totalBusinessHours = Math.ceil(end.diff(start, 'day')) * BUSINESS_HOURS_PER_DAY;
    
    Object.values(tablePerformance).forEach(table => {
      // More realistic utilization calculation
      table.utilization = Math.min(100, Math.round((table.orderCount / Math.max(1, totalBusinessHours / 24)) * 100));
      table.averageTurnTime = table.orderCount > 0 ? Math.round(totalBusinessHours / table.orderCount) : 0;
    });

    const tableSummary = {
      totalTables: tables.length,
      averageUtilization: Math.round(
        Object.values(tablePerformance).reduce((sum, table) => sum + table.utilization, 0) / tables.length
      ),
      averageRevenuePerTable: Object.values(tablePerformance).reduce((sum, table) => sum + table.revenue, 0) / tables.length,
      averageTurnTime: Math.round(
        Object.values(tablePerformance).reduce((sum, table) => sum + table.averageTurnTime, 0) / tables.length
      )
    };

    res.json({
      success: true,
      data: {
        tableSummary,
        tablePerformance: Object.values(tablePerformance),
        tableDetails: Object.values(tablePerformance)
      }
    });
  } catch (error) {
    console.error('Table performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table performance report'
    });
  }
});

// Peak Hours Analysis
router.get('/operational/peak-hours', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      }
    });

    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: i, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      const hour = dayjs(order.createdAt).hour();
      hourlyData[hour].revenue += parseFloat(order.total);
      hourlyData[hour].orders += 1;
    });

    const hourlyArray = Object.values(hourlyData);
    const peakHour = hourlyArray.reduce((max, hour) => hour.revenue > max.revenue ? hour : max);
    const peakSummary = {
      peakHours: `${peakHour.hour}:00`,
      peakRevenue: peakHour.revenue,
      peakOrders: peakHour.orders
    };

    // Day of week analysis
    const dayOfWeekData = {};
    orders.forEach(order => {
      const day = dayjs(order.createdAt).format('dddd');
      if (!dayOfWeekData[day]) {
        dayOfWeekData[day] = { day, revenue: 0, orders: 0 };
      }
      dayOfWeekData[day].revenue += parseFloat(order.total);
      dayOfWeekData[day].orders += 1;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        peakSummary,
        hourlyData: hourlyArray,
        dayOfWeekData: Object.values(dayOfWeekData)
      }
    });
  } catch (error) {
    console.error('Peak hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get peak hours report'
    });
  }
});

// Service Efficiency Report
router.get('/operational/service-efficiency', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      }
    });

    const totalHours = (end.diff(start, 'hour') + 1);
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;

    const efficiencyMetrics = {
      averageOrderTime: Math.round(totalHours / totalOrders),
      ordersPerHour: Math.round(totalOrders / totalHours),
      revenuePerHour: totalRevenue / totalHours,
      efficiencyScore: Math.round((totalOrders / totalHours) * 100)
    };

    // Efficiency trends (daily)
    const efficiencyTrends = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!efficiencyTrends[date]) {
        efficiencyTrends[date] = { date, orderTime: 0, efficiency: 0, orders: 0 };
      }
      efficiencyTrends[date].orders += 1;
    });

    Object.values(efficiencyTrends).forEach(day => {
      day.orderTime = Math.round(24 / day.orders);
      day.efficiency = Math.round((day.orders / 24) * 100);
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        efficiencyMetrics,
        efficiencyTrends: Object.values(efficiencyTrends)
      }
    });
  } catch (error) {
    console.error('Service efficiency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service efficiency report'
    });
  }
});

// Capacity Planning Report
router.get('/operational/capacity-planning', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const tables = await prisma.table.findMany({
      where: { isActive: true }
    });

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      }
    });

    const totalSeats = tables.reduce((sum, table) => sum + table.capacity, 0);
    const totalHours = (end.diff(start, 'hour') + 1);
    const totalOrders = orders.length;
    const currentUtilization = Math.round((totalOrders / (totalSeats * totalHours)) * 100);

    const capacityMetrics = {
      optimalCapacity: totalSeats,
      currentUtilization,
      growthPotential: Math.max(0, 100 - currentUtilization)
    };

    const capacityRecommendations = [
      {
        icon: '🪑',
        title: 'Optimize Table Layout',
        description: 'Consider rearranging tables to maximize seating capacity during peak hours.',
        impact: 'Potential 15-20% increase in capacity utilization'
      },
      {
        icon: '⏰',
        title: 'Extend Peak Hour Operations',
        description: 'Increase staff during identified peak hours to handle more orders.',
        impact: 'Potential 25-30% increase in revenue during peak times'
      },
      {
        icon: '📊',
        title: 'Implement Reservation System',
        description: 'Better manage table allocation and reduce wait times.',
        impact: 'Potential 10-15% improvement in customer satisfaction'
      }
    ];

    res.json({
      success: true,
      data: {
        capacityMetrics,
        capacityRecommendations
      }
    });
  } catch (error) {
    console.error('Capacity planning error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get capacity planning report'
    });
  }
});

// Operational Metrics Report
router.get('/operational/operational-metrics', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalHours = (end.diff(start, 'hour') + 1);

    const kpis = {
      customerSatisfaction: 85, // Placeholder - would need customer feedback system
      tableTurnoverRate: Math.round(totalOrders / totalHours),
      staffProductivity: Math.round((totalOrders / totalHours) * 100),
      operationalEfficiency: Math.round((totalRevenue / totalHours) * 100)
    };

    // Metrics comparison (current vs previous period)
    const previousStart = start.subtract(end.diff(start, 'day'), 'day');
    const previousEnd = end.subtract(end.diff(start, 'day'), 'day');

    const previousOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: previousStart.toDate(),
          lte: previousEnd.toDate()
        }
      }
    });

    const previousRevenue = previousOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const previousOrdersCount = previousOrders.length;

    const metricsComparison = [
      {
        metric: 'Revenue',
        current: totalRevenue,
        previous: previousRevenue
      },
      {
        metric: 'Orders',
        current: totalOrders,
        previous: previousOrdersCount
      },
      {
        metric: 'Avg Order Value',
        current: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        previous: previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0
      }
    ];

    res.json({
      success: true,
      data: {
        kpis,
        metricsComparison
      }
    });
  } catch (error) {
    console.error('Operational metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get operational metrics report'
    });
  }
});

// Operational Reports Export
router.get('/operational/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const csvContent = `Operational Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=operational-${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report'
    });
  }
});

// Cashier-specific comprehensive export
router.get('/cashier-comprehensive/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate, format = 'pdf', sections = [] } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);
    const userId = req.user.id;

    // Get cashier's data for the period
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        table: {
          select: {
            id: true,
            number: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate cashier-specific report
    let reportContent = '';
    const header = `Cashier Report - Comprehensive\nDate Range: ${start?.format('YYYY-MM-DD') || 'All'} to ${end?.format('YYYY-MM-DD') || 'All'}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    // Calculate summary metrics
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Include sections based on selection (same logic as above but for cashier data)
    if (sections.includes('summary') || sections.length === 0) {
      reportContent += header + `=== MY SALES SUMMARY ===\n`;
      reportContent += `Total Revenue,${totalRevenue}\n`;
      reportContent += `Total Orders,${totalOrders}\n`;
      reportContent += `Total Items,${totalItems}\n`;
      reportContent += `Average Order,${averageOrder.toFixed(2)}\n\n`;
    }

    // Add other sections with cashier-specific data...
    // (Similar implementation as above but filtered for this cashier)

    // Set appropriate content type and generate proper format
    if (format === 'excel') {
      // For now, return CSV format for Excel
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cashier-comprehensive-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
      res.send(reportContent);
    } else if (format === 'pdf') {
      // Generate proper PDF for cashier
      const reportData = {
        dateRange: `${start?.format('YYYY-MM-DD') || 'All'} to ${end?.format('YYYY-MM-DD') || 'All'}`,
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        paymentMethods: [], // Add payment methods calculation if needed
      };
      
      const pdfBuffer = generatePDF(reportData, sections, format);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=cashier-comprehensive-${range}-${dayjs().format('YYYY-MM-DD')}.pdf`);
      res.send(Buffer.from(pdfBuffer));
    } else {
      // Default to CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cashier-comprehensive-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
      res.send(reportContent);
    }
  } catch (error) {
    console.error('Cashier comprehensive export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export cashier comprehensive report'
    });
  }
});

// Cashier-specific export endpoints
router.get('/cashier-:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);
    const userId = req.user.id;

    // Get cashier's data for the period
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        table: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content based on report type
    let csvContent = '';
    const header = `Cashier Report: ${reportType}\nDate Range: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    if (reportType === 'summary') {
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const totalOrders = orders.length;
      const totalItems = orders.reduce((sum, order) => 
        sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      );
      
      csvContent = header + `Total Revenue,${totalRevenue}\nTotal Orders,${totalOrders}\nTotal Items,${totalItems}\nAverage Order,${totalOrders > 0 ? totalRevenue / totalOrders : 0}\n\n`;
      
      // Add order details
      csvContent += 'Order ID,Date,Table,Items,Total,Payment Method\n';
      orders.forEach(order => {
        const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        csvContent += `${order.id},${dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')},${order.table?.number || 'N/A'},${itemCount},${order.total},${order.paymentMethod}\n`;
      });
    } else {
      csvContent = header + `No specific data available for ${reportType} export\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=cashier-${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Cashier export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export cashier report'
    });
  }
});

// Legacy export route for backward compatibility
router.get('/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range = 'today' } = req.query;
    const { start, end } = getDateRange(range, null, null);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        table: true,
        user: {
          select: {
            name: true
          }
        },
        orderItems: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Generate CSV content
    const csvHeader = 'Order ID,Date,Table,Items,Total,Payment Method,Cashier\n';
    const csvRows = orders.map(order => {
      const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
      return `${order.id},${dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')},${order.table.number},${itemCount},${order.total},${order.paymentMethod},${order.user.name}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Export sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export sales report'
    });
  }
});

// Get order statistics
router.get('/order-stats', requirePermission('reports.view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const stats = await prisma.order.groupBy({
      by: ['status'],
      where,
      _count: true,
      _sum: {
        total: true
      }
    });

    const totalOrders = await prisma.order.count({ where });
    const totalRevenue = await prisma.order.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { total: true }
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        byStatus: stats,
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get order statistics'
    });
  }
});

// Inventory Reports Routes
// Current Stock Report
router.get('/inventory/current-stock', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const stock = await prisma.stock.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        quantity: 'asc'
      }
    });

    const totalItems = stock.length;
    const totalValue = stock.reduce((sum, item) => sum + (item.quantity * parseFloat(item.product.price)), 0);
    const lowStockItems = stock.filter(item => item.quantity <= item.minStock).length;

    res.json({
      success: true,
      data: {
        stock,
        stockSummary: {
          totalItems,
          totalValue,
          lowStockItems,
          inStock: stock.filter(item => item.quantity > 0).length,
          lowStock: lowStockItems
        },
        stockDetails: stock.map(item => ({
          id: item.id,
          name: item.product.name,
          category: item.product.category.name,
          quantity: item.quantity,
          minStock: item.minStock,
          unitPrice: parseFloat(item.product.price),
          totalValue: item.quantity * parseFloat(item.product.price),
          status: item.quantity === 0 ? 'Out of Stock' : 
                  item.quantity <= item.minStock ? 'Low Stock' : 'In Stock'
        }))
      }
    });
  } catch (error) {
    console.error('Current stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current stock report'
    });
  }
});

// Low Stock Alert
router.get('/inventory/low-stock-alert', requirePermission('reports.view'), async (req, res) => {
  try {
    // Fetch all stock items and filter in application layer
    // Prisma doesn't support comparing two fields (quantity <= minStock) in a where clause
    const allStock = await prisma.stock.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        quantity: 'asc'
      }
    });

    // Filter for low stock items (quantity <= minStock)
    const lowStockItems = allStock.filter(item => item.quantity <= item.minStock);

    // Transform to expected format with simplified structure for dashboard
    const alertsFormatted = lowStockItems.map(item => ({
      id: item.id,
      productName: item.product.name,
      category: item.product.category.name,
      currentStock: item.quantity,
      minStock: item.minStock,
      deficit: Math.max(0, item.minStock - item.quantity),
      lastUpdated: item.updatedAt,
      alertLevel: item.quantity === 0 ? 'Critical' : 'Low Stock'
    }));

    res.json({
      success: true,
      data: alertsFormatted,
      alertSummary: {
        criticalItems: lowStockItems.filter(item => item.quantity === 0).length,
        lowStockItems: lowStockItems.filter(item => item.quantity > 0 && item.quantity <= item.minStock).length,
        totalAlerts: lowStockItems.length,
        potentialLoss: lowStockItems.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0)
      }
    });
  } catch (error) {
    console.error('Low stock alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get low stock alert'
    });
  }
});

// Stock In/Out Report
router.get('/inventory/stock-in-out', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get stock logs for the specified date range
    const stockLogs = await prisma.stockLog.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        stock: {
          include: {
            product: {
              select: {
                name: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate summary statistics
    const stockIn = stockLogs.filter(log => log.type === 'ADD').reduce((sum, log) => sum + log.quantity, 0);
    const stockOut = stockLogs.filter(log => log.type === 'REMOVE').reduce((sum, log) => sum + log.quantity, 0);
    const adjustments = stockLogs.filter(log => log.type === 'ADJUST').reduce((sum, log) => sum + log.quantity, 0);
    const totalTransactions = stockLogs.length;

    // Group by product for detailed breakdown
    const productBreakdown = stockLogs.reduce((acc, log) => {
      const productName = log.stock.product.name;
      
      if (!acc[productName]) {
        acc[productName] = {
          productName,
          category: log.stock.product.category.name,
          stockIn: 0,
          stockOut: 0,
          adjustments: 0,
          transactions: 0
        };
      }
      
      acc[productName].transactions += 1;
      
      if (log.type === 'ADD') {
        acc[productName].stockIn += log.quantity;
      } else if (log.type === 'REMOVE') {
        acc[productName].stockOut += log.quantity;
      } else if (log.type === 'ADJUST') {
        acc[productName].adjustments += log.quantity;
      }
      
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          stockIn,
          stockOut,
          adjustments,
          totalTransactions,
          netMovement: stockIn - stockOut
        },
        productBreakdown: Object.values(productBreakdown),
        stockLogs: stockLogs.map(log => ({
          id: log.id,
          date: log.createdAt,
          type: log.type,
          quantity: log.quantity,
          productName: log.stock.product.name,
          category: log.stock.product.category.name,
          user: log.user.name,
          note: log.note
        }))
      }
    });
  } catch (error) {
    console.error('Stock in/out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock in/out report'
    });
  }
});


// Stock Value Report
router.get('/inventory/stock-value', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const stock = await prisma.stock.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    const stockValue = stock.reduce((sum, item) => sum + (item.quantity * parseFloat(item.product.price)), 0);
    const categoryValues = {};

    stock.forEach(item => {
      const categoryName = item.product.category.name;
      if (!categoryValues[categoryName]) {
        categoryValues[categoryName] = { name: categoryName, value: 0, items: 0 };
      }
      categoryValues[categoryName].value += item.quantity * parseFloat(item.product.price);
      categoryValues[categoryName].items += 1;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        totalValue: stockValue,
        categoryValues: Object.values(categoryValues),
        stockItems: stock.length
      }
    });
  } catch (error) {
    console.error('Stock value error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock value report'
    });
  }
});

// Legacy stock route for backward compatibility
router.get('/stock', requirePermission('stock.read'), async (req, res) => {
  try {
    const { lowStock, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (lowStock === 'true') {
      where.quantity = {
        lte: prisma.stock.fields.minStock
      };
    }

    const stock = await prisma.stock.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        quantity: 'asc'
      },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.stock.count({ where });

    // Calculate stock value
    const stockValue = stock.reduce((total, item) => {
      return total + (item.quantity * parseFloat(item.product.price));
    }, 0);

    res.json({
      success: true,
      data: stock,
      summary: {
        totalItems: total,
        totalValue: stockValue,
        lowStockItems: stock.filter(item => item.quantity <= item.minStock).length
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get stock report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock report'
    });
  }
});

// Get cashier dashboard data
router.get('/cashier-dashboard', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get cashier's orders today
    const myOrdersToday = await prisma.order.count({
      where: {
        userId: userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get cashier's sales today
    const mySalesToday = await prisma.order.aggregate({
      where: {
        userId: userId,
        status: 'COMPLETED',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        total: true
      }
    });

    // Get pending orders (only cashier's own pending orders)
    const pendingOrders = await prisma.order.count({
      where: {
        userId: userId,
        status: 'PENDING'
      }
    });

    // Get available tables
    const availableTables = await prisma.table.count({
      where: {
        status: 'AVAILABLE',
        isActive: true
      }
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        myOrdersToday,
        mySalesToday: mySalesToday._sum.total || 0,
        pendingOrders,
        availableTables
      }
    });
  } catch (error) {
    console.error('Get cashier dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier dashboard data'
    });
  }
});

// Get cashier-specific sales data
router.get('/cashier-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get cashier's sales for the period
    const sales = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      select: {
        total: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date for chart data
    const salesByDate = {};
    sales.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, revenue: 0, orders: 0 };
      }
      salesByDate[date].revenue += parseFloat(order.total);
      salesByDate[date].orders += 1;
    });

    const chartData = Object.values(salesByDate);

    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Get cashier sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier sales data'
    });
  }
});

// Get cashier-specific top products
router.get('/cashier-top-products', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate, limit = 5 } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          userId: userId,
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: parseInt(limit)
    });

    // Get product details
    const productIds = topProducts.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: { select: { name: true } } }
    });

    const result = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        category: product?.category?.name || 'Unknown',
        quantity: item._sum.quantity || 0,
        revenue: item._sum.subtotal || 0
      };
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get cashier top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier top products data'
    });
  }
});

// Get cashier-specific sales summary (same as Admin but filtered for cashier)
router.get('/cashier-summary', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    console.log(`Cashier ${userId} requesting summary for range: ${range}`);

    // Build where clause - same as Admin but filtered for specific cashier
    const whereClause = {
      userId: userId, // ✅ Filter for specific cashier
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
    };

    // Same include clause as Admin endpoint for full data
    const includeClause = {
      orderItems: {
        include: {
          product: {
            include: {
              category: true
            }
          }
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          shiftId: true
        }
      }
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${orders.length} orders for cashier ${userId}`);

    // Calculate totals - same logic as Admin endpoint
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Daily sales trend - same format as Admin
    const dailySales = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!dailySales[date]) {
        dailySales[date] = { date, revenue: 0 };
      }
      dailySales[date].revenue += parseFloat(order.total);
    });

    // Payment method breakdown - same logic as Admin
    const paymentMethodBreakdown = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'UNKNOWN';
      const currency = order.currency || 'USD';
      const key = `${method}_${currency}`;
      
      if (!paymentMethodBreakdown[key]) {
        paymentMethodBreakdown[key] = {
          method: method,
          currency: currency,
          count: 0,
          revenue: 0,
          percentage: 0
        };
      }
      paymentMethodBreakdown[key].count += 1;
      paymentMethodBreakdown[key].revenue += parseFloat(order.total);
    });

    // Calculate percentages
    Object.values(paymentMethodBreakdown).forEach(method => {
      method.percentage = totalRevenue > 0 ? (method.revenue / totalRevenue) * 100 : 0;
    });

    // Return same structure as Admin endpoint
    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        dailySales: Object.values(dailySales),
        paymentMethods: Object.values(paymentMethodBreakdown),
        orders: orders // ✅ Full order details like Admin endpoint
      }
    });
  } catch (error) {
    console.error('Get cashier summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier summary data'
    });
  }
});

// Get cashier-specific menu performance
router.get('/cashier-menu-performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const menuPerformance = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          userId: userId,
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      },
      _avg: {
        price: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      }
    });

    // Get product details
    const productIds = menuPerformance.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: { select: { name: true } } }
    });

    const result = menuPerformance.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        id: item.productId, // ✅ Match Admin structure
        name: product?.name || 'Unknown Product', // ✅ Use 'name' instead of 'productName'
        category: product?.category?.name || 'Unknown',
        quantity: item._sum.quantity || 0, // ✅ Use 'quantity' instead of 'quantitySold'
        revenue: item._sum.subtotal || 0,
        averagePrice: item._avg.price || 0,
        price: product?.price || 0
      };
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        topItems: result.slice(0, 10).map(item => ({
          name: item.productName,
          revenue: item.revenue,
          quantity: item.quantitySold
        })),
        items: result
      }
    });
  } catch (error) {
    console.error('Get cashier menu performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier menu performance data'
    });
  }
});

// Get cashier-specific category sales
router.get('/cashier-category-sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          userId: userId,
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        }
      },
      _sum: {
        quantity: true,
        subtotal: true
      }
    });

    // Get product categories
    const productIds = orderItems.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: { select: { name: true } } }
    });

    // Group by category
    const categoryData = {};
    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const categoryName = product?.category?.name || 'Unknown';
      
      if (!categoryData[categoryName]) {
        categoryData[categoryName] = {
          category: categoryName,
          revenue: 0,
          quantity: 0,
          orderCount: 0
        };
      }
      
      // Ensure proper number conversion and validation
      const subtotal = parseFloat(item._sum.subtotal) || 0;
      const quantity = parseInt(item._sum.quantity) || 0;
      
      categoryData[categoryName].revenue += subtotal;
      categoryData[categoryName].quantity += quantity;
      categoryData[categoryName].orderCount += 1;
    });

    const categorySalesArray = Object.values(categoryData)
      .filter(item => item.revenue > 0 || item.quantity > 0) // Filter out empty categories
      .sort((a, b) => b.revenue - a.revenue)
      .map(item => ({
        name: item.category,
        revenue: parseFloat(item.revenue.toFixed(2)), // Ensure proper decimal formatting
        quantity: parseInt(item.quantity),
        orderCount: parseInt(item.orderCount)
      }));

    console.log('Cashier category sales response:', JSON.stringify({
      success: true,
      data: {
        categorySales: categorySalesArray
      }
    }, null, 2));
    
    res.json({
      success: true,
      data: {
        categorySales: categorySalesArray
      }
    });
  } catch (error) {
    console.error('Get cashier category sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier category sales data'
    });
  }
});

// Get cashier-specific peak hours
router.get('/cashier-peak-hours', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get orders with their creation times
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      select: {
        total: true,
        createdAt: true
      }
    });

    // Group by hour
    const hourlyData = {};
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          hour: hourKey,
          revenue: 0,
          orders: 0
        };
      }
      
      hourlyData[hourKey].revenue += parseFloat(order.total);
      hourlyData[hourKey].orders += 1;
    });

    // Fill in missing hours with zero data
    for (let i = 0; i < 24; i++) {
      const hourKey = `${i.toString().padStart(2, '0')}:00`;
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          hour: hourKey,
          revenue: 0,
          orders: 0
        };
      }
    }

    const hourlySales = Object.values(hourlyData).sort((a, b) => 
      parseInt(a.hour.split(':')[0]) - parseInt(b.hour.split(':')[0])
    );

    // Find peak and slow hours
    const sortedByRevenue = hourlySales.sort((a, b) => b.revenue - a.revenue);
    const peakHour = sortedByRevenue.length > 0 ? sortedByRevenue[0].hour : 'N/A';
    const slowHour = sortedByRevenue.length > 0 ? sortedByRevenue[sortedByRevenue.length - 1].hour : 'N/A';
    const averageRevenue = hourlySales.reduce((sum, hour) => sum + hour.revenue, 0) / 24;

    res.json({
      success: true,
      data: {
        peakHours: {
          peak: peakHour,
          slow: slowHour,
          average: averageRevenue
        },
        hourlySales
      }
    });
  } catch (error) {
    console.error('Get cashier peak hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier peak hours data'
    });
  }
});

// Get cashier-specific activity
router.get('/cashier-activity', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get cashier's orders for the period
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        table: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate activity metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'COMPLETED').length;
    const pendingOrders = orders.filter(order => order.status === 'PENDING').length;
    const cancelledOrders = orders.filter(order => order.status === 'CANCELLED').length;
    
    const totalRevenue = orders
      .filter(order => order.status === 'COMPLETED')
      .reduce((sum, order) => sum + parseFloat(order.total), 0);

    const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        recentOrders: orders.slice(0, 10).map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          tableName: order.table.name,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get cashier activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier activity data'
    });
  }
});

// Get cashier-specific discounts
router.get('/cashier-discounts', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get cashier's orders with discounts
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
        discount: {
          gt: 0.00
        }
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        discount: true,
        subtotal: true,
        createdAt: true,
        table: {
          select: { number: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate discount summary
    const totalDiscountAmount = orders.reduce((sum, order) => sum + parseFloat(order.discount), 0);
    const totalOrdersWithDiscounts = orders.length;
    const averageDiscount = totalOrdersWithDiscounts > 0 ? totalDiscountAmount / totalOrdersWithDiscounts : 0;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const discountPercentage = totalRevenue > 0 ? (totalDiscountAmount / totalRevenue) * 100 : 0;

    // Group discounts by amount ranges
    const discountRanges = {
      '0-5%': 0,
      '5-10%': 0,
      '10-15%': 0,
      '15%+': 0
    };

    orders.forEach(order => {
      const subtotal = parseFloat(order.subtotal) || 0;
      const discount = parseFloat(order.discount) || 0;
      const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;
      
      if (discountPercent < 5) discountRanges['0-5%']++;
      else if (discountPercent < 10) discountRanges['5-10%']++;
      else if (discountPercent < 15) discountRanges['10-15%']++;
      else discountRanges['15%+']++;
    });

    const discountChart = Object.entries(discountRanges).map(([range, count]) => ({
      range,
      count,
      percentage: totalOrdersWithDiscounts > 0 ? (count / totalOrdersWithDiscounts) * 100 : 0
    }));

    const responseData = {
      success: true,
      data: {
        discountSummary: {
          totalDiscounts: totalOrdersWithDiscounts, // Count of orders with discounts
          totalAmount: totalDiscountAmount, // Total discount amount
          averageDiscount,
          staffCount: 1 // For cashier, it's always 1
        },
        discountChart,
        discountDetails: orders.slice(0, 10).map(order => {
          const subtotal = parseFloat(order.subtotal) || 0;
          const discount = parseFloat(order.discount) || 0;
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            staffName: req.user.name, // Cashier's name
            amount: discount,
            reason: 'Discount applied',
            date: order.createdAt
          };
        })
      }
    };
    
    console.log('Cashier discounts response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error('Get cashier discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier discounts data'
    });
  }
});

// Staff Reports Routes
// Sales by Cashier
router.get('/staff/sales-by-cashier', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const cashierSales = {};
    orders.forEach(order => {
      const userId = order.userId;
      if (!cashierSales[userId]) {
        cashierSales[userId] = {
          user: order.user,
          orderCount: 0,
          totalSales: 0,
          averageOrder: 0
        };
      }
      cashierSales[userId].orderCount += 1;
      cashierSales[userId].totalSales += parseFloat(order.total);
    });

    // Calculate average order
    Object.values(cashierSales).forEach(cashier => {
      cashier.averageOrder = cashier.orderCount > 0 ? cashier.totalSales / cashier.orderCount : 0;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        cashierPerformance: Object.values(cashierSales)
      }
    });
  } catch (error) {
    console.error('Sales by cashier error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales by cashier'
    });
  }
});

// Cancelled Orders by Staff
router.get('/staff/cancelled-orders', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const cancelledOrders = await prisma.order.findMany({
      where: {
        status: 'CANCELLED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const staffCancellations = {};
    cancelledOrders.forEach(order => {
      const userId = order.userId;
      if (!staffCancellations[userId]) {
        staffCancellations[userId] = {
          user: order.user,
          cancelledCount: 0,
          totalAmount: 0,
          averageAmount: 0
        };
      }
      staffCancellations[userId].cancelledCount += 1;
      staffCancellations[userId].totalAmount += parseFloat(order.total);
    });

    // Calculate average amount
    Object.values(staffCancellations).forEach(staff => {
      staff.averageAmount = staff.cancelledCount > 0 ? staff.totalAmount / staff.cancelledCount : 0;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        staffCancellations: Object.values(staffCancellations)
      }
    });
  } catch (error) {
    console.error('Cancelled orders by staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cancelled orders by staff'
    });
  }
});

// Cancelled Orders by Staff (alternative route name for frontend compatibility)
router.get('/staff/cancelled-by-staff', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const cancelledOrders = await prisma.order.findMany({
      where: {
        status: 'CANCELLED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const staffCancellations = {};
    cancelledOrders.forEach(order => {
      const userId = order.userId;
      if (!staffCancellations[userId]) {
        staffCancellations[userId] = {
          user: order.user,
          cancelledCount: 0,
          totalAmount: 0,
          averageAmount: 0
        };
      }
      staffCancellations[userId].cancelledCount += 1;
      staffCancellations[userId].totalAmount += parseFloat(order.total);
    });

    // Calculate average amount
    Object.values(staffCancellations).forEach(staff => {
      staff.averageAmount = staff.cancelledCount > 0 ? staff.totalAmount / staff.cancelledCount : 0;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        staffCancellations: Object.values(staffCancellations)
      }
    });
  } catch (error) {
    console.error('Cancelled orders by staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cancelled orders by staff'
    });
  }
});

// Discounts Given by Staff
router.get('/staff/discounts-given', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        discount: {
          gt: 0
        },
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const staffDiscounts = {};
    orders.forEach(order => {
      const userId = order.userId;
      if (!staffDiscounts[userId]) {
        staffDiscounts[userId] = {
          user: order.user,
          discountCount: 0,
          totalDiscount: 0,
          averageDiscount: 0
        };
      }
      staffDiscounts[userId].discountCount += 1;
      staffDiscounts[userId].totalDiscount += parseFloat(order.discount);
    });

    // Calculate average discount
    Object.values(staffDiscounts).forEach(staff => {
      staff.averageDiscount = staff.discountCount > 0 ? staff.totalDiscount / staff.discountCount : 0;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        staffDiscounts: Object.values(staffDiscounts)
      }
    });
  } catch (error) {
    console.error('Discounts given by staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discounts given by staff'
    });
  }
});

// Discounts Given by Staff (alternative route name for frontend compatibility)
router.get('/staff/discounts-by-staff', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        discount: {
          gt: 0
        },
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    const staffDiscounts = {};
    orders.forEach(order => {
      const userId = order.userId;
      if (!staffDiscounts[userId]) {
        staffDiscounts[userId] = {
          user: order.user,
          discountCount: 0,
          totalDiscount: 0,
          averageDiscount: 0
        };
      }
      staffDiscounts[userId].discountCount += 1;
      staffDiscounts[userId].totalDiscount += parseFloat(order.discount);
    });

    // Calculate average discount
    Object.values(staffDiscounts).forEach(staff => {
      staff.averageDiscount = staff.discountCount > 0 ? staff.totalDiscount / staff.discountCount : 0;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        staffDiscounts: Object.values(staffDiscounts)
      }
    });
  } catch (error) {
    console.error('Discounts given by staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discounts given by staff'
    });
  }
});

// Login/Shift Report (if supported)
router.get('/staff/login-shift', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // This would need a Shift model in the database
    // For now, we'll return a placeholder
    res.json({
      success: true,
      data: {
        message: 'Shift tracking not implemented yet',
        shifts: []
      }
    });
  } catch (error) {
    console.error('Login/shift report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get login/shift report'
    });
  }
});

// Legacy cashier performance route for backward compatibility
router.get('/cashier-performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      status: 'COMPLETED'
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const performance = await prisma.order.groupBy({
      by: ['userId'],
      where,
      _count: true,
      _sum: {
        total: true
      }
    });

    // Get user details
    const performanceWithDetails = await Promise.all(
      performance.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        });

        return {
          user,
          orderCount: item._count,
          totalSales: item._sum.total
        };
      })
    );

    res.json({
      success: true,
      data: performanceWithDetails
    });
  } catch (error) {
    console.error('Get cashier performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier performance'
    });
  }
});

// Summary Reports Routes
// Weekly/Monthly Sales Summary
router.get('/summary/weekly-monthly', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        orderItems: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Sales trend by period
    const salesTrend = {};
    orders.forEach(order => {
      const period = range === 'week' ? 
        dayjs(order.createdAt).format('YYYY-[W]WW') : 
        dayjs(order.createdAt).format('YYYY-MM');
      
      if (!salesTrend[period]) {
        salesTrend[period] = { period, revenue: 0, orders: 0 };
      }
      salesTrend[period].revenue += parseFloat(order.total);
      salesTrend[period].orders += 1;
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        salesTrend: Object.values(salesTrend)
      }
    });
  } catch (error) {
    console.error('Weekly/monthly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly/monthly summary'
    });
  }
});

// Top 10 Items Sold
router.get('/summary/top-items', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        }
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    const itemSales = {};
    orderItems.forEach(item => {
      const productId = item.productId;
      if (!itemSales[productId]) {
        itemSales[productId] = {
          id: productId,
          name: item.product.name,
          category: item.product.category.name,
          quantity: 0,
          revenue: 0
        };
      }
      itemSales[productId].quantity += item.quantity;
      itemSales[productId].revenue += parseFloat(item.subtotal);
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        topItems
      }
    });
  } catch (error) {
    console.error('Top items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top items'
    });
  }
});

// Slow-Moving Items
router.get('/summary/slow-moving', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        }
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    const itemSales = {};
    orderItems.forEach(item => {
      const productId = item.productId;
      if (!itemSales[productId]) {
        itemSales[productId] = {
          id: productId,
          name: item.product.name,
          category: item.product.category.name,
          quantity: 0,
          revenue: 0
        };
      }
      itemSales[productId].quantity += item.quantity;
      itemSales[productId].revenue += parseFloat(item.subtotal);
    });

    const slowMovingItems = Object.values(itemSales)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        slowMovingItems
      }
    });
  } catch (error) {
    console.error('Slow moving items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get slow moving items'
    });
  }
});

// Total Orders vs Revenue
router.get('/summary/orders-vs-revenue', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        orderItems: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

    // Daily breakdown
    const dailyData = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!dailyData[date]) {
        dailyData[date] = { date, orders: 0, revenue: 0, items: 0 };
      }
      dailyData[date].orders += 1;
      dailyData[date].revenue += parseFloat(order.total);
      dailyData[date].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        averageItemsPerOrder,
        dailyData: Object.values(dailyData)
      }
    });
  } catch (error) {
    console.error('Orders vs revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders vs revenue data'
    });
  }
});

// Total Orders vs Revenue (alternative route name for frontend compatibility)
router.get('/summary/orders-revenue', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        orderItems: true
      }
    });

    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const averageItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

    // Daily breakdown
    const dailyData = {};
    orders.forEach(order => {
      const date = dayjs(order.createdAt).format('YYYY-MM-DD');
      if (!dailyData[date]) {
        dailyData[date] = { date, orders: 0, revenue: 0, items: 0 };
      }
      dailyData[date].orders += 1;
      dailyData[date].revenue += parseFloat(order.total);
      dailyData[date].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalItems,
        averageOrder,
        averageItemsPerOrder,
        dailyData: Object.values(dailyData)
      }
    });
  } catch (error) {
    console.error('Orders vs revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders vs revenue data'
    });
  }
});

// Simplified Sales Routes
// Menu Performance Report
router.get('/sales/menu-performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build where clause with multi-select filters
    const filterWhere = buildFilterWhereClause(req);
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...filterWhere
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    // Get filter IDs to check if specific products are selected
    const productIds = parseFilterArray(req.query['productIds[]'] || req.query.productIds);
    
    const itemSales = {};
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const productId = item.productId;
        if (!itemSales[productId]) {
          itemSales[productId] = {
            id: productId,
            name: item.product.name,
            category: item.product.category.name,
            quantity: 0,
            revenue: 0,
            averagePrice: 0
          };
        }
        itemSales[productId].quantity += item.quantity;
        itemSales[productId].revenue += parseFloat(item.price) * item.quantity;
      });
    });

    // If specific products are filtered, include them even with zero sales
    if (productIds.length > 0) {
      const selectedProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: { category: true }
      });
      
      selectedProducts.forEach(product => {
        if (!itemSales[product.id]) {
          itemSales[product.id] = {
            id: product.id,
            name: product.name,
            category: product.category.name,
            quantity: 0,
            revenue: 0,
            averagePrice: 0
          };
        }
      });
    }

    // Calculate average price
    Object.values(itemSales).forEach(item => {
      item.averagePrice = item.quantity > 0 ? item.revenue / item.quantity : 0;
    });

    // Sort by revenue
    const sortedItems = Object.values(itemSales).sort((a, b) => b.revenue - a.revenue);
    const topItems = sortedItems.slice(0, 10);

    res.json({
      success: true,
      data: {
        items: sortedItems,
        topItems: topItems.map(item => ({
          name: item.name,
          revenue: item.revenue
        }))
      }
    });
  } catch (error) {
    console.error('Menu performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu performance report'
    });
  }
});

// Peak Hours Report
router.get('/sales/peak-hours', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build where clause with multi-select filters
    const filterWhere = buildFilterWhereClause(req);
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...filterWhere
    };

    const orders = await prisma.order.findMany({
      where: whereClause
    });

    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { hour: i, revenue: 0, orders: 0 };
    }

    orders.forEach(order => {
      const hour = dayjs(order.createdAt).hour();
      hourlyData[hour].revenue += parseFloat(order.total);
      hourlyData[hour].orders += 1;
    });

    const hourlyArray = Object.values(hourlyData);
    const peakHour = hourlyArray.reduce((max, hour) => hour.revenue > max.revenue ? hour : max);
    const slowHour = hourlyArray.reduce((min, hour) => hour.revenue < min.revenue ? hour : min);
    const averageRevenue = hourlyArray.reduce((sum, hour) => sum + hour.revenue, 0) / 24;

    const peakHours = {
      peak: `${peakHour.hour}:00`,
      slow: `${slowHour.hour}:00`,
      average: averageRevenue
    };

    res.json({
      success: true,
      data: {
        peakHours,
        hourlySales: hourlyArray
      }
    });
  } catch (error) {
    console.error('Peak hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get peak hours report'
    });
  }
});

// Table Performance Report
router.get('/sales/table-performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build where clause with multi-select filters
    const filterWhere = buildFilterWhereClause(req);
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...filterWhere
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        table: true
      }
    });

    const tableSales = {};
    const tables = await prisma.table.findMany({ where: { isActive: true } });

    tables.forEach(table => {
      tableSales[table.id] = {
        id: table.id,
        number: table.number,
        orderCount: 0,
        revenue: 0,
        averageOrder: 0,
        utilization: 0
      };
    });

    orders.forEach(order => {
      const tableId = order.tableId;
      if (tableSales[tableId]) {
        tableSales[tableId].orderCount += 1;
        tableSales[tableId].revenue += parseFloat(order.total);
      }
    });

    // Calculate averages and utilization
    const totalHours = (end.diff(start, 'hour') + 1);
    Object.values(tableSales).forEach(table => {
      table.averageOrder = table.orderCount > 0 ? table.revenue / table.orderCount : 0;
      table.utilization = Math.round((table.orderCount / totalHours) * 100);
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        tableSales: Object.values(tableSales).map(table => ({
          tableNumber: table.number,
          revenue: table.revenue
        })),
        tableDetails: Object.values(tableSales)
      }
    });
  } catch (error) {
    console.error('Table performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get table performance report'
    });
  }
});

// Discounts Report
router.get('/sales/discounts', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build where clause with multi-select filters
    const filterWhere = buildFilterWhereClause(req);
    const whereClause = {
      status: 'COMPLETED',
      discount: {
        gt: 0
      },
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...filterWhere
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        id: true,
        orderNumber: true,
        discount: true,
        subtotal: true,
        total: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalDiscounts = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.discount), 0);
    const averageDiscount = totalDiscounts > 0 ? totalAmount / totalDiscounts : 0;
    const staffCount = new Set(orders.map(order => order.userId)).size;

    const discountSummary = {
      totalDiscounts,
      totalAmount,
      averageDiscount,
      staffCount
    };

    const discountDetails = orders.map(order => {
      const discountAmount = parseFloat(order.discount);
      const subtotal = parseFloat(order.subtotal || order.total);
      const discountPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
      
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        staffName: order.user.name,
        discountPercentage: discountPercentage,
        amount: discountAmount,
        date: order.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        discountSummary,
        discountDetails
      }
    });
  } catch (error) {
    console.error('Discounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get discounts report'
    });
  }
});

// Staff Reports Routes
router.get('/staff/performance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate, staffId, shiftId } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build where clause with filters
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...(staffId ? { userId: parseInt(staffId) } : {})
    };

    // If shiftId filter is provided, need to join with shift logs
    let staffPerformance;
    if (shiftId) {
      // Get users who worked in this shift
      const shiftLogs = await prisma.shiftLog.findMany({
        where: {
          shiftId: parseInt(shiftId),
          ...(start && end ? { clockIn: buildDateFilter(start, end) } : {})
        },
        select: { userId: true },
        distinct: ['userId']
      });
      const userIds = shiftLogs.map(log => log.userId);
      
      staffPerformance = await prisma.order.groupBy({
        by: ['userId'],
        where: {
          ...whereClause,
          userId: { in: userIds }
        },
        _sum: {
          total: true,
          discount: true
        },
        _count: true,
        _avg: {
          total: true
        },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        }
      });
    } else {
      // Get staff performance data with optimized query
      staffPerformance = await prisma.order.groupBy({
        by: ['userId'],
        where: whereClause,
        _sum: {
          total: true,
          discount: true
        },
        _count: true,
        _avg: {
          total: true
        },
        orderBy: {
          _sum: {
            total: 'desc'
          }
        }
      });
    }

    // Get only cashier users for performance report
    const userIds = staffPerformance.map(staff => staff.userId);
    const users = await prisma.user.findMany({
      where: { 
        id: { in: userIds },
        role: 'CASHIER'  // Only get cashiers
      },
      select: { id: true, name: true, role: true }
    });
    
    const userMap = new Map(users.map(user => [user.id, user]));
    
    // Filter staff performance to only include cashiers
    const staffDetails = staffPerformance
      .filter(staff => userMap.has(staff.userId))  // Only include if user exists and is cashier
      .map((staff) => {
        const user = userMap.get(staff.userId);
        
        return {
          id: staff.userId,
          name: user?.name || 'Unknown',
          role: user?.role || 'CASHIER',
          orders: staff._count,
          sales: staff._sum.total || 0,
          performance: Math.round((staff._sum.total || 0) / staff._count * 100) / 100
        };
      });

    const totalStaff = staffDetails.length;
    const totalOrders = staffDetails.reduce((sum, staff) => sum + staff.orders, 0);
    const totalSales = staffDetails.reduce((sum, staff) => sum + staff.sales, 0);
    const averagePerformance = totalStaff > 0 ? totalSales / totalStaff : 0;

    // Calculate orders per hour
    let ordersPerHour = 0;
    if (start && end) {
      const hoursDiff = (end - start) / (1000 * 60 * 60);
      if (hoursDiff > 0) {
        ordersPerHour = totalOrders / hoursDiff;
      }
    }

    // Calculate punctuality (percentage of on-time clock-ins)
    let punctuality = 0;
    const recentShiftLogs = await prisma.shiftLog.findMany({
      where: {
        ...(start && end ? { clockIn: buildDateFilter(start, end) } : {}),
        clockIn: { not: null },
        ...(staffId ? { userId: parseInt(staffId) } : {}),
        ...(shiftId ? { shiftId: parseInt(shiftId) } : {})
      },
      include: {
        shift: {
          select: { startTime: true, gracePeriod: true }
        }
      }
    });

    if (recentShiftLogs.length > 0) {
      const onTimeCount = recentShiftLogs.filter(log => {
        if (!log.shift || !log.clockIn) return false;
        
        const clockInTime = new Date(log.clockIn);
        const clockInMinutes = clockInTime.getHours() * 60 + clockInTime.getMinutes();
        
        // Parse shift start time (format: "HH:MM")
        const [shiftHours, shiftMinutes] = log.shift.startTime.split(':').map(Number);
        const shiftStartMinutes = shiftHours * 60 + shiftMinutes;
        
        const gracePeriod = log.shift.gracePeriod || 10; // default 10 minutes
        const latestAllowed = shiftStartMinutes + gracePeriod;
        
        return clockInMinutes <= latestAllowed;
      }).length;
      
      punctuality = Math.round((onTimeCount / recentShiftLogs.length) * 100);
    }

    res.json({
      success: true,
      data: {
        performanceSummary: {
          totalStaff,
          totalOrders,
          totalSales,
          averagePerformance: Math.round(averagePerformance * 100) / 100,
          ordersPerHour: Math.round(ordersPerHour * 10) / 10,
          punctuality
        },
        staffPerformance: staffDetails.map(staff => ({
          name: staff.name,
          sales: staff.sales
        })),
        staffDetails
      }
    });
  } catch (error) {
    console.error('Staff performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff performance report'
    });
  }
});

router.get('/staff/activity', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate, staffId, shiftId } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Handle multiple staff IDs
    const staffIds = staffId ? (Array.isArray(staffId) ? staffId.map(id => parseInt(id)) : [parseInt(staffId)]) : null;
    
    // Handle multiple shift IDs
    const shiftIds = shiftId ? (Array.isArray(shiftId) ? shiftId.map(id => parseInt(id)) : [parseInt(shiftId)]) : null;

    // Build where clause with filters
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...(staffIds ? { userId: { in: staffIds } } : {})
    };

    // Handle shift filter
    let userIdsFilter = null;
    if (shiftIds) {
      const shiftLogs = await prisma.shiftLog.findMany({
        where: {
          shiftId: { in: shiftIds },
          ...(start && end ? { clockIn: buildDateFilter(start, end) } : {})
        },
        select: { userId: true },
        distinct: ['userId']
      });
      userIdsFilter = shiftLogs.map(log => log.userId);
      
      // If both staffIds and shiftIds are provided, get intersection
      if (staffIds) {
        userIdsFilter = userIdsFilter.filter(id => staffIds.includes(id));
      }
    }

    // Build final where clause with proper userId filtering
    let finalWhereClause = { ...whereClause };
    
    // If we have shift filter results, override the userId filter
    if (userIdsFilter) {
      finalWhereClause.userId = { in: userIdsFilter };
    }

    // Get staff activity data
    const staffActivity = await prisma.order.groupBy({
      by: ['userId'],
      where: finalWhereClause,
      _count: true
    });

    // Get only cashier users for activity report
    const userIds = staffActivity.map(staff => staff.userId);
    const users = await prisma.user.findMany({
      where: { 
        id: { in: userIds },
        role: 'CASHIER'  // Only get cashiers
      },
      select: { id: true, name: true }
    });
    
    const userMap = new Map(users.map(user => [user.id, user]));
    
    // Filter staff activity to only include cashiers
    const staffDetails = staffActivity
      .filter(staff => userMap.has(staff.userId))  // Only include if user exists and is cashier
      .map((staff) => {
        const user = userMap.get(staff.userId);
        
        return {
          name: user?.name || 'Unknown',
          orders: staff._count
        };
      });

    const activeStaff = staffDetails.length;
    const ordersToday = staffDetails.reduce((sum, staff) => sum + staff.orders, 0);
    
    // Calculate average response time from order timestamps
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      select: {
        createdAt: true,
        updatedAt: true
      },
      take: 100 // Sample last 100 orders for performance
    });

    let avgResponseTime = 0;
    if (orders.length > 0) {
      const totalResponseTime = orders.reduce((sum, order) => {
        const responseTime = (new Date(order.updatedAt) - new Date(order.createdAt)) / (1000 * 60); // minutes
        return sum + responseTime;
      }, 0);
      avgResponseTime = Math.round(totalResponseTime / orders.length);
    }

    // Get detailed metrics for each cashier
    const enhancedStaffDetails = await Promise.all(
      staffDetails.map(async (staff) => {
        const userId = users.find(u => u.name === staff.name)?.id;
        if (!userId) return staff;

        // Get sales for this cashier
        const salesData = await prisma.order.aggregate({
          where: {
            userId: userId,
            status: 'COMPLETED',
            ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
          },
          _sum: {
            total: true
          }
        });

        // Get discounts applied by this cashier
        const discountsData = await prisma.order.count({
          where: {
            userId: userId,
            status: 'COMPLETED',
            ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
            discount: { gt: 0 }
          }
        });

        // Get cancelled orders by this cashier
        const cancelledData = await prisma.order.count({
          where: {
            userId: userId,
            status: 'CANCELLED',
            ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
          }
        });

        return {
          ...staff,
          sales: salesData._sum.total || 0,
          discounts: discountsData,
          cancelled: cancelledData
        };
      })
    );

    res.json({
      success: true,
      data: {
        activitySummary: {
          activeStaff,
          ordersToday,
          avgResponseTime
        },
        staffActivity: enhancedStaffDetails
      }
    });
  } catch (error) {
    console.error('Staff activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff activity report'
    });
  }
});

router.get('/staff/sales', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate, staffId, shiftId } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Handle multiple staff IDs
    const staffIds = staffId ? (Array.isArray(staffId) ? staffId.map(id => parseInt(id)) : [parseInt(staffId)]) : null;
    
    // Handle multiple shift IDs
    const shiftIds = shiftId ? (Array.isArray(shiftId) ? shiftId.map(id => parseInt(id)) : [parseInt(shiftId)]) : null;

    // Build where clause with filters
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...(staffIds ? { userId: { in: staffIds } } : {})
    };

    // Handle shift filter
    let userIdsFilter = null;
    if (shiftIds) {
      const shiftLogs = await prisma.shiftLog.findMany({
        where: {
          shiftId: { in: shiftIds },
          ...(start && end ? { clockIn: buildDateFilter(start, end) } : {})
        },
        select: { userId: true },
        distinct: ['userId']
      });
      userIdsFilter = shiftLogs.map(log => log.userId);
      
      // If both staffIds and shiftIds are provided, get intersection
      if (staffIds) {
        userIdsFilter = userIdsFilter.filter(id => staffIds.includes(id));
      }
    }

    // Build final where clause with proper userId filtering
    let finalWhereClause = { ...whereClause };
    
    // If we have shift filter results, override the userId filter
    if (userIdsFilter) {
      finalWhereClause.userId = { in: userIdsFilter };
    }

    // Get staff sales data
    const staffSales = await prisma.order.groupBy({
      by: ['userId'],
      where: finalWhereClause,
      _sum: {
        total: true
      },
      _count: true
    });

    // Get only cashier users for sales report
    const userIds = staffSales.map(staff => staff.userId);
    const users = await prisma.user.findMany({
      where: { 
        id: { in: userIds },
        role: 'CASHIER'  // Only get cashiers
      },
      select: { id: true, name: true }
    });
    
    const userMap = new Map(users.map(user => [user.id, user]));
    
    // Filter staff sales to only include cashiers
    const staffDetails = staffSales
      .filter(staff => userMap.has(staff.userId))  // Only include if user exists and is cashier
      .map((staff) => {
        const user = userMap.get(staff.userId);
        
        return {
          name: user?.name || 'Unknown',
          sales: staff._sum.total || 0
        };
      });

    const totalSales = staffDetails.reduce((sum, staff) => sum + staff.sales, 0);
    const topPerformer = staffDetails.length > 0 ? 
      staffDetails.reduce((max, staff) => staff.sales > max.sales ? staff : max).name : 'N/A';
    const averageSale = staffDetails.length > 0 ? totalSales / staffDetails.length : 0;
    
    // Calculate target achievement based on previous period comparison
    let targetMet = 0;
    if (start && end) {
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const previousStart = dayjs(start).subtract(daysDiff, 'day');
      const previousEnd = dayjs(start).subtract(1, 'day');

      const previousSales = await prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: buildDateFilter(previousStart.toDate(), previousEnd.toDate())
        },
        _sum: {
          total: true
        }
      });

      const previousTotal = parseFloat(previousSales._sum.total || 0);
      if (previousTotal > 0) {
        targetMet = Math.round((totalSales / previousTotal) * 100);
      } else if (totalSales > 0) {
        targetMet = 100; // If no previous data but has current sales
      }
    }

    res.json({
      success: true,
      data: {
        salesSummary: {
          totalSales,
          topPerformer,
          averageSale,
          targetMet
        },
        staffSales: staffDetails
      }
    });
  } catch (error) {
    console.error('Staff sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff sales report'
    });
  }
});

router.get('/staff/attendance', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate, staffId, shiftId } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Handle multiple staff IDs
    const staffIds = staffId ? (Array.isArray(staffId) ? staffId.map(id => parseInt(id)) : [parseInt(staffId)]) : null;
    
    // Handle multiple shift IDs
    const shiftIds = shiftId ? (Array.isArray(shiftId) ? shiftId.map(id => parseInt(id)) : [parseInt(shiftId)]) : null;

    // Build where clause for shift logs
    let whereClause = {
      clockIn: { not: null },
      clockOut: { not: null },
      ...(start && end ? { clockIn: buildDateFilter(start, end) } : {})
    };

    // Add staff filter
    if (staffIds) {
      whereClause.userId = { in: staffIds };
    }

    // Add shift filter
    if (shiftIds) {
      whereClause.shiftId = { in: shiftIds };
    }

    // Get shift logs with user and shift information (simplified approach)
    const shiftLogs = await prisma.shiftLog.findMany({
      where: {
        ...(start && end ? { clockIn: buildDateFilter(start, end) } : {}),
        ...(staffIds ? { userId: { in: staffIds } } : {}),
        ...(shiftIds ? { shiftId: { in: shiftIds } } : {})
      },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        },
        shift: {
          select: { id: true, name: true, startTime: true, endTime: true }
        }
      },
      orderBy: { clockIn: 'desc' }
    });

    // Filter to only cashiers and process attendance records
    const cashierLogs = shiftLogs.filter(log => log.user?.role === 'CASHIER');
    
    const attendanceRecords = cashierLogs.map(log => {
      const clockIn = new Date(log.clockIn);
      const clockOut = log.clockOut ? new Date(log.clockOut) : null;
      
      // Process records with clock in (even if no clock out yet)
      if (!clockIn) {
        return null; // Skip records without clock in
      }

      const shiftStart = new Date(`${clockIn.toDateString()} ${log.shift?.startTime || '08:00'}`);
      const shiftEnd = clockOut ? new Date(`${clockOut.toDateString()} ${log.shift?.endTime || '17:00'}`) : null;
      
      // Calculate total hours (only if clocked out)
      let totalHoursFormatted = '—';
      if (clockOut) {
        const totalHoursMs = clockOut - clockIn;
        const totalHours = Math.floor(totalHoursMs / (1000 * 60 * 60));
        const totalMinutes = Math.floor((totalHoursMs % (1000 * 60 * 60)) / (1000 * 60));
        totalHoursFormatted = totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`;
      }

      // Calculate late time
      const lateMs = clockIn - shiftStart;
      const lateMinutes = Math.floor(lateMs / (1000 * 60));
      const lateFormatted = lateMinutes > 0 ? `${lateMinutes}m` : null;

      // Calculate overtime (only if clocked out)
      let overtimeFormatted = null;
      if (clockOut && shiftEnd) {
        const overtimeMs = clockOut - shiftEnd;
        const overtimeMinutes = Math.floor(overtimeMs / (1000 * 60));
        overtimeFormatted = overtimeMinutes > 0 ? `+${overtimeMinutes}m` : null;
      }

      // Determine status
      let status = clockOut ? 'Present' : 'On Duty';
      if (clockOut && lateMinutes > 15) {
        status = 'Late';
      }

      return {
        staffId: log.userId,
        staffName: log.user?.name || 'Unknown',
        date: clockIn.toLocaleDateString('en-US', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        }),
        shift: log.shift?.name || 'Unknown',
        checkIn: clockIn.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        checkOut: clockOut ? clockOut.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) : '—',
        totalHours: totalHoursFormatted,
        late: lateFormatted,
        overtime: overtimeFormatted,
        status
      };
    }).filter(record => record !== null); // Remove null records

    // Sort attendance records by date (newest first) then by staff name
    attendanceRecords.sort((a, b) => {
      const dateComparison = new Date(b.date.split(' ').reverse().join('-')) - new Date(a.date.split(' ').reverse().join('-'));
      if (dateComparison !== 0) return dateComparison;
      return a.staffName.localeCompare(b.staffName);
    });

    res.json({
      success: true,
      data: {
        attendance: attendanceRecords
      }
    });
  } catch (error) {
    console.error('Staff attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff attendance report'
    });
  }
});

router.get('/staff/hours', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate, staffId, shiftId } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build where clause with filters - only include completed shifts (with clock out)
    const whereClause = {
      ...(start && end ? { 
        clockIn: buildDateFilter(start, end) 
      } : {}),
      clockIn: { not: null },
      clockOut: { not: null }, // Only count completed shifts for hours calculation
      ...(staffId ? { userId: parseInt(staffId) } : {}),
      ...(shiftId ? { shiftId: parseInt(shiftId) } : {})
    };

    // Get shift logs with clock in/out data - only for cashiers
    const shiftLogs = await prisma.shiftLog.findMany({
      where: {
        ...whereClause,
        user: {
          role: 'CASHIER'  // Only get cashier shift logs
        }
      },
      include: {
        user: {
          select: { id: true, name: true, role: true }
        },
        shift: {
          select: { name: true }
        }
      },
      orderBy: {
        clockIn: 'desc'
      }
    });

    // Calculate hours worked per staff member
    const staffHoursMap = new Map();
    
    shiftLogs.forEach(log => {
      const userId = log.userId;
      const clockIn = new Date(log.clockIn);
      const clockOut = new Date(log.clockOut);
      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60); // Convert ms to hours

      if (!staffHoursMap.has(userId)) {
        staffHoursMap.set(userId, {
          id: userId,
          name: log.user?.name || 'Unknown',
          role: log.user?.role || 'N/A',
          hours: 0,
          shifts: 0,
          shifts_data: []
        });
      }

      const staffData = staffHoursMap.get(userId);
      staffData.hours += hoursWorked;
      staffData.shifts += 1;
      staffData.shifts_data.push({
        shiftName: log.shift?.name || 'N/A',
        clockIn: log.clockIn,
        clockOut: log.clockOut,
        hours: Math.round(hoursWorked * 10) / 10
      });
    });

    // Convert map to array and format
    const staffHours = Array.from(staffHoursMap.values()).map(staff => ({
      name: staff.name,
      hours: Math.round(staff.hours * 10) / 10,
      shifts: staff.shifts,
      avgShiftDuration: Math.round((staff.hours / staff.shifts) * 10) / 10 || 0
    }));

    // Calculate summary statistics
    const totalHours = staffHours.reduce((sum, staff) => sum + staff.hours, 0);
    const staffOnDuty = staffHours.length;
    const averageShift = staffOnDuty > 0 ? totalHours / staffOnDuty : 0;
    const totalShifts = staffHours.reduce((sum, staff) => sum + staff.shifts, 0);

    res.json({
      success: true,
      data: {
        hoursSummary: {
          totalHours: Math.round(totalHours * 10) / 10,
          staffOnDuty,
          averageShift: Math.round(averageShift * 10) / 10,
          totalShifts
        },
        staffHours
      }
    });
  } catch (error) {
    console.error('Staff hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff hours report'
    });
  }
});

// Staff Reports Export Endpoints
router.get('/staff/:reportType/export', requirePermission('reports.view'), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { range, startDate, endDate, format = 'csv' } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    let csvContent = '';
    const header = `Staff Report: ${reportType}\nDate Range: ${start?.format('YYYY-MM-DD') || 'All'} to ${end?.format('YYYY-MM-DD') || 'All'}\nGenerated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}\n\n`;

    if (reportType === 'performance') {
      // Get staff performance data
      const staffPerformance = await prisma.order.groupBy({
        by: ['userId'],
        where: {
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        },
        _sum: { total: true, discount: true },
        _count: true,
        _avg: { total: true },
        orderBy: { _sum: { total: 'desc' } }
      });

      const userIds = staffPerformance.map(staff => staff.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, role: true }
      });
      
      const userMap = new Map(users.map(user => [user.id, user]));
      
      csvContent = header + 'Staff Name,Role,Orders,Sales (USD),Performance Score\n';
      staffPerformance.forEach((staff) => {
        const user = userMap.get(staff.userId);
        const performance = Math.round((staff._sum.total || 0) / staff._count * 100) / 100;
        csvContent += `${user?.name || 'Unknown'},${user?.role || 'N/A'},${staff._count},${staff._sum.total || 0},${performance}\n`;
      });

    } else if (reportType === 'activity') {
      // Get staff activity data
      const staffActivity = await prisma.order.groupBy({
        by: ['userId'],
        where: {
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        },
        _count: true
      });

      const userIds = staffActivity.map(staff => staff.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true }
      });
      
      const userMap = new Map(users.map(user => [user.id, user]));
      
      csvContent = header + 'Staff Name,Orders Processed\n';
      staffActivity.forEach((staff) => {
        const user = userMap.get(staff.userId);
        csvContent += `${user?.name || 'Unknown'},${staff._count}\n`;
      });

    } else if (reportType === 'sales') {
      // Get staff sales data
      const staffSales = await prisma.order.groupBy({
        by: ['userId'],
        where: {
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        },
        _sum: { total: true },
        _count: true
      });

      const userIds = staffSales.map(staff => staff.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true }
      });
      
      const userMap = new Map(users.map(user => [user.id, user]));
      
      csvContent = header + 'Staff Name,Total Sales (USD),Orders\n';
      staffSales.forEach((staff) => {
        const user = userMap.get(staff.userId);
        csvContent += `${user?.name || 'Unknown'},${staff._sum.total || 0},${staff._count}\n`;
      });

    } else if (reportType === 'hours') {
      // Get shift logs with clock in/out data
      const shiftLogs = await prisma.shiftLog.findMany({
        where: {
          ...(start && end ? { clockIn: buildDateFilter(start, end) } : {}),
          clockIn: { not: null },
          clockOut: { not: null }
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
          shift: { select: { name: true } }
        },
        orderBy: { clockIn: 'desc' }
      });

      csvContent = header + 'Staff Name,Shift Name,Clock In,Clock Out,Hours Worked\n';
      shiftLogs.forEach(log => {
        const clockIn = new Date(log.clockIn);
        const clockOut = new Date(log.clockOut);
        const hoursWorked = ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(2);
        
        csvContent += `${log.user?.name || 'Unknown'},${log.shift?.name || 'N/A'},${dayjs(log.clockIn).format('YYYY-MM-DD HH:mm')},${dayjs(log.clockOut).format('YYYY-MM-DD HH:mm')},${hoursWorked}\n`;
      });
    }

    // Set appropriate content type
    if (format === 'excel') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=staff-${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=staff-${reportType}-${range}-${dayjs().format('YYYY-MM-DD')}.csv`);
    }
    
    res.send(csvContent);
  } catch (error) {
    console.error('Staff export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export staff report'
    });
  }
});

// Inventory Reports Routes
router.get('/inventory/stock-levels', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get stock levels data
    const stockItems = await prisma.stock.findMany({
      include: {
        product: {
          select: {
            name: true,
            price: true,
            needStock: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Filter out products that shouldn't have stock tracking
    const validStockItems = stockItems.filter(item => item.product.needStock === true);

    const stockDetails = validStockItems.map(item => ({
      id: item.id,
      name: item.product.name,
      category: item.product.category.name,
      quantity: item.quantity,
      minLevel: item.minStock || 10,
      unitPrice: parseFloat(item.product.price || 0),
      value: item.quantity * parseFloat(item.product.price || 0)
    }));

    const totalItems = stockDetails.length;
    const inStock = stockDetails.filter(item => item.quantity > 0).length;
    const lowStock = stockDetails.filter(item => item.quantity <= item.minStock).length;
    const totalValue = stockDetails.reduce((sum, item) => sum + item.value, 0);

    const stockLevels = stockDetails.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = 0;
      }
      acc[item.category] += item.quantity;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        stockSummary: {
          totalItems,
          inStock,
          lowStock,
          totalValue
        },
        stockLevels: Object.entries(stockLevels).map(([category, quantity]) => ({
          category,
          quantity
        })),
        stockDetails
      }
    });
  } catch (error) {
    console.error('Stock levels error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock levels report'
    });
  }
});


router.get('/inventory/movements', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get real stock movements from stock_logs table
    const stockLogs = await prisma.stockLog.findMany({
      where: {
        ...(start && end ? {
          createdAt: {
            gte: start,
            lte: end
          }
        } : {})
      },
      include: {
        stock: {
          include: {
            product: {
              select: {
                name: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        user: {
          select: {
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group movements by date
    const dailyMovements = stockLogs.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = { 
          date, 
          stockIn: 0, 
          stockOut: 0,
          adjustments: 0,
          transactions: 0
        };
      }
      
      acc[date].transactions += 1;
      
      if (log.type === 'ADD') {
        acc[date].stockIn += log.quantity;
      } else if (log.type === 'REMOVE') {
        acc[date].stockOut += log.quantity;
      } else if (log.type === 'ADJUST') {
        acc[date].adjustments += log.quantity;
      }
      
      return acc;
    }, {});

    // Convert to array and sort by date
    const movements = Object.values(dailyMovements).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate summary totals
    const stockIn = movements.reduce((sum, day) => sum + day.stockIn, 0);
    const stockOut = movements.reduce((sum, day) => sum + day.stockOut, 0);
    const adjustments = movements.reduce((sum, day) => sum + day.adjustments, 0);
    const totalTransactions = movements.reduce((sum, day) => sum + day.transactions, 0);
    const netMovement = stockIn - stockOut;

    // Enhanced movements data with detailed breakdown
    const movementsByType = {
      ADD: stockLogs.filter(log => log.type === 'ADD'),
      REMOVE: stockLogs.filter(log => log.type === 'REMOVE'),
      ADJUST: stockLogs.filter(log => log.type === 'ADJUST')
    };

    // Product-wise movement summary
    const productMovements = stockLogs.reduce((acc, log) => {
      const productName = log.stock.product.name;
      
      if (!acc[productName]) {
        acc[productName] = {
          productName,
          category: log.stock.product.category.name,
          stockIn: 0,
          stockOut: 0,
          adjustments: 0,
          transactions: 0,
          lastMovement: log.createdAt
        };
      }
      
      acc[productName].transactions += 1;
      acc[productName].lastMovement = log.createdAt;
      
      if (log.type === 'ADD') {
        acc[productName].stockIn += log.quantity;
      } else if (log.type === 'REMOVE') {
        acc[productName].stockOut += log.quantity;
      } else if (log.type === 'ADJUST') {
        acc[productName].adjustments += log.quantity;
      }
      
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        movementsSummary: {
          stockIn,
          stockOut,
          adjustments,
          netMovement,
          totalTransactions
        },
        movements,
        movementsByType: {
          stockIn: movementsByType.ADD.length,
          stockOut: movementsByType.REMOVE.length,
          adjustments: movementsByType.ADJUST.length
        },
        productMovements: Object.values(productMovements).sort((a, b) => 
          new Date(b.lastMovement) - new Date(a.lastMovement)
        ),
        recentTransactions: stockLogs.map(log => ({
          id: log.id,
          date: log.createdAt,
          type: log.type,
          quantity: log.quantity,
          productName: log.stock.product.name,
          category: log.stock.product.category.name,
          user: log.user.name,
          note: log.note,
          action: log.type === 'ADD' ? 'Stock Added' : 
                  log.type === 'REMOVE' ? 'Stock Removed' : 'Stock Adjusted'
        }))
      }
    });
  } catch (error) {
    console.error('Movements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get movements report'
    });
  }
});

router.get('/inventory/alerts', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get low stock alerts
    const lowStockItems = await prisma.stock.findMany({
      where: {
        quantity: {
          lte: 10
        }
      },
      include: {
        product: {
          select: {
            name: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const alerts = lowStockItems.map(item => ({
      id: item.id,
      itemName: item.product.name,
      type: 'Low Stock',
      currentLevel: item.quantity,
      threshold: item.minStock || 10,
      expiryDate: null,
      priority: item.quantity <= 5 ? 'High' : item.quantity <= 8 ? 'Medium' : 'Low'
    }));

    const lowStock = alerts.filter(alert => alert.priority === 'High').length;
    const expiringSoon = 0; // Mock data
    const totalAlerts = alerts.length;

    res.json({
      success: true,
      data: {
        alertsSummary: {
          lowStock,
          expiringSoon,
          totalAlerts
        },
        alerts
      }
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get alerts report'
    });
  }
});


router.get('/financial/tax', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get tax rate from settings
    const settings = await prisma.settings.findFirst();
    const vatRate = settings?.vatRate || 10.0; // Default to 10.0% if not set

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      }
    });

    let totalRevenue = 0;
    let totalTax = 0;
    let taxableAmount = 0;

    orders.forEach(order => {
      const orderTotal = parseFloat(order.total);
      const orderTax = parseFloat(order.tax || 0);
      const orderSubtotal = parseFloat(order.subtotal || (orderTotal - orderTax));
      
      totalRevenue += orderTotal;
      totalTax += orderTax;
      taxableAmount += orderSubtotal;
    });

    // Calculate actual tax rate from data
    const actualTaxRate = taxableAmount > 0 ? (totalTax / taxableAmount) * 100 : vatRate;

    // Tax breakdown by category
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: 'COMPLETED',
          ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
        }
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    });

    const categoryTaxBreakdown = {};
    orderItems.forEach(item => {
      const categoryName = item.product.category?.name || 'Unknown';
      const itemSubtotal = parseFloat(item.subtotal);
      const itemTax = itemSubtotal * (vatRate / 100);
      
      if (!categoryTaxBreakdown[categoryName]) {
        categoryTaxBreakdown[categoryName] = {
          category: categoryName,
          taxableAmount: 0,
          taxAmount: 0,
          percentage: 0
        };
      }
      
      categoryTaxBreakdown[categoryName].taxableAmount += itemSubtotal;
      categoryTaxBreakdown[categoryName].taxAmount += itemTax;
    });

    // Calculate percentage of total tax for each category
    Object.values(categoryTaxBreakdown).forEach(cat => {
      cat.percentage = totalTax > 0 ? (cat.taxAmount / totalTax) * 100 : 0;
    });

    const taxChart = Object.values(categoryTaxBreakdown);

    res.json({
      success: true,
      data: {
        taxSummary: {
          totalRevenue,
          taxableAmount,
          totalTax,
          taxRate: Math.round(actualTaxRate * 100) / 100,
          configuredTaxRate: vatRate
        },
        taxChart
      }
    });
  } catch (error) {
    console.error('Tax error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tax report'
    });
  }
});

router.get('/financial/payments', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      }
    });

    // Payment method breakdown
    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { method, amount: 0, count: 0 };
      }
      paymentMethods[method].amount += parseFloat(order.total);
      paymentMethods[method].count += 1;
    });

    // Calculate totals
    const cardPayments = paymentMethods['CARD']?.amount || 0;
    const cashPayments = paymentMethods['CASH']?.amount || 0;
    const digitalPayments = paymentMethods['DIGITAL']?.amount || 0;
    const totalPayments = Object.values(paymentMethods).reduce((sum, pm) => sum + pm.amount, 0);

    // Format for chart
    const paymentChart = Object.values(paymentMethods).map(pm => ({
      method: pm.method,
      amount: pm.amount,
      count: pm.count,
      percentage: totalPayments > 0 ? (pm.amount / totalPayments) * 100 : 0
    }));

    res.json({
      success: true,
      data: {
        paymentSummary: {
          cardPayments,
          cashPayments,
          digitalPayments,
          totalPayments
        },
        paymentChart
      }
    });
  } catch (error) {
    console.error('Payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments report'
    });
  }
});

router.get('/financial/end-of-day', requirePermission('reports.view'), async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    // Get end of day data with order items
    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    const dailyRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const ordersToday = orders.length;
    const averageOrderValue = ordersToday > 0 ? dailyRevenue / ordersToday : 0;
    
    // Calculate actual closing time from last order
    const lastOrder = orders.length > 0 ? 
      orders.reduce((latest, order) => 
        new Date(order.createdAt) > new Date(latest.createdAt) ? order : latest
      ) : null;
    
    const closingTime = lastOrder ? 
      dayjs(lastOrder.createdAt).format('HH:mm') : 
      'No orders';

    // Real category analysis
    const categoryAnalysis = {};
    let totalItems = 0;

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        const categoryName = item.product.category?.name || 'Unknown';
        const itemAmount = parseFloat(item.subtotal);
        
        if (!categoryAnalysis[categoryName]) {
          categoryAnalysis[categoryName] = {
            category: categoryName,
            amount: 0,
            count: 0,
            percentage: 0
          };
        }
        
        categoryAnalysis[categoryName].amount += itemAmount;
        categoryAnalysis[categoryName].count += item.quantity;
        totalItems += item.quantity;
      });
    });

    // Calculate percentages
    Object.values(categoryAnalysis).forEach(cat => {
      cat.percentage = dailyRevenue > 0 ? (cat.amount / dailyRevenue) * 100 : 0;
    });

    const endOfDayDetails = Object.values(categoryAnalysis);

    res.json({
      success: true,
      data: {
        endOfDaySummary: {
          dailyRevenue,
          ordersToday,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          closingTime,
          totalItems
        },
        endOfDayDetails
      }
    });
  } catch (error) {
    console.error('End of day error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get end of day report'
    });
  }
});

// Enhanced Sales Report with Advanced Filtering
router.get('/sales/enhanced', requirePermission('reports.view'), async (req, res) => {
  try {
    const { 
      range, 
      startDate, 
      endDate, 
      staffId, 
      paymentMethod, 
      tableId, 
      categoryId,
      minAmount,
      maxAmount
    } = req.query;
    
    const { start, end } = getDateRange(range, startDate, endDate);

    // Build enhanced where clause
    const where = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
    };

    // Add optional filters
    if (staffId) where.userId = parseInt(staffId);
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (tableId) where.tableId = parseInt(tableId);
    if (minAmount || maxAmount) {
      where.total = {};
      if (minAmount) where.total.gte = parseFloat(minAmount);
      if (maxAmount) where.total.lte = parseFloat(maxAmount);
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true }
        },
        table: {
          select: { id: true, number: true }
        },
        orderItems: {
          include: {
            product: {
              include: {
                category: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter orders by category if specified
    let filteredOrders = orders;
    if (categoryId) {
      filteredOrders = orders.filter(order => 
        order.orderItems.some(item => item.product.categoryId === parseInt(categoryId))
      );
    }

    // Calculate enhanced metrics
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalOrders = filteredOrders.length;
    const totalItems = filteredOrders.reduce((sum, order) => 
      sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Staff performance breakdown
    const staffPerformance = {};
    filteredOrders.forEach(order => {
      const staffId = order.userId;
      if (!staffPerformance[staffId]) {
        staffPerformance[staffId] = {
          user: order.user,
          orders: 0,
          revenue: 0,
          items: 0
        };
      }
      staffPerformance[staffId].orders += 1;
      staffPerformance[staffId].revenue += parseFloat(order.total);
      staffPerformance[staffId].items += order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    });

    // Payment method breakdown
    const paymentBreakdown = {};
    filteredOrders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { method, count: 0, amount: 0 };
      }
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].amount += parseFloat(order.total);
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          totalItems,
          averageOrder
        },
        staffPerformance: Object.values(staffPerformance),
        paymentBreakdown: Object.values(paymentBreakdown),
        orders: filteredOrders,
        appliedFilters: {
          dateRange: `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`,
          staffId: staffId || 'All',
          paymentMethod: paymentMethod || 'All',
          tableId: tableId || 'All',
          categoryId: categoryId || 'All',
          amountRange: `${minAmount || '0'} - ${maxAmount || '∞'}`
        }
      }
    });
  } catch (error) {
    console.error('Enhanced sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enhanced sales report'
    });
  }
});

// Get payment methods breakdown (Admin)
router.get('/sales/payment-methods', requirePermission('reports.view'), async (req, res) => {
  console.log('=== PAYMENT METHODS ENDPOINT CALLED ===');
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);
    console.log('Date range:', { start: start?.toISOString() || 'null', end: end?.toISOString() || 'null' });

    // Build where clause with multi-select filters
    const filterWhere = buildFilterWhereClause(req);
    const whereClause = {
      status: 'COMPLETED',
      ...(start && end ? { createdAt: buildDateFilter(start, end) } : {}),
      ...filterWhere
    };

    const orders = await prisma.order.findMany({
      where: whereClause,
      select: {
        paymentMethod: true,
        total: true,
        currency: true,
        paidUsd: true,
        paidRiel: true
      }
    });

    console.log('=== ORDERS DEBUG ===');
    console.log('Total orders found:', orders.length);
    console.log('Sample orders:', orders.slice(0, 3).map(o => ({ 
      paymentMethod: o.paymentMethod, 
      currency: o.currency, 
      total: o.total,
      paidUsd: o.paidUsd,
      paidRiel: o.paidRiel
    })));

    // Calculate totals for each currency separately
    // Handle both old orders (without paidUsd/paidRiel) and new orders (with these fields)
    const totalUsdRevenue = orders.reduce((sum, order) => {
      if (order.paidUsd !== null && order.paidUsd !== undefined) {
        // New orders with paidUsd field
        return sum + (parseFloat(order.paidUsd) || 0);
      } else {
        // Old orders - use total if currency is USD
        return order.currency === 'USD' ? sum + parseFloat(order.total) : sum;
      }
    }, 0);
    
    const totalRielRevenue = orders.reduce((sum, order) => {
      if (order.paidRiel !== null && order.paidRiel !== undefined) {
        // New orders with paidRiel field
        return sum + (parseFloat(order.paidRiel) || 0);
      } else {
        // Old orders - convert USD total to Riel if currency is Riel
        return order.currency === 'Riel' ? sum + (parseFloat(order.total) * 4100) : sum;
      }
    }, 0);
    
    const totalOrders = orders.length;

    // Payment method breakdown
    const paymentMethodBreakdown = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'UNKNOWN';
      const currency = order.currency || 'USD';
      const key = `${method}_${currency}`;
      
      if (!paymentMethodBreakdown[key]) {
        paymentMethodBreakdown[key] = {
          method: method,
          currency: currency,
          count: 0,
          revenue: 0,
          percentage: 0
        };
      }
      paymentMethodBreakdown[key].count += 1;
      
      // Use the actual paid amounts for each currency
      if (currency === 'Riel') {
        if (order.paidRiel !== null && order.paidRiel !== undefined) {
          // New orders with paidRiel field
          paymentMethodBreakdown[key].revenue += parseFloat(order.paidRiel) || 0;
        } else {
          // Old orders - convert USD total to Riel
          paymentMethodBreakdown[key].revenue += parseFloat(order.total) * 4100;
        }
      } else {
        if (order.paidUsd !== null && order.paidUsd !== undefined) {
          // New orders with paidUsd field
          paymentMethodBreakdown[key].revenue += parseFloat(order.paidUsd) || 0;
        } else {
          // Old orders - use total for USD
          paymentMethodBreakdown[key].revenue += parseFloat(order.total);
        }
      }
    });

    // Calculate percentages based on total revenue (USD + converted Riel)
    const totalRevenue = totalUsdRevenue + (totalRielRevenue / 4100); // Convert Riel to USD for total
    Object.values(paymentMethodBreakdown).forEach(method => {
      method.percentage = totalRevenue > 0 ? (method.revenue / totalRevenue) * 100 : 0;
    });

    // Calculate currency breakdown using actual paid amounts
    const rielBreakdown = {
      total: totalRielRevenue,
      cash: 0,
      card: 0,
      qr: 0
    };
    
    const usdBreakdown = {
      total: totalUsdRevenue,
      cash: 0,
      card: 0,
      qr: 0
    };

    console.log('=== CURRENCY BREAKDOWN DEBUG ===');
    console.log('Total USD Revenue:', totalUsdRevenue);
    console.log('Total Riel Revenue:', totalRielRevenue);
    console.log('Payment method breakdown:', JSON.stringify(paymentMethodBreakdown, null, 2));

    // Calculate breakdown by payment method for each currency
    orders.forEach(order => {
      const method = order.paymentMethod || 'UNKNOWN';
      
      // Handle USD amounts
      let paidUsd = 0;
      if (order.paidUsd !== null && order.paidUsd !== undefined) {
        // New orders with paidUsd field
        paidUsd = parseFloat(order.paidUsd) || 0;
      } else if (order.currency === 'USD') {
        // Old orders - use total for USD
        paidUsd = parseFloat(order.total);
      }
      
      if (paidUsd > 0) {
        if (method === 'CASH') usdBreakdown.cash += paidUsd;
        else if (method === 'CARD') usdBreakdown.card += paidUsd;
        else if (method === 'QR') usdBreakdown.qr += paidUsd;
      }
      
      // Handle Riel amounts
      let paidRiel = 0;
      if (order.paidRiel !== null && order.paidRiel !== undefined) {
        // New orders with paidRiel field
        paidRiel = parseFloat(order.paidRiel) || 0;
      } else if (order.currency === 'Riel') {
        // Old orders - convert USD total to Riel
        paidRiel = parseFloat(order.total) * 4100;
      }
      
      if (paidRiel > 0) {
        if (method === 'CASH') rielBreakdown.cash += paidRiel;
        else if (method === 'CARD') rielBreakdown.card += paidRiel;
        else if (method === 'QR') rielBreakdown.qr += paidRiel;
      }
    });
    
    // Currency breakdown not calculated for this endpoint

    const responseData = {
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)), // Convert Riel to USD for grand total
        totalOrders,
        paymentMethods: Object.values(paymentMethodBreakdown),
        rielBreakdown: rielBreakdown.total > 0 ? {
          total: parseFloat(rielBreakdown.total.toFixed(2)),
          cash: parseFloat(rielBreakdown.cash.toFixed(2)),
          card: parseFloat(rielBreakdown.card.toFixed(2)),
          qr: parseFloat(rielBreakdown.qr.toFixed(2))
        } : null,
        usdBreakdown: usdBreakdown.total > 0 ? {
          total: parseFloat(usdBreakdown.total.toFixed(2)),
          cash: parseFloat(usdBreakdown.cash.toFixed(2)),
          card: parseFloat(usdBreakdown.card.toFixed(2)),
          qr: parseFloat(usdBreakdown.qr.toFixed(2))
        } : null
      }
    };
    
    console.log('Sending response data:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error('Payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods data'
    });
  }
});

// Get cashier-specific payment methods breakdown
router.get('/cashier-payment-methods', requirePermission('reports.view'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDateRange(range, startDate, endDate);

    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
        status: 'COMPLETED',
        ...(start && end ? { createdAt: buildDateFilter(start, end) } : {})
      },
      select: {
        paymentMethod: true,
        total: true,
        currency: true,
        paidUsd: true,
        paidRiel: true
      }
    });

    // Calculate totals for each currency separately
    const totalUsdRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.paidUsd) || 0), 0);
    const totalRielRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.paidRiel) || 0), 0);
    const totalOrders = orders.length;

    // Payment method breakdown
    const paymentMethodBreakdown = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'UNKNOWN';
      const currency = order.currency || 'USD';
      const key = `${method}_${currency}`;
      
      if (!paymentMethodBreakdown[key]) {
        paymentMethodBreakdown[key] = {
          method: method,
          currency: currency,
          count: 0,
          revenue: 0,
          percentage: 0
        };
      }
      paymentMethodBreakdown[key].count += 1;
      
      // Use the actual paid amounts for each currency
      if (currency === 'Riel') {
        if (order.paidRiel !== null && order.paidRiel !== undefined) {
          // New orders with paidRiel field
          paymentMethodBreakdown[key].revenue += parseFloat(order.paidRiel) || 0;
        } else {
          // Old orders - convert USD total to Riel
          paymentMethodBreakdown[key].revenue += parseFloat(order.total) * 4100;
        }
      } else {
        if (order.paidUsd !== null && order.paidUsd !== undefined) {
          // New orders with paidUsd field
          paymentMethodBreakdown[key].revenue += parseFloat(order.paidUsd) || 0;
        } else {
          // Old orders - use total for USD
          paymentMethodBreakdown[key].revenue += parseFloat(order.total);
        }
      }
    });

    // Calculate percentages based on total revenue (USD + converted Riel)
    const totalRevenue = totalUsdRevenue + (totalRielRevenue / 4100); // Convert Riel to USD for total
    Object.values(paymentMethodBreakdown).forEach(method => {
      method.percentage = totalRevenue > 0 ? (method.revenue / totalRevenue) * 100 : 0;
    });

    // Calculate currency breakdown using actual paid amounts
    const rielBreakdown = {
      total: totalRielRevenue,
      cash: 0,
      card: 0,
      qr: 0
    };
    
    const usdBreakdown = {
      total: totalUsdRevenue,
      cash: 0,
      card: 0,
      qr: 0
    };

    // Calculate breakdown by payment method for each currency
    orders.forEach(order => {
      const method = order.paymentMethod || 'UNKNOWN';
      
      // Handle USD amounts
      let paidUsd = 0;
      if (order.paidUsd !== null && order.paidUsd !== undefined) {
        // New orders with paidUsd field
        paidUsd = parseFloat(order.paidUsd) || 0;
      } else if (order.currency === 'USD') {
        // Old orders - use total for USD
        paidUsd = parseFloat(order.total);
      }
      
      if (paidUsd > 0) {
        if (method === 'CASH') usdBreakdown.cash += paidUsd;
        else if (method === 'CARD') usdBreakdown.card += paidUsd;
        else if (method === 'QR') usdBreakdown.qr += paidUsd;
      }
      
      // Handle Riel amounts
      let paidRiel = 0;
      if (order.paidRiel !== null && order.paidRiel !== undefined) {
        // New orders with paidRiel field
        paidRiel = parseFloat(order.paidRiel) || 0;
      } else if (order.currency === 'Riel') {
        // Old orders - convert USD total to Riel
        paidRiel = parseFloat(order.total) * 4100;
      }
      
      if (paidRiel > 0) {
        if (method === 'CASH') rielBreakdown.cash += paidRiel;
        else if (method === 'CARD') rielBreakdown.card += paidRiel;
        else if (method === 'QR') rielBreakdown.qr += paidRiel;
      }
    });
    
    // Currency breakdown not calculated for this endpoint

    res.json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)), // Convert Riel to USD for grand total
        totalOrders,
        paymentMethods: Object.values(paymentMethodBreakdown),
        rielBreakdown: rielBreakdown.total > 0 ? {
          total: parseFloat(rielBreakdown.total.toFixed(2)),
          cash: parseFloat(rielBreakdown.cash.toFixed(2)),
          card: parseFloat(rielBreakdown.card.toFixed(2)),
          qr: parseFloat(rielBreakdown.qr.toFixed(2))
        } : null,
        usdBreakdown: usdBreakdown.total > 0 ? {
          total: parseFloat(usdBreakdown.total.toFixed(2)),
          cash: parseFloat(usdBreakdown.cash.toFixed(2)),
          card: parseFloat(usdBreakdown.card.toFixed(2)),
          qr: parseFloat(usdBreakdown.qr.toFixed(2))
        } : null
      }
    });
  } catch (error) {
    console.error('Cashier payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cashier payment methods data'
    });
  }
});

module.exports = router; 