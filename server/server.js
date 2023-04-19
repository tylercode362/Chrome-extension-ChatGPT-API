const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const requestIds = {};
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

const sendMessage = async (req, res) => {
  let message;
  const requestId = Date.now();
  let responseSent = false;
  requestIds[requestId] = { path: req.path, responseSent: false }

  if (req.path === '/chat/completions') {
    console.log(
      `Request received: ${req.method} ${req.path} ${JSON.stringify(req.body)}`
    );

    const { messages } = req.body;

    message = messages
      ? messages
          .map((message) => `${message.role}: ${message.content}`)
          .join('\n')
      : '';
    console.log('Combined messages:', message);
  } else {
    message = req.body.message;
    console.log('Request received:', req.method, req.path, JSON.stringify(req.body));
  }

  const promises = clients.map((client) => {
    return new Promise((resolve) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log(requestId)
        client.send(JSON.stringify({ type: 'new-message', message, requestId: requestId }), () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });

  await Promise.all(promises);

  const handleResponse = (message) => {
    const data = JSON.parse(message.data.toString());

    if (data.type === 'response' && data.requestId === requestId) {
      const requestPath = requestIds[requestId].path;
      requestIds[requestId].responseSent = true

      if (requestPath === '/chat/completions') {
        const now = Math.floor(Date.now() / 1000);
        const formattedResponse = {
          id: requestId,
          object: 'chat.completion',
          created: now,
          model: 'gpt-4',
          usage: {
            prompt_tokens: 1,
            completion_tokens: 1,
            total_tokens: 2,
          },
          choices: [
            {
              message: {
                role: 'assistant',
                content: data.content,
              },
              finish_reason: 'stop',
              index: 0,
            },
          ],
        };

        res.status(200).json(formattedResponse);
      } else {
        res.status(200).json({ data: data.content });
      }

      responseSent = true;

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.removeEventListener('message', handleResponse);
        }
      });
    }
  };

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.addEventListener('message', handleResponse);
    }
  });

  setTimeout(() => {
    if (!requestIds[requestId].responseSent) {
      res.status(408).json({ error: 'Request timeout' });

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.removeEventListener('message', handleResponse);
        }
      });
    }
  }, 120000);
};

app.post('/send-message', sendMessage);
app.post('/chat/completions', sendMessage);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
