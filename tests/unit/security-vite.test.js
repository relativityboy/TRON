import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer,resolveConfig} from 'vite';
import projectConfig from '../../vite.config.js';

test('Vite preserves every upstream deny pattern and blocks sensitive root and nested files over HTTP',async t=>{
 const upstream=await resolveConfig({configFile:false,logLevel:'silent'},'serve');
 const project=projectConfig({mode:'test'}),deny=project.server.fs.deny;
 for(const pattern of upstream.server.fs.deny)assert(deny.includes(pattern),`Missing Vite default: ${pattern}`);
 const root=await realpath(await mkdtemp(join(tmpdir(),'tron-security-vite-')));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const files=['.env','.env.local','.npmrc','.yarnrc.yml','private.key','private.p12','private.pfx','private.cer','private.der','private.crt','private.pem','.git/config','nested/.npmrc','nested/private.key','credentials/key.txt','.local/state.json','.dev.vars','.wrangler/config.json'];
 for(const file of files){const path=join(root,file);await mkdir(join(path,'..'),{recursive:true});await writeFile(path,'PRIVATE-TEST-FIXTURE');}
 await writeFile(join(root,'visible.txt'),'PUBLIC-TEST-FIXTURE');
 const server=await createServer({configFile:false,root,logLevel:'silent',server:{host:'127.0.0.1',port:0,hmr:false,watch:null,fs:{deny,allow:[root]}}});
 t.after(()=>server.close());await server.listen();
 const base=`http://127.0.0.1:${server.httpServer.address().port}`;
 assert.equal(await(await fetch(base+'/visible.txt')).text(),'PUBLIC-TEST-FIXTURE');
 for(const file of files){const response=await fetch(base+'/'+file);assert.equal(response.status,403,file);assert(!(await response.text()).includes('PRIVATE-TEST-FIXTURE'),file);}
});
