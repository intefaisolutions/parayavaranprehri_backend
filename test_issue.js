const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testApi() {
  const payload = {
    sub: '66bc6cc3b174b2fcf17a3a30', // Just a dummy valid object ID format
    role: 'mitra',
    permissions: []
  };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });
  
  const response = await fetch('http://localhost:3000/api/v1/field-issues', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      type: 'Missing',
      priority: 'Low',
      description: 'Test issue from script'
    })
  });
  
  const body = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(`Body: ${body}`);
}

testApi().catch(console.error);
