import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  tenantId?: number;
  userId?: number;
}

export class CRMWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/crm'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('🔗 CRM WebSocket server initialized on /ws/crm');
  }

  private async handleConnection(ws: AuthenticatedWebSocket, request: any) {
    try {
      // Extract token from query params
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(1008, 'Authentication token required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      ws.tenantId = decoded.tenantId;
      ws.userId = decoded.userId;

      // Add client to tenant group
      if (!this.clients.has(ws.tenantId!)) {
        this.clients.set(ws.tenantId!, new Set());
      }
      this.clients.get(ws.tenantId!)!.add(ws);

      console.log(`📱 CRM WebSocket client connected for tenant ${ws.tenantId}`);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'CRM WebSocket connection established',
        tenantId: ws.tenantId
      }));

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('❌ Invalid WebSocket message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.handleDisconnection(ws);
      });

    } catch (error) {
      console.error('❌ WebSocket authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: any) {
    console.log(`📨 Received WebSocket message from tenant ${ws.tenantId}:`, message);

    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      
      case 'subscribe_customer_updates':
        // Client wants to subscribe to customer updates
        ws.send(JSON.stringify({ 
          type: 'subscription_confirmed', 
          subscription: 'customer_updates' 
        }));
        break;

      default:
        console.log(`❓ Unknown message type: ${message.type}`);
    }
  }

  private handleDisconnection(ws: AuthenticatedWebSocket) {
    if (ws.tenantId) {
      const tenantClients = this.clients.get(ws.tenantId);
      if (tenantClients) {
        tenantClients.delete(ws);
        if (tenantClients.size === 0) {
          this.clients.delete(ws.tenantId);
        }
      }
      console.log(`📱 CRM WebSocket client disconnected for tenant ${ws.tenantId}`);
    }
  }

  // Broadcast customer status update to all tenant clients
  broadcastCustomerUpdate(tenantId: number, customerUpdate: any) {
    const tenantClients = this.clients.get(tenantId);
    if (tenantClients) {
      const message = JSON.stringify({
        type: 'customer_status_update',
        data: customerUpdate,
        timestamp: Date.now()
      });

      tenantClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });

      console.log(`🔄 Broadcasted customer update to ${tenantClients.size} clients for tenant ${tenantId}`);
    }
  }

  // Broadcast customer creation to all tenant clients
  broadcastCustomerCreated(tenantId: number, customer: any) {
    const tenantClients = this.clients.get(tenantId);
    if (tenantClients) {
      const message = JSON.stringify({
        type: 'customer_created',
        data: customer,
        timestamp: Date.now()
      });

      tenantClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });

      console.log(`🔄 Broadcasted customer creation to ${tenantClients.size} clients for tenant ${tenantId}`);
    }
  }

  // Get connected clients count for a tenant
  getConnectedClientsCount(tenantId: number): number {
    const tenantClients = this.clients.get(tenantId);
    return tenantClients ? tenantClients.size : 0;
  }

  // Cleanup and shutdown
  shutdown() {
    this.wss.close();
    this.clients.clear();
    console.log('🔌 CRM WebSocket server shutdown');
  }
}