/**
 * @module listeners
 */

 import * as d3 from 'd3';
import * as $ from 'jquery';
import {CommonElements} from '../../../common/src/constants/common_elements';
import {Roles} from '../../../common/src/constants/roles';
import {FlickManager} from '../../../common/src/listeners/flick_manager';
import {TouchManager} from '../../../common/src/listeners/touch_manager';
import {SynergyMeshApp} from '../../../common/src/synergymesh_app';
import {Networking} from '../../../common/src/utils/networking';
import {Transformations} from '../../../common/src/utils/transformations';

/**
 * A class which manages all the network flick events relating to an item.
 */
export class NetworkFlickManager extends FlickManager {
	
	
	//// Private Constant. ////
	
	/** How often (in seconds) to sample for whether friction should be appliedon a newly arrive object. */
	private static ARRIVAL_SAMPLE: number = 0.01;
	
	/** Time to take to fade a transferring object out or in (in seconds). */
	private static FADE_TIME: number = 0.25;
	
	/** Name of the network event to use for the tranfer. */
	private static FLICK_EVENT: string = 'network-flick';
	
	/** String elements representing keys in a typical network flick event network message. */
	private static FLICK_MESSAGE = {
		
		/** The friction of the transferred item. */
		FRICTION: 'friction',  
		
		/** The outer HTML of the transferred item. */
		HTML: 'html',
		
		/** The ID of the transferred item. */
		ID: 'id', 
		
		/** The movement of the transferred item. */
		MOVEMENT: 'movement',  
		
		/** The position of the transferred item. */
		POSITION: 'position'
		
	};
	
	
	//// Private Static Global Variables. ////
	
	/** Function to be called when transferring an item. */
	private static onSend: (objectToSend: JSON, ele: d3.Selection<any>) => JSON = null;
	
	/** Flag to indicate that the network flick functionality has been enabled. */
	private static enabled: boolean = false;
	
	
	//// Private Global Variables. ////
	
	/** Flag to indicate that the item is a new arrival */
	private newArrival: boolean = false;
	
	/** Flag to indicate that the item is due to be transferred. */
	private transferring: boolean = false;
	
	
	//// Public Static Methods. ////
	
	/**
	 * Method for setting up listener for network flick arrivals.
	 * 
	 * @param {SynergyMeshApp} app The app the listener is to be used for.
	 * @param {(objectReceived: JSON, ele: d3.Selection<any>, touchManager: TouchManager, 
	 * 	networkflickManager: NetworkFlickManager) => void} onReceive Function to be called when receiving an item.
	 * @param {(objectToSend: JSON, ele: d3.Selection<any>)  => JSON} onSend Function to be called when transferring an item.
	 */
	public static registerForNetworkFlick(app: 	SynergyMeshApp, 
		onReceive: (objectReceived: JSON, ele: d3.Selection<any>, touchManager: 
		TouchManager, networkflickManager: NetworkFlickManager) => void = null, 
		onSend: (objectToSend: JSON, ele: d3.Selection<any>)  => JSON = null) {
		
		// Set network flick enabled.
		NetworkFlickManager.enabled = true;
		
		// Store on send function.
		if (onSend != null) {
			NetworkFlickManager.onSend = onSend;
		}
		
		// Add network flick arrival listener.
		Networking.listenForMessage(NetworkFlickManager.FLICK_EVENT, function(data) {
		
			// Create new element.
			let newElement = document.createElement('div');
			let svg = document.getElementById(CommonElements.APP_SVG);
			svg.appendChild(newElement);
			newElement.outerHTML = data[NetworkFlickManager.FLICK_MESSAGE.HTML];
			
			// Prepare new element as d3 selection.
			let ele = d3.select('#' + data[NetworkFlickManager.FLICK_MESSAGE.ID]);
			ele.style('display', null);
			ele.style('opacity', 0);
			
			// Move element into place.	
			let pos = data[NetworkFlickManager.FLICK_MESSAGE.POSITION];
			Transformations.setTranslation(ele, app.vizWidth -pos.x, pos.y);
			Transformations.setRotation(ele, Transformations.getRotation(ele) + 180);

			// Add listeners to new element.
			let touchManager = new TouchManager(ele);
			let networkFlickManager = new NetworkFlickManager(ele, app, touchManager);
			networkFlickManager.newArrival = true;
			networkFlickManager.friction = 1;
			
			// Run on receive callback on new element.
			if (onReceive != null) {
				onReceive(data, ele, touchManager, networkFlickManager);
			}
			
			// Flick new element.
			let movement = data[NetworkFlickManager.FLICK_MESSAGE.MOVEMENT];
			networkFlickManager.flick(-movement.x * 1000, -movement.y * 1000);
			
			// Fade in new element.
			$(document.getElementById(ele.attr('id'))).fadeTo(NetworkFlickManager.FADE_TIME * 1000, 1);
			
			// No friction until centre is in view.	
			let applyFunction = 	function() {
				let x = Transformations.getTranslationX(ele);
				let y = Transformations.getTranslationY(ele);
				if (x > 0 && x < app.vizWidth && y > 0 && y < app.vizHeight) {
					networkFlickManager.friction = data[NetworkFlickManager.FLICK_MESSAGE.FRICTION];
				} else {
					setTimeout(applyFunction, NetworkFlickManager.ARRIVAL_SAMPLE * 1000);		
				}
			}
			applyFunction();
			
		});
		
	}
	
	
	//// Protected Methods. ////
	
	/**
	 * To be called when an item hits the screen top.
	 */
	protected onHitTop(): void {
		
		// Check if has a valid transfer target.
		let studentCount = 0;
		for (let app in Networking.clients[Roles.STUDENT]) {
			studentCount+= Networking.clients[Roles.STUDENT][app].length;
		}
		let validTarget = studentCount > 1 && NetworkFlickManager.enabled;
		
		// Check if a valid target and not a new arrival.
		if (validTarget && !this.newArrival) {
			
			// Check if not already transferring
			if (!this.transferring) {
			
				// Log as transferring.
				this.transferring = true;
			
				// Remove friction.
				let oldFriction = this.friction;
				this.friction = 1;
				
				// Fade out.
				$(document.getElementById(this.ele.attr('id'))).fadeOut(NetworkFlickManager.FADE_TIME * 1000);
				
				// Get self.
				let self = this;
				
				// When the fade is done.
				setTimeout(function() {
					
					// Get element.
					let element = document.getElementById(self.ele.attr('id'));
					
					// Update object ID.
					let newId = 'tranfer-' + new Date().getTime();
					element.id = newId;
					
					// Prepare transfer message.
					let objectToSend = <JSON>{};
					objectToSend[NetworkFlickManager.FLICK_MESSAGE.HTML] = element.outerHTML;
					objectToSend[NetworkFlickManager.FLICK_MESSAGE.ID] = newId;
					objectToSend[NetworkFlickManager.FLICK_MESSAGE.POSITION] =  self.posOnFlick;
					objectToSend[NetworkFlickManager.FLICK_MESSAGE.MOVEMENT] = self.movementInfo;
					objectToSend[NetworkFlickManager.FLICK_MESSAGE.FRICTION] = oldFriction;
					
					// On send call back.
					if (NetworkFlickManager.onSend != null) {
						objectToSend = NetworkFlickManager.onSend(objectToSend, self.ele);
					}
					
					// Send out transfer message. 
					Networking.sendMessageToRole(NetworkFlickManager.FLICK_EVENT, Roles.STUDENT, objectToSend);
				
					// Stop moving, remove item and self.
					self.stop();
					
					// Remove item and self.
					self.terminate();
					
				}, NetworkFlickManager.FADE_TIME * 1000);
				
			}
				
		} else {
		
			// Bounce as usual.
			super.onHitTop();
			
		}
		
	}
	
	/**
	 * To be called when the first touch of a gesture happens on the target element.
	 */
	protected onStartMoving(): void {
		
		// Stop item being classed as a new arrival.
		this.newArrival = false;
		
		// Continue as usual.
		super.onStartMoving();
		
	}
	
	
	//// Private Methods. ////
	
	
	/**
	 * Destroy the item and this listener.
	 */
	private terminate(): void {
		this.shouldBeMoving = false;
		this.shouldBeSampling = false;
		let element = document.getElementById(this.ele.attr('id'));
		element.parentNode.removeChild(element);
		delete this.touchManager;
		delete this.ele;
		// delete this;
	}
	
}