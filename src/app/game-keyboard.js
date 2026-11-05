/** Cancel browser defaults during play; modified shortcuts must not fire game actions.
 * macOS may consume system shortcuts before they reach the browser. */
export function guardGameKey(event,active){
 if(!active||event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return false;
 event.preventDefault();
 return !!(event.metaKey||event.ctrlKey||event.altKey||event.key==='Fn'||event.key==='Globe'||event.getModifierState?.('Fn'));
}
