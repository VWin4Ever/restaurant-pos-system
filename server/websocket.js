const WebSocket = require('ws');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);
      
      // Send initial connection confirmation
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        message: 'Connected to real-time updates'
      }));
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }
  
  // Broadcast to all connected clients
  broadcast(data) {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(data));
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
          this.clients.delete(client);
        }
      }
    });
  }
  
  // Send table update
  sendTableUpdate(table) {
    this.broadcast({
      type: 'table_update',
      table: table,
      timestamp: new Date().toISOString()
    });
  }
  
  // Send tables refresh notification
  sendTablesRefresh() {
    this.broadcast({
      type: 'tables_refresh',
      timestamp: new Date().toISOString()
    });
  }
  
  // Get connected clients count
  getConnectedClientsCount() {
    return this.clients.size;
  }
}

module.exports = WebSocketServer; 