import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCarrierDiagnostics} from '../../src/app/carrier-diagnostics.js';

test('local diagnostics report carrier visibility and shader failures without changing the scene',async()=>{
 const oldDocument=globalThis.document,oldFetch=globalThis.fetch,reports=[];
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>null})};
 globalThis.fetch=async(url,options)=>{reports.push({url,options,body:JSON.parse(options.body)});return {};};
 const ship=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(20,20,20));ship.add(mesh);ship.position.set(-100,40,-500);
 const camera=new T.PerspectiveCamera(63,16/9,.15,12000);camera.position.set(0,8,19);camera.lookAt(0,5,-30);
 const view={carrier:ship,camera,cameraRig:{opening:null},map:{wallIntersection:()=>null},renderer:{info:{programs:[{name:'carrier',diagnostics:{runnable:false,programLog:'compile failure'}}]},getContext:()=>({isContextLost:()=>false})}};
 const run={time:12,playerVehicle:'tank',x:0,s:0,yaw:0,turretYaw:0};
 try{
  const diagnostics=createCarrierDiagnostics({getView:()=>view,getRun:()=>run,getMode:()=>'running'});
  diagnostics.sample();await Promise.resolve();assert.equal(reports.length,1);
  const {body,url,options}=reports[0];assert.equal(url,'http://127.0.0.1:5191/report');assert.equal(options.method,'POST');
  assert.equal(body.carrier.visible,true);assert.equal(body.carrier.meshCount,1);assert.equal(body.carrier.inFrustum,true);assert.equal(body.carrier.wallBlocked,false);assert.equal(body.shaderErrors[0].program,'compile failure');
  assert.deepEqual(ship.position.toArray(),[-100,40,-500]);assert.deepEqual(camera.position.toArray(),[0,8,19]);
  diagnostics.dispose();diagnostics.sample();assert.equal(reports.length,1);assert(options.signal.aborted);
 }finally{globalThis.document=oldDocument;globalThis.fetch=oldFetch;mesh.geometry.dispose();mesh.material.dispose();}
});
