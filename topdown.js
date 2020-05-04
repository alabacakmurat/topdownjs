/**
 * TopdownJS is a product of [MA]Lab <muratalabacak.com
 * 	v0.6
 * 
 * You can find the full documentation here:
 *		http://workspace.muratalabacak.com/topdownjs/
 */
let $$topdown;
window.$$topdown = $$topdown = {
	'version': 0.6,

	// options
	options(opt, val) {
		if( !!val && !(typeof opt == 'object') ) {
			var optid = opt;
			opt = {};
			opt[optid] = val;
		}

		if( Array.isArray(opt) || !(typeof opt == 'object') ) return;
		
		// pixels
		this.pixels 			= opt.pixels || 10;

		// no buttons
		if( typeof opt.buttons != 'object' ) opt.buttons = {};

		// dismiss-cancel
		opt.buttons.cancel 		= !!opt.buttons ? (opt.buttons.cancel || this.globalButtons.cancel) : this.globalButtons.cancel;
		opt.buttons.dismiss 	= !!opt.buttons ? (opt.buttons.dismiss || this.globalButtons.dismiss) : this.globalButtons.dismiss;
		opt.buttons.confirm 	= !!opt.buttons ? (opt.buttons.confirm || this.globalButtons.confirm) : this.globalButtons.confirm;

		// merge
		this.globalButtons = {...this.globalButtons, ...opt.buttons};

		// merge
		if( Array.isArray(opt.fallbackButtons) )
			this.fallbackButtons = opt.fallbackButtons;
		else if( !!opt.fallbackButtons )
			this.fallbackButtons = [opt.fallbackButtons];

		// titles
		if( typeof opt.titles == 'object' )
			this.titles = {...this.titles, ...opt.titles};

		// states
		if( typeof opt.states == 'object' )
			this.globalStates = {...this.globalStates, ...opt.states};
	},

	// how many pixels will be added/remove each refresh?
	'pixels': 10,

	// titles
	'titles': {
		'success': 	'SUCCESS',
		'error': 	'ERROR',
		'warning': 	'WARNING',
		'info': 	'INFORMATION',
		'confirm': 	'CONFIRM',
	},

	// Buttons fallback
	'fallbackButtons': [
		'dismiss'
	],

	// Default buttons
	'globalButtons': {
		'dismiss': '<button type="button" topdown:dismiss>Close</button>',
		'cancel': '<button type="button" topdown:dismiss>Cancel</button>',
		'confirm': '<button type="button" topdown:dismiss>Confirm</button>',
	},

	// global states
	'globalStates': {
		'shown': null,
		'hidden': null,
	},

	// when(..)
	when(state, fn) {
		this.globalStates[state] = fn;
	},

	// Nodes
	_parent() {
		return document.getElementsByTagName('body')[0];
	},
	_container() {
		this.construct();
		return document.querySelector('div[id="__topdown_container"]');
	},
	get container() { return this._container(); },
	_wrapper() {
		this.construct();
		return document.querySelector('div[id="__topdown_container"]>div._topdown_wrapper');
	},
	get wrapper() { return this._wrapper(); },
	_title(_html) {
		var html = _html || '';
		this.construct();
		var title = this._wrapper().querySelector('div._topdown_heading>._topdown_title');
		if(html !== '') title.innerHTML = Array.isArray(html) ? html.join('') : html;
		return title;
	},
	get titleElement() { return this._titleElement(); },
	set title(title) { return this._title(title); },
	_body(_html) {
		var html = _html || '';
		this.construct();
		var body = this._wrapper().querySelector('div._topdown_body');
		if(html !== '')  body.innerHTML = Array.isArray(html) ? html.join('') : html;
		return body;
	},
	get bodyElement() { return this._bodyElement(); },
	set body(body) { return this._body(body); },
	set content(body) { return this._body(body); },
	set text(body) { return this._body(body); },

	_buttons(_html, set_buttons) {
		var html = set_buttons === true ? (_html || this.fallbackButtons) : false;

		this.construct();
		var footer = this._wrapper().querySelector('div._topdown_footer'),
			exposable = document.createElement('div');

		if( html !== false )
		{
			var parsed = this.parseButtons( html );
			if( Array.isArray(parsed) )
			{
				parsed.forEach(button => {
					exposable.appendChild( button );
				});

				footer.innerHTML = '';
				footer.appendChild(exposable);
			}
		}


		return footer;
	},
	set buttons(html) { return this._buttons(html); },
	set footer(html) { return this._buttons(html); },
	get footerElement() { return this._footerElement(); },

	centralize() {
		var container = this._container();
		var docWith = document.body.clientWidth;
		// if the viewport is < 400px
		if( docWith < 500 )
		{
			container.style.left = '0px';
			container.style.right = '0px';
			container.style.width = 'auto';
			container.style.minWidth = 'auto';
		} else {
			var left = (docWith - container.clientWidth) / 2;
			container.style.left = left+'px';
			container.style.right = null;
			container.style.width = '40vw';
			container.style.minWidth = '500px';
		}
	},

	// Constructor
	construct(reconstruct) {
		// Do we have __topdown_container
		var body 		= this._parent();
		var container 	= document.querySelector('div[id="__topdown_container"]');
		reconstruct 	= reconstruct === true ? true : false;

		if( !container )
		{
			// style
			var css = this._styleTag(),
				head = document.head || document.getElementsByTagName('head')[0],
				style = document.createElement('style');
			head.appendChild(style);
			style.type = 'text/css';
			if( style.styleSheet )
			  style.styleSheet.cssText = css;
			else
			  style.appendChild(document.createTextNode(css));

			// Push a container first
			container = document.createElement('div');
			container.setAttribute('id', '__topdown_container');
			container.className = 'force';
			body.prepend(container);

			container.innerHTML = '<div class="_topdown_wrapper"><div class="_topdown_heading"><a class="_topdown_dismiss" topdown:dismiss>&times;</a><div class="_topdown_title"></div></div><div class="_topdown_body"></div><div class="_topdown_footer"></div></div>'

			// We'll need to add a listener for that
			this.centralize();
			window.addEventListener('resize', () => { this.centralize() })

			// centralize now
			container.style.opacity = '0'
			container.style.display = 'none'
			container.style.height 	= '0px'

		} else if( reconstruct === true ) {
			this.destruct();
			this.construct(false);
		}
	},

	// Destructor
	destruct() {
		var container 	= document.querySelector('div[id="__topdown_container"]');
		container.parentNode.removeChild(container);
	},

	// Displayer
	display(what, body, buttons, states, hidden) {
		this.construct();

		// states
		var stateShown, stateHidden;
		
		// state shown
		if( this.isFunction(states) ) stateShown = states;
		else if( Array.isArray(states) ) stateShown = states.shift();
		else if( typeof states == 'object' ) stateShown = states.shown || '';
		
		// state hidden
		if( this.isFunction(hidden) ) stateHidden = hidden;
		else if( Array.isArray(states) ) stateHidden = states.shift();
		else if( typeof states == 'object' ) stateHidden = states.hidden || '';

		var displayfn = () => {
			// do we have a title?
			var title = (this.titles[what] || what),
				content = '';
			if( Array.isArray(body) )
			{
				title = body.shift() || (this.titles[what] || what);
				content = body.shift() || '';
			} else if( typeof body == 'object' )
			{
				var {title, content} = body;
			} else {
				content = body;
			}

			this._container().className = 'force ' + what;
			this._title( title );
			this._body( content );
			this._buttons( buttons, true );

			// clickers
			this._container().querySelectorAll('[topdown\\:dismiss]').forEach((el) => {
				el.addEventListener('click', () => {
					this.hide( stateHidden );
				})
			});

			// focus on the dismiss button
			var qd = this._buttons().querySelector('[topdown\\:dismiss]');
			if( !!qd ) qd.focus();

			// focus on the last button
			var ql = this._buttons().querySelector('*:last-child');
			if( !qd && !!ql ) ql.focus();

			// centralize
			this.centralize();

			// 
			this.isFunction(stateShown) ? stateShown() : null;
		};

		// Animative-effects
		if( this.isShown() )
			this.hide(() => {
				// 
				this.isFunction(stateHidden) ? stateHidden() : null;

				this.show(displayfn);
			});
		else
			this.show(displayfn);
	},

	// Displayer
	show(done) {
		var showfn = () => {
			this._container().style.opacity = '1'
			this._container().style.display = 'block'
			this.slideDown();
			
			this.isFunction(done) ? done() : null;
			
			this.isFunction(this.globalStates.shown) ? this.globalStates.shown() : null;
		};

		// show or hide-first
		clearTimeout(this.timer)
		if( this.isShown() )
		{
			this.hide(showfn);
		} else {
			showfn();
		}
	},
	isShown() {
		return this._container().style.display == 'block';
	},

	hide(done) {
		var hidefn = () => {
			this.slideUp(() => {
				this._container().style.opacity = '0'
				this._container().style.display = 'none'

				this.isFunction(done) ? done() : null;
				
				this.isFunction(this.globalStates.hidden) ? this.globalStates.hidden() : null;
			});
		};

		// show or hide-first
		clearTimeout(this.timer)
		if( this.isShown() )
		{
			hidefn();
		}

	},
	dismiss(...props) { return this.hide(...props); },
	isHidden() {
		return !this.isShown();
	},

	// Slider
	slideUp(done) {
		// paddings
		this._container().style.overflow = 'hidden';
		var tick = () => {
			var container = this._container(), 
				paddings = parseFloat(this.getStyle(container, 'padding-top')) + parseFloat(this.getStyle(container, 'padding-bottom')),
				height = parseFloat(this.getStyle(container, 'height'));

			var newHeight = Math.max(0, (height - this.pixels));
			container.style.height = newHeight + 'px';

			if( newHeight > 0 ) this.timer = setTimeout(tick, 10)
			else { this.isFunction(done) ? done() : null; }
		}
		tick();
	},

	// Slider
	slideDown(done) {
		// paddings
		var timer;
		this._container().style.overflow = 'hidden';
		var tick = () => {
			var container = this._container(),
				btWidth = parseFloat(this.getStyle(container, 'border-top-width')),
				bbWidth = parseFloat(this.getStyle(container, 'border-bottom-width')),
				wrapperHeight = this._wrapper().offsetHeight + btWidth + bbWidth,
				paddings = parseFloat(this.getStyle(container, 'padding-top')) + parseFloat(this.getStyle(container, 'padding-bottom')),
				height = parseFloat(this.getStyle(container, 'height'));

			var newHeight = Math.min(wrapperHeight, (height + this.pixels));
			container.style.height = newHeight + 'px';

			if( newHeight < wrapperHeight ) this.timer = setTimeout(tick, 10)
			else { this.isFunction(done) ? done() :null;  }
		}
		tick();
	},

	// CSS
	_styleTag() {
		return '#__topdown_container{position:fixed;top:0;min-width:500px;max-width:600px;background:#f3b7bd;border-color:#e4606d;-webkit-box-shadow:0 0 5px 2px rgba(220,53,69,0.2);box-shadow:0 0 5px 2px rgba(220,53,69,0.2);border-width:1px;border-style:solid;border-top:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;z-index:999;margin:0 auto}#__topdown_container.error{background:#f3b7bd;border-color:#e4606d;-webkit-box-shadow:0 0 5px 2px rgba(220,53,69,0.2);box-shadow:0 0 5px 2px rgba(220,53,69,0.2)}#__topdown_container.warning{background:#ffe7a0;border-color:#ffce3a;-webkit-box-shadow:0 0 5px 2px rgba(255,193,7,0.2);box-shadow:0 0 5px 2px rgba(255,193,7,0.2)}#__topdown_container.success{background:#86e29b;border-color:#34ce57;-webkit-box-shadow:0 0 5px 2px rgba(40,167,69,0.2);box-shadow:0 0 5px 2px rgba(40,167,69,0.2)}#__topdown_container.info{background:#99caff;border-color:#3395ff;-webkit-box-shadow:0 0 5px 2px rgba(0,123,255,0.2);box-shadow:0 0 5px 2px rgba(0,123,255,0.2)}#__topdown_container ._topdown_wrapper{padding:1rem 1.8rem}#__topdown_container ._topdown_heading{display:flex}#__topdown_container ._topdown_heading ._topdown_title{flex-grow:1;font-size:120%;letter-spacing:2px;font-weight:700;text-transform:uppercase}#__topdown_container a._topdown_dismiss{cursor:pointer;padding:.6rem 1rem;position:absolute;top:0;right:0;}a._topdown_dismiss{color:inherit;text-decoration:none;}#__topdown_container ._topdown_body{margin:5px 0}#__topdown_container ._topdown_footer{text-align:right}#__topdown_container ._topdown_footer a,#__topdown_container ._topdown_footer button{margin:0 0 0 5px}';
	},

	// Styler
	getStyle(el, cssRule) {
		var value = "";
		if(document.defaultView && document.defaultView.getComputedStyle)
		{
			value = document.defaultView.getComputedStyle(el, "").getPropertyValue(cssRule);
		} else if(el.currentStyle)
		{
			cssRule = cssRule.replace(/\-(\w)/g, (strMatch, p1) => {
				return p1.toUpperCase();
			});
			value = el.currentStyle[cssRule];
		}
		
		return value;
	},

	isFunction(fn) {
		return fn && {}.toString.call(fn) === '[object Function]';
	},

	createElementFromHTML(htmlString) {
		var div = document.createElement('div');
		div.innerHTML = htmlString.trim();

		// Change this to div.childNodes to support multiple top-level nodes
		return div.firstChild; 
	},

	isDOMElement(obj) {
		try {
			return obj instanceof HTMLElement;
		}
		catch(e){
			return (typeof obj==="object") &&
				(obj.nodeType===1) && (typeof obj.style === "object") &&
				(typeof obj.ownerDocument ==="object");
		}
	},

	/**
	 * We have these values for buttons
	 *
	 *		'button HTML'
	 *		['button HTML']
	 *		{text: 'Object creator for button'}
	 *		[{text: 'Object creator for button'}]
	 *		['HTML', {text: 'Object creator for button'}]
	 *		['HTML', 'global-button-name', {text: 'Object creator for button'}]
	 *		['HTML', document.getElementsByTagName('button')[0], {text: 'Object creator for button'}]
	 */
	parseButtons(buttons) {
		// Is this already a dom element?
		if( this.isDOMElement(buttons) )
		{
			return [buttons];

		// Is this an object?
		} else if( typeof buttons == 'object' && buttons.constructor.name == 'Object' )
		{
			var button = buttons,
				_button = document.createElement('button');
				_button.type 		= 'button';
				_button.className 	= button.className || '';
				_button.innerHTML 	= button.text || 'Button';

			if( this.isFunction((button.onclick||null)) )
				_button.addEventListener('click', button.onclick);

			return [ _button ];

		// do we have it directly in the global buttons?
		} else if( !!this.globalButtons[buttons] ) {
			return this.parseButtons( this.globalButtons[buttons] );
		
		// Is this a set of buttons?
		} else if( Array.isArray(buttons) )
		{
			var parsed = [];
			buttons.forEach(button => {
				parsed[parsed.length] = this.parseButtons( button ).shift();
			});
			return parsed;
		
		// Directly a html?
		} else if( !!buttons )
		{
			return [ this.createElementFromHTML(buttons) ];

		// Safe return
		} else {
			return [];
		}
	}
};