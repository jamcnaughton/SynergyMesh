/**
 * @module utilities
 */
import * as io from 'socket.io-client';

/**
 * Class with static methods for supporting networking.
 */
export class Networking {
	
	
	//// Public Constants. ////
	
	/** Object for holding constant strings relating to networking events. */
	public static EVENTS = {
		
		/** Event for telling the server that the client is joining a session. */
		JOIN: 'join',
		
		/** Event for sending a message to all in a session */
		TO_ALL: 'to_all',
		
		/** Event for sending a message to a specific client in a session */
		TO_CLIENT: 'to_client',
		
		/** Event for sending a message to all in a specific app in a session */
		TO_APP: 'to_app',
		
		/** Event for sending a message to all of a specific role in a session */
		TO_ROLE: 'to_role',
		
		/** Event for sending a message to all of a specific role in a specific app in a session */
		TO_ROLE_IN_APP: 'to_app',
		
		/** Event for updating the client list. */
		UPDATE_CLIENTS: 'update_clients'
			
	};	
	
	/** Object for holding constant strings relating to networking message elements. */
	public static MESSAGE = {			
		
		/** The list of clients used in a client update. */
		CLIENTS: 'clients',				
		
		/** The actual contents of the message to be used by the app. */
		CONTENTS: 'contents',			
		
		/** The name of the event to send to the client. */
		EVENT_NAME: 'event_name',			
		
		/** The target app for the message. */
		TARGET_APP: 'target_app',		
		
		/** The target client for the message. */
		TARGET_CLIENT: 'target_client',
		
		/** The target role for the message. */
		TARGET_ROLE: 'target_role',
		
		/** The target session for the message. */
		TARGET_SESSION: 'target_session'
		
	}
	
	
	//// Public Static Variables. ////
	
	/** The Id of this client. */
	public static clientId: string;
	
	/** Multi-dimensional array of clients currently connected to the same session. */
	public static clients: any[] = [];	
	
	/** The flag to set if the debugging is shown. */
	public static debug: boolean = false;
	
	
	//// Private Static Variables. ////	
	
	/** Flag to indicate if networking is enabled. */
	private static enabled: boolean = true;
	
	/** The session to connect to. */
	private static session: string;
	
	/** Socket io instance. */
	private static socket: any;

	
	/**
	 * Initialise the socket io instance connected to the server on the same host.
	 * 
	 * @param {string} host The protocol and name of the host.
	 * @param {string} port The port of the host.
	 * @param {string} session The session to connect to.
	 * @param {string} role The role of the app user..
	 * @param {string} app The name of the app being run.
	 * @param {() => void} clientListCallback The function to call when the client list is updated.
	 * 
	 */
	public static establishConnection (
		host: string, port: string, session: string, role: string, app: string, clientListCallback: () => void = null): void { 
	
		// Check if networking is enabled.
		if (Networking.enabled) {
		
			// Establish socket.
			Networking.socket = io(host + ':' + port);
			Networking.debugMessage('Connected to server.');
			
			// Store passed values.
			Networking.session = session;
			
			// Listen for the clients list being updated.
			Networking.socket.on(Networking.EVENTS.UPDATE_CLIENTS, function(message: any) {
				
				// Update this client's Id.
				Networking.clientId = Networking.socket.id;
				
				// Update client list.
				Networking.clients = message[Networking.MESSAGE.CLIENTS];
				Networking.debugMessage('Clients list updated.');
				
				// Callback.
				if (clientListCallback != null) {
					clientListCallback();
				}
				
			});
			
			// Establish join object.
			let messageToSend = {};
			messageToSend[Networking.MESSAGE.TARGET_SESSION] = session;
			messageToSend[Networking.MESSAGE.TARGET_ROLE] = role;
			messageToSend[Networking.MESSAGE.TARGET_APP] = app;
				
			// Join the session (or establish it) on the server.
			Networking.socket.emit(Networking.EVENTS.JOIN, messageToSend);	
			Networking.debugMessage('Joined the following session: ' + session);	
			
		}
		
	}	
	
	/**
	 * Set up a listener for server-side events.
	 * 
	 * @param {string} eventName The name of the event to listen for.
	 * @param {(data: JSON) => void)} callback Function to handle incoming message.
	 */
	public static listenForMessage (eventName: string, callback: (message: JSON) => void): void {
	
		// Check if networking is enabled.
		if (Networking.enabled) {
		
			// Establish listener for any messages that calls the passed function.
			Networking.socket.on(eventName, function(message: any){
				
					// Call the callback.
					Networking.debugMessage('Received a message for the following network event: ' + eventName);
					callback(message);
				
			});			
			
		}
		
	}
	
	/**
	 * Send a command to the server asking for it to be broadcast to all clients in the session.
	 * 
	 * @param {string} eventName The name of the event to listen for.
	 * @param {JSON} messageToSend The message to be sent.
	 */
	public static sendMessageToAll (eventName: string, messageToSend: JSON): void {		
	
		// Check if networking is enabled.
		if (Networking.enabled) {
	
			// Create JSON wrapper for sending message.
			let wrappedMessageToSend = {};
			wrappedMessageToSend[Networking.MESSAGE.EVENT_NAME] = eventName;
			wrappedMessageToSend[Networking.MESSAGE.TARGET_SESSION] = Networking.session;
			wrappedMessageToSend[Networking.MESSAGE.CONTENTS] = messageToSend;
			
			// Send message.
			Networking.socket.emit(Networking.EVENTS.TO_ALL, wrappedMessageToSend);		
			Networking.debugMessage('Sent the following network event to all in the session: ' + eventName);	
			
		}
			
	}
	
	/**
	 * Send a command to the server asking for it to be broadcast to all clients in the session 
	 * of a specific role.
	 * 
	 * @param {string} eventName The name of the event to listen for.
	 * @param {string} role The role to send messages to.
	 * @param {JSON} messageToSend The message to be sent.
	 */
	public static sendMessageToRole (eventName: string, role: string, messageToSend: JSON): void{		
	
		// Check if networking is enabled.
		if (Networking.enabled) {
		
			// Create JSON wrapper for sending message.
			let wrappedMessageToSend = {};
			wrappedMessageToSend[Networking.MESSAGE.EVENT_NAME] = eventName;
			wrappedMessageToSend[Networking.MESSAGE.TARGET_SESSION] = Networking.session;
			wrappedMessageToSend[Networking.MESSAGE.TARGET_ROLE] = role;
			wrappedMessageToSend[Networking.MESSAGE.CONTENTS] = messageToSend;
			
			// Send message.
			Networking.socket.emit(Networking.EVENTS.TO_ROLE, wrappedMessageToSend);		
			Networking.debugMessage('Sent the following network event to all in session with the ' + role + ' role: ' + eventName);	
			
		}
			
	}
	
	/**
	 * Send a message to the server asking for it to be broadcast to all clients in the session 
	 * in a specific app.
	 * 
	 * @param {string} eventName The name of the event to listen for.
	 * @param {string} app The app to send messages to.
	 * @param {JSON} messageToSend The message to be sent.
	 */
	public static sendMessageToApp (eventName: string, app: string, messageToSend: JSON): void {		
	
		// Check if networking is enabled.
		if (Networking.enabled) {
	
			// Create JSON wrapper for sending message.
			let wrappedMessageToSend = {};
			wrappedMessageToSend[Networking.MESSAGE.EVENT_NAME] = eventName;
			wrappedMessageToSend[Networking.MESSAGE.TARGET_SESSION] = Networking.session;
			wrappedMessageToSend[Networking.MESSAGE.TARGET_APP] = app;
			wrappedMessageToSend[Networking.MESSAGE.CONTENTS] = messageToSend;
			
			// Send message.
			Networking.socket.emit(Networking.EVENTS.TO_APP, wrappedMessageToSend);		
			Networking.debugMessage('Sent the following network event to all in session in the ' + app + ' app: ' + eventName);	
			
		}
			
	}
	
	/**
	 * Send a message to the server asking for it to be broadcast to all clients in the session 
	 * with a specific role in a specific app.
	 * 
	 * @param {string} eventName The name of the event to listen for.
	 * @param {string} role The role to send messages to.
	 * @param {string} app The app to send messages to.
	 * @param {JSON} messageToSend The message to be sent.
	 */
	public static sendMessageToRoleInApp (eventName: string, role: string, app: string, messageToSend: JSON): void {		
	
		// Check if networking is enabled.
		if (Networking.enabled) {
	
			// Create JSON wrapper for sending message.
			let wrappedMessageToSend = {};
			wrappedMessageToSend[Networking.MESSAGE.EVENT_NAME] = eventName;
			wrappedMessageToSend[Networking.MESSAGE.TARGET_SESSION] = Networking.session;
			wrappedMessageToSend[Networking.MESSAGE.TARGET_ROLE] = role;
			wrappedMessageToSend[Networking.MESSAGE.TARGET_APP] = app;
			wrappedMessageToSend[Networking.MESSAGE.CONTENTS] = messageToSend;
			
			// Send message.
			Networking.socket.emit(Networking.EVENTS.TO_ROLE_IN_APP, wrappedMessageToSend);	
			Networking.debugMessage(
				'Sent the following network event to all in session with the ' + role + ' role in the ' + app + ' app: ' + eventName);		
			
		}
			
	}
	
	/**
	 * Send a command to the server asking for it to be broadcast to a specific client.
	 * 
	 * @param {string} eventName The name of the event to listen for.
	 * @param {string} targetClient The socket id of the client to sent the message to..
	 * @param {JSON} messageToSend The message to be sent.
	 */
	public static sendMessageToSpecificClient (eventName: string, targetClient: string, messageToSend: JSON): void {		
	
		// Check if networking is enabled.
		if (Networking.enabled) {
		
			// Create JSON wrapper for sending message.
			let wrappedMessageToSend = {};
			wrappedMessageToSend[Networking.MESSAGE.EVENT_NAME] = eventName;
			wrappedMessageToSend[Networking.MESSAGE.TARGET_CLIENT] = targetClient;
			wrappedMessageToSend[Networking.MESSAGE.CONTENTS] = messageToSend;
			
			// Send message.
			Networking.socket.emit(Networking.EVENTS.TO_CLIENT, wrappedMessageToSend);		
			Networking.debugMessage('Sent the following network event to the client ' + targetClient + ': ' + eventName);	
			
		}
			
	}
	
	/**
	 * Set whether networking is enabled or not.
	 * 
	 * @param {boolean} enabled Flag to indicate if networking is enabled.
	 */
	public static setEnabled(enabled: boolean): void {
		Networking.enabled = enabled;
	}
	
	
	//// Private Static Methods. ////
	
	/**
	 * Output message (if debugging enabled).
	 * 
	 * @param {string} message The message to output (maybe).
	 */
	private static debugMessage (message: string): void {
		if (Networking.debug) {
			console.log(message);
		}
	}
	
}
