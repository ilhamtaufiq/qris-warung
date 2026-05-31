import { Alert } from 'react-native';
import { getWebSocketUrl } from '@/lib/api';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private shouldReconnect = false;
  
  connect(storeId: number) {
    this.shouldReconnect = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const wsUrl = getWebSocketUrl(`/ws/${storeId}`);
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };
    
    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === 'payment_success') {
          // Play sound in a real app, here we show an alert (Soundbox MVP)
          Alert.alert("PAYMENT RECEIVED!", `Amount: Rp ${data.amount}`);
        } else if (data.event === 'payment_expired') {
          Alert.alert("Payment Expired", `Order: ${data.order_id}`);
        }
      } catch (err) {
        console.error("Error parsing message", err);
      }
    };
    
    this.ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };
    
    this.ws.onclose = (e) => {
      console.log('WebSocket disconnected', {
        code: e.code,
        reason: e.reason,
        wasClean: e.wasClean,
      });
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(storeId), 5000);
      }
    };
  }
  
  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();
