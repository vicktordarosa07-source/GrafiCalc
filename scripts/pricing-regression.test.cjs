const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"..","app.mjs"),"utf8");
function extract(name){
  const start=source.indexOf("function "+name+"(");
  assert.ok(start>=0, name+" exists");
  const end=source.indexOf("\nfunction ",start+10);
  assert.ok(end>start,name+" boundary");
  return source.slice(start,end);
}
const ctx={console,
  getLinearMeterCatalog:()=>[{id:"banner",label:"Banner",widthLabel:"1,50 m",rate:20,minimumOrder:30}],
  normalizeDiscountValue:v=>Math.max(0,Number(v||0)),
  normalizeDiscountType:v=>v==="%"?"%":"R$",
  toDecimalNumber:v=>Number(v||0),
  toWholeNumber:v=>Math.trunc(Number(v||0)),
  toMoneyNumber:v=>Math.max(0,Number(v||0)),
};
vm.createContext(ctx);
vm.runInContext(extract("calculateDiscount")+"\n"+extract("calculateLinearMeterRow"),ctx);
assert.equal(ctx.calculateDiscount(100,{discountType:"%",discountValue:20}).totalAfterDiscount,80);
assert.equal(ctx.calculateDiscount(100,{discountType:"%",discountValue:150}).totalAfterDiscount,0);
assert.equal(ctx.calculateDiscount(100,{discountType:"R$",discountValue:130}).totalAfterDiscount,0);
assert.equal(ctx.calculateDiscount(100,{discountType:"R$",discountValue:15}).discountAmount,15);
const row=(widthCm,heightCm,quantity,extra={})=>({widthCm,heightCm,quantity,productType:"banner",discountType:"R$",discountValue:0,artCreationFee:0,...extra});
const cfg={linearMeterPricing:{}};
const a=ctx.calculateLinearMeterRow(row(50,100,3),0,cfg);
assert.equal(a.columns,3);assert.equal(a.linearMeters,1);assert.equal(a.baseTotal,30);
const b=ctx.calculateLinearMeterRow(row(200,100,3),0,cfg);
assert.equal(b.rotated,true);assert.equal(b.linearMeters,6);assert.equal(b.baseTotal,120);
const c=ctx.calculateLinearMeterRow(row(200,200,3),0,cfg);
assert.equal(c.valid,false);assert.ok(c.warning.includes("não cabe"));
console.log("pricing-regression: production discount and linear-meter formulas passed");
