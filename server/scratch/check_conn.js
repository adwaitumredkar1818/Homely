const dns = require('dns');
const net = require('net');

dns.setServers(['8.8.8.8']);
console.log('Resolving db.kavdqktsmbstfezlccke.supabase.co...');
dns.lookup('db.kavdqktsmbstfezlccke.supabase.co', (err, address) => {
  if (err) {
    console.error('DNS Lookup failed:', err.message);
    return;
  }
  console.log('DNS Lookup successful. Address:', address);
  
  console.log('Testing TCP connection to port 5432...');
  const client = net.createConnection({ host: address, port: 5432 }, () => {
    console.log('TCP Connection SUCCESSFUL!');
    client.end();
  });
  
  client.on('error', (tcpErr) => {
    console.error('TCP Connection FAILED:', tcpErr.message);
  });
  
  setTimeout(() => {
    console.log('TCP connection timeout');
    client.destroy();
  }, 10000);
});
