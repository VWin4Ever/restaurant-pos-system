# ✅ Cashier Settings Access Fix

## Issue Fixed
**Cashiers were getting 403 Forbidden errors when trying to access settings data needed for daily operations.**

---

## 🔍 Root Cause

The SettingsContext was trying to fetch from `/api/settings` which requires `settings.read` permission, but cashiers don't have this permission. However, cashiers need access to basic business settings like:

- **VAT Rate** - for tax calculations
- **Currency** - for currency formatting
- **Restaurant Name** - for receipts and display
- **Timezone** - for time display

---

## 🔧 Fix Applied

### Backend (server/routes/settings.js)

**Added new endpoint for cashiers:**

```javascript
// NEW: Get basic business settings (for cashiers and other users)
router.get('/business', async (req, res) => {
  try {
    // Get only business settings from database
    const businessSettingsRecord = await prisma.settings.findFirst({
      where: { category: 'business' }
    });
    
    // Return only essential business settings that cashiers need
    const cashierSettings = {
      business: {
        vatRate: businessSettings.vatRate,
        currency: businessSettings.currency,
        restaurantName: businessSettings.restaurantName,
        timezone: businessSettings.timezone,
        // Add other essential settings as needed
      }
    };

    res.json({
      success: true,
      data: cashierSettings
    });
  } catch (error) {
    // Error handling...
  }
});
```

**Key Features:**
- ✅ **No Permission Required:** Public endpoint for essential business settings
- ✅ **Limited Data:** Only business settings, not system/security settings
- ✅ **Secure:** No sensitive configuration data exposed
- ✅ **Efficient:** Single database query for business settings only

### Frontend (client/src/contexts/SettingsContext.js)

**Updated to use role-based endpoints:**

```javascript
const fetchSettings = async () => {
  try {
    // Use different endpoint based on user role
    const endpoint = user?.role === 'ADMIN' ? '/api/settings' : '/api/settings/business';
    const response = await axios.get(endpoint);
    const fetchedSettings = response.data.data;
    
    // For cashiers, we only get business settings, so merge with existing defaults
    if (user?.role === 'CASHIER') {
      setSettings(prev => ({
        ...prev,
        business: {
          ...prev.business,
          ...fetchedSettings.business
        }
      }));
    } else {
      // For admins, replace all settings
      setSettings(fetchedSettings);
    }
  } catch (error) {
    // Error handling...
  }
};
```

**Key Features:**
- ✅ **Role-Based Access:** Admins get full settings, cashiers get business only
- ✅ **Smart Merging:** Cashiers get business settings merged with defaults
- ✅ **User Dependency:** Refetches when user changes
- ✅ **Backward Compatible:** Admins still get full settings access

---

## 🔒 Security Model

### What Cashiers Can Access ✅
- **Business Settings:** VAT rate, currency, restaurant name, timezone
- **Essential Operations:** Tax calculations, currency formatting, receipts

### What Cashiers Cannot Access ❌
- **System Settings:** Auto-backup, low stock thresholds, max tables
- **Security Settings:** Session timeouts, password requirements
- **Full Settings Management:** Cannot modify any settings

### Permission Model:
- **Admin:** `settings.read` → Full access to all settings
- **Cashier:** No permissions → Limited access to business settings only

---

## 📊 What This Enables for Cashiers

### Essential Functions Now Work:
1. **Tax Calculations** ✅
   - `getTaxRate()` returns correct VAT rate
   - `calculateTax(subtotal)` works properly

2. **Currency Formatting** ✅
   - `getCurrency()` returns restaurant currency
   - `formatCurrency(amount)` displays correctly

3. **Receipt Generation** ✅
   - Restaurant name appears on receipts
   - Proper timezone for timestamps

4. **Order Processing** ✅
   - Tax calculations in order totals
   - Currency display in order summaries

---

## 🧪 Test Results

### Before Fix ❌
```
SettingsContext.js:46  GET http://localhost:5000/api/settings 403 (Forbidden)
```

### After Fix ✅
```
Settings fetched: { business: { vatRate: 10, currency: "USD", restaurantName: "Angkor Holiday", timezone: "Asia/Phnom_Penh" } }
VAT Rate from settings: 10
```

---

## 📁 Files Modified

- ✅ `server/routes/settings.js` (Lines 147-190)
- ✅ `client/src/contexts/SettingsContext.js` (Lines 1, 17, 46-76, 142-150)

---

## 🚀 Benefits

### For Cashiers:
- **No More 403 Errors:** Settings context loads successfully
- **Full Functionality:** Tax calculations, currency formatting work
- **Better UX:** No console errors or missing data
- **Essential Access:** Get only what they need for daily operations

### For System:
- **Security Maintained:** Cashiers can't access sensitive settings
- **Performance:** Efficient single-query endpoint for business settings
- **Scalability:** Role-based access pattern for future features
- **Maintainability:** Clear separation between admin and cashier settings

---

## 🔄 API Endpoints

### Admin Access:
```
GET /api/settings
- Requires: settings.read permission
- Returns: All settings (business, system, security)
- Used by: Admin settings management
```

### Cashier Access:
```
GET /api/settings/business  
- Requires: No permission (public for authenticated users)
- Returns: Business settings only (vatRate, currency, restaurantName, timezone)
- Used by: Cashier operations, tax calculations, currency formatting
```

---

**Status:** ✅ FIXED  
**Priority:** HIGH (Critical functionality for cashiers)  
**Impact:** Cashiers can now access essential business settings without permission errors

---

*Cashiers now have access to the business settings they need for daily operations while maintaining security by restricting access to system and security configurations.*
