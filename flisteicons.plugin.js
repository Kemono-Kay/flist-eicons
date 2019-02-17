//META{"name":"flisteicons"}*//

class flisteicons {
	getName() { return "F-list eicons"; }
	getShortName() { return "flei"; }
	getDescription() { return "Inserts F-list eicons into messages where applicable"; }
	getVersion() { return "0.1.0"; }
	getAuthor() { return "Kemono-Kay"; }
	
	load() {}
    unload() {}
	initialize() {}
	stop() {}
	start() {}
	constructor() {}
	
	observer( { addedNodes, removedNodes } ) {
		
		console.log(addedNodes);
		
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
			let imgs = [];
			
			// Formatting specific to search results. The text nodes are broken up and highlighted; this fuses the text nodes together.
			for ( let node of [ ...element.childNodes ] ) {
				if ( node.nodeType == document.ELEMENT_NODE && node.tagName.toLowerCase() == 'span' && !el.firstElementChild.className ) {
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
					let img = document.createElement( 'img' );
					img.setAttribute( 'alt', match[ 0 ] );
					img.setAttribute( 'draggable', false );
					img.setAttribute( 'src', 'https://static.f-list.net/images/eicon/' + match[ 1 ].toLowerCase() + '.gif' );
					img.setAttribute( 'class', 'emoji da-emoji' );
					icons.push( img );
					imgs.push( img );
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
				for ( let img of imgs ) {
					img.classList.add( 'jumboable', 'da-jumboable' );
				}
			}
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
					var callback = function( mutationsList, observer ) {
						insertIcons( el );
						observer.disconnect();
					};
					var observer = new MutationObserver( callback );
					observer.observe( el, { attributes: false, childList: false, subtree: true, characterData: true } );
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