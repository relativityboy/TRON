import test from 'node:test';
import assert from 'node:assert/strict';
import {guardGameKey} from '../../src/app/game-keyboard.js';
function event(values={}){return {preventDefault(){this.prevented=true;},...values};}
test('play cancels default character/scroll/focus actions while retaining ordinary game keys',()=>{
 for(const code of ['KeyE','Space','Tab','ArrowUp','F1']){const e=event({code});assert.equal(guardGameKey(e,true),false);assert(e.prevented);}
 const e=event({shiftKey:true,code:'KeyT'});assert.equal(guardGameKey(e,true),false);assert(e.prevented);
});
test('emoji and other modifier shortcuts cannot also trigger game controls',()=>{
 for(const values of [{code:'Space',ctrlKey:true,metaKey:true},{code:'KeyE',getModifierState:key=>key==='Fn'},{key:'Globe'},{code:'KeyR',metaKey:true},{code:'KeyD',altKey:true}]){const e=event(values);assert(guardGameKey(e,true));assert(e.prevented);}
});
test('menu and editable controls retain normal keyboard behavior',()=>{
 const menu=event();assert.equal(guardGameKey(menu,false),false);assert(!menu.prevented);
 const input=event({target:{closest:()=>({})}});assert.equal(guardGameKey(input,true),false);assert(!input.prevented);
});
