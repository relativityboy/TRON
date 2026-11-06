import {Box3,Frustum,Matrix4,Vector3} from 'three';

// Explicit development opt-in. Only the game canvas and carrier state are
// sent to the user's loopback diagnostic server; never storage or credentials.
export function createCarrierDiagnostics({getView,getRun,getMode}){
 const endpoint='http://127.0.0.1:5191',controller=new AbortController();
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
 const context=canvas.getContext('2d');let next=0,pending=false,disposed=false;
 return {
  sample(){
   if(disposed||pending||performance.now()<next)return;
   const view=getView();if(!view)return;
   next=performance.now()+1500;const run=getRun(),ship=view.carrier,camera=view.camera;
   camera.updateMatrixWorld();ship?.updateMatrixWorld(true);
   const bounds=ship?new Box3().setFromObject(ship):null;
   const frustum=new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   const center=bounds?.getCenter(new Vector3()),projected=center?.clone().project(camera);
   const finiteBounds=!!bounds&&[...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite);
   const meshes=[];ship?.traverse(o=>{if(o.isMesh&&!o.userData.breakupExclude)meshes.push(o);});
   const rez=ship?.userData.rez;
   const report={receivedFrom:'carrier-debug-v1',mode:getMode(),time:run.time,playerVehicle:run.playerVehicle,
    player:{x:run.x,s:run.s,yaw:run.yaw,turretYaw:run.turretYaw},
    carrier:ship?{position:ship.position.toArray(),visible:ship.visible,meshCount:meshes.length,
     visibleMeshes:meshes.filter(o=>o.visible&&[].concat(o.material).some(m=>m.visible)).length,
     finitePosition:ship.position.toArray().every(Number.isFinite),bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},inFrustum:finiteBounds&&frustum.intersectsBox(bounds),projected:projected.toArray(),
     wallBlocked:center?view.map.wallIntersection({x:camera.position.x,s:-camera.position.z,y:camera.position.y},{x:center.x,s:-center.z,y:center.y})!==null:null,
     reveal:rez?{opacity:rez.opacity,solidCut:rez.solid.rezCut.value,wireCut:rez.wire.rezCut.value,wireOpacity:rez.lineMaterial.opacity,
      visibleWires:rez.wires.filter(w=>w.visible).length,panel:rez.rectangle.visible,bounds:{min:rez.bounds.min.toArray(),max:rez.bounds.max.toArray()}}:null}:null,
    camera:{position:camera.position.toArray(),rotation:camera.quaternion.toArray(),fov:camera.fov,aspect:camera.aspect,near:camera.near,far:camera.far,opening:view.cameraRig.opening},
    shaderErrors:(view.renderer.info.programs||[]).filter(p=>p.diagnostics?.runnable===false).map(p=>({name:p.name,program:p.diagnostics.programLog,vertex:p.diagnostics.vertexShader?.log,fragment:p.diagnostics.fragmentShader?.log})),
    sceneryTime:view.sceneryClock?.time,contextLost:view.renderer.getContext().isContextLost()};
   if(context){try{context.drawImage(view.renderer.domElement,0,0,canvas.width,canvas.height);report.screenshot=canvas.toDataURL('image/png');}catch(error){report.captureError=error.message;}}
   pending=true;void fetch(endpoint+'/report',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(report),signal:controller.signal}).catch(()=>{}).finally(()=>{pending=false;});
  },
  dispose(){disposed=true;controller.abort();canvas.width=canvas.height=0;},
 };
}
