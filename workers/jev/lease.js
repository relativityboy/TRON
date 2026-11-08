import {PUBLIC_LIMITS} from './budget.js';

// Keep the concurrency slot while the provider response (including its body) is
// in use. Losing budget storage aborts the call rather than silently losing its slot.
export async function withBudgetLease(budget,lease,operation){
 const controller=new AbortController();let timer,renewal,stopped=false;
 const schedule=()=>{timer=setTimeout(()=>{renewal=renew();},PUBLIC_LIMITS.leaseRenewIntervalMs);};
 async function renew(){
  try{
   const response=await budget.fetch('https://budget/renew',{method:'POST',body:JSON.stringify({lease}),signal:AbortSignal.timeout(PUBLIC_LIMITS.leaseRenewTimeoutMs)});
   if(!response.ok||!(await response.json()).ok)throw Error('AI budget lease unavailable');
   if(!stopped)schedule();
  }catch{controller.abort(new DOMException('AI budget lease unavailable','AbortError'));}
 }
 schedule();
 try{const result=await operation(controller.signal);controller.signal.throwIfAborted();return result;}
 finally{stopped=true;clearTimeout(timer);await renewal;}
}
