/*
 * jQuery griddle v1.1
 *
 * Licensed under the MIT license.
 * Copyright 2015 James Musgrave
 
 * https://github.com/jamesmusgrave/griddle.js
 */

/*jshint browser: true, curly: true, eqeqeq: true, forin: false, immed: false, newcap: true, noempty: true, strict: true, undef: true */

(function(window, $) {

	'use strict';

	$.griddle = function(options, element) {
		this.element = $(element);
		this._create(options);
	};

	$.griddle.defaults = {
		isResizable: true, // Resize function that fires on smart resize
		minHeight: 0, // Min height of items
		maxHeight: 99999, // Max Height of items
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
		calculateSize: false
	};

	$.griddle.prototype = {
		/*
		 * Lets go
		 */
		_create: function(options) {
			this.options = $.extend(true, {}, $.griddle.defaults, options);

			this.layout();

			var instance = this;

			setTimeout(function() {
				instance.element.addClass('griddle-pan');
			}, 0);

			if (this.options.isResizable) {
				$(window).bind('smartresize.griddle', function() {
					instance.resize();
				});
			}
		},

		/*
		 * Set options after initialization using
		 * $.griddle('option',{ foo: bar});
		 */
		option: function(option) {
			if ($.isPlainObject(option)) {
				this.options = $.extend(true, this.options, option);
			}
		},

		/*
		 * Primary functions
		 */
		before: function() {
			if (this.options.before) {
				this.options.before(this.element);
			}
			if (this.options.cssBefore) {
				this.element.children().children('img').css(this.options.cssBefore);
			}
		},
		end: function() {
			if (this.options.end) {
				this.options.end(this.element);
			}
			if (this.options.cssEnd) {
				this.element.children().children('img').css(this.options.cssEnd);
			}
		},
		resize: function() {
			this._setParentWidth();
			if (this.options.maxHeight) {
				this._getRatios();
			}
			if (this.parentWidth < this.options.minParentWidth) {
				this._cancel();
			} else {
				this._makeLayout();
			}
			this.end();
		},
		layout: function() {
			this._prepItems();
			this.before();
			this._setParentWidth();
			if (this.parentWidth < this.options.minParentWidth) {
				this._cancel();
			} else {
				this._getRatios();
				this._makeLayout();
			}
			this.end();
		},

		/*
		 * Internal functions
		 */
		_prepItems: function() {
			this.$items = this.element.children()
				.css({
				float: 'left'
			}).addClass('griddle-item');

			if(this.options.calculateSize){
				this.$items.each(function(k, v) {

					var elm = $(v);
					if (typeof(elm.attr('data-width') === 'undefined')) {
						elm.attr('data-width', elm.outerWidth());
					}
					if (typeof(elm.attr('data-height') === 'undefined')) {
						elm.attr('data-height', elm.outerHeight());
					}
				});
			}

			return this.$items;
		},
		_setParentWidth: function() {
			if (this.options.parentWidth) {
				this.parentWidth = this.options.parentWidth;
			} else {
				this.parentWidth = this.element.parent().width();
			}
			this.element.width(this.parentWidth);
		},
		_getRatios: function() {

			/* Calculate Rows */

			this.rows = [];
			var row = [];
			var rowRatio = 0;
			var rowCount = 0;
			this.rowRatios = [];

			this.itemsCount = this.$items.length;

			/* Loop All Elements */
			for (var i = 0; i < this.itemsCount; i++) {

				var $this = $(this.$items[i]);

				/* Use ratio set in markup if available */
				var ratio = $this.attr('data-ratio');
				if (ratio === undefined) {
					var width = $this.attr('data-width');
					var height = $this.attr('data-height');
					ratio = width / height;
					$this.attr('data-ratio',ratio);
				}
				ratio = parseFloat(ratio);

				/* Track the ratio of the row */
				rowRatio = rowRatio + ratio;

				/* Reset elements if they have moved */
				$this.attr('data-first',false).attr('data-last',false);

				/* Is this the first element? */
				if(i === 0){
					$this.attr('data-first',true);
				}

				/* Is this the last element? */
				if(i === this.itemsCount - 1){
					$this.attr('data-last',true);
				}

				/* Should we start a new row? */
				if (
						this.parentWidth / rowRatio < this.options.minHeight ||
						(
							rowRatio > this.options.maxRatio 
							&& this.parentWidth / rowRatio < this.options.maxHeight
						)
					)
				{
					/* If we are starting the row set the last element of the previous row */
					$(this.$items[i-1]).attr('data-last',true);

					/* And the first item of our current row */
					$this.attr('data-first',true);

					/* Finalise the row we just finished */
					this.rows.push(row);

					/* Start a new row and reset tracking varibles */
					row = [];
					rowRatio = ratio;
					rowCount++;
					
				} 
				/* Store row ratios for later */
				this.rowRatios[rowCount] = rowRatio;

				/* Track this items row */
				$this.attr('data-row',rowCount);

				/* Add this item to current row */
				row.push($this);
			};

			/* Finalise last row */
			this.rows.push(row);

		},
		_makeLayout: function() {

			/* Loop all rows */
			for (var i = 0, il = this.rows.length; i < il; i++) {

				var rowLength = this.rows[i].length;

				/* Remove gutter from the parent width */
				var rowWidth = this.parentWidth - (parseInt(this.options.gutter) * rowLength - 1);
 
				/* Loop all elements in row */
				for (var o = 0; o < rowLength; o++) {

					var $this = this.rows[i][o];

					/* Collect ratio data and calculate item size relative to row */
					var ratio = parseFloat($this.attr('data-ratio'));
					var rowCount = parseInt($this.attr('data-row'));
					var rowRatio = this.rowRatios[rowCount];
					var fraction = ratio/rowRatio;

					/* Resize relative to row */
					var width = Math.floor(rowWidth * fraction);
					var height = Math.floor(rowWidth / rowRatio);

					/* If item is too large resize (useful for last row) */
					if(height > this.options.maxHeight){
						height = this.options.maxHeight;
						width = height * ratio;
					}

					/* Don't include gutter for items at the end of the row */
					var gutter = ($this.attr('data-last') !== 'true') ? this.options.gutter : 0;
					
					/* Attach item styles */
					$this.css({
						'float' : 'left',
						'width': width,
						'height': height,
						'margin-right': gutter
					});

					/* Expose scaling (useful for type) */
					if (this.options.exposeScaling) {
						var origWidth = parseInt($this.attr('data-width'));
						var scale = Math.round((width / origWidth) * 100) / 100;
						$this.attr('data-scale', scale);
					}
		
				}

			}


		},
		_cancel: function() {
			this.element.children().attr('style','');
		}
	};

	var logError = function(message) {
		if (window.console) {
			window.console.error(message);
		}
	};


	/*
	 * plugin bridge
	 * leverages data method to either create or return $.griddle constructor
	 *
	 * lifted from jQuery Masonry
	 * http://masonry.desandro.com
	 *
	 * Copyright 2012 David DeSandro
	 * Licensed under the MIT license.
	 *
	 * original references: jQuery UI and jcarousel
	 * https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.widget.js
	 * https://github.com/jsor/jcarousel/blob/master/lib/jquery.jcarousel.js
	 */

	$.fn.griddle = function(options) {
		if (typeof options === 'string') {
			// call method
			var args = Array.prototype.slice.call(arguments, 1);

			this.each(function() {
				var instance = $.data(this, 'griddle');
				if (!instance) {
					logError("cannot call methods on griddle prior to initialization; " +
						"attempted to call method '" + options + "'");
					return;
				}
				if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {
					logError("no such method '" + options + "' for griddle instance");
					return;
				}
				// apply method
				instance[options].apply(instance, args);
			});
		} else {
			this.each(function() {
				var instance = $.data(this, 'griddle');
				if (instance) {
					// apply options & init
					instance.option(options || {});
					instance._init();
				} else {
					// initialize new instance
					$.data(this, 'griddle', new $.griddle(options, this));
				}
			});
		}
		return this;
	};


	/*
	 * smartresize: debounced resize event for jQuery
	 *
	 * latest version and complete README available on Github:
	 * https://github.com/louisremi/jquery.smartresize.js
	 *
	 * Copyright 2011 @louis_remi
	 * Licensed under the MIT license.
	 */

	var $event = $.event,
		resizeTimeout;

	$event.special.smartresize = {
		setup: function() {
			$(this).bind("resize", $event.special.smartresize.handler);
		},
		teardown: function() {
			$(this).unbind("resize", $event.special.smartresize.handler);
		},
		handler: function(event, execAsap) {
			// Save the context
			var context = this,
				args = arguments;

			// set correct event type
			event.type = "smartresize";

			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
			resizeTimeout = setTimeout(function() {
				$event.dispatch.apply(context, args);

			}, execAsap === "execAsap" ? 0 : 100);
		}
	};

	$.fn.smartresize = function(fn) {
		return fn ? this.bind("smartresize", fn) : this.trigger("smartresize", ["execAsap"]);
	};

	/*!
	 * jQuery imagesLoaded plugin v1.1.0
	 * http://github.com/desandro/imagesloaded
	 *
	 * MIT License. by Paul Irish et al.
	 */

	$.fn.imagesLoaded = function(callback) {
		var $this = this,
			$images = $this.find('img').add($this.filter('img')),
			len = $images.length,
			blank = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
			loaded = [];

		function triggerCallback() {
			callback.call($this, $images);
		}

		function imgLoaded(event) {
			var img = event.target;
			if (img.src !== blank && $.inArray(img, loaded) === -1) {
				loaded.push(img);
				if (--len <= 0) {
					setTimeout(triggerCallback);
					$images.unbind('.imagesLoaded', imgLoaded);
				}
			}
		}

		// if no images, trigger immediately
		if (!len) {
			triggerCallback();
		}

		$images.bind('load.imagesLoaded error.imagesLoaded', imgLoaded).each(function() {
			// cached images don't fire load sometimes, so we reset src.
			var src = this.src;
			// webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
			// data uri bypasses webkit log warning (thx doug jones)
			this.src = blank;
			this.src = src;
		});

		return $this;
	};

})(window, jQuery);