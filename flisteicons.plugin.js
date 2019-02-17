//META{"name":"flisteicons"}*//

class flisteicons {
	getName() { return "F-list eicons"; }
	getShortName() { return "flei"; }
	getDescription() { return "Inserts F-list eicons into messages where applicable"; }
	getVersion() { return "0.0.4"; }
	getAuthor() { return "Kemono-Kay"; }
	
	load() {}
    unload() {}
	initialize() {}
	stop() {}
	start() {}
	
	observer( e ) {
		e.addedNodes.forEach( function( el ) {
			if ( el.classList ) {
				let insertIcons = function( el ) {		
					el.childNodes.forEach( function( el ) {
						if ( el.nodeType == 1 && ( el.tagName.toLowerCase() == 'pre' || el.tagName.toLowerCase() == 'code' ) )
							return;
						insertIcons( el );
						if ( el.nodeType == 3 ) {							
							let text = el.textContent;
							let splittext = [];
							let emotes = [];						
							while ( /:[fF]!([ \w-]+?):/.test( text ) ) {
								let match = /:[fF]!([ \w-]+?):/.exec( text );
								splittext.push( text.split( match[ 0 ], 1 ) );
								text = text.substring( match.index + match[ 0 ].length );
								let img = document.createElement( 'img' );
								img.setAttribute( 'alt', match[ 0 ] );
								img.setAttribute( 'draggable', false );
								img.setAttribute( 'src', 'https://static.f-list.net/images/eicon/' + match[ 1 ] + '.gif' );
								img.setAttribute( 'class', 'emoji jumboable da-jumboable da-emoji' );
								emotes.push( img );
							}
							
							if ( splittext.length > 0 ) {
								let parent = el.parentElement;
								for ( let i = 0 ; i < splittext.length; i++ ) {
									if ( splittext[ i ].length > 0 ) {
										parent.insertBefore( document.createTextNode( splittext[ i ] ), el );
									}
									parent.insertBefore( emotes[ i ], el );
								}
								if ( text.length > 0 ) {
									parent.insertBefore( document.createTextNode( text ), el );
								}
								parent.removeChild( el );
							}
						}
					} );
				}
				
				if ( el.classList.contains( 'da-message' ) ) {
					insertIcons( el );
				} else if (
					el.classList.contains( 'da-container' ) ||
					el.classList.contains( 'da-messagesWrapper' )
				) {
					let els = el.getElementsByClassName( 'da-message' );
					for ( let i = 0; i < els.length; i++ ) {
						insertIcons( els[ i ] );
					}
				}
			}
		} );
	}
}