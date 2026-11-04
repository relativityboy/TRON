import {createOutlineMaze} from './outline-maze.js';
import {OUTLINES,BLUEPRINT_SIZE,METERS_PER_PIXEL} from './blueprint-outlines.js';
// Build the small-maze collision/triangulation data only when enabled.
const cache=new Map();
export function blueprintSource(includeWalls=true){
 if(cache.has(includeWalls))return cache.get(includeWalls);
 const maze=createOutlineMaze({shapes:includeWalls?OUTLINES.map(outline=>({outline})):[],size:BLUEPRINT_SIZE,metersPerPixel:METERS_PER_PIXEL});
 const {pixelToWorld,FLOOR_HALF,HALF}=maze;
const SPAWN={x:pixelToWorld([1288,980]).x,s:-FLOOR_HALF[1]-HALF,yaw:0};
const RECOGNIZER_STARTS=[[-80,150],[1752,230],[-80,800],[1752,850],[830,-90]].map(pixelToWorld);

 const result={...maze,SPAWN,RECOGNIZER_STARTS};cache.set(includeWalls,result);return result;
}
