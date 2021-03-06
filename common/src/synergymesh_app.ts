/**
 * @module common
 */
import * as d3 from 'd3';
import * as $ from 'jquery';
import { CommonNetworkEvents } from './constants/common_network_events';
import { Roles } from './constants/roles';
import { Config } from './utils/config';
import { Networking } from './utils/networking';
import { CommonElements } from './constants/common_elements';

 /**
 * Abstract class which defines what all SynergyMesh apps should do.
 * (e.g. load contents, connect to other instances, etc.)
 */
export abstract class SynergyMeshApp {	

	
	//// Private Constants. ////
	
	/** Key to use in local storage to store the session key. */
	private static SESSION_ID_STORE_KEY = 'synergymesh-session';


	//// Public Global Variables. ////
	
	/** Flag to indicate whether the app is ready yet. */
	public isReady = false;

	/** The height of the SVG element. */
	public vizHeight: number;

	/** The width of the SVG element. */
	public vizWidth: number;


	//// Protected Global Variables. ////
	
	/** The name of this app. */
	protected appName: string = 'SynergyMesh';
	
	/** The URL root of the page. */
	protected rootPath: string;
	
	/** The role of the intended user of this app. */
	protected role: string = Roles.STUDENT;
	
	/** The ID of the network session to use. */
	protected sessionId: string;

	/** The svg which holds all the elements. */
	protected svg: d3.Selection<any>;
	
	/** Flag to indicate if the app is in test mode. */
	protected testMode: boolean = false;
	
	
	//// Private Global Variables. */
	
	/** Regular expression for just alpha-numeric characters. */
	private pattern: RegExp = /[^a-zA-Z0-9 ]/g;
	
	
	//// Constructor. ////

	/**
	 * Initialise a SynergyMeshApp object.
	 * 
	 * @param {string} root The URL root of the page.
	 * @param {boolean} testMode Flag to indicate if the app is in test mode.
	 */
	public constructor(rootPath: string = '', testMode: boolean = false) {	

		document.addEventListener('dragstart', function (e) {
			e.preventDefault();
		});
			
		// Store test mode.
		this.testMode = testMode;
	
		// Run any pre-start functions.
		this.preStart();
	
		// Get inital display dimensions.
		this.vizHeight = Math.max(document.documentElement.clientHeight, window.innerHeight, screen.height|| 0);
		this.vizWidth = Math.max(document.documentElement.clientWidth, window.innerWidth, screen.width || 0);
		
		// Store root.
		this.rootPath = rootPath;		
			
		// Get values from config.
		Config.getConfig(testMode, this.buildAppStarter.bind(this));
			
	}
	
	/**
	 * Put in place listeners for building the app with.
	 */
	private buildAppStarter(): void{
		
		// Check is not in test mode.
		if (!this.testMode) {
			
			// Create self object for referencing elsewhere.
			let self = this;
			
			// Get session input.
			let sessionInput = <HTMLInputElement>document.getElementById(CommonElements.SESSION_INPUT);
			
			// Set session input default value.
			if (sessionInput != undefined) {
				if (SynergyMeshApp.SESSION_ID_STORE_KEY in localStorage) {
					sessionInput.value = localStorage[SynergyMeshApp.SESSION_ID_STORE_KEY];
				}
			}
			
			// Create button to start the app.
			let startButton = document.getElementById(CommonElements.START_BUTTON);
			startButton.addEventListener('touchstart', function(e) {		
				e.preventDefault();
				self.startAppAttempt(startButton, sessionInput);			
			});
			
			// Add listener to session input field which filters out non-alphanumeric characters..
			$('#' + CommonElements.SESSION_INPUT).bind('keypress', function(event) {			
				let value = String.fromCharCode(event.which);			
				let sessionInput = <HTMLInputElement>document.getElementById(CommonElements.SESSION_INPUT);
				sessionInput.value = sessionInput.value.replace(self.pattern, '');
				     if (event.keyCode == 13) { 
						self.startAppAttempt(startButton, sessionInput); 
					} 
				return !self.pattern.test(value);
			});
				
		} else {
			
			// Disable networking.
			Networking.setEnabled(false);
			
			// Trigger the app running.
			this.startAppEnvironment();
				
		}
		
	}
	
	/**
	 * Function for attempting to start the app.
	 * 
	 * @param {HTMLElement} startButton The button to start the app with.
	 * @param {HTMLInputElement} sessionInput The text input button. 
	 */
	private startAppAttempt(startButton: HTMLElement, sessionInput: HTMLInputElement): void {
		
		// Check if session input field is present.
		if (sessionInput != undefined) {
			
			// Get valid text.
			let input = sessionInput.value.replace(this.pattern, '');
			
			// Display warning if blank.
			if (input == '') {
				alert('You need to enter a session ID for this app.');
				return;
			}
			
			// Store supplied session.
			this.sessionId = input;
			localStorage[SynergyMeshApp.SESSION_ID_STORE_KEY] = input;
			
		}
		
		// Hide elements.
		document.getElementById(CommonElements.SYNERGYMESH_CONTROLS).hidden = true;
		
		// Start app.
		this.startAppEnvironment();	
		
		// Full screen on desktop.
		if(!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(navigator.userAgent))){
			
			// Set full screen.
			this.requestFullscreen(document.getElementById(CommonElements.APP_SVG));			
	
			// Get fullscreen display dimensions.
			this.vizHeight = Math.max(document.documentElement.clientHeight, window.innerHeight, screen.height|| 0);
			this.vizWidth = Math.max(document.documentElement.clientWidth, window.innerWidth, screen.width || 0);
			
		}
		
	}
	
	/**
	 * Make the supplied element fullscreen.
	 * 
	 * @param (any) ele HTML element.
	 */
	private requestFullscreen(ele: any) {
		if (ele.requestFullscreen) {
			ele.requestFullscreen();
		} else if (ele.webkitRequestFullscreen) {
			ele.webkitRequestFullscreen();
		} else if (ele.mozRequestFullScreen) {
			ele.mozRequestFullScreen();
		} else if (ele.msRequestFullscreen) {
			ele.msRequestFullscreen();
		} else {
			console.log('Fullscreen API is not supported.');
		}
	}
	
	/**
	 * Builds the initial environment.
	 */
	private startAppEnvironment() {		
		
		// Create SVG that fits window size.
		this.svg = d3.select('#' + CommonElements.APP_SVG_DIV).append('svg');
		this.svg.attr('xmlns', 'http://www.w3.org/2000/svg');
		this.svg.attr('height', this.vizHeight);
		this.svg.attr('width', this.vizWidth);
		this.svg.attr('id', CommonElements.APP_SVG);
		
		// Add background to SVG.
		let backgroundRectangle = this.svg.append('rect');
		backgroundRectangle.attr('height', this.vizHeight)
		backgroundRectangle.attr('width', this.vizWidth);
		backgroundRectangle.attr('id', CommonElements.APP_BG);
		
		// Call function which adds the app's specific contents.
		this.addContents();
		
	}
	
	
	//// Protected Methods. ////
	
	/**
	 * Add the contents specific to this app to override.
	 */
	protected addContents() {}
	
	/**
	 * Add listeners for teacher control messages from the server.
	 */
	protected addTeacherControlListeners(): void {
		
		// Build hidden freeze block. 
		let freezeBlock = this.svg.append('rect');
		freezeBlock.attr('id', 'freeze-block');
		freezeBlock.attr('width', this.vizWidth);
		freezeBlock.attr('height', this.vizHeight);
		freezeBlock.style('visibility', 'hidden');
		
		// Set up freeze listener.
		Networking.listenForMessage(CommonNetworkEvents.FREEZE, function() {
			freezeBlock.each(function(){
				this.parentNode.appendChild(this);
			});
			freezeBlock.style('visibility', 'visible');
		});
		
		// Set up unfreeze listener.
		Networking.listenForMessage(CommonNetworkEvents.UNFREEZE, function() {
			freezeBlock.style('visibility', 'hidden');
		});
			
	}
	
	/**
	 * Set up the networking connection.
	 * 
	 * @param {() => void} clientListCallback The function to call when the client list is updated.
	 */
	protected establishNetworking(clientListCallback: () => void = null): void {
	
		// Get host and port from config.
		let host = Config.getConfigValue(Config.SERVER_HOST);
		let port = Config.getConfigValue(Config.SERVER_PORT);
		
		// Set debugging if needed.
		if (Config.getConfigValue(Config.NETWORK_DEBUGGING)) {
			Networking.debug = true;
		}
		
		// Announce presence to server.
		Networking.establishConnection(host, port, this.sessionId, this.role, this.appName, clientListCallback);
	
	}
	
	/**
	 * Function to be called when the page is first loaded.
	 */
	protected preStart() {}
	
	/**
	 * Function to be called after initial setup to indicate that the app is ready.
	 */
	protected ready() {
		this.isReady = true;
	}
	
}
