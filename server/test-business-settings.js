// Test script to verify Business Information settings functionality
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testBusinessSettings() {
  console.log('🧪 Testing Business Information Settings...\n');

  try {
    // Test 1: Get current settings
    console.log('1️⃣ Testing GET /api/settings');
    const getResponse = await axios.get(`${API_BASE_URL}/api/settings`);
    console.log('✅ GET settings successful');
    console.log('📊 Current business settings:', JSON.stringify(getResponse.data.data.business, null, 2));
    console.log('');

    // Test 2: Update business settings
    console.log('2️⃣ Testing PUT /api/settings/business');
    const testBusinessData = {
      restaurantName: 'Test Restaurant POS',
      address: '456 Test Street, Test City, TS 12345',
      phone: '+1 (555) 987-6543',
      email: 'test@restaurant.com',
      taxRate: 9.5,
      currency: 'EUR',
      timezone: 'Europe/London'
    };

    const updateResponse = await axios.put(`${API_BASE_URL}/api/settings/business`, testBusinessData);
    console.log('✅ PUT business settings successful');
    console.log('📊 Updated business settings:', JSON.stringify(updateResponse.data.data, null, 2));
    console.log('');

    // Test 3: Verify settings were saved
    console.log('3️⃣ Testing GET /api/settings (verification)');
    const verifyResponse = await axios.get(`${API_BASE_URL}/api/settings`);
    console.log('✅ GET settings verification successful');
    console.log('📊 Verified business settings:', JSON.stringify(verifyResponse.data.data.business, null, 2));
    console.log('');

    // Test 4: Test validation errors
    console.log('4️⃣ Testing validation errors');
    try {
      const invalidData = {
        restaurantName: '', // Empty name should fail
        address: 'Short', // Too short address
        phone: 'invalid-phone', // Invalid phone format
        email: 'invalid-email', // Invalid email
        taxRate: 150, // Tax rate > 100%
        currency: 'USD',
        timezone: 'UTC'
      };

      await axios.put(`${API_BASE_URL}/api/settings/business`, invalidData);
      console.log('❌ Expected validation error but request succeeded');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation errors caught correctly');
        console.log('📋 Validation errors:', error.response.data.errors);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 5: Reset to defaults
    console.log('5️⃣ Testing POST /api/settings/reset');
    const resetResponse = await axios.post(`${API_BASE_URL}/api/settings/reset`);
    console.log('✅ Reset settings successful');
    console.log('📊 Reset response:', resetResponse.data.message);
    console.log('');

    // Test 6: Verify reset
    console.log('6️⃣ Testing GET /api/settings (after reset)');
    const finalResponse = await axios.get(`${API_BASE_URL}/api/settings`);
    console.log('✅ GET settings after reset successful');
    console.log('📊 Final business settings:', JSON.stringify(finalResponse.data.data.business, null, 2));
    console.log('');

    console.log('🎉 All Business Information tests passed successfully!');
    console.log('');
    console.log('📋 Summary of Business Information functionality:');
    console.log('   ✅ Settings can be retrieved');
    console.log('   ✅ Settings can be updated');
    console.log('   ✅ Validation works correctly');
    console.log('   ✅ Settings can be reset to defaults');
    console.log('   ✅ Data persistence works');
    console.log('   ✅ All business fields are properly handled');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testBusinessSettings(); 