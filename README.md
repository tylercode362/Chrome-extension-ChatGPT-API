# WebSocket API Bridge Extension for Chat.OpenAI
This browser extension is specifically designed to communicate with chat.openai.com using WebSockets. It allows users to interact with the chat interface by sending messages and receiving responses through a WebSocket server.

<img width="750" alt="" src="https://user-images.githubusercontent.com/22150402/232227769-95f1fef1-2914-4162-bfad-c95b850a28a1.png">

<img width="753" alt="" src="https://user-images.githubusercontent.com/22150402/232227774-ba1a2e4d-7576-4ab1-820a-5ffd09f1c4dd.png">

<img width="541" alt="" src="https://user-images.githubusercontent.com/22150402/232227783-828d7dd4-d942-4bca-8033-f530f225858f.png">


## Features
Communicate with chat.openai.com using WebSockets
Send messages to chat.openai.com through a WebSocket server
Receive responses from chat.openai.com (ChatGPT Web) and display them in the chat interface

## Usage
Clone the repository to your local machine:

```
git clone https://github.com/tylercode362/websocket-api-bridge-extension.git
cd websocket-api-bridge-extension/server
docker-compose up
``` 

###Install the extension in Google Chrome:

Open Chrome and navigate to chrome://extensions/
Enable "Developer mode" in the top-right corner
Click on "Load unpacked" and select the websocket-api-bridge-extension/extension folder
Visit https://chat.openai.com/ and start using the extension.

## API
The server exposes an API endpoint to send messages to the chat:

Send Message
Send a message to chat.openai.com through the WebSocket server.

```
URL: /send-message
Method: POST
Content-Type: application/json
Data Params: { "message": "Your message here" }
```

Example:

```
curl -X POST -H "Content-Type: application/json" -d '{"message": "hi"}' http://localhost:3000/send-message
The response will contain the content generated by chat.openai.com.
```

Known Limitations
The extension is only compatible with Google Chrome.
The extension is designed to work specifically with chat.openai.com and may not function properly on other websites.
