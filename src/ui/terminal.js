export const CREDIT_READING=Object.freeze({wordsPerMinute:240,postBitWordsPerMinute:480,minimumSeconds:3,settleSeconds:.75});
export function creditHoldSeconds(text,afterBit=false){return Math.max(CREDIT_READING.minimumSeconds,(text.match(/\S+/g)?.length??0)*60/(afterBit?CREDIT_READING.postBitWordsPerMinute:CREDIT_READING.wordsPerMinute)+CREDIT_READING.settleSeconds);}
export const EXTENDED_CREDIT_PRINT=Object.freeze({secondsPerCharacter:.018});

// Static access text; the opening dissolve is handled by the main view.
export class Terminal {
 constructor(text,actions){this.text=text;this.actions=actions;this.done=true;}
 finish(){this.done=true;this.actions.hidden=false;this.text.parentElement.classList.add('complete');}
}

// One authored credit per screen; source URLs remain in the archival text file.
export function creditPages(text){
 const pages=[];let author='';
 for(const block of text.replace(/\r\n?/g,'\n').trim().split(/\n\s*\n/)){
  if(/^NPM DEPENDENCY INVENTORY/.test(block.trim()))break;
  if(/^Wrangler \/ Cloudflare Workers SDK/.test(block.trim()))continue;
  if(/^Thanks to the maintainers/.test(block.trim())){pages.push('Thanks to the maintainers and contributors of these projects.');continue;}
  if(/^Project source repository/i.test(block.trim()))continue;
  const lines=block.split('\n').map(line=>line.replace(/https?:\/\/\S+/gi,'').trimEnd()).filter(line=>line.trim()&&!/^[-=]+$/.test(line.trim()));
  if(!lines.length)continue;
  // The dependency inventory has one credit on each line, without blank separators.
  if(lines.every(line=>/^\S+@\d.* — /.test(line))){pages.push(...lines);continue;}
  const continuation=/^\s/.test(lines[0]);
  if(!continuation)author=lines[0];
  if(continuation&&author)lines.unshift(author);
  pages.push(lines.join('\n').trim());
 }
 return pages;
}

// Combine the composer's entries; keep model previews solo, then show five entries.
export function creditScreens(text){
 const pages=creditPages(text);
 const composer=pages.findIndex(page=>page.startsWith('WENDY CARLOS\n'));
 if(composer>=0&&pages[composer+1]?.startsWith('WENDY CARLOS\n')){
  pages.splice(composer,2,pages[composer]+'\n\n'+pages[composer+1].slice('WENDY CARLOS\n'.length));
 }
 const cycle=pages.findIndex(page=>page.startsWith('CARL N. HOFF\n'));
 if(cycle>=0&&pages[cycle+1]?.startsWith('RAY-CAST RENDERER\n')){
  pages.splice(cycle,2,pages[cycle]+'\n\n'+pages[cycle+1]);
 }
 const lastModel=pages.findIndex(page=>page.startsWith('CONTROLLINGTRANSMISSION\n'));
 if(lastModel<0)return pages;
 const screens=pages.slice(0,lastModel+1);
 for(let i=lastModel+1;i<pages.length;i+=5)screens.push(pages.slice(i,i+5).join('\n\n'));
 return screens;
}

// Driven by the frame loop, including pauses/fades: restart leaves no timers.
export class TerminalTribute {
 constructor(element,message,extendedMessage=''){
  this.element=element;this.output=element.querySelector('#tribute-text');
  this.typed=element.querySelector('.tribute-typed');
  this.message=message.replace(/\r\n?/g,'\n').replace(/\n+$/,'').replace(/\nEND OF LINE$/,'');
  this.sentences=this.message.split(/\n\n/);
  this.extendedStart=this.sentences.length;
  this.sentences.push(...creditScreens(extendedMessage));
  const bitIndex=this.sentences.findIndex((text,index)=>index>=this.extendedStart&&text.startsWith('CONTROLLINGTRANSMISSION\n'));
  this.postBitStart=bitIndex<0?Infinity:bitIndex+1;
  element.querySelector('.tribute-measure').textContent=this.sentences.reduce((a,b)=>a.split('\n').length>b.split('\n').length?a:b,'')+'\nEND OF LINE';
  this.element.setAttribute('aria-label',this.sentences.join('\n\n')+'\nEND OF LINE');this.reset();
 }
 reset(){this.preview?.reset();this.elapsed=0;this.nextCharacter=3;this.count=0;this.index=0;this.active=false;this.phase='body';this.line=null;this.output.textContent='';this.typed.style.opacity='1';this.element.classList.remove('complete','signing-off');}
 start(reducedMotion=false){this.reset();this.active=true;this.reducedMotion=reducedMotion;}
 next(){
  if(this.index>=this.sentences.length-1)return;
  this.index++;this.count=0;this.active=true;this.phase='body';this.nextCharacter=this.elapsed;
  this.output.textContent='';this.line=null;this.typed.style.opacity='1';
  this.element.classList.remove('complete','signing-off');
  this.update(0);
 }
 update(dt,signOffReady=false){
  if(!this.active)return false;
  this.elapsed+=dt;
  if(this.phase==='body'){
   const message=this.sentences[this.index],previous=this.count;
   if(this.reducedMotion&&this.elapsed>=this.nextCharacter)this.count=message.length;
   while(this.elapsed>=this.nextCharacter&&this.count<message.length){
    const character=message[this.count++];
    this.nextCharacter+=this.index>=this.extendedStart?EXTENDED_CREDIT_PRINT.secondsPerCharacter:.045+Math.random()*.10+(character==='\n'?.45:/[.!?]/.test(character)?.3:/[,;:]/.test(character)?.14:0);
   }
   appendPrintedText(this,message.slice(previous,this.count));
   if(this.count<message.length)return false;
   this.phase=this.index===this.sentences.length-1?'waiting':'hold';this.phaseStarted=this.elapsed;this.element.classList.add('complete');
  }
  if(this.phase==='hold'){
   if(this.elapsed-this.phaseStarted<creditHoldSeconds(this.sentences[this.index],this.index>=this.postBitStart))return false;
   this.phase='fade';this.phaseStarted=this.elapsed;
  }
  if(this.phase==='fade'){
   const fade=this.reducedMotion?1:Math.min(1,(this.elapsed-this.phaseStarted)/.8);
   this.typed.style.opacity=String(1-fade);
   if(fade<1)return false;
   this.output.textContent='';this.line=null;this.typed.style.opacity='1';this.element.classList.remove('complete');
   this.index++;this.count=0;
   this.phase=this.index<this.sentences.length?'body':'waiting';this.nextCharacter=this.elapsed+.4;
   return false;
  }
  if(this.phase==='waiting'){
   if(!signOffReady)return false;
   this.output.append(document.createTextNode('\n'));
   this.phase='return';this.nextCharacter=this.elapsed+.18;this.element.classList.remove('complete');return false;
  }
  if(this.phase==='return'&&this.elapsed>=this.nextCharacter){
   this.element.classList.add('signing-off');this.tail=document.createElement('span');this.tail.className='terminal-signoff';this.output.append(this.tail);
   this.phase='signoff';this.count=0;this.nextCharacter=this.elapsed+.18;
  }
  if(this.phase==='signoff'){
   const previous=this.count;
   while(this.elapsed>=this.nextCharacter&&this.count<11){this.count++;this.nextCharacter+=.055+Math.random()*.10;}
   if(this.reducedMotion)this.count=11;
   this.tail.textContent='END OF LINE'.slice(0,this.count);
   if(this.count===11){this.active=false;this.element.classList.add('complete');}
   return previous===0&&this.count>0;
  }
  return false;
 }
}

// Constant character cadence, including punctuation and line breaks.
export const VICTORY_PRINT=Object.freeze({charactersPerSecond:1/EXTENDED_CREDIT_PRINT.secondsPerCharacter,maxCatchUpSeconds:.25});
export class TerminalPrinter {
 constructor(output,message,{clock=()=>performance.now()}={}){
  this.output=output;this.message=message.replace(/\r\n?/g,'\n').trimEnd();this.clock=clock;this.reset();
 }
 reset(){this.active=false;this.count=0;this.line=null;}
 start(){this.reset();this.startedAt=this.clock();this.nextCharacterAt=this.startedAt+1000/VICTORY_PRINT.charactersPerSecond;this.active=true;this.output.replaceChildren();}
 update(){
  if(!this.active)return;
  // Match extended-credit typing speed and bound catch-up after stalls.
  const now=this.clock(),interval=1000/VICTORY_PRINT.charactersPerSecond;
  if(now<this.nextCharacterAt)return;
  const due=Math.min(this.maxCharactersPerUpdate??Math.ceil(VICTORY_PRINT.charactersPerSecond*VICTORY_PRINT.maxCatchUpSeconds),1+Math.floor((now-this.nextCharacterAt)/interval));
  const count=Math.min(this.message.length,this.count+due);
  this.nextCharacterAt=Math.max(this.nextCharacterAt+due*interval,now);
  if(count<=this.count)return;
  appendPrintedText(this,this.message.slice(this.count,count));
  this.count=count;
  if(count===this.message.length)this.active=false;
 }
}

// One glyph per frame, with uneven keystrokes and a longer carriage return.
export class HumanTerminalPrinter extends TerminalPrinter {
 constructor(output,message,{random=Math.random,...options}={}){super(output,message,options);this.random=random;this.maxCharactersPerUpdate=1;}
 delay(character=''){return (45+this.random()*100+(character==='\n'?350:character===' '?45:0))/2;}
 start(){super.start();this.nextCharacterAt=this.clock()+this.delay();}
 update(){
  const before=this.count;super.update();
  if(this.count!==before)this.nextCharacterAt=this.clock()+this.delay(this.message[this.count-1]);
 }
}

// Append only new glyphs; completed lines keep their DOM and paint layers.
function appendPrintedText(printer,text){
 const document=printer.output.ownerDocument;
 for(const glyph of text){
  if(glyph==='\n'){printer.output.appendChild(document.createTextNode(glyph));printer.line=null;continue;}
  if(!printer.line){printer.line=document.createElement('span');printer.line.className='printer-line';printer.output.appendChild(printer.line);}
  const character=document.createElement('span');character.className='printer-character';
  character.appendChild(document.createTextNode(glyph));printer.line.appendChild(character);
 }
}
