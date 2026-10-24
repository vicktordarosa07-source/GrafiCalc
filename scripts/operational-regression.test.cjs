const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname,"..","app.mjs"),"utf8");
function extract(name,indent=""){
  const marker=indent+"function "+name+"(";
  const first=source.indexOf(marker);
  assert.ok(first>=0,"missing function "+name);
  const closing="\n"+indent+"}";
  const end=source.indexOf(closing,first+marker.length);
  assert.ok(end>first,"function boundary "+name);
  return source.slice(first,end+closing.length);
}
const currency=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v||0));
const esc=v=>String(v||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const ctx={console, Intl,Date,formatCurrency:currency,formatInteger:String,
  buildColorQuoteDetail:()=>"100 un.",getDiscountQuoteDetail:()=>"",
  escapeHtml:esc,escapeAttribute:esc,
  document:{getElementById:()=>({innerHTML:"<div>LOGO</div>"})},
};
vm.createContext(ctx);
vm.runInContext([
  extract("createQuoteEntries"),
  extract("createQuoteHtml"),
  extract("createQuoteText"),
  extract("syncQuoteStatusFromWorkOrder","  ")
].join("\n"),ctx);
const empty=()=>({activeRows:[],totals:{totalGeneral:0,totalQuantity:0}});
const blackWhite=empty(),colored=empty(),credentials=empty(),m2=empty(),ready=empty(),resin=empty();
colored.activeRows=[{description:"Cartaz colorido",productLabel:"Cartaz",total:125,internalCost:90}];
colored.totals.totalQuantity=100;
const state={
  company:{name:"Gráfica <exemplo>",cnpj:"00.000.000/0001-00",address:"Rua 1",contact:"Contato",logoDataUrl:""},
  client:{name:"Cliente <script>",contact:"(00) 99999-9999",cnpj:"123",personType:"individual"},
  paymentTerms:"30 dias",quoteNotes:"",freeQuoteItems:[],
  quoteHistory:[{id:"q1",status:"pending"}]
};
const text=ctx.createQuoteText(state,blackWhite,colored,credentials,m2,ready,resin);
assert.match(text,/Cartaz colorido/);
assert.match(text,/Total geral: R\$\s*125,00/);
assert.doesNotMatch(text,/Total geral: R\$\s*0,00/);
const html=ctx.createQuoteHtml(state,blackWhite,colored,credentials,m2,ready,resin);
assert.match(html,/R\$\s*125,00/);
assert.ok(!html.includes("internalCost"));
assert.ok(!html.includes("<script>"));
assert.ok(html.includes("&lt;script&gt;"));
ctx.state=state;
const q=state.quoteHistory[0];
ctx.syncQuoteStatusFromWorkOrder({quoteId:"q1",id:"os1",status:"delivered"});
assert.equal(q.status,"completed");assert.equal(q.osId,"os1");
ctx.syncQuoteStatusFromWorkOrder({quoteId:"q1",id:"os1",status:"cancelled"});
assert.equal(q.status,"cancelled");
ctx.syncQuoteStatusFromWorkOrder({quoteId:"q1",id:"os1",status:"created"});
assert.equal(q.status,"converted");
console.log("operational-regression: quote text totals, client HTML and OS status passed");
