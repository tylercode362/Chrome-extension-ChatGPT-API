# API Bridge Chrome Extension for ChatGPT(Web)

A cutting-edge browser extension designed to facilitate seamless communication with chat.openai.com using WebSockets. This extension enables users to interact with the chat interface by sending messages and receiving responses through a WebSocket server, providing a user-friendly and efficient experience.

This WebSocket API Bridge Extension is compatible with both ChatGPT Plus (including GPT-3.5 and GPT-4) and the Free Version, ensuring access for a wide range of users(without the api key).

<img width="750" alt="" src="https://user-images.githubusercontent.com/22150402/232227769-95f1fef1-2914-4162-bfad-c95b850a28a1.png">

<img width="753" alt="" src="https://user-images.githubusercontent.com/22150402/232227774-ba1a2e4d-7576-4ab1-820a-5ffd09f1c4dd.png">

![image](https://user-images.githubusercontent.com/22150402/232239230-57d6db32-7342-487f-a72b-15e206af72bc.png)


## Features
- Establish real-time communication with chat.openai.com using WebSockets
- Effortlessly send messages to chat.openai.com via a WebSocket server
- Receive prompt responses from ChatGPT Web, directly displayed in the chat interface
- Broad compatibility with ChatGPT Plus (GPT-3.5 / GPT-4) and Free Version (https://chat.openai.com/)

If you're interested in collaborating on

1. the Auto-GPT project, please give it a try:
[Auto-GPT-web-chat](https://github.com/tylercode362/Auto-GPT-web-chat)
<img width="1435" alt="" src="https://user-images.githubusercontent.com/22150402/232292997-664f68ae-c8c0-4e21-b637-51cbd9dd8157.png">

2. the VS Code extension , please give it a try: [VSCode Web ChatGPT Extension](https://github.com/tylercode362/vscode-with-web-chatgpt)
![image](https://user-images.githubusercontent.com/22150402/235415188-7e159e10-8211-449b-bdc3-22450f0a1ad6.png)
![image](https://user-images.githubusercontent.com/22150402/235415197-665882b0-3e10-422b-8dab-31fc86868790.png)

## Usage
### Clone the repository to your local machine:

```
git clone https://github.com/tylercode362/websocket-api-bridge-extension.git
cd websocket-api-bridge-extension/server
docker-compose up
```

[How to Install Docker Compose](https://docs.docker.com/compose/install/)

### Install the extension in Google Chrome:

Open Chrome and navigate to chrome://extensions/
Enable "Developer mode" in the top-right corner
Click on "Load unpacked" and select the websocket-api-bridge-extension/extension folder
Visit https://chat.openai.com/ and start using the extension.

![Click Icon](https://user-images.githubusercontent.com/22150402/232239034-f8c54614-5f01-419b-8c0b-a75fbc270764.png)
![enable Extension](https://user-images.githubusercontent.com/22150402/232239035-de122fde-977d-4567-8048-9a2ecf60e599.png)


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
curl -X POST -H "Content-Type: application/json" -d '{"message": "hi"}' http://localhost:3030/send-message
The response will contain the content generated by chat.openai.com.
```

Known Limitations
The extension is only compatible with Google Chrome.
The extension is designed to work specifically with chat.openai.com and may not function properly on other websites.
