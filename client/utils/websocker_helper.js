class ReconnectingWebSocket {
  constructor(url, protocols = []) {
    this.url = url;
    this.protocols = protocols;
    this.reconnectInterval = 1000; // Initial wait time before reconnecting (in ms)
    this.maxReconnectInterval = 30000; // Maximum wait time before reconnecting (in ms)
    this.reconnectDecay = 1.5; // Reconnect interval growth factor
    this.reconnectAttempts = 0; // Number of reconnect attempts
    this.maxReconnectAttempts = 10; // Maximum number of reconnect attempts
    this.websocket = null; // The actual WebSocket connection
    this.shouldReconnect = true; // Whether to attempt reconnects or not

    // Event listeners
    this.onopen = () => {
    };
    this.onclose = () => {
    };
    this.onerror = () => {
    };
    this.onmessage = () => {
    };

    this.connect();
  }

  connect() {
    this.websocket = new WebSocket(this.url, this.protocols);

    this.websocket.onopen = (event) => {
      console.log("WebSocket connected:", event);
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      this.onopen(event); // Call user-defined onopen handler
    };

    this.websocket.onclose = (event) => {
      console.log("WebSocket closed:", event);
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => this.reconnect(), this.reconnectInterval);
        this.reconnectInterval = Math.min(this.reconnectInterval * this.reconnectDecay, this.maxReconnectInterval);
        this.reconnectAttempts++;
      }
      this.onclose(event); // Call user-defined onclose handler
    };

    this.websocket.onerror = (event) => {
      console.error("WebSocket error:", event);
      this.onerror(event); // Call user-defined onerror handler
    };

    this.websocket.onmessage = (event) => {
      console.log("WebSocket message received:", event);
      this.onmessage(event); // Call user-defined onmessage handler
    };
  }

  reconnect() {
    console.log(`Attempting to reconnect (#${this.reconnectAttempts})...`);
    this.connect();
  }

  send(message) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(message);
    } else {
      console.error("WebSocket is not open. Unable to send message:", message);
    }
  }

  close() {
    this.shouldReconnect = false; // Prevent further reconnection attempts
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

export default ReconnectingWebSocket;

