//META{"name":"flisteicons"}*//

/*

TODO:
Zoom in on eicons
Allow clearing individual eicons from history
Allow insertion of eicons in history as you're typing (like is the case for emoji)

*/

const request = require( 'request' );
const pluginName = 'flisteicons';
const eiconPattern = /:[f]!([ \w-]+?):/i;
var currentText = '';

class flisteicons {
	getName() { return "F-list eicons"; }
	getShortName() { return "flei"; }
	getDescription() { return "Inserts F-list eicons into messages where applicable"; }
	getVersion() { return "0.3.2"; }
	getAuthor() { return "Kemono-Kay"; }
	getSettingsPanel() { return buildSettingsPage(); }
	stop() {}
	start() {
		loadDefaultEicon();
	}
	onSwitch() {
		// Find the main textArea and attach handlers for managing eicon history.
		attachTextAreaHandlers( document );
		
		// Upon switching to a different view, try inserting icons.
		document.querySelectorAll( '.da-messagesWrapper .da-message' ).forEach( ( element ) => {
			setTimeout( () => { 
				insertIcons( element );
			} );
		} );
	}
	observer( { addedNodes } ) {
		addedNodes.forEach( handleMutation );
	}
}

/*
 * Checks whether an eicon exists by file contents
 */
function eiconExists( body ) {
	let standard = readData( 'default-eicon' );
	if ( 'undefined' === typeof standard )
		return true;
	return standard !== body;
}

/*
 * Gets the data of the eicon with the given name.
 */
function getEiconData( name, callback ) {
	request( getEiconUrl( name ), ( error, response, body ) => {
		setTimeout( callback, 0, body );
	} );
}

/*
 * Gets the data of the default eicon.
 */
function loadDefaultEicon() {
	if ( 'undefined' === typeof readData( 'default-eicon' ) ) {
		request( getEiconUrl(), ( error, response, body ) => {
			if ( 'undefined' !== typeof body ) {
				writeData( 'default-eicon', body );
			} else {
				setTimeout( loadDefaultEicon(), 10000 );
			}
		} );
	}
}

/*
 * Writes to the plugin data.
 */
function writeData( key, data ) {
	BdApi.saveData( pluginName, key, data );
}

/*
 * Reads from the plugin data.
 */
function readData( key, fallback ) {
	let value = BdApi.loadData( pluginName, key );
	return typeof value !== 'undefined' ? value : fallback;
}

/*
 * Gets the url of a given eicon.
 */
function getEiconUrl( name = '' ) {
	return `https://static.f-list.net/images/eicon/${name}.gif`;
}

/*
 * Looks for text nodes to insert icons into, within the given element's child nodes.
 */
function insertIcons( el ) {		
	let replaceOnThis = false;
	for ( let element of [ ...el.childNodes ] ) {
		// Do not replace eicons inside pre or code tags.
		if ( element.nodeType == document.ELEMENT_NODE && ( element.tagName.toLowerCase() == 'pre' || element.tagName.toLowerCase() == 'code' ) )
			return;
		
		// Call recursively
		insertIcons( element );
		
		// If this is a text node, try matching tags.
		if ( element.nodeType == document.TEXT_NODE )
			replaceOnThis = true;
	}
	
	if ( replaceOnThis )
		replaceMatches( el );
}

/*
 * Adds an eicon to the history list.
 */
function addToHistory( eicon ) {
	var history = readData( 'history', [] );
	var maxLength = readData( 'maxhistory', 50 );
	var index = history.indexOf( eicon );
	if ( index >= 0 ) {
		history.unshift( history.splice( index, 1 )[ 0 ] );
		history.splice( maxLength );
		writeData( 'history', history );
	} else {
		getEiconData( eicon, ( data ) => {
			if ( eiconExists( data ) ) {
				history.unshift( eicon );
				history.splice( maxLength );
				writeData( 'history', history );
			}
		} );
	}
}

/*
 * Inserts an eicon code into a textArea.
 */
function insertTextAreaEiconCode( textArea, eicon ) {
	let text = textArea.value;
	if ( textArea.selectionStart || textArea.selectionStart == '0' ) {
		text = textArea.value.substring( 0, textArea.selectionStart ) + `:f!${eicon}:` + textArea.value.substring( textArea.selectionEnd, textArea.value.length );
	} else {
		text += `:f!${eicon}:`;
	}
	Utils.insertText( $( textArea )[ 0 ], text );
}

/*
 * Creates the eicon image element
 */
function createEiconImage( name ) {
	var img = document.createElement( 'img' );
	img.alt = `:f!${name}:`;
	img.draggable = false;
	img.src = getEiconUrl( name );
	img.classList.add( 'emoji', 'da-emoji' );
	return img;
}

/*
 * Replaces any eicons codes with the actual images within text nodes in the given elements.
 */
function replaceMatches( element ) {
	let jumboable = true;
	
	// Formatting specific to search results; its nodes are broken up. This fuses the text nodes together so icons can be inserted.
	for ( let node of [ ...element.childNodes ] ) {
		if ( node.nodeType == document.ELEMENT_NODE && node.tagName.toLowerCase() == 'span' && !node.className ) {
			let text = document.createTextNode( node.textContent )
			element.insertBefore( text, node );
			node.remove();
			node = text;
		}
		
		if ( node.previousSibling == null )
			continue;
		
		if ( node.nodeType == document.TEXT_NODE && node.previousSibling.nodeType == document.TEXT_NODE ) {
			node.previousSibling.appendData( node.textContent );
			node.remove();
		}
	}
	
	// Try inserting images in each text node.
	for ( let node of [ ...element.childNodes ] ) {
		if ( node.nodeType != document.TEXT_NODE )
			continue;
		
		let whitespace = /^\s*$/;
		let text = node.textContent;
		let splitText = [];
		let icons = [];
		
		// Text is split on eicons so that img elements can be inserted between the resulting strings.
		while ( eiconPattern.test( text ) ) {
			
			// Split text on eicon
			let match = eiconPattern.exec( text );
			let name = match[ 1 ].toLowerCase();
			let beforeText = text.substring( 0, match.index );
			if( !whitespace.test( beforeText ) )
				jumboable = false;
			splitText.push( beforeText );
			text = text.substring( match.index + match[ 0 ].length );
			
			// Create eicon
			let img = createEiconImage( name );
			attachTooltipHandlers( img );
			
			let favs = readData( 'favourites', [] );
			
			
			let input = document.createElement( 'input' );
			input.classList.add( 'fav' );
			input.setAttribute( 'data-eicon', name );
			input.title = 'Favourite!';
			input.type = 'button';
			input.style.zIndex = 1;
			if ( favs.indexOf( name ) >= 0 ) {
				input.classList.add( 'active' );
			}
			input.addEventListener( 'click', toggleFavourite );
			
			// Wrap eicon in a wrapper
			let wrapper = document.createElement( 'div' );
			wrapper.classList.add( 'emotewrapper' );
			
			wrapper.appendChild( img );
			wrapper.appendChild( input );
			
			icons.push( wrapper );
		}
		
		splitText.push( text );
		
		for ( let index in splitText ) {
			element.insertBefore( document.createTextNode( splitText[ index ] ), node );
			if ( index != icons.length )
				element.insertBefore( icons[ index ], node );
		}
		
		node.remove();
		
		if( !whitespace.test( text ) )
				jumboable = false;
	}
	
	// If no visible text accompanies the eicon, make it jumboable (larger size)
	if ( jumboable ) {
		for ( let img of [ ...element.getElementsByTagName( 'img' ) ] ) {
			img.classList.add( 'jumboable', 'da-jumboable' );
		}
		for ( let wrapper of [ ...element.getElementsByClassName( 'emotewrapper' ) ] ) {
			wrapper.classList.add( 'jumboable' );
		}
	}
}

/*
 * Event handler for favourite button click event, where it adds/removes the associated icon to/from the favourites.
 */
function toggleFavourite () {
	let favourites = readData( 'favourites', [] );
	let name = this.getAttribute( 'data-eicon' );
	let index = favourites.indexOf( name );
	console.log( name );
	let buttons = document.querySelectorAll( `[data-eicon="${name}"]` );
	if ( index < 0 ) {
		favourites.unshift( name );
		buttons.forEach( ( element ) => { console.log(element); element.classList.add( 'active' ); } );
	} else {
		favourites.splice( index, 1 );
		buttons.forEach( ( element ) => { console.log(element); element.classList.remove( 'active' ); } );
	}
	writeData( 'favourites', favourites )
}

/*
 * Attaches tooltip event handlers to the eicon.
 */
function attachTooltipHandlers( img ){
	var timeoutId = null;
	img.addEventListener( 'mouseover', () => { timeoutId = setTimeout( displayTooltip, 1000, img ); } );
	img.addEventListener( 'mouseout', () => { clearTimeout( timeoutId ); removeTooltip(); } );
}

/*
 * Displays a tooltip for an eicon
 */
function displayTooltip( element ) {
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
function removeTooltip() {
	document.getElementsByClassName('da-tooltips')[ 0 ].innerHTML = '';
}

/*
 * Event handler for textArea keyup event, where it finds a typed eicon so it can be added to the history.
 */
function findTypedEicon( event ) {
	if ( 'Enter' === event.code) {
		while ( eiconPattern.test( currentText ) ) {
			// Split text on eicon
			let match = eiconPattern.exec( currentText );
			let name = match[ 1 ].toLowerCase();
			currentText = currentText.substring( match.index + match[ 0 ].length );
			setTimeout( addToHistory, 0, name );
		}
		currentText = '';
	}
}

/*
 * Event handler for textArea input and focus event, where it updates the current text.
 */
function updateTypedValue( event ) {
	if ( this.value ) {
		currentText = this.value;
	}
}

/*
 * Attaches event handlers for a textArea.
 */
function attachTextAreaHandlers( root ) {
	let textArea = root.querySelector( '.da-textArea' );
	if ( null !== textArea ) {
		textArea.addEventListener( 'focus', updateTypedValue );
		textArea.addEventListener( 'input', updateTypedValue );
		textArea.addEventListener( 'keyup', findTypedEicon );
	}
}

/*
 * Upon mutation, do relevant action.
 */
function handleMutation( element ) {
	if ( element.classList ) {		
		if ( element.id == 'bda-qem' ) {
			// Upon loading the emoji popout, insert eicons that have been recently used.
			var button = document.createElement( 'button' );
			button.id = 'bda-qem-eicons';					
			button.addEventListener( 'click', () => {
				document.querySelector('.da-emojiPicker').style.display = 'none';
				document.querySelector('#bda-qem-twitch-container').style.display = 'none';
				document.querySelector('#bda-qem-favourite-container').style.display = 'none';
				document.querySelector('#bda-qem-eicon-container').style.display = 'block';
				for ( let child of [ ...button.parentNode.children] ) {
					child.classList.remove( 'active' );
				}						
				button.classList.add( 'active' ); 
				return false;
			} );
			button.style.order = 2;
			button.appendChild( document.createTextNode( 'Eicons' ) );
			element.appendChild( button );
			for ( let child of [ ...button.parentNode.children] ) {
				if ( child !== button ) child.addEventListener( 'click', () => {
					document.querySelector('#bda-qem-eicon-container').style.display = 'none';
					document.querySelector('#bda-qem-eicons').classList.remove( 'active' );
				} );
			}
			
			var picker = document.createElement( 'div' );
			picker.style.display = 'none';
			picker.style.width = '346px';
			picker.style.height = '327px';
			picker.style.backgroundColor = '#353535';
			picker.style.borderRadius = '0 0 5px 5px';
			picker.id = 'bda-qem-eicon-container';
			var scrollerWrap = document.createElement( 'div' );
			scrollerWrap.classList.add( 'scroller-wrap', 'scrollerWrap-2lJEkd', 'fade' );
			var scroller = document.createElement( 'div' );
			scroller.classList.add( 'scroller', 'scroller-2FKFPG' );
			var menuInner = document.createElement( 'div' );
			menuInner.classList.add( 'emote-menu-inner' );
			var categoryFavourites = document.createElement( 'div' );
			categoryFavourites.style.color = '#98aab6';
			categoryFavourites.style.fontSize = '12px';
			categoryFavourites.style.fontWeight = '500';
			categoryFavourites.style.height = '32px';
			categoryFavourites.style.lineHeight = '32px';
			categoryFavourites.style.padding = '0 4px';
			categoryFavourites.style.textTransform = 'uppercase';
			categoryFavourites.appendChild( document.createTextNode( 'Favourites' ) );
			var categoryRecent = categoryFavourites.cloneNode( false );
			categoryRecent.appendChild( document.createTextNode( 'Recently Used' ) );
			
			picker.appendChild( scrollerWrap );
			scrollerWrap.appendChild( scroller );
			scroller.appendChild( menuInner );
			menuInner.appendChild( categoryFavourites );
			for( let icon of readData( 'favourites', [] ) ) {
				let container = document.createElement( 'div' );
				container.classList.add( 'emote-container' );
				var img = createEiconImage( icon );
				img.classList.add( 'emote-icon', 'jumboable', 'da-jumboable' );
				img.title = `:f!${icon}:`;
				container.appendChild( img );
				menuInner.appendChild( container );
				var textArea = document.querySelector( '.popout-open' ).parentElement.parentElement.querySelector( 'textarea' );
				container.addEventListener( 'click', () => { insertTextAreaEiconCode( textArea, icon ); } );
			}
			menuInner.appendChild( categoryRecent );
			for( let icon of readData( 'history', [] ) ) {
				let container = document.createElement( 'div' );
				container.classList.add( 'emote-container' );
				var img = createEiconImage( icon );
				img.classList.add( 'emote-icon', 'jumboable', 'da-jumboable' );
				img.title = `:f!${icon}:`;
				container.appendChild( img );
				menuInner.appendChild( container );
				var textArea = document.querySelector( '.popout-open' ).parentElement.parentElement.querySelector( 'textarea' );
				container.addEventListener( 'click', () => { insertTextAreaEiconCode( textArea, icon ); } );
			}
			
			element.parentNode.appendChild( picker );
		} else if ( element.classList.value === '' ) {
			// If the element might contain a textArea, search for it and attach handlers for managing eicon history.
			attachTextAreaHandlers( element );
		}
		if ( element.classList.contains( 'da-message' ) ) {
			// Upon a message being sent, try insert icons.
			insertIcons( element );
		} else if (	element.classList.contains( 'da-container' )	) {
			// Upon edit (characterData mutation) retry inserting icons.
			var callback = function( mutationsList, observer ) {
				insertIcons( element );
				observer.disconnect();
			};
			var observer = new MutationObserver( callback );
			observer.observe( element, { attributes: false, childList: false, subtree: true, characterData: true } );
			
			/* 
			 * The mutation doesn't trigger if the edit is cancelled, but the eicon is removed when this happens.
			 * If I insert the eicon straight away, though, it overwrites any edits that are made.
			 * Therefore, this is triggered with a slight delay, to give the mutation time to occur first.
			 */
			setTimeout( () => { insertIcons( element ); }, 400 );
		} else if ( 
			element.classList.value === '' ||
			//element.classList.contains( 'da-messagesWrapper' ) || 
			element.classList.contains( 'da-modal' ) ||
			element.classList.contains( 'da-resultsWrapper' ) ||
			element.classList.contains( 'da-searchResultsWrap' )
		) {
			// Upon switching to a different view, bringing up a modal containing a message, or searching, try inserting icons.
			let els = element.getElementsByClassName( 'da-message' );
			for ( let i = 0; i < els.length; i++ ) {
				insertIcons( els[ i ] );
			}
		}
	}
}

function buildSettingsPage() {
	let maxHistoryInput = document.createElement( 'input' );
	let maxHistoryLabel = document.createElement( 'label' );
	let hr = document.createElement( 'hr' );
	let buttonWrapper = document.createElement( 'div' );
	let saveButton = document.createElement( 'button' );
	let saveButtonContents = document.createElement( 'div' );
	let clearHistoryButton = document.createElement( 'button' );
	let clearHistoryButtonContents = document.createElement( 'div' );
	
	maxHistoryInput.classList.add( 'inputDefault-_djjkz', 'input-cIJ7To', 'size16-14cGz5', 'da-inputDefault', 'da-input', 'da-size16' );
	maxHistoryInput.name = 'maxHistory';
	maxHistoryInput.id = `${pluginName}_${maxHistoryInput.name}`;
	maxHistoryInput.type = 'number'
	maxHistoryInput.setAttribute( 'min', 0 );
	maxHistoryInput.value = readData( 'maxhistory', 50 );
	
	maxHistoryLabel.classList.add( 'h5-18_1nd', 'title-3sZWYQ', 'size12-3R0845', 'height16-2Lv3qA', 'weightSemiBold-NJexzi', 'da-h5', 'da-title', 'da-size12', 'da-height16', 'da-weightSemiBold', 'defaultMarginh5-2mL-bP', 'marginBottom8-AtZOdT', 'da-defaultMarginh5', 'da-marginBottom8' );
	maxHistoryLabel.setAttribute( 'for', maxHistoryInput.id );
	maxHistoryLabel.appendChild( document.createTextNode( 'Eicon History Size Limit' ) );
	
	hr.classList.add( 'divider-3573oO', 'da-divider', 'marginTop20-3TxNs6', 'da-marginTop20', 'marginBottom20-32qID7', 'da-marginBottom20' );
	
	buttonWrapper.style.display = 'flex';
	buttonWrapper.style.justifyContent = 'space-between';
	buttonWrapper.appendChild( clearHistoryButton );
	buttonWrapper.appendChild( saveButton );
	
	saveButton.type = 'submit';
	saveButton.classList.add( 'button-38aScr', 'da-button', 'lookFilled-1Gx00P', 'colorGreen-29iAKY', 'sizeSmall-2cSMqn', 'grow-q77ONN', 'da-grow' );
	
	clearHistoryButton.type = 'button';
	clearHistoryButton.classList.add( 'button-38aScr', 'da-button', 'lookFilled-1Gx00P', 'colorBrand-3pXr91', 'sizeSmall-2cSMqn', 'grow-q77ONN', 'da-grow' );
	clearHistoryButton.onclick = () => { 
		writeData( 'history', [] );
		BdApi.showToast( 'Eicon history has been cleared.', { type: 'success' } );
	}
	
	saveButtonContents.classList.add( 'contents-18-Yxp', 'da-contents' );
	saveButtonContents.appendChild( document.createTextNode( 'Save' ) );
	saveButton.appendChild( saveButtonContents );
	
	clearHistoryButtonContents.classList.add( 'contents-18-Yxp', 'da-contents' );
	clearHistoryButtonContents.appendChild( document.createTextNode( 'Clear eicon history' ) );	
	clearHistoryButton.appendChild( clearHistoryButtonContents );
	
	let form = document.createElement( 'form' );
	form.style.padding = '20px';
	form.appendChild( maxHistoryLabel );
	form.appendChild( maxHistoryInput );
	form.appendChild( hr );
	form.appendChild( buttonWrapper );
	form.onsubmit = () => { 
		event.preventDefault();
		writeData( 'maxhistory', document.querySelector( `#${maxHistoryInput.id}` ).value );
		BdApi.showToast( 'Settings have been successfully saved.', { type: 'success' } );
	}
	
	return form;
}