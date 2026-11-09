const modes=new Set(['clu','cycles-solo','cycles-mp','bit']);
let frame,timer;
/** Best-effort, production-only marker. No caller waits for analytics. */
export function markPlay(mode,base){
  try{
    if(!import.meta.env.PROD||!modes.has(mode))return;
    if(new URLSearchParams(location.search).get('analytics')==='off'||localStorage.getItem('colvmn:no-analytics'))return;
    clearTimeout(timer);frame?.remove();
    frame=document.createElement('iframe');frame.hidden=true;frame.tabIndex=-1;
    frame.setAttribute('aria-hidden','true');frame.dataset.playMarker=mode;
    // BIT supplies its parent app URL; Vite supplies the normal app base.
    frame.src=new URL(`events/play-${mode}.html`,base||new URL(import.meta.env.BASE_URL,document.baseURI)).href;
    document.body.append(frame);
    timer=setTimeout(()=>{frame?.remove();frame=null;},10000);
  }catch{/* Analytics must never interrupt play. */}
}
