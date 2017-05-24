// Establish where the target class is located.
var APPS_PATH = './apps/';

/**
 * Load all the script files related to this app.
 * 
 * @param root The url of the script store relative to the page calling it.
 */
function loadApp(root){
	
	// Configure Require JS.
	require.config({
		baseUrl: root,
		paths: {
			'BootStrap': 'common/src/bootstrap',
			'PrototypeStudentApp': APPS_PATH + 'prototype/src/prototype_student_app',
		}
	});
	
	// Load libraries and report script through RequireJS.
	require(['BootStrap'], function (bootstrap) {
		bootstrap.start(function(){
			require(['PrototypeStudentApp'], function (prototype_student_app) {
				$(document).ready(function run() {
					new prototype_student_app.PrototypeStudentApp();
				});
			});
		});
	});

}