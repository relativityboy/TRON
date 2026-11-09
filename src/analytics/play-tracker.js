/** One play per controlled run or seated racing round; menus, pauses and spectators do not count. */
export class PlayTracker {
  constructor(mark){this.mark=mark;this.reset();}
  reset(){this.space=false;this.round=null;}
  update({mode,game,run}){
    if(mode!=='running')return;
    if(game==='space'){
      if(!this.space){this.space=true;this.mark('clu');}
      return;
    }
    if(game!=='cycles'&&game!=='multiplayer')return;
    const race=run.cycleRace,mp=game==='multiplayer';
    const seat=mp?run.multiplayer?.seat:race?.playerId;
    if(!race||run.arenaWaiting||race.phase!=='racing'||seat==null||mp&&!run.multiplayer?.connected)return;
    if(!race.cycles.some(b=>b.id===seat&&b.alive))return;
    const key=`${game}:${race.round}`;
    if(this.round!==key){this.round=key;this.mark(mp?'cycles-mp':'cycles-solo');}
  }
}
