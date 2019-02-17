//META{"name":"flisteicons"}*//

class flisteicons {
	getName() { return "F-list eicons"; }
	getShortName() { return "flei"; }
	getDescription() { return "Inserts F-list eicons into messages where applicable"; }
	getVersion() { return "0.2.1"; }
	getAuthor() { return "Kemono-Kay"; }
	
	load() {}
    unload() {}
	initialize() {}
	stop() {}
	start() {}
	
	observer( { addedNodes, removedNodes } ) {
		//console.log( addedNodes );
		/*
		 * Looks for text nodes to insert icons into, within the given element's child nodes.
		 */
		var insertIcons = function( el ) {		
			let replaceOnThis = false;
			for ( let element of [ ...el.childNodes ] ) {
				// Do not replace eicons inside pre or code tags.
				if ( element.nodeType == document.ELEMENT_NODE && ( element.tagName.toLowerCase() == 'pre' || element.tagName.toLowerCase() == 'code' ) )
					return;
				
				// Call recursively
				insertIcons( element );
				
				if ( element.nodeType == document.TEXT_NODE )
					replaceOnThis = true;
			}
			
			if ( replaceOnThis )
				replaceMatches( el );
		}
		
		/*
		 * Replaces any in-text eicons with the actual images within text nodes in the given elements.
		 */
		var replaceMatches = function( element ) {
			let jumboable = true;
			
			// Formatting specific to search results. The text nodes are broken up and highlighted; this fuses the text nodes together.
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
				
				let eicon = /:[f]!([ \w-]+?):/i;
				let whitespace = /^\s*$/;
				let text = node.textContent;
				let splitText = [];
				let icons = [];
				
				// Text is split on eicons so that img elements can be inserted between the resulting strings.
				while ( eicon.test( text ) ) {
					
					// Split text on eicon
					let match = eicon.exec( text );
					let beforeText = text.substring( 0, match.index );
					if( !whitespace.test( beforeText ) )
						jumboable = false;
					splitText.push( beforeText );
					text = text.substring( match.index + match[ 0 ].length );
					
					// Turn in-text eicon into an actual image
					var img = document.createElement( 'img' );
					img.setAttribute( 'alt', match[ 0 ] );
					img.setAttribute( 'draggable', false );
					img.setAttribute( 'src', 'https://static.f-list.net/images/eicon/' + match[ 1 ].toLowerCase() + '.gif' );
					img.setAttribute( 'class', 'emoji da-emoji' );
					icons.push( img );
					
					var timeoutId = null;
					img.addEventListener( 'mouseover', () => { timeoutId = setTimeout( displayTooltip, 1000, img ); } );
					img.addEventListener( 'mouseout', () => { clearTimeout( timeoutId ); removeTooltip(); } );
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
			}
		}
		
		var displayTooltip = function ( element ) {
			let rect = element.getBoundingClientRect();
			let tooltip = document.createElement( 'div' );
			tooltip.setAttribute( 'class', 'tooltip-1OS-Ti da-tooltip top-1pTh1F da-top black-2bmmnj da-black' );
			tooltip.appendChild( document.createTextNode( element.getAttribute( 'alt' ) ) );
			document.getElementsByClassName('da-tooltips')[ 0 ].appendChild( tooltip );
			
			let bottom = window.screen.height - rect.top - tooltip.clientHeight;
			let left = rect.left / 2 + rect.right / 2 - tooltip.clientWidth / 2;
			
			tooltip.setAttribute( 'style', `bottom: ${bottom}px; left: ${left}px;` );
		}
		
		var removeTooltip = function() {
			document.getElementsByClassName('da-tooltips')[ 0 ].innerHTML = '';
		}

		/*
		 * Upon mutation, try inserting icons.
		 */
		addedNodes.forEach( function( el ) {
			if ( el.classList ) {
				if ( el.classList.contains( 'da-message' ) ) {
					// Upon a message being sent, try insert icons.
					insertIcons( el );
				} else if (	el.classList.contains( 'da-container' )	) {
					// Upon edit (characterData mutation) retry inserting icons.
					insertIcons( el );
					var callback = function( mutationsList, observer ) {
						insertIcons( el );
						observer.disconnect();
					};
					var observer = new MutationObserver( callback );
					observer.observe( el, { attributes: false, childList: false, subtree: true, characterData: true } );
					
					/* 
					 * The mutation doesn't trigger if the edit is cancelled, but the eicon is removed when this happens.
					 * If I insert the eicon straight away, though, it overwrites any edits that are made.
					 * Therefore, this is triggered with a slight delay, to give the mutation time to occur first.
					 */
					setTimeout( () =>{ insertIcons( el ); }, 250 );
				} else if ( 
					el.classList.contains( 'da-messagesWrapper' ) || 
					el.classList.contains( 'da-modal' ) ||
					el.classList.contains( 'da-resultsWrapper' ) ||
					el.classList.contains( 'da-searchResultsWrap' )
				) {
					// Upon switching to a different view, bringing up a modal containing a message, or searching, try inserting icons.
					let els = el.getElementsByClassName( 'da-message' );
					for ( let i = 0; i < els.length; i++ ) {
						insertIcons( els[ i ] );
					}
				}
			}
		} );
	}
}