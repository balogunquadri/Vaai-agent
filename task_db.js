const url = 'https://5838ur4e.us-east.insforge.app/integrations';
const apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMjQwMjR9.beYa0c9HxMPrumgLYX8kmwyghrcNMdn248NPGsm6v5U';

async function run() {
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': apikey,
        'Authorization': `Bearer ${apikey}`
      }
    });
    const text = await res.text();
    console.log("Raw Response:", text);
  } catch (err) {
    console.error(err);
  }
}

run();
