import fs from 'node:fs';
const root='docs/sounds',catalog=JSON.parse(fs.readFileSync(root+'/catalog.json','utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
let md=`---\ntitle: Sound library\nsubtitle: 1982 TRON sounds, experiments and future resources\n---\n\nReviewed ${catalog.reviewed}. ${catalog.purpose}\n\n[Game sound study](../../audio.html) · [Machine-readable catalog](catalog.json)\n\nStart with the Syna-Max Recognizer and derezz recreations. Four public HQ MP3 previews are saved locally; full original downloads use the creator’s Freesound pages. The shelf also retains current game sounds, cleanup experiments, six stock-effect leads, and two complete vendor metadata catalogs. Auditory comparison is pending; file verification is not a claim of film fidelity.\n\n`;
md+=`## CycleInteriorSound1 engine — November 4\n\nWorld and cabin cycle engines now use the user-supplied CycleInteriorSound1.mp4 recording. The inner stereo waveform has an 80 ms phase-matched raised-cosine loop join and circular stereo-linked level smoothing. No spectral resynthesis. Source hash, timecodes and reproducible conversion command are recorded in cycle-source.json. User approved the resulting engine sound on November 4.\n\n`;
for(const group of new Set(catalog.items.map(i=>i.group))){
 md+=`## ${group}\n\n`;
 for(const item of catalog.items.filter(i=>i.group===group)){
  if(item.disk&&!fs.existsSync(item.disk))throw Error('Missing audio: '+item.disk);
  md+=`### ${item.title}\n\n**${item.status}** · ${item.use}\n\n${item.notes}\n\n`;
  if(item.playback)md+=`<audio controls preload="none" aria-label="${escape(item.title)}" src="${escape(item.playback)}"></audio>\n\n[Open audio file](${item.playback})\n\n`;
  md+=`[Source](${item.source}) · ${item.author} · ${item.license_url?`[${item.license}](${item.license_url})`:item.license}\n\n`;
  if(item.media)md+=`${Number(item.media.format.duration).toFixed(2)} seconds · ${item.media.streams[0].channels} channels · ${(item.bytes/1048576).toFixed(2)} MB · HQ MP3 preview, not the original master.\n\n`;
  if(item.film_reference)md+=`[Community film-match lead](${item.film_reference})\n\n`;
  if(item.catalog)md+=`[Local catalog: ${item.catalog_rows} rows](${item.catalog}) · [Publisher CSV](${item.catalog_source}) · [Publisher audition page](${item.audition})\n\n`;
 }
}
md+=`## Next auditions\n\n1. Compare the Syna-Max Recognizer against the current film-derived flight loop.\n2. Pick useful events from the derezz recording and compare with the supplied explosion edit.\n3. Check CRT059908–10 and PE205401 against the film before treating them as matches.\n4. Keep lightcycle and synth ambience available for later vehicle/environment experiments.\n\nThe Serafine collections provide further design material, but no exact Recognizer or tank stem has been verified there. No new library audio is loaded by the game.\n`;
fs.writeFileSync(root+'/_index.md',md);
console.log(`Built sound library: ${catalog.items.length} resources.`);
