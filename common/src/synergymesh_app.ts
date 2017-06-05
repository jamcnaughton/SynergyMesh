/// <reference path='../../lib/typings/d3-3.5.17.d.ts' />
/// <reference path="../../lib/typings/interactjs-1.2.8.d.ts" />
/// <reference path='../../lib/typings/jquery-2.2.0.d.ts' />
/// <reference path='../../lib/typings/server-side-events.d.ts' />

import {CommonElements} from 'common/src/constants/common_elements'; 
  
 /**
 * Abstract class which defines what all SynergyMesh apps should do.
 * (e.g. load contents, connect to other instances, etc.)
 */
export abstract class SynergyMeshApp {	

	/** The height of the SVG element. */
	protected vizHeight: number;

	/** The width of the SVG element. */
	protected vizWidth: number;

	/** The width of the SVG element. */
	protected svg: d3.Selection<any>;

	/**
	 * Initialise a SynergyMeshApp object.
	 */
	public constructor() {
		
		// Create self object for referencing elsewhere.
		let self = this;
		
		// Ensure interact allows multi-user multi-touch.
		interact.maxInteractions(Infinity); 
		
		// Make full screen.
		let startButton = document.getElementById(CommonElements.START_BUTTON);
		startButton.addEventListener('click', function(e) {
			e.preventDefault();
			startButton.hidden = true;
			self.requestFullscreen(document.body);
			self.startAppEnvironment();
		});
		
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
	
		// Get viz height and width.
		this.vizHeight = screen.height;
		this.vizWidth = screen.width;
		
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
	
	/**
	 * Add the contents specific to this app to override.
	 */
	protected addContents() {}
	
}
