//META{"name":"flisteicons","version":"1.0.3","website":"https://github.com/Kemono-Kay/flist-eicons","source":"https://raw.githubusercontent.com/Kemono-Kay/flist-eicons/master/flisteicons.plugin.js"}*//

class flisteicons {
	getName() { return "F-list eicons"; }
	getShortName() { return "flisteicons"; }
	getDescription() { return "Allows users to use F-list eicons as emotes."; }
	getVersion() { return "1.0.3"; }
	getAuthor() { return "Kemono-Kay"; }
	getSettingsPanel() { return this.settingsPanel; }
	load() {
		this.checkForUpdate( ( updateAvailable ) => {
			if ( updateAvailable ) {
				BdApi.showToast( `${this.getName()} v${updateAvailable.version} is now available.`, { type: 'info', timeout: '6000' } );
			} else if ( null === updateAvailable ) {
				BdApi.showToast( `${this.getName()} could not check for updates at this time.`, { type: 'warn' } );
			} else if ( false === updateAvailable ) {
				BdApi.showToast( `The ${this.getName()} plugin is up to date.` );
			}
		} );
	}
	stop() {
		this.unpatchAllMethods();
		this.restartEmoteModule();
	}
	start() {
		if ( 'undefined' === typeof this.readData( 'default-eicon' ) )
			this.loadDefaultEicon();
		if ( this.readData( 'display-changelog' ) !== this.getVersion() ) {
			let versions = [];
			for ( let version in this.changelog ) {
				if ( this.readData( 'display-changelog' ) == version ) break;
				versions.push( version );
			}
			this.displayChangelog( versions );
			this.writeData( 'display-changelog', this.getVersion() );
		}
		this.methods = [];
		this.patchRender();
		this.patchQuickEmoteMenu();
		BdApi.clearCSS( this.getShortName() );
		BdApi.injectCSS( this.getShortName(), this.css );
		if ( emoteModule.initialized || quickEmoteMenu.initialized )
			this.restartEmoteModule();
		
	}
	
	get sourceUrl() { return 'https://raw.githubusercontent.com/Kemono-Kay/flist-eicons/master/flisteicons.plugin.js'; }
	get eiconPattern() { return /:[f]!([ \w-]+?):/ig; }
	getEiconUrl( name = '' ) { return `https://static.f-list.net/images/eicon/${name}.gif`; }	
	get whitespace() { return /^\s*$/; }
	get changelog() {
		return {
			'1.0.3': [
				`Changes to css have been made for increased compatibility with other themes and plugins.`,
				`Clicking on eicons to zoom in zooms out on particularly large mosaics.`,
				`Eicon mosaics now automatically start on a new line.`,
				`Eicon mosaics are now large by default.`,
			],
			'1.0.2': [
				`Changelog now displays all changes since you last updated, not only the most recent version.`,
				`No extra custom css is needed to style eicons.`,
			],
			'1.0.1': [
				`A critical bug has been fixed where the plugin cannot start.`,
			],
			'1.0.0': [
				`Type eicon names in chat to have them be displayed to other users of this plugin like so: <code>:f!name:</code>`,
				`This plugin has a settings panel to adjust your preferences, or update the plugin when a new update is available.`,
				`Sent eicons will get added to your history in the emoji picker for quick access.`,
				`Eicons can be favourited so that they'll always stay available in the emoji picker.`,
				`When written without spaces or with only a newline between them, eicons will be chained together and treated as one big image.`,
				`Eicons can be clicked on to view them at their full size.`,
			],
		};
	}
	get css() {
		return `
			@keyframes eicon-zoom-wrapper-fade-in {
				from { opacity: 0 }
				to { opacity: 1 }
			}
			
			@keyframes eicon-zoom-img-fade-in {
				from { width: 1px; height: 1px; }
				to { width: 100px; height: 100px; }
			}
			
			.eicon-mosaic {
				display:inline;
				position: relative;
				text-indent: 0;
			}
			
			.eicon-wrapper {
				top: 4px;
				margin: -4px 0 0 0;
				position: relative;
				display: inline-flex;
				object-fit: contain;
				vertical-align: baseline;
			}
			
			.eicon-wrapper.jumboable img.emote {
				margin: 0;
				height: 2rem;
				width: auto;
			}
			
			.eicon-wrapper input {
				z-index: 1;
			}
			
			.eicon-wrapper img.emote {
				height: 1.45em;
				width: auto;
				cursor: pointer;
			}
			
			.eicon-wrapper:hover input {
				display: block;
			}
			
			.eicon-changelog-wrapper,
			.eicon-zoom-wrapper {
				opacity: 1;
				background-color: rgb( 0, 0, 0, 0.85 );
				display: flex;
				justify-content: center;
				align-items: center;
				flex-direction: column;
				z-index: 1000;
				position: fixed;
				right: 0;
				top: 0;
				bottom: 0;
				left: 0;
				animation: eicon-zoom-wrapper-fade-in;
				animation-iteration-count: 1;
				animation-duration: 0.25s;
			}
			
			.eicon-changelog-wrapper > div::-webkit-scrollbar-track {
				background-color: transparent;
				border-color: transparent;
			}
			
			.eicon-changelog-wrapper > div::-webkit-scrollbar-track-piece {
				background-color: #2f3136;
				border: 3px solid #36393f;
				border-radius: 7px;
			}
			
			.eicon-changelog-wrapper > div::-webkit-scrollbar-thumb {
				background-color: #202225;
				border: 3px solid #36393f;
				border-radius: 7px;
			}
			
			.eicon-changelog-wrapper > div::-webkit-scrollbar {
				width: 14px;
			}
			
			.eicon-changelog-wrapper > div {
				overflow-y: auto;
				padding: 1rem;
				border-radius: .5rem;
				width: 50%;
				height: 80%;
				max-width: 600px;
				min-height: 400px;
				background-color: #36393f;
			}
			
			.eicon-changelog-wrapper h2 {
				color: #f6f6f7;
				font-size: 16px;
				font-weight: 600;
				line-height: 20px;
				text-transform: uppercase;
			}
			
			.eicon-changelog-wrapper ul {
				margin: 20px 0;
				color: #b9bbbe;
				line-height: 24px;
				padding: 0 2em;
				list-style-type: disc;
			}
			
			.eicon-changelog-wrapper code {
				background: #2f3136;
				border-radius: 3px;
				font-size: 85%;
				padding: .2em;
			}
			
			.eicon-zoom-wrapper > div {
				white-space: nowrap;
				line-height: 0;
			}
			
			.eicon-changelog-wrapper.eicon-fade-out,
			.eicon-zoom-wrapper.eicon-fade-out {
				transition: .25s;
				opacity: 0;
			}
			
			.eicon-zoom-wrapper img {
				width: 100px;
				height: 100px;
				margin: auto;
				animation: eicon-zoom-img-fade-in;
				animation-iteration-count: 1;
				animation-duration: 0.25s;
			}
			
			.eicon-zoom-wrapper.eicon-fade-out img {
				transition: .25s;
				width: 0px;
				height: 0px;
			}
			
			#bda-qem-eicon {
				order: 2;
			}
			
			#bda-qem-eicon-container {
				width: 346px;
				height: 327px;
				background-color: #fff;
				border-radius: 0 0 5px 5px;
			}
			
			.eicon-category-title {
				color: #98aab6;
				font-size: 12px;
				font-weight: 500;
				height: 32px;
				line-height: 32px;
				padding: 0 4px;
				text-transform: uppercase;
			}
			
			.bda-dark #bda-qem-eicon-container {
				background-color: #353535;
			}
			
			#eicon-settings {
				margin: 20px;
			}
			
			#eicon-settings hr {
				margin: 20px 0;
				height: 1px;
				background-color: rgba(114,118,125,.3);
			}
			
			#eicon-settings label {
				display: block;
				color: #b9bbbe;
				letter-spacing: .5px;
				text-transform: uppercase;
				margin-bottom: 8px;
				font-weight: 600;
				line-height: 16px;
				font-size: 12px;
				user-select: none;
			}
			
			#eicon-settings input[type="number"]:focus {
				border-color: #7289da;
			}
			
			#eicon-settings input[type="number"] {
				width: 100%;
				font-family: Whitney,Helvetica Neue,Helvetica,Arial,sans-serif;
				font-size: 16px;
				border-radius: 3px;
				border-style: solid;
				border-width: 1px;
				height: 40px;
				padding: 10px;
				background-color: rgba(0,0,0,.1);
				border-color: rgba(0,0,0,.3);
				color: #f6f6f7;
				transition: background-color .15s ease,border .15s ease;
			}
			
			#eicon-settings input[type="button"],
			#eicon-settings input[type="submit"] {
				cursor: pointer;
				height: 32px;
				min-width: 60px;
				border: none;
				border-radius: 3px;
				font-size: 14px;
				font-weight: 500;
				line-height: 16px;
				padding: 2px 16px;
				user-select: none;
				color: white;
			}
			
			#eicon-settings input[type="button"][disabled] {
				color: lightgray !important;
				background-color: #8b97c1 !important;
				cursor: auto !important;
			}
			
			#eicon-settings input[type="submit"] {
				background-color: #43b581;
			}
			
			#eicon-settings input[type="submit"]:hover {
				background-color: #3ca374;
			}
			
			#eicon-settings input[type="button"] {
				background-color: #7289da;
			}
			
			#eicon-settings input[type="button"]:hover {
				background-color: #677bc4;
			}
			
			#eicon-settings input.link {
				background-color: transparent !important;
			}
			
			#eicon-settings input.link:hover {
				text-decoration: underline;
			}
			
			#eicon-settings .form-controls {
				display: flex;
			}
			
			#eicon-settings .cancel {
				margin-left: auto;
			}
			
			#eicon-settings > div {
				margin-bottom: 20px;
			}
			
			#eicon-settings > div:last-of-type {
				margin-bottom: 0;
			}
			`;
	}
	get MosaicReactComponent() {
		let self = this;
		return class extends BdApi.React.Component {
			render() {
				let cols = 0;
				let rows = 0;
				let currentCols = 0;
				for( let child of this.props.children ) {
					if ( 'br' === child.type ) {
						rows++;
						continue;
					}
					if ( currentCols++ > cols ) {
						cols = currentCols;
					}
				}
				return BdApi.React.createElement( 'div', {
					className: 'eicon-mosaic',
					onClick: () => {
						self.showEnlarged( this.props.children, cols, rows )
					},
				}, this.props.children );
			}
		}
	}
	
	get EiconReactComponent() {
		let self = this;
		return class extends BDEmote {
			constructor( props ) {
				let name = props.eiconName;
				props.name = `:f!${name}:`;
				props.url = self.getEiconUrl( name );
				super( props );
				this.setState( { isFavorite: self.isFavorite( name ) } );
				if ( this.props.isMosaic ) this.props.jumboable = true;
			}
			onMouseEnter() {
				if ( !this.state.shouldAnimate && this.animateOnHover ) {
					this.setState( { shouldAnimate: true } );
				}
				if ( !this.state.isFavorite && self.isFavorite( this.props.eiconName ) ) {
					this.setState( { isFavorite: true } );
				} else if ( this.state.isFavorite && !self.isFavorite( this.props.eiconName ) ) {
					this.setState( { isFavorite: false } );
				}
			}
			render() {
				let elements = super.render();
				elements.props.children.props.className = 'eicon-wrapper' + ( this.props.jumboable ? ' jumboable' : '' );
				elements.props.children.props.children[ 1 ].props.onClick = ( e ) => {
					e.preventDefault();
					e.stopPropagation();
					this.setState( { isFavorite: self.favouriteEicon( this.props.eiconName ) } );
				};
				elements.props.children.props.children[ 0 ].props.className = 'emote' + ( this.props.jumboable ? ' jumboable' : '' );
				if ( !this.props.isMosaic ) elements.props.children.props.children[ 0 ].props.onClick = ( e ) => {
					self.showEnlarged( [ this ] );
				};
				return elements;
			}
		}
	}
	get config() { return [
		{ id: 'eicons_maxHistory', name: 'maxhistory', title: 'Eicon History Size Limit', tag: 'input', props: { min: 0, type: 'number', value: 50 } },
		{ id: 'eicons_clearHistory', name: null, title: null, tag: 'input', props: { value: 'Clear eicon history', type: 'button' }, events: { click: () => { this.writeData( 'history', [] ); this.updateEicons(); BdApi.showToast( 'Eicon history has been cleared.', { type: 'success' } ); } } },
	]; }
	get settingsPanel() {
		let pluginName = this.getShortName();
		let config = this.config;
		
		let form = document.createElement( 'form' );
		form.id = 'eicon-settings';
		form.addEventListener( 'submit', () => {
			event.preventDefault();
			for ( let option of config ) {
				if ( null !== option.name ) {
					let element = form.querySelector( `#${option.id}` );
					this.writeData( option.name, element.value );
				}
			}
			form.parentNode.previousElementSibling.click();
			BdApi.showToast( 'Settings have been successfully saved.', { type: 'success' } );
		} );
		
		let formContents;
		for ( let option of config ) {
			let wrapper = document.createElement( 'div' );
			if ( option.title !== null ) {
				let title = document.createElement( 'label' );
				title.setAttribute( 'for', option.id );
				title.appendChild( document.createTextNode( option.title ) );
				wrapper.appendChild( title );
			}
			
			let el = document.createElement( option.tag );
			el.id = option.id;
			if ( option.name !== null ) {
				option.props.name = option.name;
			}
			for ( let prop in option.props ) {
				el.setAttribute( prop, option.props[ prop ] );
			}
			for ( let event in option.events ) {
				el.addEventListener( event, option.events[ event ] );
			}
			switch ( option.tag ) {
				case 'input':
					let val = this.readData( option.name, option.value );
					if ( 'undefined' !== typeof val ) {
						el.value = val;
					}
					wrapper.appendChild( el );
					break;
			}
			form.appendChild( wrapper );
			
		}
		form.appendChild( document.createElement( 'hr' ) );
		let formControls = document.createElement( 'div' );	
		formControls.className = 'form-controls';		
		let update = document.createElement( 'input' );
		update.type = 'button';
		update.value = 'Update';
		update.disabled = true;
		let updated = null;
		setTimeout( () => {
			this.checkForUpdate( ( updateAvailable ) => {
				if ( updateAvailable ) {
					update.disabled = false;
					update.value += ` to v${updateAvailable.version}`;
					updated = updateAvailable;
				} else if ( false === updateAvailable ) {
					update.value = 'Up to date';
				}
			} )
		} );
		update.addEventListener( 'click', () => {
			if ( updated !== null ) {
				let { writeFileSync } = require( 'fs' );
				writeFileSync( __filename, updated.body );
				BdApi.showToast( `${this.getName()} has been updated to v${updated.version}` , { type: 'success' } );
				form.parentNode.previousElementSibling.click();
			}
		} );
		formControls.appendChild( update );
		let link = document.createElement( 'input' );
		link.type = 'button';
		link.className = 'link';
		link.value = 'Changelog';
		link.addEventListener( 'click', () => {
			this.displayChangelog();
		} );
		formControls.appendChild( link );
		let cancel = document.createElement( 'input' );
		cancel.type = 'button';
		cancel.className = 'cancel link';
		cancel.value = 'Cancel';
		cancel.addEventListener( 'click', () => {
			form.parentNode.previousElementSibling.click();
		} );
		formControls.appendChild( cancel );
		let save = document.createElement( 'input' );
		save.type = 'submit';
		save.value = 'Save';
		formControls.appendChild( save );
		form.appendChild( formControls );
		return form;
	}
	
	/*
	 * Displays the changelog for the listed version.
	 */
	displayChangelog( versions = null ) {
		if ( null === versions )
			versions = Object.keys( this.changelog );
		let target = document.getElementById( 'app-mount' ).lastElementChild;
		let wrapper = document.createElement( 'div' );
		let close = () => {
			wrapper.classList.add( 'eicon-fade-out' );
			document.removeEventListener( 'click', close );
			document.removeEventListener( 'keydown', closeByKeystroke );
			setTimeout( () => {
				if ( wrapper !== null )
					wrapper.remove();
			}, 250 );
		};
		let closeByKeystroke = ( e ) => {
			if ( 'Escape' === event.code ) {
				close();
			}
			e.preventDefault();
		};
		
		wrapper.addEventListener( 'click', close );
		document.addEventListener( 'keydown', closeByKeystroke );
		
		wrapper.className = 'eicon-changelog-wrapper';
		let modal = document.createElement( 'div' );
		modal.onclick = () => { event.stopPropagation(); }
		wrapper.appendChild( modal );
		for ( let version of versions ) {
			let h2 = document.createElement( 'h2' );
			h2.appendChild( document.createTextNode( `Changes in ${this.getName()} v${version}` ) );
			modal.appendChild( h2 );
			let ul = document.createElement( 'ul' );
			let changes = this.changelog[ version ];
			for ( let change of changes ) {
				ul.innerHTML += `<li>${change}</li>`
			}
			modal.appendChild( ul );
		}
		target.appendChild( wrapper );
	}
	
	/*
	 * Fetches the eicon container for the QuickEmoteMenu
	 */
	getEiconContainer( data ) {
		let eiContainer = `
			<div id="bda-qem-eicon-container">
				<div class="scroller-wrap scrollerWrap-2lJEkd fade">
					<div class="scroller scroller-2FKFPG">
						<div class="emote-menu-inner">
							<div class="eicon-category-title">Favourites</div>`;
		for ( let favourite of this.readData( 'favourites', [] ) ) {
			let title = `:f!${favourite}:`
			let src = this.getEiconUrl( favourite );
			eiContainer += `
				<div class="emote-container">
					<img class="emote-icon eicon-icon" alt="${title}" src="${src}" title="${title}">
				</div>
			`;
		}
		eiContainer += `<div class="eicon-category-title">Recently Used</div>`;
		for ( let history of this.readData( 'history', [] ) ) {
			let title = `:f!${history}:`
			let src = this.getEiconUrl( history );
			eiContainer += `
				<div class="emote-container">
					<img class="emote-icon eicon-icon" alt="${title}" src="${src}" title="${title}">
				</div>
			`;
		}
		eiContainer +=`
						</div>
					</div>
				</div>
			</div>
		`;
		return eiContainer;
	}
	
	/*
	 * Checks whether the plugin has an update available
	 */
	checkForUpdate( callback ) {
		let request = require( 'request' );
		request( this.sourceUrl, ( error, response, body ) => {
			let match = body.match( /\/\/META(.*)\*\/\// );
			if ( null !== match ) {
				try {
					let META = JSON.parse( match[ 1 ] );
					let newestVersion = META.version.split( '.' );
					let thisVersion = this.getVersion().split( '.' );
					for ( let index in thisVersion ) {
						if ( newestVersion[ index ] > thisVersion[ index ] ) {
							return callback( { version: META.version, body: body } );
						}
					}
				} catch ( e ) {
					return callback( null );
				}
			}
			return callback( false );
		} );
	}
	
	/*
	 * Restarts the emote module so that the eicon patches will be executed.
	 */
	restartEmoteModule() {
		emoteModule = new EmoteModule();
		quickEmoteMenu = new QuickEmoteMenu();
		window.emotePromise = emoteModule.init().then(() => {
			emoteModule.initialized = true;
			quickEmoteMenu.init();
		});
	}
	
	/*
	 * Handles the rendering data to insert data such as eicons into it.
	 */
	patchRender() {
		let self = this;
		self.methods.push( Utils.monkeyPatch( BDV2.MessageContentComponent.prototype, 'render', {
			after: ( { thisObject, returnValue } ) => {
				Utils.monkeyPatch( returnValue.props, "children", { silent: true, once: true, after: ( { returnValue } ) => {
					const markup = returnValue.props.children[ 1 ];
					if ( !markup.props.children ) return;
					const nodes = markup.props.children[ 1 ];
					if ( !nodes || !nodes.length ) return;
					for ( let index in nodes ) {
						if ( 'string' === typeof nodes[ index ] ) {
							let newElements = self.tryInsertEicon( nodes.splice( index, 1 )[ 0 ] );
							for ( let element of newElements ) {
								nodes.splice( index++, 0, element );
							}
						}
					}
				} } );
				if ( 'SENDING' === thisObject.props.message.state ) {
					let matches = thisObject.props.message.content.match( self.eiconPattern );
					if ( null !== matches ) {
						for ( let match of matches ) {
							self.addToHistory( self.eiconPattern.exec( match )[ 1 ] );
						}
					}
				}
			}
		} ) );
	}

	/*
	 * Patches the QuickEmoteMenu to allow for eicons to be inserted into it
	 */
	patchQuickEmoteMenu() {
		let self = this;
		
		let init = function ( instance ) {
			let index = instance.qmeHeader.lastIndexOf( '</div>' );
			instance.qmeHeader = instance.qmeHeader.slice( 0, index ) + `
				<button id="bda-qem-eicon" onclick="quickEmoteMenu.switchHandler(this); return false;">Eicons</button>
			` + instance.qmeHeader.slice( index );
			instance.eiContainer = self.getEiconContainer();
		}
		if ( !quickEmoteMenu ) init( quickEmoteMenu );
		this.methods.push( BdApi.monkeyPatch( QuickEmoteMenu.prototype, 'init', { after: ( data ) => {
			init( data.thisObject );
		} } ) );
		
		this.methods.push( BdApi.monkeyPatch( QuickEmoteMenu.prototype, 'switchQem', { after: ( data ) => {
			let eicon = $( '#bda-qem-eicon' );
			eicon.removeClass( 'active' );
			$( '#bda-qem-eicon-container' ).hide();
			if( data.methodArguments[ 0 ] == 'bda-qem-eicon') {
				eicon.addClass( 'active' );
				$( '#bda-qem-eicon-container' ).show();
			}
			let emoteIcon = $( '.eicon-icon' );
			emoteIcon.off();
			emoteIcon.on( 'click', function () {
				var emote = $( this ).attr( 'title' );
				var ta = Utils.getTextArea();
				Utils.insertText( ta[ 0 ], ta.val() + emote );
			} );
		} } ) );
		
		this.methods.push( BdApi.monkeyPatch( QuickEmoteMenu.prototype, 'obsCallback', { before: ( data ) => {
			let e = $( data.methodArguments[ 0 ] );
			e.append( data.thisObject.eiContainer );
		} } ) );
	}
	
	/*
	 * Unpatches all the monkey patched methods.
	 */
	unpatchAllMethods() {
		for ( let method of this.methods ) {
			method();
		}
		this.methods = undefined;
	}
	
	/*
	 * Writes to the plugin data.
	 */
	writeData( key, data ) {
		BdApi.saveData( this.getShortName(), key, data );
	}

	/*
	 * Reads from the plugin data.
	 */
	readData( key, fallback ) {
		let value = BdApi.loadData( this.getShortName(), key );
		return typeof value !== 'undefined' ? value : fallback;
	}
	
	/*
	 * Gets the data of the eicon with the given name.
	 */
	getEiconData( name, callback ) {
		let request = require( 'request' );
		request( this.getEiconUrl( name ), ( error, response, body ) => {
			setTimeout( callback, 0, body );
		} );
	}
	
	/*
	 * Gets the data of the default eicon.
	 */
	loadDefaultEicon() {
		let request = require( 'request' );
		if ( 'undefined' === typeof this.readData( 'default-eicon' ) ) {
			request( this.getEiconUrl(), ( error, response, body ) => {
				if ( 'undefined' !== typeof body ) {
					this.writeData( 'default-eicon', body );
				} else {
					setTimeout( this.loadDefaultEicon(), 10000 );
				}
			} );
		}
	}
	
	/*
	 * Checks whether an eicon exists by file contents
	 */
	eiconExists( body ) {
		let standard = this.readData( 'default-eicon' );
		if ( 'undefined' === typeof standard )
			return true;
		return standard !== body;
	}
	
	/*
	 * Updates the list of eicons that is ised by the QuickEmoteMenu.
	 */
	updateEicons() {
		quickEmoteMenu.eiContainer = this.getEiconContainer();
		$( '#bda-qem-eicon-container' ).replaceWith( quickEmoteMenu.eiContainer );
	}
	
	/*
	 * Checks if an eicon is favourited.
	 */
	isFavorite( name ) {
		return this.readData( 'favourites', [] ).indexOf( name ) >= 0;
	}
	
	/*
	 * Adds an eicon to your favourites.
	 */
	favouriteEicon( name ) {
		let isFav;
		let favourites = this.readData( 'favourites', [] );
		let index = favourites.indexOf( name );
		let buttons = document.querySelectorAll( `[data-eicon="${name}"]` );
		if ( index < 0 ) {
			isFav = true;
			favourites.unshift( name );
			buttons.forEach( ( element ) => { element.classList.add( 'active' ); } );
		} else {
			isFav = false;
			favourites.splice( index, 1 );
			buttons.forEach( ( element ) => { element.classList.remove( 'active' ); } );
		}
		this.writeData( 'favourites', favourites );			
		this.updateEicons();
		return isFav
	}
	
	/*
	 * Adds an eicon to the eicon history
	 */
	addToHistory( eicon ) {
		let history = this.readData( 'history', [] );
		let maxLength = this.readData( 'maxhistory', 50 );
		let index = history.indexOf( eicon );
		if ( index >= 0 ) {
			history.unshift( history.splice( index, 1 )[ 0 ] );
			history.splice( maxLength );
			this.writeData( 'history', history );
			this.updateEicons();
			quickEmoteMenu.switchQem( 'bda-qem-eicon' );
		} else {
			this.getEiconData( eicon, ( data ) => {
				if ( this.eiconExists( data ) ) {
					history.unshift( eicon );
					history.splice( maxLength );
					this.writeData( 'history', history );
					this.updateEicons();
					quickEmoteMenu.switchQem( 'bda-qem-eicon' );
				}
			} );
		}
	}
	
	/*
	 * Tries to insert eicons into the React DOM
	 */
	tryInsertEicon( text ) {
		let elements = [];
		let mosaic = false;
		let mosaicElement;
		while ( this.eiconPattern.test( text ) ) {
			let match = this.eiconPattern.exec( text );
			let eiconName = match[ 1 ].toLowerCase();
			let textBefore = text.substring( 0, match.index );
			text = text.substring( match.index + match[ 0 ].length );
			if ( textBefore.length ) {
				if ( '\n' !== textBefore && mosaic ) {
					mosaic = false;
					elements.push( mosaicElement );
					elements.push( BdApi.React.createElement( 'div', { className: 'eicon-clearfix' } ) );
				}
				if ( mosaic ) {
					mosaicElement.props.children.push( BdApi.React.createElement( 'br' ) );
				} else {
					elements.push( textBefore );
				}
			}
			let eicon = BdApi.React.createElement( this.EiconReactComponent, { eiconName: eiconName, isMosaic: mosaic } );
			if ( !mosaic && this.eiconPattern.test( text ) ) {
				if ( Number( '\n' === text.slice( 0, 1 ) ) === this.eiconPattern.exec( text ).index ) {
					mosaic = true;
					eicon.props.isMosaic = true;
					elements.push( BdApi.React.createElement( 'div', { className: 'eicon-clearfix' } ) );
					mosaicElement = BdApi.React.createElement( this.MosaicReactComponent, {}, [] );
				}
			}
			if ( mosaic ) {
				mosaicElement.props.children.push( eicon );
			} else {
				elements.push( eicon );
			}
		}
		if ( mosaic ) elements.push( mosaicElement );
		if ( mosaic && text.length ) elements.push( BdApi.React.createElement( 'div', { className: 'eicon-clearfix' } ) );
		if ( text.length ) elements.push( text );
		
		return elements;
	}
	
	/*
	 * Displays an enlarged version of the eicon at 100x100 size.
	 */
	showEnlarged( elements, width = 1, height = 1 ) {
		let target = document.getElementById( 'app-mount' ).lastElementChild;
		let wrapper = document.createElement( 'div' );
		wrapper.classList.add( 'eicon-zoom-wrapper' );
		let close = () => {
			wrapper.classList.add( 'eicon-fade-out' );
			document.removeEventListener( 'click', close );
			document.removeEventListener( 'keydown', closeByKeystroke );
			setTimeout( () => {
				if ( wrapper !== null )
					wrapper.remove();
			}, 250 );
		};
		let closeByKeystroke = ( e ) => {
			if ( 'Escape' === event.code ) {
				close();
			}
			e.preventDefault();
		};
		wrapper.addEventListener( 'click', close );
		document.addEventListener( 'keydown', closeByKeystroke );
		let innerWrapper = document.createElement( 'div' );
		for ( let element of elements ) {
			if ( 'br' === element.type ) {
				innerWrapper.appendChild( document.createElement( 'br' ) );
			} else {
				let image = document.createElement( 'img' );
				image.src = element.props.url;
				image.alt = element.props.name;
				innerWrapper.appendChild( image );
			}
		}
		
		let wWidth = window.innerWidth * .8;
		let wHeight = window.innerHeight * .8;
		let multiplier = Math.min( wWidth / ( width * 100 ), wHeight / ( height * 100 ), 1 );
		innerWrapper.style.transform = `scale( ${multiplier}, ${multiplier} )`;
		
		wrapper.appendChild( innerWrapper );
		target.appendChild( wrapper );
	}
	
	/*
	 * Displays a tooltip for an eicon
	 */
	showTooltip( element ) {
		// Create the tooltip element
		let tooltip = document.createElement( 'div' );
		tooltip.setAttribute( 'class', 'tooltip-1OS-Ti da-tooltip top-1pTh1F da-top black-2bmmnj da-black' );
		tooltip.appendChild( document.createTextNode( element.getAttribute( 'alt' ) ) );
		document.getElementsByClassName( 'da-tooltips' )[ 0 ].appendChild( tooltip );
		
		// Set the desired position of the tooltip element after it's added to the DOM
		let rect = element.getBoundingClientRect();
		let bottom = window.screen.height - rect.top - tooltip.clientHeight;
		let left = rect.left / 2 + rect.right / 2 - tooltip.clientWidth / 2;
		tooltip.style.bottom = `${bottom}px`;
		tooltip.style.left = `${left}px`;
	}
	
	/*
	 * Removes any displayed tooltips
	 */
	removeTooltip() {
		document.getElementsByClassName('da-tooltips')[ 0 ].innerHTML = '';
	}
}
