const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const {setTimeout:delay}=require("node:timers/promises");
const PORT=3218;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(PORT)],{
  cwd:process.cwd(),stdio:["ignore","pipe","pipe"],
  env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:"",SUPABASE_URL:"",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"",SUPABASE_PUBLISHABLE_KEY:""}
});
let logs="";
server.stderr.on("data",c=>{logs+=c.toString()});
server.stdout.on("data",c=>{logs+=c.toString()});
async function request(path) {
  return fetch("http://127.0.0.1:"+PORT+path,{redirect:"manual",signal:AbortSignal.timeout(3000)});
}
(async()=>{
  try{
    let login=null;
    for(let i=0;i<30;i++){
      if(server.exitCode!==null)throw new Error("Next exited: "+logs.slice(-600));
      try{login=await request("/entrar");break}catch{await delay(400)}
    }
    assert.ok(login,"Next server unavailable");
    assert.equal(login.status,200,"public login must remain reachable");
    assert.match(await login.text(),/GrafiCalc/i);
    const blocked=await request("/api/shared-state");
    assert.equal(blocked.status,503,"private API must fail closed with no Supabase");
    const legacy=await request("/legacy/index.html");
    assert.equal(legacy.status,307,"legacy workspace must not be public");
    assert.match(legacy.headers.get("location")||"",/\/entrar/);
    const health=await request("/api/auth/health");
    assert.equal(health.status,503,"health must detect unavailable Supabase");
    console.log("Next smoke: login reachable; unauthenticated legacy and private API protected; health fails closed");
  }finally{
    if(server.exitCode===null)server.kill("SIGTERM");
  }
})().catch(e=>{console.error(e);process.exitCode=1});
