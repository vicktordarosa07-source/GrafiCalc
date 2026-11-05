const assert=require("node:assert/strict");
const {createHash}=require("node:crypto");
const {spawn}=require("node:child_process");
const {setTimeout:delay}=require("node:timers/promises");
const PORT=3218;
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(PORT)],{
  cwd:process.cwd(),stdio:["ignore","pipe","pipe"],
  env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:"",SUPABASE_URL:"",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"",SUPABASE_PUBLISHABLE_KEY:"",CRON_SECRET:""}
});
let logs="";
server.stderr.on("data",c=>{logs+=c.toString()});
server.stdout.on("data",c=>{logs+=c.toString()});
async function request(path) {
  return fetch("http://127.0.0.1:"+PORT+path,{redirect:"manual",signal:AbortSignal.timeout(3000)});
}
function assertNonceHtml(response,html,label){
  assert.equal(response.status,200,`${label} must remain publicly reachable`);
  const csp=response.headers.get("content-security-policy")||"";
  const nonceMatch=csp.match(/'nonce-([^']+)'/);
  assert.ok(nonceMatch,`${label} must have a nonce-based CSP`);
  assert.doesNotMatch(csp,/unsafe-inline/,`${label} production CSP must not allow arbitrary inline scripts or styles`);
  const logoStyleHash=createHash("sha256").update("color:transparent","utf8").digest("base64");
  const stylePolicy=csp.split(";").find((directive)=>directive.trim().startsWith("style-src"))||"";
  assert.ok(stylePolicy.includes("'unsafe-hashes'")&&stylePolicy.includes(`'sha256-${logoStyleHash}'`),"CSP must allow only the exact Next Image fallback style");
  const scriptTags=[...html.matchAll(/<script\b[^>]*>/g)].map((match)=>match[0]);
  assert.ok(scriptTags.length>0,`${label} should include Next.js scripts`);
  assert.ok(scriptTags.every((tag)=>tag.includes(`nonce="${nonceMatch[1]}"`)),`${label} scripts must use the nonce from the CSP`);
  const styleTags=[...html.matchAll(/<style\b[^>]*>/g)].map((match)=>match[0]);
  assert.ok(styleTags.every((tag)=>tag.includes(`nonce="${nonceMatch[1]}"`)),`${label} style blocks must use the nonce from the CSP`);
  const inlineStyleAttributes=[...html.matchAll(/\sstyle="([^"]*)"/g)].map((match)=>match[1]);
  assert.ok(inlineStyleAttributes.every((value)=>value==="color:transparent"),`${label} contains an inline style outside the single hashed Next Image fallback`);
  return nonceMatch[1];
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
    const loginHtml=await login.text();
    assert.match(loginHtml,/GrafiCalc/i);
    assert.match(loginHtml,/área de trabalho/i,"login copy should use correct Portuguese accents");
    const firstNonce=assertNonceHtml(login,loginHtml,"/entrar");
    const secondLogin=await request("/entrar");
    const secondNonce=assertNonceHtml(secondLogin,await secondLogin.text(),"second /entrar response");
    assert.notEqual(secondNonce,firstNonce,"each HTML response must receive a fresh nonce");
    for(const route of ["/cadastro","/recuperar-senha","/confirmar-email"]){
      const page=await request(route);
      assertNonceHtml(page,await page.text(),route);
    }
    const blocked=await request("/api/shared-state");
    assert.equal(blocked.status,503,"private API must fail closed with no Supabase");
    const legacy=await request("/legacy/index.html");
    assert.equal(legacy.status,307,"legacy workspace must not be public");
    assert.match(legacy.headers.get("location")||"",/\/entrar/);
    const health=await request("/api/auth/health");
    assert.equal(health.status,503,"health must detect unavailable Supabase");
    const worker=await request("/api/billing/worker");
    assert.equal(worker.status,503,"billing worker must fail closed without its cron secret");
    assert.deepEqual(await worker.json(),{ok:false,error:"worker-not-configured"},"the request must reach the worker's CRON_SECRET check instead of being intercepted by the user-session proxy");
    console.log("Next smoke: nonce CSP passed on public auth pages; unauthenticated workspace protected; health and billing worker fail closed");
  }finally{
    if(server.exitCode===null)server.kill("SIGTERM");
  }
})().catch(e=>{console.error(e);process.exitCode=1});
