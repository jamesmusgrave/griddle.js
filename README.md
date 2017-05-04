griddle.js
==========

Elements in a grid, resized proportionally to fill the width of their container.

~~~bash
bower install griddle.js --save
~~~

~~~js
$('div').griddle({
	isResizable: true, // Resize function that fires on smart resize
	minHeight: 0, // Min height of items
	maxHeight: 99999, // Max Height of items
	maxHeightLastRow: 99999, //Can be set to 'auto' to use the height of the previous row
	parentWidth: false, // Force setting of the containers width defaults to auto
	minParentWidth: 700, // If less than this amount the whole layout cancels
	maxRatio: 10, // Max ratio of the total row, fiddle for best effect
	before: false, // Function to call before layout
	end: false, // Function to call after layout
	cssBefore: {
		'width': '100%',
		'height': '100%'
	}, // Img CSS after before function but before layout
	cssEnd: false, // Img CSS after everything
	exposeScaling: false, // Expose scaling in dom
	gutter: 0, // Set gutter 
	calculateSize: false // Calculates size of element rather than using data- values
});
~~~