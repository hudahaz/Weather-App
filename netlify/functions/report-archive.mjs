import JSZip from 'jszip';

const URL_DEFAULT='https://orbevdrvkmnddkzuqiuj.supabase.co';
const PUBLIC_DEFAULT='sb_publishable_5ybYDImMD1M_5JoHVhCOJg_QM388v0X';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function createHandler({env=process.env,request=fetch}={}){
 return async req=>{
  try{
   if(!['GET','POST'].includes(req.method))return reply({error:'Kaedah tidak dibenarkan.'},405);
   const origin=req.headers.get('origin');
   if(origin&&origin!==new URL(req.url).origin)return reply({error:'Permintaan tidak dibenarkan.'},403);
   const token=req.headers.get('authorization');
   if(!/^Bearer [^\s]+$/i.test(token||''))return reply({error:'Sila log masuk sebagai admin.'},401);
   const root=(env.SUPABASE_URL||URL_DEFAULT).replace(/\/$/,'');
   const pub=env.SUPABASE_PUBLISHABLE_KEY||PUBLIC_DEFAULT;
   const secret=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
   if(!secret)return reply({error:'Tetapkan SUPABASE_SECRET_KEY dalam Netlify.'},503);
   async function api(path,{method='GET',body,caller=false}={}){
    const headers={apikey:caller?pub:secret,Authorization:caller?token:'Bearer '+secret};
    if(body!==undefined)headers['Content-Type']='application/json';
    const res=await request(root+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)}),redirect:'error',signal:AbortSignal.timeout(20000)});
    return res;
   }
   const identity=await api('/auth/v1/user',{caller:true});
   if(!identity.ok)return reply({error:'Sesi tamat; log masuk semula.'},401);
   const user=await identity.json();
   if(!user?.id)return reply({error:'Pengguna tidak sah.'},401);
   const profileRes=await api('/rest/v1/report_profiles?id=eq.'+encodeURIComponent(user.id)+'&select=role,active');
   if(!profileRes.ok)return reply({error:'Tidak dapat mengesahkan peranan.'},503);
   const profile=(await profileRes.json())?.[0];
   if(profile?.role!=='admin'||profile.active!==true)return reply({error:'Pentadbir sahaja.'},403);

   const action=new URL(req.url).searchParams.get('action')||'summary';
   async function reportPages(){
    const rows=[];
    for(let start=0;start<20000;start+=1000){
     const response=await api('/rest/v1/operation_reports?select=*&order=id.asc&limit=1000&offset='+start);
     if(!response.ok)throw Error('Laporan tidak dapat dibaca.');
     const batch=await response.json();rows.push(...batch);
     if(batch.length<1000)return rows;
    }
    throw Error('Had arkib 20,000 rekod dicapai; pecahkan arkib kepada beberapa bahagian.');
   }
   async function storageSummary(){
    let offset=0,count=0,bytes=0;
    while(offset<20000){
     const response=await api('/storage/v1/object/list/report-photos',{method:'POST',body:{prefix:'',limit:1000,offset,sortBy:{column:'name',order:'asc'}}});
     if(!response.ok)throw Error('Penggunaan storan gambar tidak tersedia.');
     const items=await response.json();
     for(const item of items){if(item.id){count++;bytes+=Number(item.metadata?.size||0);}}
     if(items.length<1000)break;
     offset+=1000;
    }
    return {count,bytes,estimate:true,scope:'report-photos'};
   }
   if(req.method==='GET'&&action==='summary'){
    const [rows,storage]=await Promise.all([reportPages(),storageSummary()]);
    return reply({reports:rows.length,active:rows.filter(r=>r.status==='active').length,resolved:rows.filter(r=>r.status==='resolved').length,photos:rows.filter(r=>r.photo_path).length,storage});
   }
   if(req.method==='GET'&&action==='download'){
    const rows=await reportPages();
    const photos=rows.filter(r=>r.photo_path);
    if(photos.length>250)return reply({error:'Lebih 250 gambar: arkib terlalu besar. Hubungi pentadbir untuk arkib berperingkat.'},413);
    const zip=new JSZip();
    const json=JSON.stringify({exported_at:new Date().toISOString(),report_count:rows.length,photo_count:photos.length,rows},null,2);
    zip.file('laporan-operasi.json',json);
    const csvHeaders=['id','report_date','status','state','branch','postcode','locations','bit','location_bits','poslaju','posdaftar','mel','remarks','photo_path','updated_at'];
    const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
    zip.file('laporan-operasi.csv','\ufeff'+[csvHeaders,...rows.map(r=>csvHeaders.map(k=>r[k]!=null&&typeof r[k]==='object'?JSON.stringify(r[k]):r[k]))].map(row=>row.map(cell).join(',')).join('\r\n'));
    let bytes=0;
    for(const row of photos){
     const path=row.photo_path;
     if(typeof path!=='string'||!new RegExp('^'+row.id+'/[0-9a-f-]+\\.(jpg|jpeg|png|webp)$','i').test(path))throw Error('Laluan gambar tidak sah: '+row.id);
     const response=await api('/storage/v1/object/report-photos/'+path.split('/').map(encodeURIComponent).join('/'));
     if(!response.ok)throw Error('Gambar tidak berjaya dimuat turun: '+row.id);
     const data=new Uint8Array(await response.arrayBuffer());bytes+=data.byteLength;
     if(bytes>80*1024*1024)throw Error('Gambar melebihi 80 MB; arkib perlu dibahagikan.');
     zip.file('gambar/'+path,data);
    }
    const output=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:3}});
    return new Response(output,{status:200,headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="pos-radar-archive.zip"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
   }
   if(req.method==='POST'&&action==='cleanup'){
    const raw=await req.text();
    if(Buffer.byteLength(raw)>500000)return reply({error:'Permintaan terlalu besar.'},413);
    let body;try{body=JSON.parse(raw);}catch{return reply({error:'Data tidak sah.'},400);}
    if(body?.confirm!=='PADAM GAMBAR SELESAI'||body?.archiveDownloaded!==true)return reply({error:'Muat turun dan sahkan arkib sebelum pemadaman.'},400);
    const rows=await reportPages(),candidates=rows.filter(r=>r.status==='resolved'&&r.photo_path);
    if(candidates.length>250)return reply({error:'Lebih 250 gambar selesai. Sila arkibkan secara berperingkat.'},413);
    const result={deleted:0,failed:[],total:candidates.length};
    for(const r of candidates){
     if(!new RegExp('^'+r.id+'/[0-9a-f-]+\\.(jpg|jpeg|png|webp)$','i').test(r.photo_path)){result.failed.push(r.id);continue;}
     // Conditional update prevents changing a report that another user has edited.
     const query='/rest/v1/operation_reports?id=eq.'+r.id+'&status=eq.resolved&version=eq.'+r.version+'&photo_path=eq.'+encodeURIComponent(r.photo_path);
     const response=await api(query,{method:'PATCH',body:{photo_path:null}});
     if(!response.ok){result.failed.push(r.id);continue;}
     const removed=await api('/storage/v1/object/report-photos',{method:'DELETE',body:{prefixes:[r.photo_path]}});
     if(removed.ok)result.deleted++;else result.failed.push(r.id+' (storage cleanup)');
    }
    return reply(result);
   }
   return reply({error:'Tindakan tidak dikenali.'},404);
  }catch(e){return reply({error:e?.message||'Arkib tidak tersedia.'},503);}
 };
}
export default createHandler();
export const config={path:'/api/report-archive'};
