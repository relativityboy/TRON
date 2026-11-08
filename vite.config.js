import {sceneStudioPlugin} from './server/scene-studio.js';
import {wallStudioPlugin} from './server/wall-studio.js';
import {recoveryPlugin} from './tools/build/recovery.js';
import {publicAssetPlugin} from './tools/build/public-assets.js';
import {assetCompatibilityPlugin} from './server/asset-compat.js';
import {multiplayerPlugin} from './server/multiplayer.js';
import {defineConfig,loadEnv} from 'vite';
import {jevPlugin} from './server/jev.js';
import {mcpPlugin} from './server/mcp.js';
// Keep play sessions intact while files change; refresh explicitly to try edits.
const liveReload=process.env.TRON_HMR==='1';
// Vite replaces fs.deny rather than extending it. Keep all upstream defaults;
// the regression test compares this list with the installed Vite defaults.
const defaultSensitiveFiles=['.env','.env.*','*.{crt,pem,key,p12,pfx,cer,der}','.npmrc','.yarnrc.yml','**/.git/**'];
const projectSensitiveFiles=['**/.local/**','**/.env','**/.env.*','**/credentials/**','**/.dev.vars*','**/.wrangler/**'];
export default defineConfig(({mode})=>({plugins:[wallStudioPlugin(),sceneStudioPlugin(),recoveryPlugin(),publicAssetPlugin(),assetCompatibilityPlugin(),multiplayerPlugin(),jevPlugin(loadEnv(mode,process.cwd(),'')),mcpPlugin(loadEnv(mode,process.cwd(),''))],base:'./',server:{hmr:liveReload,fs:{deny:[...defaultSensitiveFiles,...projectSensitiveFiles]}},build:{rollupOptions:{preserveEntrySignatures:'strict',output:{entryFileNames:chunk=>chunk.name==='bitPlay'?'src/analytics/bit-play.js':'assets/[name]-[hash].js'},input:{bitPlay:'src/analytics/bit-play.js',game:'index.html',mcp:'mcp.html',audio:'audio.html',carrier:'carrier.html',raycastCycle:'raycast-cycle.html'}}}}));
