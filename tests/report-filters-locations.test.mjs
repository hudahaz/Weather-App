import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {recordsForDay,currentOperations,operationsForDay} from '../public/history-core.mjs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const script=html.match(/<script>const POS_DATA=[\s\S]*?<\/script>/)[0].slice(8,-9);
const context=vm.createContext({padPostcode:n=>String(n).padStart(5,'0')});
vm.runInContext(readFileSync(new URL('../public/report-tools.js',import.meta.url),'utf8'),context);
vm.runInContext(script.slice(script.indexOf('function postcodeChoices'),script.indexOf('window.POS_DATA=POS_DATA;')),context);
const branches=[{name:'Kangar (PLC)',state:'Perlis',office_type:'PLC'}],ranges=[{branch:'Kangar (PLC)',postcode_from:1000,postcode_to:1000}];
const input={branch:'Kangar (PLC)',state:'Perlis',postcode:'01000',report_date:'2026-11-04',status:'active',remarks:'Banjir',poslaju:'1',posdaftar:'2',mel:'3',location_bits:[{location:'Kg Bukit Kecil',bit:'10'},{location:'Kg Telok Batu 5',bit:'25'}]};
const plain=x=>JSON.parse(JSON.stringify(x));
test('location BIT pairs survive validation, storage serialization and edit reconstruction',()=>{
 const row=context.validateReport(input,branches,ranges),saved=plain(row);
 assert.deepEqual(saved.location_bits,input.location_bits);assert.equal(saved.bit,'Pelbagai BIT');assert.deepEqual(saved.locations,input.location_bits.map(p=>p.location));
 assert.deepEqual(plain(context.PosRadar.locationPairs(saved)),input.location_bits);assert.equal(saved.poslaju+saved.posdaftar+saved.mel,6);
 assert.match(context.PosRadar.pairText(saved),/Kg Telok Batu 5 — BIT 25/);
});
test('missing, oversized and duplicate location entries are rejected',()=>{
 for(const location_bits of [[],[{location:'Town',bit:''}],[{location:'',bit:'10'}],[{location:'Town',bit:'x'.repeat(101)}],[{location:'Town',bit:'10'},{location:' town ',bit:'25'}]])assert.throws(()=>context.validateReport({...input,location_bits},branches,ranges));
});
test('legacy reports keep their original BIT for each editable location',()=>{
 const legacy={locations:['A','B'],bit:'10'};assert.deepEqual(plain(context.PosRadar.locationPairs(legacy)),[{location:'A',bit:'10'},{location:'B',bit:'10'}]);
 const row=context.validateReport({...input,...legacy,location_bits:undefined},branches,ranges);assert.equal(row.bit,'10');assert.equal(row.location_bits.length,2);
});
test('multi-state selection uses OR, reset includes all, and CSV selection searches location BIT',()=>{
 vm.runInContext('let reports='+JSON.stringify([{...input,id:'a',locations:['Kg Telok Batu 5'],bit:'Pelbagai BIT'},{...input,id:'b',state:'Kedah',locations:['Town']},{...input,id:'c',state:'Johor',locations:['Town']}])+';',context);
 vm.runInContext(script.slice(script.indexOf('function dateRangeError'),script.indexOf('function filteredReports')),context);
 assert.deepEqual(plain(context.selectReports({state:['Perlis','Kedah']})).map(r=>r.id),['a','b']);assert.equal(context.selectReports({state:[]}).length,3);
 assert.equal(context.selectReports({state:['Perlis'],text:'25'}).length,1);
});
test('historical and active operations support multiple selected states',()=>{
 const reports=['Perlis','Kedah','Johor'].map(state=>({state,status:'active',report_date:'2026-11-04'}));
 assert.equal(currentOperations(reports,'2026-11-04',['Perlis','Kedah']).length,2);
 assert.equal(operationsForDay(reports,'2027-11-04',['Perlis','Kedah']).length,2);
 const records=reports.map(r=>({...r,date_basis:'observation_date',observation_date:'2026-11-04'}));assert.equal(recordsForDay(records,'2027-11-04',['Perlis','Kedah']).length,2);
});
test('view filters do not widen staff or manager edit permissions',()=>{
 assert.equal(context.canEdit({active:true,role:'staff',branch:'Other'},input),false);
 assert.equal(context.canEdit({active:true,role:'manager',access_states:['Kedah']},input),false);
 assert.equal(context.canEdit({active:true,role:'admin'},input),true);
});
