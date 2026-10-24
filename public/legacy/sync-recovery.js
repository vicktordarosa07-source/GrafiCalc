/* Deterministic, no-overwrite three-way reconciliation. */
(function(root){
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const list=a=>Array.isArray(a)?a:[];
  function reconcileRecords(base,local,remote){
    const old=new Map(list(base).map(r=>[r?.id,r]));
    const mine=new Map(list(local).map(r=>[r?.id,r]));
    const theirs=new Map(list(remote).map(r=>[r?.id,r]));
    const ids=new Set([...old.keys(),...mine.keys(),...theirs.keys()]);
    const merged=[],conflicts=[];
    for(const id of ids){
      if(typeof id!=="string"||!id){conflicts.push(String(id));continue}
      const b=old.get(id),l=mine.get(id),r=theirs.get(id);
      let chosen;
      if(eq(l,b))chosen=r;
      else if(eq(r,b)||eq(l,r))chosen=l;
      else{conflicts.push(id);continue}
      if(chosen!==undefined)merged.push(chosen);
    }
    return {records:merged,conflicts};
  }
  function reconcileShared(base={},local={},remote={}){
    const sharedState={},conflicts=[];
    for(const key of ["clients","quoteHistory","workOrders"]){
      const part=reconcileRecords(base[key],local[key],remote[key]);
      sharedState[key]=part.records;
      conflicts.push(...part.conflicts.map(id=>key+":"+id));
    }
    return {sharedState,conflicts};
  }
  const api={reconcileRecords,reconcileShared};
  root.GrafiCalcSyncRecovery=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
