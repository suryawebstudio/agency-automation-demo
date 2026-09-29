import React,{useMemo,useRef,useState} from 'react';
import {supabase} from './supabase';

const ALIASES={
 name:['name','full name','fullname','contact name','contact'],
 company:['company','company name','business','business name','organization'],
 email:['email','email address','e-mail'],
 phone:['phone','phone number','mobile','mobile number','telephone'],
 website:['website','website url','url','site'],
 industry:['industry','sector','vertical'],
 service:['service','required service','required_service','services'],
 budget:['budget','budget range','estimated budget'],
 timeline:['timeline','time line','project timeline'],
 message:['message','requirement','requirements','notes','note','description']
};

function clean(v){return String(v??'').trim()}
function normalizeHeader(v){return clean(v).toLowerCase().replace(/[_-]+/g,' ').replace(/\s+/g,' ')}
function parseCsv(text){
 const rows=[];let row=[];let cell='';let quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){
   if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted;
  }else if(c===','&&!quoted){row.push(cell);cell=''}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);cell='';if(row.some(x=>clean(x)))rows.push(row);row=[]}
  else cell+=c;
 }
 if(cell.length||row.length){row.push(cell);if(row.some(x=>clean(x)))rows.push(row)}
 if(rows.length<2)return [];
 const headers=rows[0].map(normalizeHeader);
 return rows.slice(1).map(values=>{const raw={};headers.forEach((h,i)=>raw[h]=clean(values[i]));const out={};Object.entries(ALIASES).forEach(([field,names])=>{const key=headers.find(h=>names.includes(h));if(key)out[field]=raw[key]||''});return out}).filter(r=>Object.values(r).some(Boolean));
}
function scoreLead(f){let s=0;if(f.service)s+=20;if(f.budget&&f.budget.toLowerCase()!=='unknown')s+=25;if(f.timeline==='2 weeks')s+=30;else if(f.timeline==='1 month')s+=20;else if(f.timeline==='3 months')s+=10;if(f.company)s+=10;if((f.message||'').length>20)s+=7;return Math.min(100,s)}
function priority(score){return score>=80?'hot':score>=55?'warm':'cold'}

export default function BulkImport({existingLeads,onImported}){
 const [open,setOpen]=useState(false);const [rows,setRows]=useState([]);const [raw,setRaw]=useState('');const [busy,setBusy]=useState(false);const [result,setResult]=useState('');const [error,setError]=useState('');const fileRef=useRef(null);
 const duplicates=useMemo(()=>{const emails=new Set(existingLeads.map(x=>clean(x.email).toLowerCase()).filter(Boolean));const phones=new Set(existingLeads.map(x=>clean(x.phone)).filter(Boolean));const seenEmail=new Set();const seenPhone=new Set();let count=0;const valid=rows.map(r=>{const email=clean(r.email).toLowerCase(),phone=clean(r.phone);const duplicate=(email&&(emails.has(email)||seenEmail.has(email)))||(phone&&(phones.has(phone)||seenPhone.has(phone)));if(duplicate)count++;if(email)seenEmail.add(email);if(phone)seenPhone.add(phone);return {...r,_duplicate:!!duplicate}});return {valid, count}},[rows,existingLeads]);
 const openImport=()=>{setOpen(true);setRows([]);setRaw('');setResult('');setError('')};
 const loadText=text=>{setRaw(text);setRows(parseCsv(text));setError('');setResult('')};
 const handleFile=e=>{const file=e.target.files?.[0];if(!file)return;if(!file.name.toLowerCase().endsWith('.csv')){setError('Please upload a CSV file.');return}const reader=new FileReader();reader.onload=()=>loadText(String(reader.result||''));reader.readAsText(file);e.target.value=''};
 const importLeads=async()=>{setError('');setResult('');const toImport=duplicates.valid.filter(r=>!r._duplicate&&r.email);if(!toImport.length){setError('No new valid leads to import. Each lead needs an email address.');return}setBusy(true);const payload=toImport.map(f=>{const score=scoreLead(f);return {name:f.name||'Unknown',company:f.company||'Unknown',email:f.email,phone:f.phone||null,website:f.website||null,industry:f.industry||null,service:f.service||null,budget:f.budget||null,timeline:f.timeline||null,source:'Bulk import',lead_score:score,priority:priority(score),summary:f.message||null,status:'new'}});let inserted=0;try{for(let i=0;i<payload.length;i+=100){const {error}=await supabase.from('leads').insert(payload.slice(i,i+100));if(error)throw error;inserted+=Math.min(100,payload.length-i)}setResult(`${inserted} leads imported successfully. ${duplicates.count} duplicate rows skipped.`);setRows([]);setRaw('');await onImported()}catch(e){setError(e.message||'Import failed. No further batches were processed.')}finally{setBusy(false)}};
 const downloadTemplate=()=>{const csv='name,company,email,phone,website,industry,service,budget,timeline,message\nJohn Smith,Acme Inc,john@example.com,+123456789,https://example.com,Real Estate,Web Development,5000,1 month,Needs a new company website\n';const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='lead-import-template.csv';a.click();URL.revokeObjectURL(url)};
 return <>
  <button className="primary small" onClick={openImport}>Import Leads</button>
  {open&&<div className="overlay" onClick={()=>!busy&&setOpen(false)}><div className="modal import-modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>!busy&&setOpen(false)}>×</button><span className="eyebrow">BULK LEAD IMPORT</span><h2>Import a list of leads</h2><p>Upload a CSV exported from your scraper, preview it, then import it securely into Supabase.</p>
   <div className="import-actions"><button className="primary" onClick={()=>fileRef.current?.click()}>Choose CSV</button><button className="secondary" onClick={downloadTemplate}>Download template</button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={handleFile}/></div>
   <textarea className="paste-area" placeholder="Or paste CSV data here…\nname,company,email,phone,website,industry,service,budget,timeline,message" value={raw} onChange={e=>loadText(e.target.value)}/>
   {rows.length>0&&<div className="import-summary"><b>{rows.length} rows detected</b><span>{duplicates.count} duplicates will be skipped</span><span>{duplicates.valid.filter(r=>!r._duplicate&&r.email).length} ready to import</span></div>}
   {rows.length>0&&<div className="import-preview"><div className="preview-head"><span>Name</span><span>Company</span><span>Email</span><span>Service</span></div>{duplicates.valid.slice(0,8).map((r,i)=><div className={r._duplicate?'preview-row duplicate':'preview-row'} key={i}><span>{r.name||'—'}</span><span>{r.company||'—'}</span><span>{r.email||'—'}</span><span>{r.service||'—'}</span></div>)}{rows.length>8&&<small>Showing first 8 rows.</small>}</div>}
   {error&&<div className="error import-message">{error}</div>}{result&&<div className="success import-message">{result}</div>}
   <button className="primary full" disabled={busy||!rows.length} onClick={importLeads}>{busy?'Importing…':'Import leads →'}</button>
  </div></div>}
 </>
}
