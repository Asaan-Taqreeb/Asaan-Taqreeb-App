const fetch = require('node-fetch');

async function checkChats() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZjQ4ZThkMDI0MDZjZWU1NTdjODAyMiIsInJvbGUiOiJjbGllbnQiLCJpYXQiOjE3Nzc2Njc5MzcsImV4cCI6MTc3NzY2ODgzN30.I9ec_7uAinZKqqJAk3UoqNQeW92eqHgb7F-I05A9kZQ';
  
  try {
    const res = await fetch('https://asaan-taqreeb-backend.onrender.com/api/v1/messages', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

checkChats();
