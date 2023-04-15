const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

function logRequest(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration} ms`
    );
  });
  next();
}

wss.on('connection', (ws) => {
  clients.push(ws);
  console.log('Client connected to WebSocket.');

  ws.on('message', (message) => {
    console.log('Received message:', message.toString());
  });

  ws.on('close', () => {
    clients = clients.filter((client) => client !== ws);
    console.log('Client disconnected from WebSocket.');
  });
});

app.use(logRequest);
app.use(express.json());

app.post('/send-message', async (req, res) => {
  const { message } = req.body;
  // Create a unique identifier for the request
  const requestId = Date.now();
  let responseSent = false;

  const promises = clients.map((client) => {
    return new Promise((resolve) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'new-message', message, requestId: requestId }), () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });

  await Promise.all(promises);

  // Define a function to handle responses from the extension
  const handleResponse = (message) => {
    const data = JSON.parse(message.data.toString());
    console.log(data.type === 'response', data.requestId, requestId)
    if (data.type === 'response' && data.requestId === requestId) {
      res.status(200).json({ data: data.content });
      responseSent = true;

      // Remove the listener
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.removeEventListener('message', handleResponse);
        }
      });
    }
  };

  // Add the listener to all clients
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.addEventListener('message', handleResponse);
    }
  });

  // Set a timeout for the response
  setTimeout(() => {
    if (!responseSent) {
      res.status(408).json({ error: 'Request timeout' });

      // Remove the listener
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.removeEventListener('message', handleResponse);
        }
      });
    }
  }, 120000); // 120 seconds timeout
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});