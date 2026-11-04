(function(root){
 const states=value=>[...new Set((Array.isArray(value)?value:[value]).filter(Boolean))];
 const matchesState=(state,selection)=>!states(selection).length||states(selection).some(s=>s.toLowerCase()===String(state||'').toLowerCase());
 const getStates=select=>Array.from(select.selectedOptions).map(o=>o.value).filter(Boolean);
 function setStates(select,value){const chosen=states(value);for(const o of select.options)o.selected=chosen.includes(o.value);select._refreshStates?.();}
 function mountStates(select){
  if(select._refreshStates)return;select.multiple=true;select.hidden=true;
  const box=document.createElement('details'),title=document.createElement('summary'),list=document.createElement('div');box.className='state-picker';box.append(title,list);select.after(box);
  title.setAttribute('aria-label',select.getAttribute('aria-label')||'Tapis negeri');
  function render(){title.textContent=getStates(select).join(', ')||'Semua negeri';list.replaceChildren();
   const reset=document.createElement('button');reset.type='button';reset.textContent='Semua negeri / Reset';reset.onclick=()=>{setStates(select,[]);select.dispatchEvent(new Event('change',{bubbles:true}));};list.append(reset);
   for(const o of select.options){if(!o.value)continue;const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=o.selected;check.onchange=()=>{o.selected=check.checked;title.textContent=getStates(select).join(', ')||'Semua negeri';select.dispatchEvent(new Event('change',{bubbles:true}));};label.append(check,document.createTextNode(o.text));list.append(label);}
  }
  select._refreshStates=render;new MutationObserver(render).observe(select,{childList:true});select.addEventListener('change',render);render();
  document.addEventListener('click',ev=>{if(!box.contains(ev.target))box.open=false;});box.addEventListener('keydown',ev=>{if(ev.key==='Escape'){box.open=false;title.focus();}});
 }
 const locationPairs=report=>Array.isArray(report.location_bits)?report.location_bits.map(p=>({...p})):(report.locations||[]).map(location=>({location,bit:report.bit||''}));
 const pairText=report=>locationPairs(report).map(p=>p.location+' — BIT '+p.bit).join('; ');
 root.PosRadar={states,matchesState,getStates,setStates,mountStates,locationPairs,pairText};
})(globalThis);
