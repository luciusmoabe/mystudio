import { useState, useEffect, useMemo, useRef } from "react";
import { LayoutDashboard, Users, DollarSign, FileText, Kanban, Target, Package, Plus, Search, Edit2, Trash2, X, ArrowLeft, ChevronRight, Printer, Pen, Link, LogOut, Settings } from "lucide-react";
import { printContract, printSignedContract } from "./printUtils";
import { 
  fetchClientes, upsertCliente, deleteCliente, deleteContratosPorCliente,
  fetchContratos, upsertContrato, deleteContrato, 
  fetchLeads, upsertLead, deleteLead, 
  fetchDespesas, upsertDespesa, deleteDespesa, 
  fetchConfig, saveConfig,
  fetchServicosPortfolio, upsertServicoPortfolio, deleteServicoPortfolio,
  fetchFavorecidos, upsertFavorecido, deleteFavorecido
} from './db';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';

const C={bg:"#FAF8F5",sidebar:"#F2EDE6",card:"#FFF",border:"#EAE4DB",accent:"#C4A882",accentDk:"#9A7D5A",accentLt:"rgba(196,168,130,0.12)",text:"#3D3530",textSm:"#7A6E65",textXs:"#AFA49A"};
const ST={Confirmado:{bg:"#E6EFE7",color:"#3D6B42"},Pendente:{bg:"#F5EDD8",color:"#7A5A18"},"Concluído":{bg:"#E4EBF4",color:"#2F5480"},Cancelado:{bg:"#F2E6E6",color:"#7A3838"}};
const DEF_SRVS=["Newborn","Gestante","Baby","Batizado","Aniversário"];
const STATUS=["Pendente","Confirmado","Concluído","Cancelado"];
const ORIGENS=["Instagram","Google","Anúncio","Indicação","Site","Outros"];
const PGTOS=["Pix à vista","Pix parcelado","Cartão de crédito","Boleto"];
const CATS_DSP=["Software","Equipamento","Marketing","Material","Aluguel","Transporte","Alimentação","Impostos","Outros"];
const DEF_ETAPAS=[{id:"agendado",label:"Serviço agendado",color:"#7A5A18",bg:"#FDF8EE"},{id:"previa",label:"Aguardando prévia",color:"#2F5480",bg:"#E8EFF8"},{id:"edicao",label:"Em edição",color:"#5A3A7A",bg:"#F2EAF8"},{id:"galeria",label:"Galeria enviada",color:"#3D6B42",bg:"#E6EFE7"},{id:"selecao",label:"Aguardando seleção",color:"#7A3838",bg:"#F8EAEA"}];
const LEAD_ET=[{id:"contato",label:"Primeiro contato",color:"#5A3A7A",bg:"#F2EAF8",icon:"💬"},{id:"proposta",label:"Proposta enviada",color:"#2F5480",bg:"#E8EFF8",icon:"📋"},{id:"followup",label:"Follow up",color:"#7A5A18",bg:"#FDF8EE",icon:"🔔"},{id:"contrato",label:"Contrato enviado",color:"#9A7D5A",bg:"#F5EFE6",icon:"📄"},{id:"assinatura",label:"Aguard. assinatura",color:"#2D6B6B",bg:"#E4F2F2",icon:"✍️"},{id:"pagamento",label:"Aguard. pagamento",color:"#5A5A18",bg:"#F5F5E0",icon:"💰"},{id:"fechado",label:"Fechado ✅",color:"#3D6B42",bg:"#E6EFE7",icon:"✅"},{id:"perdido",label:"Não fechou ❌",color:"#7A3838",bg:"#F8EAEA",icon:"❌"}];
const COL_OPTS=[{color:"#7A5A18",bg:"#FDF8EE"},{color:"#2F5480",bg:"#E8EFF8"},{color:"#5A3A7A",bg:"#F2EAF8"},{color:"#3D6B42",bg:"#E6EFE7"},{color:"#7A3838",bg:"#F8EAEA"},{color:"#9A7D5A",bg:"#F5EFE6"},{color:"#2D6B6B",bg:"#E4F2F2"},{color:"#1E4D2B",bg:"#E0F0E6"}];

const LEAD_ET_ATIVOS = (le:any[]) => le.filter(e => e.id !== "perdido");
const PENULTIMA_LEAD_ID = (le:any[]) => {
  const active = LEAD_ET_ATIVOS(le);
  return active[active.length - 2]?.id;
};

const uid=()=>{
  if(typeof crypto!=='undefined'&&crypto.randomUUID){
    try{return crypto.randomUUID();}catch(_){}
  }
  // Fallback para contextos não-seguros (HTTP via IP)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
    const r=Math.random()*16|0;
    return(c==='x'?r:(r&0x3|0x8)).toString(16);
  });
};
const fmtD=d=>d?new Date(d+"T12:00:00").toLocaleDateString("pt-BR"):"—";
const fmtR=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtN=v=>Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2});
const todayS=()=>new Date().toISOString().slice(0,10);
const waLink=(tel,msg)=>"https://wa.me/55"+tel.replace(/\D/g,"")+"?text="+encodeURIComponent(msg);

const maskPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 10) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  return v.length > 0 ? `(${v}` : v;
};

const maskCPF = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  if (v.length > 6) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`;
  if (v.length > 3) return `${v.slice(0, 3)}.${v.slice(3)}`;
  return v;
};

const TPL_BASE=`CONTRATO DE PRESTAÇÃO DE SERVIÇOS FOTOGRÁFICOS\n\nCONTRATANTE: {nome_cliente}, {estado_civil}, {nacionalidade}, nascida em {nasc_cliente}, CPF {cpf_cliente}, residente em {endereco_cliente}. Contato: {telefone_cliente}.\nCONTRATADA: Brenda Monteiro Photography, CNPJ 32.241.811/0001-70, Brenda Santos Monteiro, CPF 062.645.595-20.\n\nCLÁUSULA 1ª — OBJETO\n{objeto}\n\nCLÁUSULA 2ª — ENTREGA\nPrévia em até 7 dias. Galeria para seleção em até 15 dias (prazo de 60 dias). Entrega final em até 20 dias após seleção.\n\nCLÁUSULA 3ª — REEDIÇÃO\nAjustes adicionais cobrados por fotografia, entrega em até 15 dias.\n\n{remarcacao}\n\nCLÁUSULA 5ª — PAGAMENTO\nValor: R$ {valor}. Sinal de 40% (R$ {entrada}) na adesão, restante em até 30 dias.\nForma de pagamento: {forma_pagamento}.\n\nCLÁUSULA 6ª — DIREITOS AUTORAIS\nImagens são propriedade intelectual da CONTRATADA (Lei 9.610/98 Art.79). A CONTRATANTE autoriza uso para portfólio e redes sociais.\n\nCLÁUSULA 7ª — ARMAZENAMENTO\nBackup mantido por 1 ano. Nova cópia: R$150,00.\n\nCLÁUSULA 8ª — CONDIÇÕES GERAIS\nPendências quitadas antes da entrega. Descumprimento: multa de 20%.\n\nCLÁUSULA 9ª — FORO\nComarca de Salvador — BA.\n\nDATA: {data_contrato}\nCONTRATANTE: {nome_cliente}\nCONTRATADA: Brenda Santos Monteiro / Brenda Monteiro Photography`;
const OBJETOS={Newborn:"Ensaio Newborn — Experiência {nome_experiencia}: {quantidade_fotos} fotos digitais, média 3-4h. Produção disponibilizada pela CONTRATADA.",Gestante:"Ensaio Gestante — Experiência {nome_experiencia}: {quantidade_fotos} fotos, duração {duracao}. Reunião Online com Brenda.",Baby:"Ensaio Baby — Experiência {nome_experiencia}: {quantidade_fotos} fotos, duração {duracao}. Reunião Online com Brenda.",Batizado:"Batizado — Experiência {nome_experiencia}: {quantidade_fotos} fotos, duração {duracao}.","Aniversário":"Aniversário — Experiência {nome_experiencia}: {quantidade_fotos} fotos, duração {duracao}."};
const REM_NWB="CLÁUSULA 4ª — REMARCAÇÕES (NEWBORN)\nAguardo de até 2h para realização. Remarcação: R$200,00 adicional. Rescisão: devolução com retenção de 20%. Remarcação com menos de 24h: multa de 10%.";
const REM_STD="CLÁUSULA 4ª — REMARCAÇÕES\nProdução (figurino, maquiagem) é responsabilidade da CONTRATANTE. Remarcação com menos de 24h: multa de 10%. Rescisão: devolução com retenção de 20%.";
const mkTpl=srv=>TPL_BASE.replace("{objeto}",OBJETOS[srv]||OBJETOS["Gestante"]).replace("{remarcacao}",srv==="Newborn"?REM_NWB:REM_STD);
const DEF_TPLS=Object.fromEntries(DEF_SRVS.map(s=>[s,mkTpl(s)]));
const fillTpl=(tpl,cl,ct)=>{const val=Number(ct?.val||0),ent=Number(ct?.ent||0);return tpl.replace(/{nome_cliente}/g,cl.nome||"").replace(/{cpf_cliente}/g,cl.cpf||"").replace(/{estado_civil}/g,cl.estadoCivil||"").replace(/{nacionalidade}/g,cl.nacionalidade||"").replace(/{nasc_cliente}/g,fmtD(cl.nasc)).replace(/{endereco_cliente}/g,cl.endereco||"").replace(/{telefone_cliente}/g,cl.tel||"").replace(/{nome_experiencia}/g,ct?.nomeExp||"").replace(/{quantidade_fotos}/g,ct?.qtdFotos||"").replace(/{duracao}/g,ct?.duracao||"").replace(/{valor}/g,fmtN(val)).replace(/{entrada}/g,fmtN(ent)).replace(/{saldo}/g,fmtN(val-ent)).replace(/{forma_pagamento}/g,ct?.formaPagamento||"Não informada").replace(/{data_sessao}/g,fmtD(ct?.ds)).replace(/{data_contrato}/g,fmtD(ct?.dc||todayS()));};

// Dados iniciais vazios para novos usuários SaaS (sem dados de exemplo)
const SC:any[]=[];
const SK:any[]=[];
const SL:any[]=[];

const IS={width:"100%",padding:"0.5rem 0.7rem",border:"1px solid "+C.border,borderRadius:7,fontSize:13,color:C.text,background:"#FDFBF8",outline:"none",boxSizing:"border-box"};
const Badge=({s})=><span style={{...ST[s],borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600}}>{s}</span>;
function Btn({children,onClick,variant="primary",sm,disabled}:{children:any,onClick?:any,variant?:string,sm?:any,disabled?:any}){const S:any={primary:{background:disabled?"#D8C9B4":C.accent,color:"#fff",border:"none"},secondary:{background:C.card,color:C.textSm,border:"1px solid "+C.border},danger:{background:"#FBF0EF",color:"#8A3838",border:"1px solid #DFB8B8"}};return <button type="button" onClick={disabled?undefined:onClick} style={{display:"inline-flex",alignItems:"center",gap:5,padding:sm?"0.35rem 0.75rem":"0.55rem 1.1rem",fontSize:sm?11:13,fontWeight:500,borderRadius:7,cursor:disabled?"default":"pointer",...S[variant]}}>{children}</button>;}
const KPI=({label,value,color})=><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"1.1rem 1.3rem",flex:1,minWidth:120}}><p style={{margin:0,fontSize:10,color:C.textXs,textTransform:"uppercase",letterSpacing:"0.12em"}}>{label}</p><p style={{margin:"5px 0 0",fontSize:21,fontWeight:700,color:color||C.text}}>{value}</p></div>;
function Modal({title,onClose,children,wide,full}){return <div style={{position:"fixed",inset:0,background:"rgba(50,40,35,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}><div style={{background:C.card,borderRadius:14,padding:"1.75rem",width:full?"95vw":wide?780:510,maxHeight:"93vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}><h2 style={{margin:0,fontSize:16,fontWeight:600,color:C.text}}>{title}</h2><button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.textXs}}><X size={17}/></button></div>{children}</div></div>;}
function GForm({fields,state,set,cols=2}){const s=(k,v,m)=>set(p=>({...p,[k]:m?m(v):v}));return <div style={{display:"grid",gridTemplateColumns:"repeat("+cols+",1fr)",gap:"0 14px"}}>{fields.map(f=>{if(f.sep)return <div key={f.key} style={{gridColumn:"1/-1",borderTop:"1px solid "+C.border,paddingTop:10,marginTop:4}}>{f.label&&<p style={{margin:0,fontSize:10,color:C.textXs,textTransform:"uppercase",fontWeight:600}}>{f.label}</p>}</div>;const inp=f.type==="select"?<select style={IS} value={state[f.key]||""} onChange={e=>s(f.key,e.target.value,f.mask)}>{(f.blank?[<option key="" value="">{f.blank}</option>]:[])}{(f.opts||[]).map(o=><option key={o} value={o}>{o}</option>)}</select>:f.type==="date"?<input style={IS} type="date" value={state[f.key]||""} onChange={e=>s(f.key,e.target.value,f.mask)}/>:f.type==="number"?<input style={IS} type="number" value={state[f.key]||""} onChange={e=>s(f.key,e.target.value,f.mask)} placeholder={f.ph||""}/>:f.type==="textarea"?<textarea style={{...IS,minHeight:60,resize:"vertical"}} value={state[f.key]||""} onChange={e=>s(f.key,e.target.value,f.mask)} placeholder={f.ph||""}/>:<input style={IS} value={state[f.key]||""} onChange={e=>s(f.key,e.target.value,f.mask)} placeholder={f.ph||""}/>;return <div key={f.key} style={{marginBottom:13,gridColumn:f.full?"1/-1":"auto"}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>{f.label}</label>{inp}</div>;})}</div>;}

function SigPad({onSave,label}){const ref=useRef(null);const[dr,setDr]=useState(false);const[last,setLast]=useState(null);const[has,setHas]=useState(false);const pos=e=>{const r=ref.current.getBoundingClientRect(),t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};};const start=e=>{e.preventDefault();setDr(true);setLast(pos(e));};const move=e=>{e.preventDefault();if(!dr)return;const p=pos(e),ctx=ref.current.getContext("2d");ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle="#3D3530";ctx.lineWidth=2.2;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();setLast(p);setHas(true);};return <div><p style={{margin:"0 0 8px",fontSize:12,color:C.textSm}}>{label||"Desenhe sua assinatura:"}</p><canvas ref={ref} width={440} height={120} style={{border:"1.5px dashed "+C.border,borderRadius:8,cursor:"crosshair",background:"#FDFBF8",display:"block",touchAction:"none",maxWidth:"100%"}} onMouseDown={start} onMouseMove={move} onMouseUp={()=>setDr(false)} onMouseLeave={()=>setDr(false)} onTouchStart={start} onTouchMove={move} onTouchEnd={()=>setDr(false)}/><div style={{display:"flex",gap:8,marginTop:8}}><Btn variant="secondary" sm onClick={()=>{ref.current.getContext("2d").clearRect(0,0,440,120);setHas(false);}}>Limpar</Btn><Btn sm onClick={()=>has&&onSave(ref.current.toDataURL())} disabled={!has}><Pen size={11}/>Salvar</Btn></div></div>;}
function SigOptions({onSave}){const[modo,setModo]=useState(null);const fileRef=useRef(null);const upFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onSave(ev.target.result);r.readAsDataURL(f);};if(modo==="draw")return <div><button onClick={()=>setModo(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.textSm,fontSize:12,marginBottom:14,padding:0,display:"flex",alignItems:"center",gap:4}}><ArrowLeft size={12}/>Voltar</button><SigPad onSave={onSave}/></div>;if(modo==="img")return <div><button onClick={()=>setModo(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.textSm,fontSize:12,marginBottom:14,padding:0,display:"flex",alignItems:"center",gap:4}}><ArrowLeft size={12}/>Voltar</button><div onClick={()=>fileRef.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){const r=new FileReader();r.onload=ev=>onSave(ev.target.result);r.readAsDataURL(f);}}} style={{border:"2px dashed "+C.border,borderRadius:10,padding:"2.5rem",textAlign:"center",cursor:"pointer",background:"#FDFBF8"}}><p style={{margin:"0 0 6px",fontSize:28}}>🖼️</p><p style={{margin:"0 0 4px",fontSize:13,fontWeight:500,color:C.text}}>Clique ou arraste</p><p style={{margin:0,fontSize:11,color:C.textXs}}>PNG recomendado</p></div><input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={upFile}/></div>;return <div><p style={{margin:"0 0 16px",fontSize:13,color:C.textSm}}>Como prefere adicionar sua assinatura?</p><div style={{display:"flex",gap:14}}>{[["draw","✍️","Desenhar"],["img","📎","Anexar imagem"]].map(([m,ic,t])=><button key={m} onClick={()=>setModo(m)} style={{flex:1,padding:"1.5rem 1rem",border:"1.5px solid "+C.border,borderRadius:12,background:C.card,cursor:"pointer",textAlign:"center"}}><p style={{margin:"0 0 6px",fontSize:26}}>{ic}</p><p style={{margin:0,fontSize:13,fontWeight:600,color:C.text}}>{t}</p></button>)}</div></div>;}

function KanbanBoard({lanes,cards,getLane,onMove,renderCard,extraLaneStyle}){const[drag,setDrag]=useState(null);const[over,setOver]=useState(null);return <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:16,alignItems:"flex-start"}}>{lanes.map(lane=>{const lc=cards.filter(c=>getLane(c)===lane.id);const isOver=over===lane.id;return <div key={lane.id} onDragOver={e=>{e.preventDefault();setOver(lane.id);}} onDrop={e=>{e.preventDefault();if(drag)onMove(drag,lane.id);setDrag(null);setOver(null);}} style={{minWidth:205,width:205,flexShrink:0,background:isOver?"#F0EBE3":C.sidebar,borderRadius:12,padding:"0.85rem",border:"2px solid "+(isOver?C.accent:C.border),...(extraLaneStyle?extraLaneStyle(lane):{})}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:11.5,fontWeight:600,color:C.text}}>{lane.icon?lane.icon+" ":""}{lane.label}</span><span style={{fontSize:11,background:lane.bg,color:lane.color,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{lc.length}</span></div><div style={{display:"flex",flexDirection:"column",gap:8,minHeight:50}}>{lc.length===0&&<div style={{border:"1.5px dashed "+C.border,borderRadius:8,padding:"1rem",textAlign:"center"}}><p style={{margin:0,fontSize:11,color:C.textXs}}>Nenhum</p></div>}{lc.map(c=><div key={c.id} draggable onDragStart={e=>{setDrag(c.id);e.dataTransfer.effectAllowed="move";}} onDragEnd={()=>{setDrag(null);setOver(null);}} style={{opacity:drag===c.id?0.4:1}}>{renderCard(c,lane,lanes,onMove)}</div>)}</div></div>;})}  </div>;}

function ServiceEditModal({data,onSave,onClose}){const[f,setF]=useState({nome:"",desc:"",...data});const s=(k,v)=>setF(p=>({...p,[k]:v}));return <Modal title={data.id?"Editar serviço":"Novo serviço"} onClose={onClose}><div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Nome *</label><input style={IS} value={f.nome} onChange={e=>s("nome",e.target.value)}/></div><div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Descrição</label><input style={IS} value={f.desc||""} onChange={e=>s("desc",e.target.value)}/></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={()=>{if(f.nome.trim())onSave(f);}}>Salvar</Btn></div></Modal>;}
function PackageEditModal({data,onSave,onClose}){const[f,setF]=useState({nome:"",preco:"",desc:"",...data});const s=(k,v)=>setF(p=>({...p,[k]:v}));return <Modal title={data.id?"Editar pacote":"Novo pacote"} onClose={onClose}><div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Nome *</label><input style={IS} value={f.nome} onChange={e=>s("nome",e.target.value)}/></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}><div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Preço (R$)</label><input style={IS} type="number" value={f.preco} onChange={e=>s("preco",e.target.value)}/></div><div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>O que inclui</label><input style={IS} value={f.desc||""} onChange={e=>s("desc",e.target.value)}/></div></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={()=>{if(f.nome.trim())onSave({...f,preco:Number(f.preco)||0});}}>Salvar</Btn></div></Modal>;}
function DspModal({data,onSave,onClose}){const[f,setF]=useState({tipo:"Fixa",nome:"",valor:"",dia:"",data:"",categoria:"Outros",obs:"",ativo:true,...data});const s=(k,v)=>setF(p=>({...p,[k]:v}));return <Modal title={data.id?"Editar despesa":"Nova despesa"} onClose={onClose}><div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:6,fontWeight:500}}>Tipo</label><div style={{display:"flex",gap:8}}>{["Fixa","Variável"].map(t=><button key={t} onClick={()=>s("tipo",t)} style={{flex:1,padding:"0.5rem",borderRadius:7,border:"1px solid "+(f.tipo===t?C.accent:C.border),background:f.tipo===t?C.accentLt:C.card,color:f.tipo===t?C.accentDk:C.textSm,cursor:"pointer",fontWeight:f.tipo===t?600:400,fontSize:13}}>{t}</button>)}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}><div style={{gridColumn:"1/-1",marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Nome *</label><input style={IS} value={f.nome} onChange={e=>s("nome",e.target.value)}/></div><div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Valor (R$)</label><input style={IS} type="number" value={f.valor} onChange={e=>s("valor",e.target.value)}/></div><div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Categoria</label><select style={IS} value={f.categoria} onChange={e=>s("categoria",e.target.value)}>{CATS_DSP.map(c=><option key={c}>{c}</option>)}</select></div>{f.tipo==="Fixa"&&<div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Dia vencimento</label><input style={IS} type="number" min="1" max="31" value={f.dia} onChange={e=>s("dia",e.target.value)}/></div>}{f.tipo==="Variável"&&<div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Data</label><input style={IS} type="date" value={f.data||""} onChange={e=>s("data",e.target.value)}/></div>}<div style={{gridColumn:"1/-1",marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Observações</label><input style={IS} value={f.obs||""} onChange={e=>s("obs",e.target.value)}/></div></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={()=>{if(f.nome.trim())onSave({...f,valor:Number(f.valor)||0});}}>Salvar</Btn></div></Modal>;}

function ServicosView({services,setServices,setConfMod}:any){const[editSrv,setEditSrv]=useState<any>(null);const[editPkg,setEditPkg]=useState<any>(null);const saveSrv=d=>{setServices(p=>d.id?p.map(s=>s.id===d.id?{...s,...d}:s):[...p,{...d,id:uid(),pacotes:[]}]);setEditSrv(null);};const delSrv=id=>{
  setConfMod({
    title: "Excluir serviço",
    msg: "Deseja realmente excluir este serviço e todos os seus pacotes?",
    onConfirm: () => setServices(p=>p.filter(s=>s.id!==id))
  });
};const savePkg=(srvId,pk)=>{setServices(p=>p.map(s=>s.id===srvId?{...s,pacotes:pk.id?s.pacotes.map(x=>x.id===pk.id?pk:x):[...s.pacotes,{...pk,id:uid()}]}:s));setEditPkg(null);};const delPkg=(srvId,pkId)=>{
  setConfMod({
    title: "Excluir pacote",
    msg: "Deseja realmente excluir este pacote?",
    onConfirm: () => setServices(p=>p.map(s=>s.id===srvId?{...s,pacotes:s.pacotes.filter(x=>x.id!==pkId)}:s))
  });
};const totPkgs=services.reduce((s,x)=>s+x.pacotes.length,0);return <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"1.4rem"}}><div><h1 style={{margin:"0 0 0.2rem",fontSize:21,fontWeight:700,color:C.text}}>Serviços</h1><p style={{margin:0,fontSize:13,color:C.textXs}}>{services.length+" serviços · "+totPkgs+" pacotes"}</p></div><Btn onClick={()=>setEditSrv({})}><Plus size={13}/>Novo serviço</Btn></div>{services.length===0&&<div style={{textAlign:"center",padding:"3rem",color:C.textXs,background:C.card,border:"1px solid "+C.border,borderRadius:12}}>Nenhum serviço cadastrado.</div>}<div style={{display:"flex",flexDirection:"column",gap:16}}>{services.map(srv=><div key={srv.id} style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"1.25rem"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><div><h2 style={{margin:0,fontSize:16,fontWeight:600,color:C.text}}>{srv.nome}</h2>{srv.desc&&<p style={{margin:"3px 0 0",fontSize:12.5,color:C.textSm}}>{srv.desc}</p>}</div><div style={{display:"flex",gap:7}}><Btn variant="secondary" sm onClick={()=>setEditSrv(srv)}><Edit2 size={11}/>Editar</Btn><Btn variant="danger" sm onClick={(e)=>{e.stopPropagation(); delSrv(srv.id);}}><Trash2 size={11}/></Btn></div></div><div style={{borderTop:"1px solid "+C.border,paddingTop:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><span style={{fontSize:11,fontWeight:600,color:C.textSm,textTransform:"uppercase",letterSpacing:"0.1em"}}>Pacotes</span><Btn sm onClick={()=>setEditPkg({srvId:srv.id,pk:{}})}><Plus size={11}/>Adicionar</Btn></div>{srv.pacotes.length===0&&<p style={{fontSize:12.5,color:C.textXs,margin:0}}>Nenhum pacote ainda.</p>}<div style={{display:"flex",flexDirection:"column",gap:8}}>{srv.pacotes.map(pk=><div key={pk.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#F8F4EF",borderRadius:9}}><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>{pk.nome}</span><span style={{fontSize:14,fontWeight:700,color:C.accentDk}}>{fmtR(pk.preco)}</span></div>{pk.desc&&<p style={{margin:"2px 0 0",fontSize:11.5,color:C.textSm}}>{pk.desc}</p>}</div><div style={{display:"flex",gap:6}}><Btn variant="secondary" sm onClick={()=>setEditPkg({srvId:srv.id,pk})}><Edit2 size={10}/></Btn><Btn variant="danger" sm onClick={(e)=>{e.stopPropagation(); delPkg(srv.id,pk.id);}}><Trash2 size={10}/></Btn></div></div>)}</div></div></div>)}</div>{editSrv&&<ServiceEditModal data={editSrv} onSave={saveSrv} onClose={()=>setEditSrv(null)}/>}{editPkg&&<PackageEditModal data={editPkg.pk} onSave={pk=>savePkg(editPkg.srvId,pk)} onClose={()=>setEditPkg(null)}/>}</div>;}

function Sidebar({view,go,studioName,ownerName,onLogout,logoUrl}:any){const links=[{id:"dashboard",Icon:LayoutDashboard,label:"Dashboard"},{id:"clientes",Icon:Users,label:"Clientes"},{id:"financeiro",Icon:DollarSign,label:"Financeiro"},{id:"servicos",Icon:Package,label:"Serviços"},{id:"contratos",Icon:FileText,label:"Contratos"},{id:"jornada",Icon:Kanban,label:"Jornada do Cliente"},{id:"leads",Icon:Target,label:"Jornada do Lead"},{id:"config",Icon:Settings,label:"Configurações"}];return <aside style={{width:210,minWidth:210,background:C.sidebar,borderRight:"1px solid "+C.border,display:"flex",flexDirection:"column",padding:"2rem 0"}}><div style={{padding:"0 1.4rem 2rem"}}>{logoUrl?<img src={logoUrl} alt="Logo" style={{width:40,height:40,borderRadius:8,marginBottom:12,objectFit:"cover"}}/>:<p style={{margin:0,fontSize:10,color:C.textXs,letterSpacing:"0.14em",textTransform:"uppercase"}}>MyStudio · CRM</p>}<h2 style={{margin:"4px 0 0",fontSize:15,fontWeight:600,color:C.text,fontFamily:"Georgia,serif",lineHeight:1.3}}>{studioName||"Meu Estúdio"}</h2>{ownerName&&<p style={{margin:"2px 0 0",fontSize:11,color:C.textSm}}>{ownerName}</p>}</div><nav style={{flex:1}}>{links.map(({id,Icon,label})=>{const a=view===id;return <button key={id} onClick={()=>go(id)} style={{display:"flex",alignItems:"center",gap:9,width:"100%",padding:"0.6rem 1.4rem",border:"none",cursor:"pointer",background:a?C.accentLt:"transparent",color:a?C.accentDk:C.textSm,borderLeft:a?"3px solid "+C.accent:"3px solid transparent",fontSize:13,fontWeight:a?600:400,textAlign:"left"}}><Icon size={14}/>{label}</button>;})}</nav><div style={{padding:"0.5rem 1.4rem",borderTop:"1px solid "+C.border}}>{onLogout&&<button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"0.5rem 0",border:"none",cursor:"pointer",background:"transparent",color:C.textXs,fontSize:12}}><LogOut size={13}/>Sair</button>}</div></aside>;}

function MiniCal({contracts,clients,go}:any){const today=new Date();const[cur,setCur]=useState({y:today.getFullYear(),m:today.getMonth()});const[sel,setSel]=useState<number|null>(null);const cmap=useMemo(()=>Object.fromEntries(clients.map(c=>[c.id,c])),[clients]);const MN=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];const dIM=new Date(cur.y,cur.m+1,0).getDate(),fD=new Date(cur.y,cur.m,1).getDay();const tDay=today.getFullYear()===cur.y&&today.getMonth()===cur.m?today.getDate():null;const byDay=useMemo(()=>{const m={};contracts.forEach(c=>{if(!c.ds)return;const d=new Date(c.ds+"T12:00:00");if(d.getFullYear()===cur.y&&d.getMonth()===cur.m){const n=d.getDate();if(!m[n])m[n]=[];m[n].push(c);}});return m;},[contracts,cur]);const cells=[];for(let i=0;i<fD;i++)cells.push(null);for(let d=1;d<=dIM;d++)cells.push(d);return <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"1.25rem",flex:1,minWidth:270}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><button onClick={()=>setCur(p=>p.m===0?{y:p.y-1,m:11}:{y:p.y,m:p.m-1})} style={{background:"none",border:"1px solid "+C.border,borderRadius:6,padding:"3px 10px",cursor:"pointer"}}>‹</button><span style={{fontSize:13,fontWeight:600,color:C.text}}>{MN[cur.m]+" "+cur.y}</span><button onClick={()=>setCur(p=>p.m===11?{y:p.y+1,m:0}:{y:p.y,m:p.m+1})} style={{background:"none",border:"1px solid "+C.border,borderRadius:6,padding:"3px 10px",cursor:"pointer"}}>›</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>{["D","S","T","Q","Q","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,color:C.textXs,fontWeight:600}}>{d}</div>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>{cells.map((d,i)=>{if(!d)return <div key={i}/>;const has=byDay[d]?.length>0,isT=d===tDay,isS=d===sel;return <div key={i} onClick={()=>setSel(isS?null:d)} style={{textAlign:"center",padding:"5px 2px",borderRadius:7,cursor:has?"pointer":"default",background:isS?C.accent:isT?C.accentLt:"transparent",border:isT&&!isS?"1px solid "+C.accent:"1px solid transparent"}}><span style={{fontSize:12,fontWeight:has||isT?600:400,color:isS?"#fff":isT?C.accentDk:C.text}}>{d}</span>{has&&<div style={{display:"flex",justifyContent:"center",gap:2,marginTop:2}}>{byDay[d].slice(0,3).map((_,j)=><span key={j} style={{width:4,height:4,borderRadius:"50%",background:isS?"rgba(255,255,255,.8)":C.accent,display:"inline-block"}}/>)}</div>}</div>;})}</div>{sel&&byDay[sel]&&<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid "+C.border}}>{byDay[sel].map(c=><div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid "+C.border}}><div><button onClick={()=>go("clientes",cmap[c.cid])} style={{background:"none",border:"none",cursor:"pointer",color:C.accentDk,fontWeight:600,fontSize:12,padding:0}}>{cmap[c.cid]?.nome||"—"}</button><span style={{fontSize:11,color:C.textSm,marginLeft:6}}>{c.srv}</span></div><Badge s={c.st}/></div>)}</div>}</div>;}

function Tarefas({contracts,clients,go}){const cmap=useMemo(()=>Object.fromEntries(clients.map(c=>[c.id,c])),[clients]);const hoje=todayS();const in7=new Date();in7.setDate(in7.getDate()+7);const in7s=in7.toISOString().slice(0,10);const items=useMemo(()=>{const l=[];contracts.forEach(c=>{const n=cmap[c.cid]?.nome||"Cliente";const sl=Number(c.val||0)-Number(c.ent||0);const fut=c.ds===hoje||c.ds>hoje;if(fut&&!(c.ds>in7s)&&c.st!=="Cancelado")l.push({id:c.id+"p",i:"📅",u:0,m:"Sessão "+c.srv+" com "+n+" em "+fmtD(c.ds),cid:c.cid});if(sl>0&&!fut&&c.st!=="Cancelado")l.push({id:c.id+"s",i:"💰",u:1,m:"Saldo "+fmtR(sl)+" — "+n,cid:c.cid});if(c.st==="Pendente")l.push({id:c.id+"c",i:"⏳",u:2,m:"Contrato pendente — "+n,cid:c.cid});if(c.dataEntrega&&c.st!=="Cancelado"){const deAt=c.dataEntrega!==hoje&&!(c.dataEntrega>hoje);const deHj=c.dataEntrega===hoje;const dePrx=!deAt&&!deHj&&!(c.dataEntrega>in7s);if(deAt)l.push({id:c.id+"de",i:"🚨",u:0,m:"Entrega atrasada — "+n+" ("+c.srv+"): "+fmtD(c.dataEntrega),cid:c.cid});else if(deHj)l.push({id:c.id+"de",i:"⏰",u:0,m:"Entrega hoje — "+n+" ("+c.srv+")",cid:c.cid});else if(dePrx)l.push({id:c.id+"de",i:"📦",u:1,m:"Entrega em "+fmtD(c.dataEntrega)+" — "+n+" ("+c.srv+")",cid:c.cid});}});return l.sort((a,b)=>a.u-b.u).slice(0,10);},[contracts,cmap]);return <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"1.25rem",flex:1,minWidth:230}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h2 style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>Tarefas pendentes</h2><span style={{background:C.accentLt,color:C.accentDk,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:600}}>{items.length}</span></div>{items.length===0?<p style={{textAlign:"center",color:C.textSm,fontSize:13}}>✅ Tudo em dia!</p>:<div style={{display:"flex",flexDirection:"column",gap:8}}>{items.map(t=><div key={t.id} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 10px",borderRadius:8,background:"#F8F4EF"}}><span style={{fontSize:16,flexShrink:0}}>{t.i}</span><p style={{margin:0,flex:1,fontSize:12.5,color:C.text,lineHeight:1.4}}>{t.m}</p><button onClick={()=>go("clientes",clients.find(c=>c.id===t.cid))} style={{background:"none",border:"1px solid "+C.border,borderRadius:5,padding:"2px 8px",cursor:"pointer",color:C.textSm,fontSize:10.5,flexShrink:0}}>Ver</button></div>)}</div>}</div>;}

function Aniversarios({clients}){const hoje=new Date();const mm=String(hoje.getMonth()+1).padStart(2,"0");const dd=String(hoje.getDate()).padStart(2,"0");const hits=[];clients.forEach(c=>{if(c.nasc){const p=c.nasc.split("-");if(p[1]===mm&&p[2]===dd)hits.push({tipo:"mae",c});}if(c.nascBebe){const p=c.nascBebe.split("-");if(p[1]===mm&&p[2]===dd)hits.push({tipo:"bebe",c});}});if(!hits.length)return null;return <div style={{background:"#FDF8EE",border:"1px solid #E8D898",borderRadius:12,padding:"1.1rem 1.25rem",marginBottom:18}}><h2 style={{margin:"0 0 12px",fontSize:14,fontWeight:600,color:"#7A5A18"}}>🎂 Aniversários hoje!</h2>{hits.map(({tipo,c},i)=>{const n=tipo==="bebe"?c.bebe:c.nome;const msg=tipo==="bebe"?"Olá "+c.nome+"! 🎉 Hoje é o aniversário de "+c.bebe+"! Que dia especial! Muita saúde e alegria! 🎈 — Brenda Monteiro Fotografia":"Olá "+c.nome+"! 🎂 Feliz aniversário! Foi uma honra registrar momentos tão especiais da sua família. Que esse novo ciclo seja repleto de amor e alegria! 🌸 — Brenda Monteiro Fotografia";return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:C.card,borderRadius:8,border:"1px solid #E8D898",marginBottom:6}}><div><p style={{margin:0,fontSize:13,fontWeight:600,color:C.text}}>{n}</p><p style={{margin:0,fontSize:11,color:"#7A5A18"}}>{tipo==="bebe"?"Aniversário do bebê 🎈":"Aniversário da mamãe 🌸"}</p></div>{c.tel&&<a href={waLink(c.tel,msg)} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,background:"#25D366",color:"#fff",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:600,textDecoration:"none"}}>💬 WhatsApp</a>}</div>;})}</div>;}

function DashboardView({clients,contracts,go}){const cmap=useMemo(()=>Object.fromEntries(clients.map(c=>[c.id,c])),[clients]);const hojeDate=new Date();const mmD=String(hojeDate.getMonth()+1).padStart(2,"0");const aaD=String(hojeDate.getFullYear());const fat=contracts.filter(c=>c.dc&&c.dc.startsWith(aaD+"-"+mmD)).reduce((s,c)=>s+Number(c.val||0),0);const rec=contracts.filter(c=>c.dc&&c.dc.startsWith(aaD+"-"+mmD)).reduce((s,c)=>s+Number(c.ent||0),0);const hoje=todayS();const up=useMemo(()=>contracts.filter(c=>!(c.ds<hoje)&&c.st!=="Cancelado").sort((a,b)=>a.ds.localeCompare(b.ds)).slice(0,6),[contracts,hoje]);const th={textAlign:"left",padding:"10px 16px",fontWeight:500,fontSize:10,color:C.textXs,textTransform:"uppercase"};const td={padding:"12px 16px",fontSize:13};return <div><h1 style={{margin:"0 0 0.2rem",fontSize:21,fontWeight:700,color:C.text}}>Dashboard</h1><p style={{margin:"0 0 1.5rem",fontSize:13,color:C.textXs}}>Visão geral do seu estúdio</p><Aniversarios clients={clients}/><div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap"}}><KPI label="Clientes" value={clients.length}/><KPI label="Sessões ativas" value={contracts.filter(c=>c.st==="Confirmado"||c.st==="Pendente").length}/><KPI label="Total faturado" value={fmtR(fat)}/><KPI label="A receber" value={fmtR(fat-rec)} color="#7A5A18"/></div><div style={{display:"flex",gap:14,marginBottom:18,flexWrap:"wrap",alignItems:"flex-start"}}><MiniCal contracts={contracts} clients={clients} go={go}/><Tarefas contracts={contracts} clients={clients} go={go}/></div><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,overflow:"hidden"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1.25rem 1.5rem 1rem"}}><h2 style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>Próximas sessões</h2><Btn variant="secondary" sm onClick={()=>go("financeiro")}>Ver todas</Btn></div>{up.length===0?<p style={{padding:"1rem 1.5rem 1.5rem",color:C.textXs,fontSize:13}}>Nenhuma sessão agendada.</p>:<table style={{width:"100%",borderCollapse:"collapse"}}><thead style={{background:"#F8F4EF"}}><tr><th style={th}>Cliente</th><th style={th}>Serviço</th><th style={th}>Data</th><th style={th}>Valor</th><th style={th}>Status</th></tr></thead><tbody>{up.map(c=><tr key={c.id} style={{borderTop:"1px solid "+C.border}}><td style={{...td,fontWeight:500}}><button onClick={()=>go("clientes",cmap[c.cid])} style={{background:"none",border:"none",cursor:"pointer",color:C.accentDk,fontWeight:600,fontSize:13,padding:0}}>{cmap[c.cid]?.nome||"—"}</button></td><td style={{...td,color:C.textSm}}>{c.srv}</td><td style={{...td,color:C.textSm}}>{fmtD(c.ds)}</td><td style={td}>{fmtR(c.val)}</td><td style={td}><Badge s={c.st}/></td></tr>)}</tbody></table>}</div></div>;}

function ClienteCard({client,contracts,favorecidos=[],onBack,onEdit,onAddK,onEditK,onDeleteK,onAddFav,onDelFav,onEditFav}:any){const tot=contracts.reduce((s,c)=>s+Number(c.val||0),0),rec=contracts.reduce((s,c)=>s+Number(c.ent||0),0);const ini=client.nome.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase();const favs = favorecidos.filter(f => f.cliente_id === client.id);return <div><button onClick={onBack} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",color:C.textSm,fontSize:13,marginBottom:18,padding:0}}><ArrowLeft size={13}/>Voltar</button><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"1.5rem",marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{display:"flex",gap:14,alignItems:"flex-start"}}><div style={{width:48,height:48,borderRadius:"50%",background:C.accentLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:600,color:C.accentDk,flexShrink:0}}>{ini}</div><div><h1 style={{margin:"0 0 4px",fontSize:19,fontWeight:700,color:C.text}}>{client.nome}</h1><div style={{display:"flex",gap:12,fontSize:12.5,color:C.textSm,flexWrap:"wrap"}}>{client.tel&&<span>{"📱 "+client.tel}</span>}{client.email&&<span>{"✉️ "+client.email}</span>}{client.cidade&&<span>{"📍 "+client.cidade}</span>}{client.cpf&&<span>{"CPF: "+client.cpf}</span>}</div>{client.endereco&&<p style={{margin:"5px 0 0",fontSize:12.5,color:C.textSm}}>{"📌 "+client.endereco}</p>}{client.obs&&<p style={{margin:"6px 0 0",fontSize:12.5,color:C.textSm,fontStyle:"italic"}}>{client.obs}</p>}<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid "+C.border}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><p style={{margin:0,fontSize:10,color:C.textXs,textTransform:"uppercase",fontWeight:700,letterSpacing:"0.05em"}}>Alvos da Sessão / Favorecidos</p><Btn sm onClick={onAddFav} variant="secondary" style={{padding:"2px 8px",fontSize:10.5}}><Plus size={10}/>Adicionar</Btn></div>{favs.length === 0 ? <p style={{margin:0,fontSize:12,color:C.textXs,fontStyle:"italic"}}>Nenhum favorecido (filho/modelo) cadastrado.</p> : <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{favs.map(f => <div key={f.id} style={{background:"#FDFBF8",border:"1px solid "+C.border,borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}><div style={{flex:1}}><p style={{margin:0,fontSize:13,fontWeight:600,color:C.text}}>{f.nome}</p><p style={{margin:0,fontSize:10.5,color:C.textSm}}>{(f.parentesco?f.parentesco+" · ":"")+(f.nasc?fmtD(f.nasc):"Sem data")}{f.telefone && ` · 📱 ${f.telefone}`}</p></div><div style={{display:"flex",gap:4}}><button onClick={()=>onEditFav(f)} style={{background:"none",border:"none",cursor:"pointer",color:C.textXs}}><Edit2 size={12}/></button><button onClick={()=>onDelFav(f.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#8A3838"}}><Trash2 size={12}/></button></div></div>)}</div>}</div>{(client.parceiro||client.telParceiro)&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid "+C.border}}><p style={{margin:"0 0 4px",fontSize:10,color:C.textXs,textTransform:"uppercase",fontWeight:600}}>Parceiro(a)</p><div style={{display:"flex",gap:12,fontSize:12.5,color:C.textSm}}>{client.parceiro&&<span>{"👤 "+client.parceiro}</span>}{client.telParceiro&&<span>{"📱 "+client.telParceiro}</span>}</div></div>}</div></div><Btn variant="secondary" sm onClick={onEdit}><Edit2 size={11}/>Editar Cliente</Btn></div>{contracts.length>0&&<div style={{display:"flex",gap:12,marginTop:18,paddingTop:14,borderTop:"1px solid "+C.border}}>{[["Contratado",fmtR(tot),C.text,"#F8F4EF"],["Recebido",fmtR(rec),"#3D6B42","#ECF5EC"],["A receber",fmtR(tot-rec),"#7A5A18","#FDF8EE"]].map(([l,v,cl,bg])=><div key={l} style={{flex:1,background:bg,borderRadius:8,padding:"0.7rem 1rem"}}><p style={{margin:0,fontSize:10,color:C.textXs,textTransform:"uppercase"}}>{l}</p><p style={{margin:"4px 0 0",fontWeight:700,color:cl,fontSize:15}}>{v}</p></div>)}</div>}</div><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"1.5rem"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h2 style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>Contratos · Sessões</h2><Btn sm onClick={onAddK}><Plus size={12}/>Nova sessão</Btn></div>{contracts.length===0?<p style={{color:C.textXs,fontSize:13}}>Nenhum contrato ainda.</p>:<div style={{display:"flex",flexDirection:"column",gap:10}}>{contracts.map(c=>{const sl=Number(c.val||0)-Number(c.ent||0);return <div key={c.id} style={{border:"1px solid "+C.border,borderRadius:10,padding:"1rem 1.2rem"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}><span style={{fontWeight:600,fontSize:14,color:C.text}}>{c.srv+(c.nomeExp?" · "+c.nomeExp:"")}</span><Badge s={c.st}/></div><div style={{display:"flex",gap:12,fontSize:12,color:C.textSm,flexWrap:"wrap"}}><span>{"📅 "+fmtD(c.ds)}</span>{c.qtdFotos&&<span>{"📷 "+c.qtdFotos}</span>}<span>{"💰 "+fmtR(c.val)}</span><span>{"Entrada: "+fmtR(c.ent)}</span><span style={{color:sl>0?"#7A5A18":"#3D6B42"}}>{"Saldo: "+fmtR(sl)}</span>{c.formaPagamento&&<span>{"💳 "+c.formaPagamento}</span>}</div></div><div style={{display:"flex",gap:7}}><Btn variant="secondary" sm onClick={()=>onEditK(c)}><Edit2 size={11}/></Btn><Btn variant="danger" sm onClick={(e)=>{e.stopPropagation(); onDeleteK(c.id);}}><Trash2 size={11}/></Btn></div></div></div>;})} </div>}</div></div>;}

function ClientesView({clients,contracts,onAdd,onEdit,onDelete,onSelect,onImport,onForm}){const[q,setQ]=useState("");const[showImp,setShowImp]=useState(false);const[showForm,setShowForm]=useState(false);const list=q?clients.filter(c=>c.nome.toLowerCase().includes(q.toLowerCase())||c.tel?.includes(q)):clients;const th={textAlign:"left",padding:"11px 18px",fontWeight:500,fontSize:10,color:C.textXs,textTransform:"uppercase"};const td={padding:"13px 18px",fontSize:13};return <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"1.4rem"}}><div><h1 style={{margin:"0 0 0.2rem",fontSize:21,fontWeight:700,color:C.text}}>Clientes</h1><p style={{margin:0,fontSize:13,color:C.textXs}}>{clients.length} cadastrada{clients.length!==1?"s":""}</p></div><div style={{display:"flex",gap:8}}><Btn variant="secondary" onClick={()=>setShowForm(true)}><Link size={13}/>Formulário</Btn><Btn variant="secondary" onClick={()=>setShowImp(true)}><Plus size={13}/>Importar</Btn><Btn onClick={onAdd}><Plus size={13}/>Novo</Btn></div></div>{showImp&&<ImportModal onClose={()=>setShowImp(false)} onImport={l=>{onImport(l);setShowImp(false);}}/>}{showForm&&<PreCadModal onSave={c=>{onForm(c);setShowForm(false);}} onClose={()=>setShowForm(false)}/>}<div style={{position:"relative",marginBottom:16}}><Search size={13} style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:C.textXs}}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." style={{...IS,paddingLeft:"2.1rem"}}/></div><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,overflow:"hidden"}}>{list.length===0?<p style={{padding:"2.5rem",textAlign:"center",color:C.textXs}}>Nenhum cliente encontrado.</p>:<table style={{width:"100%",borderCollapse:"collapse"}}><thead style={{background:"#F8F4EF"}}><tr><th style={th}>Nome</th><th style={th}>Telefone</th><th style={th}>Cidade</th><th style={th}>Sessões</th><th style={{...th,textAlign:"right"}}>Ações</th></tr></thead><tbody>{list.map(c=><tr key={c.id} style={{borderTop:"1px solid "+C.border}}><td style={{...td,fontWeight:500}}><button onClick={()=>onSelect(c)} style={{background:"none",border:"none",cursor:"pointer",color:C.accentDk,fontWeight:600,fontSize:13,padding:0,display:"flex",alignItems:"center",gap:4}}>{c.nome}<ChevronRight size={12}/></button></td><td style={{...td,color:C.textSm}}>{c.tel||"—"}</td><td style={{...td,color:C.textSm}}>{c.cidade||"—"}</td><td style={td}><span style={{background:"#F2EDE6",color:C.accentDk,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:600}}>{contracts.filter(k=>k.cid===c.id).length}</span></td><td style={{...td,textAlign:"right"}}><div style={{display:"flex",gap:7,justifyContent:"flex-end"}}><Btn variant="secondary" sm onClick={()=>onEdit(c)}><Edit2 size={11}/></Btn><Btn variant="danger" sm onClick={(e)=>{e.stopPropagation(); onDelete(c.id);}}><Trash2 size={11}/></Btn></div></td></tr>)}</tbody></table>}</div></div>;}

function FinanceiroView({contracts,clients,servicos=[],onEdit,onDelete,despesas=[],setDespesas,setConfMod}:any){const[tab,setTab]=useState("receitas");const[filtTipo,setFiltTipo]=useState("Todos");const[fst,setFst]=useState("Todos");const[fsr,setFsr]=useState("Todos");const today=new Date();const[mes,setMes]=useState(today.getMonth());const[ano,setAno]=useState(today.getFullYear());const[editDsp,setEditDsp]=useState<any>(null);const cmap=useMemo(()=>Object.fromEntries(clients.map(c=>[c.id,c])),[clients]);const list=useMemo(()=>contracts.filter(c=>(fst==="Todos"||c.st===fst)&&(fsr==="Todos"||c.srv===fsr)).sort((a,b)=>b.ds.localeCompare(a.ds)),[contracts,fst,fsr]);const mm=String(mes+1).padStart(2,"0"),aa=String(ano);const cMes=contracts.filter(c=>c.dc&&c.dc.startsWith(aa+"-"+mm));const recMes=cMes.reduce((s,c)=>s+Number(c.val||0),0);const entMes=cMes.reduce((s,c)=>s+Number(c.ent||0),0);const fixasMes=despesas.filter(d=>d.tipo==="Fixa"&&d.ativo).reduce((s,d)=>s+Number(d.valor||0),0);const varMes=despesas.filter(d=>d.tipo==="Variável"&&d.data&&d.data.startsWith(aa+"-"+mm)).reduce((s,d)=>s+Number(d.valor||0),0);const dspMes=fixasMes+varMes;const lucroMes=recMes-dspMes;const MESES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];const pill=(a,l,f)=><button onClick={f} style={{padding:"0.35rem 0.8rem",fontSize:12,borderRadius:20,border:"1px solid "+(a?C.accent:C.border),background:a?C.accentLt:C.card,color:a?C.accentDk:C.textSm,cursor:"pointer",fontWeight:a?600:400}}>{l}</button>;const tabSt=(id:string)=>({padding:"0.45rem 1.1rem",fontSize:13,border:"none",background:tab===id?C.card:"transparent",color:tab===id?C.accentDk:C.textSm,borderRadius:8,cursor:"pointer",fontWeight:tab===id?600:400,borderBottom:tab===id?"2px solid "+C.accent:"2px solid transparent"});const th:any={textAlign:"left",padding:"10px 14px",fontWeight:500,fontSize:10,color:C.textXs,textTransform:"uppercase"};const td:any={padding:"12px 14px",fontSize:13};const saveDsp=d=>{setDespesas(p=>d.id?p.map(x=>x.id===d.id?d:x):[...p,{...d,id:uid()}]);setEditDsp(null);};const delDsp=id=>{
  setConfMod({
    title: "Excluir despesa",
    msg: "Deseja realmente excluir esta despesa?",
    onConfirm: () => setDespesas(p=>p.filter(x=>x.id!==id))
  });
};const dspFilt=despesas.filter(d=>filtTipo==="Todos"||(filtTipo==="Fixa"?d.tipo==="Fixa":d.tipo==="Variável"));return <div><h1 style={{margin:"0 0 0.2rem",fontSize:21,fontWeight:700,color:C.text}}>Financeiro</h1><p style={{margin:"0 0 1.25rem",fontSize:13,color:C.textXs}}>Visão financeira do seu estúdio</p><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"1.25rem",marginBottom:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h2 style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>Resumo mensal</h2><div style={{display:"flex",gap:8,alignItems:"center"}}><button onClick={()=>mes===0?(setMes(11),setAno(a=>a-1)):setMes(m=>m-1)} style={{background:"none",border:"1px solid "+C.border,borderRadius:6,padding:"3px 10px",cursor:"pointer",color:C.textSm}}>‹</button><span style={{fontSize:13,fontWeight:600,color:C.text,minWidth:100,textAlign:"center"}}>{MESES[mes]+" "+ano}</span><button onClick={()=>mes===11?(setMes(0),setAno(a=>a+1)):setMes(m=>m+1)} style={{background:"none",border:"1px solid "+C.border,borderRadius:6,padding:"3px 10px",cursor:"pointer",color:C.textSm}}>›</button></div></div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{[["Receitas do mês",fmtR(recMes),"#3D6B42","#ECF5EC"],["Entradas recebidas",fmtR(entMes),"#2F5480","#E8EFF8"],["Despesas fixas",fmtR(fixasMes),"#7A3838","#F8EAEA"],["Despesas variáveis",fmtR(varMes),"#7A5A18","#FDF8EE"],["Lucro líquido",fmtR(lucroMes),lucroMes>=0?"#3D6B42":"#7A3838",lucroMes>=0?"#ECF5EC":"#F8EAEA"]].map(([l,v,cl,bg])=><div key={l as string} style={{flex:1,minWidth:110,background:bg as string,borderRadius:8,padding:"0.75rem 1rem"}}><p style={{margin:0,fontSize:10,color:C.textXs,textTransform:"uppercase",letterSpacing:"0.08em"}}>{l as string}</p><p style={{margin:"4px 0 0",fontWeight:700,color:cl as string,fontSize:14}}>{v as string}</p></div>)}</div></div><div style={{display:"flex",gap:4,marginBottom:18,borderBottom:"1px solid "+C.border}}>{[["receitas","Receitas"],["despesas","Despesas"]].map(([id,l])=><button key={id} style={tabSt(id)} onClick={()=>setTab(id)}>{l}</button>)}</div>{tab==="receitas"&&<><div style={{display:"flex",gap:14,marginBottom:16,flexWrap:"wrap"}}><KPI label="Contratos no mês" value={cMes.length}/><KPI label="Faturado no mês" value={fmtR(recMes)}/><KPI label="Recebido no mês" value={fmtR(entMes)} color="#3D6B42"/><KPI label="A receber no mês" value={fmtR(recMes-entMes)} color="#7A5A18"/></div><div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>{["Todos",...STATUS].map(s=>pill(fst===s,s,()=>setFst(s)))}<div style={{width:1,height:20,background:C.border,margin:"0 4px"}}/>{["Todos",...servicos].map(s=>pill(fsr===s,s,()=>setFsr(s)))}</div><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,overflow:"hidden"}}>{list.length===0?<p style={{padding:"2.5rem",textAlign:"center",color:C.textXs}}>Nenhum contrato.</p>:<table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}><colgroup><col style={{width:"22%"}}/><col style={{width:"12%"}}/><col style={{width:"11%"}}/><col style={{width:"12%"}}/><col style={{width:"11%"}}/><col style={{width:"11%"}}/><col style={{width:"13%"}}/><col style={{width:"8%"}}/></colgroup><thead style={{background:"#F8F4EF"}}><tr>{["Cliente","Serviço","Data","Valor","Entrada","Saldo","Status",""].map((h,i)=><th key={i} style={{...th,textAlign:i>=5?"right":"left"}}>{h}</th>)}</tr></thead><tbody>{list.map(c=>{const s=Number(c.val||0)-Number(c.ent||0);return <tr key={c.id} style={{borderTop:"1px solid "+C.border}}><td style={{...td,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cmap[c.cid]?.nome||"—"}</td><td style={{...td,color:C.textSm}}>{c.srv}</td><td style={{...td,color:C.textSm}}>{fmtD(c.ds)}</td><td style={td}>{fmtR(c.val)}</td><td style={{...td,color:"#3D6B42"}}>{fmtR(c.ent)}</td><td style={{...td,color:s>0?"#7A5A18":"#3D6B42",textAlign:"right"}}>{fmtR(s)}</td><td style={{...td,textAlign:"right"}}><Badge s={c.st}/></td><td style={{...td,textAlign:"right"}}><div style={{display:"flex",gap:4,justifyContent:"flex-end"}}><Btn variant="secondary" sm onClick={()=>onEdit(c)}><Edit2 size={10}/></Btn><Btn variant="danger" sm onClick={(e)=>{e.stopPropagation(); onDelete(c.id);}}><Trash2 size={10}/></Btn></div></td></tr>;})}</tbody></table>}</div></>}{tab==="despesas"&&<><div style={{display:"justify-content:space-between;align-items:center;margin-bottom:16px"}}></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{display:"flex",gap:7}}>{["Todos","Fixa","Variável"].map(t=>pill(filtTipo===t,t,()=>setFiltTipo(t)))}</div><Btn onClick={()=>setEditDsp({})}><Plus size={13}/>Nova despesa</Btn></div>{dspFilt.filter(d=>d.tipo==="Fixa").length>0&&<><h3 style={{margin:"0 0 10px",fontSize:12,fontWeight:600,color:C.textSm,textTransform:"uppercase",letterSpacing:"0.09em"}}>💳 Despesas Fixas</h3><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,overflow:"hidden",marginBottom:18}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead style={{background:"#F8F4EF"}}><tr><th style={th}>Nome</th><th style={th}>Categoria</th><th style={{...th,textAlign:"center"}}>Vencimento</th><th style={{...th,textAlign:"right"}}>Valor/mês</th><th style={{...th,textAlign:"right"}}></th></tr></thead><tbody>{dspFilt.filter(d=>d.tipo==="Fixa").map(d=><tr key={d.id} style={{borderTop:"1px solid "+C.border}}><td style={{...td,fontWeight:500}}>{d.nome}</td><td style={{...td,fontSize:11}}><span style={{background:"#F2EDE6",color:C.accentDk,borderRadius:20,padding:"2px 8px"}}>{d.categoria}</span></td><td style={{...td,textAlign:"center",color:C.textSm}}>{"Dia "+d.dia}</td><td style={{...td,textAlign:"right",fontWeight:600,color:"#7A3838"}}>{fmtR(d.valor)}</td><td style={{...td,textAlign:"right"}}><div style={{display:"flex",gap:5,justifyContent:"flex-end"}}><Btn variant="secondary" sm onClick={()=>setEditDsp(d)}><Edit2 size={10}/></Btn><Btn variant="danger" sm onClick={(e)=>{e.stopPropagation(); delDsp(d.id);}}><Trash2 size={10}/></Btn></div></td></tr>)}<tr style={{borderTop:"2px solid "+C.border,background:"#F8F4EF"}}><td colSpan={3} style={{...td,fontWeight:600,fontSize:12}}>Total fixo / mês</td><td style={{...td,textAlign:"right",fontWeight:700,color:"#7A3838",fontSize:14}}>{fmtR(fixasMes)}</td><td></td></tr></tbody></table></div></>}{dspFilt.filter(d=>d.tipo==="Variável").length>0&&<><h3 style={{margin:"0 0 10px",fontSize:12,fontWeight:600,color:C.textSm,textTransform:"uppercase",letterSpacing:"0.09em"}}>📋 Despesas Variáveis</h3><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,overflow:"hidden",marginBottom:18}}><table style={{width:"100%",borderCollapse:"collapse"}}><thead style={{background:"#F8F4EF"}}><tr><th style={th}>Nome</th><th style={th}>Categoria</th><th style={{...th,textAlign:"right"}}>Data</th><th style={{...th,textAlign:"right"}}>Valor</th><th style={{...th,textAlign:"right"}}></th></tr></thead><tbody>{dspFilt.filter(d=>d.tipo==="Variável").map(d=><tr key={d.id} style={{borderTop:"1px solid "+C.border}}><td style={{...td,fontWeight:500}}>{d.nome}{d.obs&&<div style={{fontSize:11,color:C.textXs}}>{d.obs}</div>}</td><td style={{...td,fontSize:11}}><span style={{background:"#F2EDE6",color:C.accentDk,borderRadius:20,padding:"2px 8px"}}>{d.categoria}</span></td><td style={{...td,textAlign:"right",color:C.textSm}}>{fmtD(d.data)}</td><td style={{...td,textAlign:"right",fontWeight:600,color:"#7A5A18"}}>{fmtR(d.valor)}</td><td style={{...td,textAlign:"right"}}><div style={{display:"flex",gap:5,justifyContent:"flex-end"}}><Btn variant="secondary" sm onClick={()=>setEditDsp(d)}><Edit2 size={10}/></Btn><Btn variant="danger" sm onClick={(e)=>{e.stopPropagation(); delDsp(d.id);}}><Trash2 size={10}/></Btn></div></td></tr>)}</tbody></table></div></>}{dspFilt.length===0&&<div style={{textAlign:"center",padding:"3rem",color:C.textXs,background:C.card,border:"1px solid "+C.border,borderRadius:12}}>Nenhuma despesa cadastrada.</div>}</>}{editDsp&&<DspModal data={editDsp} onSave={saveDsp} onClose={()=>setEditDsp(null)}/>}</div>;}
function ConfigView({profile,onSave}:any){const[f,setF]=useState(profile);const[saving,setSaving]=useState(false);const s=(k,v)=>setF(p=>({...p,[k]:v}));const UFS=['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];return <div><h1 style={{margin:"0 0 0.2rem",fontSize:21,fontWeight:700,color:C.text}}>Configurações</h1><p style={{margin:"0 0 1.5rem",fontSize:13,color:C.textXs}}>Ajuste os dados do seu estúdio</p><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"1.5rem",maxWidth:700}}><h2 style={{margin:"0 0 1.25rem",fontSize:15,fontWeight:600,color:C.text}}>Perfil do Estúdio</h2><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}><div style={{gridColumn:"1/-1",marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Nome do Estúdio *</label><input style={IS} value={f.nome_estudio} onChange={e=>s("nome_estudio",e.target.value)}/></div><div style={{gridColumn:"1/-1",marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Nome do Profissional *</label><input style={IS} value={f.nome_profissional} onChange={e=>s("nome_profissional",e.target.value)}/></div><div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>CPF</label><input style={IS} value={f.cpf} onChange={e=>s("cpf",e.target.value)}/></div><div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>CNPJ</label><input style={IS} value={f.cnpj} onChange={e=>s("cnpj",e.target.value)}/></div><div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Telefone</label><input style={IS} value={f.telefone} onChange={e=>s("telefone",e.target.value)}/></div><div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>E-mail</label><input style={IS} value={f.email} onChange={e=>s("email",e.target.value)}/></div><div style={{gridColumn:"1/-1",marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Endereço</label><input style={IS} value={f.endereco} onChange={e=>s("endereco",e.target.value)}/></div><div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Cidade</label><input style={IS} value={f.cidade} onChange={e=>s("cidade",e.target.value)}/></div><div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>UF</label><select style={IS} value={f.uf} onChange={e=>s("uf",e.target.value)}><option value="">Selecione...</option>{UFS.map(u=><option key={u}>{u}</option>)}</select></div><div style={{gridColumn:"1/-1",marginBottom:20}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>URL do Logo</label><input style={IS} value={f.logo_url} onChange={e=>s("logo_url",e.target.value)} placeholder="https://..."/></div></div><Btn onClick={async()=>{setSaving(true);await onSave(f);setSaving(false);alert("Perfil atualizado!");}} disabled={saving}>{saving?"Salvando...":"Salvar alterações"}</Btn></div></div>;}

const VARS_C=[["{nome_cliente}","Nome"],["{cpf_cliente}","CPF"],["{estado_civil}","Estado civil"],["{nasc_cliente}","Nasc. mãe"],["{endereco_cliente}","Endereço"],["{telefone_cliente}","Telefone"],["{nome_experiencia}","Pacote"],["{quantidade_fotos}","Qtd fotos"],["{duracao}","Duração"],["{valor}","Valor"],["{entrada}","Entrada"],["{saldo}","Saldo"],["{forma_pagamento}","Forma pgto"],["{data_contrato}","Data contrato"]];

function AssinarModal({txt,cliente,mySig,onClose}:any){
  const [step,setStep]=useState(0);
  const [cSig,setCSig]=useState<string|null>(null);
  const print=()=>printSignedContract(txt,mySig,cSig);
  return (
    <Modal title="Assinatura digital" onClose={onClose} full>
      {step===0 ? (
        <>
          <div style={{background:"#F8F4EF",borderRadius:8,padding:"0.9rem",marginBottom:14}}>
            <p style={{margin:0,fontSize:12.5,color:"#7A5A18"}}>📄 Mostre este contrato para a cliente ler. Quando estiver pronta, clique em <b>Ir para assinatura</b>.</p>
          </div>
          <div style={{background:"#FDFBF8",border:"1px solid "+C.border,borderRadius:8,padding:"2rem",maxHeight:400,overflowY:"auto",fontFamily:"Georgia,serif",fontSize:12.5,lineHeight:1.85,marginBottom:16}}>
            {txt.split("\n").map((l:string,i:number)=><p key={i} style={{margin:"0 0 2px"}}>{l||<span>{"\u00a0"}</span>}</p>)}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="secondary" onClick={onClose}>Fechar</Btn>
            <Btn onClick={()=>setStep(1)}>✍️ Ir para assinatura</Btn>
          </div>
        </>
      ) : step===1 ? (
        <>
          <div style={{display:"flex",gap:32,marginBottom:20,flexWrap:"wrap"}}>
            <div style={{flex:1}}>
              <p style={{margin:"0 0 8px",fontSize:12,fontWeight:600,color:C.text}}>CONTRATADA (Brenda)</p>
              {mySig?<img src={mySig} style={{height:60,display:"block",border:"1px solid "+C.border,borderRadius:8,padding:8,background:"#FDFBF8"}} alt="sig"/>:<p style={{color:"#8A3838",fontSize:12}}>⚠️ Cadastre sua assinatura.</p>}
            </div>
            <div style={{flex:1}}>
              <p style={{margin:"0 0 8px",fontSize:12,fontWeight:600,color:C.text}}>CONTRATANTE ({cliente.nome})</p>
              {cSig?<><img src={cSig} style={{height:60,display:"block",border:"1px solid "+C.border,borderRadius:8,padding:8,background:"#FDFBF8"}} alt="cliSig"/><Btn variant="secondary" sm onClick={()=>setCSig(null)}>Refazer</Btn></> : <SigPad onSave={setCSig} label="A cliente assina aqui:"/>}
            </div>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <Btn variant="secondary" onClick={()=>setStep(0)}>Voltar</Btn>
            <Btn onClick={()=>setStep(2)} disabled={!cSig}>✅ Confirmar</Btn>
          </div>
        </>
      ) : (
        <div style={{textAlign:"center",padding:"2rem"}}>
          <p style={{fontSize:36,margin:"0 0 12px"}}>✅</p>
          <p style={{fontSize:16,fontWeight:600,color:C.text,margin:"0 0 8px"}}>Contrato Assinado!</p>
          <p style={{fontSize:13,color:C.textSm,margin:"0 0 24px"}}>As assinaturas foram aplicadas ao documento.</p>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <Btn variant="secondary" onClick={onClose}>Fechar</Btn>
            <Btn onClick={print}><Printer size={14}/>Imprimir / Salvar PDF</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ContratosView({clients,contracts,templates,setTemplates,signature,setSignature,servicos=[],setServicos,setConfMod}:any){const[tab,setTab]=useState("modelo");const[srv,setSrv]=useState(servicos[0]||"");const[tpl,setTpl]=useState(templates[servicos[0]]||"");const[saved,setSaved]=useState(false);const[showMgr,setShowMgr]=useState(false);const[selCid,setSelCid]=useState("");const[selKid,setSelKid]=useState("");const[selSrv2,setSelSrv2]=useState(servicos[0]||"");const[prev,setPrev]=useState(null);const[sigMod,setSigMod]=useState(null);useEffect(()=>setTpl(templates[srv]||""),[srv,templates]);const cks=useMemo(()=>contracts.filter(c=>c.cid===selCid),[contracts,selCid]);const selCl=clients.find(c=>c.id===selCid);const selCt=contracts.find(c=>c.id===selKid);const saveTpl=()=>{setTemplates(p=>({...p,[srv]:tpl}));setSaved(true);setTimeout(()=>setSaved(false),2000);};const gerar=()=>{if(!selCl)return;const m=selCt?templates[selCt.srv]:templates[selSrv2];setPrev(fillTpl(m||"",selCl,selCt||null));};const tabSt=id=>({padding:"0.45rem 1.1rem",fontSize:13,border:"none",background:tab===id?C.card:"transparent",color:tab===id?C.accentDk:C.textSm,borderRadius:8,cursor:"pointer",fontWeight:tab===id?600:400,borderBottom:tab===id?"2px solid "+C.accent:"2px solid transparent"});const srvSt=id=>({padding:"0.3rem 0.8rem",fontSize:11,borderRadius:20,border:"1px solid "+(srv===id?C.accent:C.border),background:srv===id?C.accentLt:C.card,color:srv===id?C.accentDk:C.textSm,cursor:"pointer",fontWeight:srv===id?600:400});return <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.3rem"}}><h1 style={{margin:0,fontSize:21,fontWeight:700,color:C.text}}>Contratos</h1>{tab==="modelo"&&<Btn variant="secondary" sm onClick={()=>setShowMgr(true)}><Edit2 size={12}/>Gerenciar serviços</Btn>}</div><p style={{margin:"0 0 1.5rem",fontSize:13,color:C.textXs}}>Modelo por serviço, assinatura e geração</p>{showMgr&&<SrvModal servicos={servicos} setServicos={setServicos} templates={templates} setTemplates={setTemplates} setConfMod={setConfMod} onClose={()=>setShowMgr(false)}/>}<div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid "+C.border}}>{[["modelo","Modelo"],["assinatura","Minha assinatura"],["gerar","Gerar contrato"]].map(([id,l])=><button key={id} style={tabSt(id)} onClick={()=>setTab(id)}>{l}</button>)}</div>{tab==="modelo"&&<div style={{display:"grid",gridTemplateColumns:"1fr 230px",gap:18}}><div><div style={{display:"flex",gap:7,marginBottom:12,flexWrap:"wrap"}}>{servicos.map(s=><button key={s} style={srvSt(s)} onClick={()=>setSrv(s)}>{s}</button>)}</div><textarea value={tpl} onChange={e=>setTpl(e.target.value)} style={{...IS,minHeight:480,resize:"vertical",fontFamily:"Georgia,serif",fontSize:12.5,lineHeight:1.8}}/><div style={{display:"flex",gap:10,marginTop:10,alignItems:"center"}}><Btn onClick={saveTpl}>Salvar</Btn>{saved&&<span style={{fontSize:12,color:"#3D6B42"}}>✓ Salvo</span>}</div></div><div style={{background:"#F8F4EF",borderRadius:10,padding:"1rem",height:"fit-content"}}><p style={{margin:"0 0 10px",fontSize:11,fontWeight:600,color:C.textSm,textTransform:"uppercase"}}>Variáveis</p>{VARS_C.map(([v,d])=><div key={v} style={{marginBottom:7}}><code style={{fontSize:10,background:"#EDE8DF",padding:"2px 6px",borderRadius:4,color:C.accentDk,display:"block",marginBottom:1}}>{v}</code><span style={{fontSize:10.5,color:C.textXs}}>{d}</span></div>)}</div></div>}{tab==="assinatura"&&<div style={{maxWidth:500}}>{signature?<div><p style={{margin:"0 0 10px",fontSize:13,color:C.textSm}}>Assinatura atual:</p><div style={{border:"1px solid "+C.border,borderRadius:8,padding:"1rem",background:"#FDFBF8",display:"inline-block",marginBottom:14}}><img src={signature} style={{height:68,display:"block"}} alt="sig"/></div><div><Btn variant="secondary" sm onClick={()=>setSignature(null)}>Trocar</Btn></div></div>:<SigOptions onSave={setSignature}/>}</div>}{tab==="gerar"&&<div style={{maxWidth:540}}><div style={{background:C.card,border:"1px solid "+C.border,borderRadius:12,padding:"1.5rem"}}><div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Cliente *</label><select style={IS} value={selCid} onChange={e=>{setSelCid(e.target.value);setSelKid("");}}><option value="">Selecione...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>{selCid&&<div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Sessão</label><select style={IS} value={selKid} onChange={e=>setSelKid(e.target.value)}><option value="">Sem sessão específica</option>{cks.map(k=><option key={k.id} value={k.id}>{k.srv+(k.nomeExp?" · "+k.nomeExp:"")} · {fmtD(k.ds)} · {fmtR(k.val)}</option>)}</select></div>}{selCid&&!selKid&&<div style={{marginBottom:13}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Modelo</label><select style={IS} value={selSrv2} onChange={e=>setSelSrv2(e.target.value)}>{servicos.map(s=><option key={s}>{s}</option>)}</select></div>}{!signature&&<div style={{background:"#FDF8EE",border:"1px solid #E8D898",borderRadius:8,padding:"0.75rem 1rem",marginBottom:14}}><p style={{margin:0,fontSize:12,color:"#7A5A18"}}>Cadastre sua assinatura na aba <b>Minha assinatura</b>.</p></div>}<Btn onClick={gerar} disabled={!selCid}><FileText size={13}/>Visualizar contrato</Btn></div></div>}{prev&&<Modal title="Contrato gerado" onClose={()=>setPrev(null)} wide><div style={{background:"#FDFBF8",border:"1px solid "+C.border,borderRadius:8,padding:"2rem",marginBottom:16,fontFamily:"Georgia,serif",fontSize:12.5,lineHeight:1.85,maxHeight:420,overflowY:"auto"}}>{prev.split("\n").map((l,i)=><p key={i} style={{margin:"0 0 2px",whiteSpace:"pre-wrap"}}>{l||<span>{"\u00a0"}</span>}</p>)}<div style={{display:"flex",gap:60,marginTop:36,paddingTop:16,borderTop:"1px solid "+C.border}}><div><p style={{margin:"0 0 4px",fontWeight:"bold",fontSize:12}}>CONTRATADA:</p><p style={{margin:"0 0 4px",fontSize:12}}>Brenda Santos Monteiro<br/>Brenda Monteiro Photography</p>{signature?<img src={signature} style={{height:48,display:"block",marginTop:4}} alt="sig"/>:<div style={{borderBottom:"1px solid #000",width:180,marginTop:28}}/>}</div><div><p style={{margin:"0 0 4px",fontWeight:"bold",fontSize:12}}>CONTRATANTE:</p><div style={{borderBottom:"1px solid #000",width:200,marginTop:28}}/><p style={{margin:"6px 0 0",fontSize:10,color:"#999"}}>Assinatura da contratante</p></div></div></div><div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={()=>setPrev(null)}>Fechar</Btn>{selCl&&<Btn variant="secondary" onClick={()=>setSigMod({txt:prev,cl:selCl})}><Pen size={13}/>Assinatura digital</Btn>}<Btn onClick={()=>printContract(prev,signature)}><Printer size={13}/>Imprimir/PDF</Btn></div></Modal>}{sigMod&&<AssinarModal txt={sigMod.txt} cliente={sigMod.cl} mySig={signature} onClose={()=>setSigMod(null)}/>}</div>;}

function SrvModal({servicos,setServicos,templates,setTemplates,setConfMod,onClose}:any){const[list,setList]=useState([...servicos]);const[ei,setEi]=useState(null);const[ev,setEv]=useState("");const[ns,setNs]=useState("");const confirmE=i=>{const o=list[i],n=ev.trim();if(!n||n===o){setEi(null);return;}setList(list.map((s,j)=>j===i?n:s));setTemplates(p=>{const x={...p};if(x[o]){x[n]=x[o];delete x[o];}return x;});setEi(null);};const del=i=>{
  const n=list[i];
  if(list.length<=1) return;
  setConfMod({
    title: "Excluir serviço",
    msg: "Deseja realmente excluir o serviço '"+n+"' dos modelos?",
    onConfirm: () => {
      setList(list.filter((_,j)=>j!==i));
      setTemplates(p=>{const x={...p};delete x[n];return x;});
      if(ei===i)setEi(null);
    }
  });
};const add=()=>{const n=ns.trim();if(!n||list.includes(n))return;setList(p=>[...p,n]);setTemplates(p=>({...p,[n]:mkTpl("Gestante")}));setNs("");};const mv=(i,d)=>{const j=i+d;if(j<0||j>=list.length)return;const a=[...list];[a[i],a[j]]=[a[j],a[i]];setList(a);};return <Modal title="Gerenciar serviços" onClose={onClose}><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>{list.map((s,i)=><div key={i} style={{border:"1px solid "+C.border,borderRadius:9,padding:"0.7rem 1rem",background:"#FDFBF8",display:"flex",alignItems:"center",gap:10}}><span>📋</span>{ei===i?<input autoFocus value={ev} onChange={e=>setEv(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")confirmE(i);if(e.key==="Escape")setEi(null);}} style={{...IS,flex:1,padding:"0.35rem 0.6rem"}}/>:<span style={{flex:1,fontSize:13,fontWeight:500,color:C.text}}>{s}</span>}<div style={{display:"flex",gap:5}}>{ei===i?<Btn sm onClick={()=>confirmE(i)}>✓</Btn>:<><button onClick={()=>mv(i,-1)} disabled={i===0} style={{background:"none",border:"1px solid "+C.border,borderRadius:5,padding:"3px 7px",fontSize:11,cursor:i===0?"default":"pointer",color:C.textSm}}>↑</button><button onClick={()=>mv(i,1)} disabled={i===list.length-1} style={{background:"none",border:"1px solid "+C.border,borderRadius:5,padding:"3px 7px",fontSize:11,cursor:i===list.length-1?"default":"pointer",color:C.textSm}}>↓</button><Btn variant="secondary" sm onClick={()=>{setEi(i);setEv(s);}}><Edit2 size={10}/>Renomear</Btn><Btn variant="danger" sm onClick={(e)=>{e.stopPropagation(); del(i);}} disabled={list.length<=1}><Trash2 size={10}/></Btn></>}</div></div>)}</div><div style={{background:"#F8F4EF",borderRadius:9,padding:"0.9rem",marginBottom:18}}><p style={{margin:"0 0 8px",fontSize:12,fontWeight:600,color:C.text}}>Novo serviço</p><div style={{display:"flex",gap:8}}><input value={ns} onChange={e=>setNs(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Ex: Família..." style={{...IS,flex:1}}/><Btn onClick={add} disabled={!ns.trim()||list.includes(ns.trim())}><Plus size={12}/>Adicionar</Btn></div></div><div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={()=>{setServicos(list);onClose();}}>Salvar</Btn></div></Modal>;}

function EtapasModal({etapas,setEtapas,contracts,setContracts,setConfMod,onClose,isLead}:any){const[list,setList]=useState(etapas.map(e=>({...e})));const[ei,setEi]=useState(null);const[nl,setNl]=useState("");const upd=(i,k,v)=>setList(p=>p.map((e,j)=>j===i?{...e,[k]:v}:e));const del=i=>{
  if(list.length<=1)return;
  const et=list[i];
  setConfMod({
    title: "Excluir etapa",
    msg: "Deseja realmente excluir a etapa '"+et.label+"'? Todos os cards desta etapa serão movidos para a primeira etapa.",
    onConfirm: () => {
      const fb=list.find((_,j)=>j!==i)?.id||"";
      setContracts(p=>p.map(c=>c.etapa===et.id?{...c,etapa:fb}:c));
      setList(p=>p.filter((_,j)=>j!==i));
      if(ei===i)setEi(null);
    }
  });
};const add=()=>{if(!nl.trim())return;const col=COL_OPTS[list.length%COL_OPTS.length];setList(p=>[...p,{id:uid(),label:nl.trim(),icon:isLead?"💬":"",movesTo:[],converts:false,...col}]);setNl("");};const mv=(i,d)=>{const j=i+d;if(j<0||j>=list.length)return;const a=[...list];[a[i],a[j]]=[a[j],a[i]];setList(a);};
const[saving,setSaving]=useState(false);
const[error,setError]=useState<string|null>(null);
const handleSave=async()=>{
  setSaving(true);
  setError(null);
  try {
    await setEtapas([...list]);
    onClose();
  } catch(e:any) {
    setError(e.message || "Erro desconhecido ao salvar");
  } finally {
    setSaving(false);
  }
};
return <Modal title={isLead?"Gerenciar etapas (Leads)":"Gerenciar etapas (Cliente)"} onClose={onClose} wide><div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>{list.map((e,i)=><div key={e.id} style={{border:"1px solid "+C.border,borderRadius:10,padding:"1rem",background:"#FDFBF8"}}>{ei===i?<div><div style={{display:"flex",gap:12,marginBottom:14}}>{isLead&&<div style={{width:60}}><label style={{display:"block",fontSize:11,color:C.textSm,marginBottom:4,fontWeight:600}}>Ícone</label><input style={{...IS,textAlign:"center",fontSize:18}} value={e.icon} onChange={ev=>upd(i,"icon",ev.target.value)}/></div>}<div style={{flex:1}}><label style={{display:"block",fontSize:11,color:C.textSm,marginBottom:4,fontWeight:600}}>Nome da Etapa</label><input style={IS} autoFocus value={e.label} onChange={ev=>upd(i,"label",ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&setEi(null)}/></div></div><div style={{background:"#F8F4EF",padding:"12px",borderRadius:8,marginBottom:14}}><label style={{display:"block",fontSize:11,color:C.textSm,marginBottom:8,fontWeight:700,textTransform:"uppercase"}}>Pode mover para:</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{list.map(target=>target.id!==e.id&&<label key={target.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.text,cursor:"pointer"}}><input type="checkbox" checked={(e.movesTo||[]).includes(target.id)} onChange={ev=>{const cur=e.movesTo||[];const next=ev.target.checked?[...cur,target.id]:cur.filter(x=>x!==target.id);upd(i,"movesTo",next);}}/>{target.label}</label>)}</div></div>{isLead&&<div style={{marginBottom:14,padding:"8px 12px",background:"#E6EFE7",borderRadius:8,display:"flex",alignItems:"center",gap:8}}><input type="checkbox" id={"conv"+e.id} checked={!!e.converts} onChange={ev=>upd(i,"converts",ev.target.checked)}/><label htmlFor={"conv"+e.id} style={{fontSize:12,fontWeight:600,color:"#3D6B42",cursor:"pointer"}}>Esta etapa permite converter em Cliente?</label></div>}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{display:"flex",gap:7}}>{COL_OPTS.map((o,ci)=><button key={ci} onClick={()=>{upd(i,"color",o.color);upd(i,"bg",o.bg);}} style={{width:24,height:24,borderRadius:"50%",background:o.color,border:e.color===o.color?"3px solid #333":"2px solid transparent",cursor:"pointer"}}/>)}</div><Btn sm onClick={()=>setEi(null)}>✓ Concluído</Btn></div></div>:<div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:20}}>{e.icon}</span><span style={{width:12,height:12,borderRadius:"50%",background:e.color,display:"inline-block",flexShrink:0}}/><div style={{flex:1}}><p style={{margin:0,fontSize:14,fontWeight:600,color:C.text}}>{e.label}</p><p style={{margin:0,fontSize:10,color:C.textXs}}>{(e.movesTo||[]).length===0?"⚠️ Nenhuma saída definida":"Saídas: "+(e.movesTo||[]).length}{isLead&&e.converts&&" · 🚀 Converte para Cliente"}</p></div>{!isLead&&<span style={{fontSize:11,background:e.bg,color:e.color,borderRadius:20,padding:"3px 10px",fontWeight:700}}>{contracts.filter(c=>(c.etapa||"agendado")===e.id).length}</span>}<div style={{display:"flex",gap:5}}><button onClick={()=>mv(i,-1)} disabled={i===0} style={{background:"none",border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:i===0?"default":"pointer",color:C.textSm}}>↑</button><button onClick={()=>mv(i,1)} disabled={i===list.length-1} style={{background:"none",border:"1px solid "+C.border,borderRadius:6,padding:"4px 8px",fontSize:11,cursor:i===list.length-1?"default":"pointer",color:C.textSm}}>↓</button><Btn variant="secondary" sm onClick={()=>setEi(i)}><Edit2 size={11}/></Btn><Btn variant="danger" sm onClick={(e)=>{e.stopPropagation(); del(i);}} disabled={list.length<=1}><Trash2 size={11}/></Btn></div></div>}</div>)}</div><div style={{background:"#F8F4EF",borderRadius:10,padding:"1rem",marginBottom:18}}><p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:C.text}}>Adicionar nova etapa</p><div style={{display:"flex",gap:8}}><input value={nl} onChange={e=>setNl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Nome da etapa..." style={{...IS,flex:1}}/><Btn onClick={add} disabled={!nl.trim()}><Plus size={14}/>Adicionar</Btn></div></div>{error&&<div style={{background:"#FDEAEA",border:"1px solid #DFB8B8",borderRadius:8,padding:"10px",marginBottom:18,color:"#8A3838",fontSize:12,display:"flex",gap:8,alignItems:"flex-start"}}><span style={{fontSize:16}}>⚠️</span><div><p style={{margin:"0 0 4px",fontWeight:700}}>Erro ao salvar:</p><p style={{margin:0,fontFamily:"monospace"}}>{error}</p></div></div>}<div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Btn><Btn onClick={handleSave} disabled={saving}>{saving?"Salvando...":"Salvar Configurações"}</Btn></div></Modal>;}

function JornadaView({clients,contracts,favorecidos=[],setContracts,go,etapas,setEtapas,setConfMod,onEditK,onShowH}:any){const cmap=useMemo(()=>Object.fromEntries(clients.map(c=>[c.id,c])),[clients]);const[showMgr,setShowMgr]=useState(false);  const getL=c=>c.etapa||etapas[0]?.id||"agendado";
  const mv=(id,et)=>{
    const card = contracts.find(c=>c.id===id);
    if(!card) return;
    const currentLane = etapas.find(e=>e.id===getL(card));
    const allowed = currentLane?.movesTo || [];
    
    if(!allowed.includes(et) && et !== getL(card)) return; // Bloqueia se não permitido
    
    const targetLane = etapas.find(e=>e.id===et);
    const log = {
      id: uid(),
      data: new Date().toISOString(),
      tipo: "movimentacao",
      msg: `Jornada: Movido para "${targetLane?.label || "Fim"}"`,
      de: currentLane?.id,
      para: et
    };

    const updated = {...card, etapa:et, historico:[...(card.historico||[]), log]};
    upsertContrato(updated).catch(()=>{});
    setContracts(p=>p.map(c=>c.id===id?updated:c));
  };const renderCard=(c,lane,lanes,onMove)=>{
    const cl=cmap[c.cid];
    const ini=cl?.nome.split(" ").slice(0,2).map(n=>n[0]).join("").toUpperCase()||"?";
    const sl=Number(c.val||0)-Number(c.ent||0);
    const moves = lane.movesTo || [];
    
    // Resolve o nome do favorecido para exibição
    const fv = (c.favorecido_id && favorecidos) ? favorecidos.find(f => f.id === c.favorecido_id) : null;
    const fvName = fv ? fv.nome : cl?.favorecido;

    return <div style={{background:C.card,borderRadius:9,padding:"0.8rem",boxShadow:"0 1px 4px rgba(0,0,0,0.07)",cursor:"grab",border:"1px solid "+C.border,userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:C.accentLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.accentDk,flexShrink:0}}>{ini}</div>
        <div style={{flex:1}}><p style={{margin:0,fontSize:12.5,fontWeight:600,color:C.text,lineHeight:1.2}}>{cl?.nome||"—"}</p>{fvName&&<p style={{margin:0,fontSize:10.5,color:C.textXs}}>{"👤 "+fvName}</p>}</div>
        <button onClick={()=>go("clientes",cl)} style={{background:"none",border:"1px solid "+C.border,borderRadius:6,padding:"2px 6px",cursor:"pointer",color:C.textSm,fontSize:10}}><Edit2 size={9}/>Ver</button>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:11,background:"#F2EDE6",color:C.accentDk,borderRadius:20,padding:"2px 8px",fontWeight:600}}>{c.srv}</span>
        <span style={{fontSize:10.5,color:C.textXs}}>{"📅 "+fmtD(c.ds)}</span>
      </div>
      <div style={{borderTop:"1px solid "+C.border,paddingTop:6,display:"flex",justifyContent:"space-between",marginBottom:7}}>
        <span style={{fontSize:10.5,color:C.textSm}}>{fmtR(c.val)}</span>
        {sl>0?<span style={{fontSize:10.5,color:"#7A5A18",fontWeight:600}}>{"Saldo: "+fmtR(sl)}</span>:<span style={{fontSize:10.5,color:"#3D6B42",fontWeight:600}}>Quitado</span>}
      </div>
      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
        {lanes.filter(e=>moves.includes(e.id)).map(e=><button key={e.id} onClick={()=>onMove(c.id,e.id)} style={{fontSize:9.5,padding:"2px 6px",borderRadius:20,border:"1px solid "+e.color+"40",background:e.bg,color:e.color,cursor:"pointer",whiteSpace:"nowrap"}}>{"→ "+e.label.split(" ")[0]}</button>)}
        <button onClick={()=>onShowH(c)} style={{background:"none",border:"1px solid "+C.border,borderRadius:20,padding:"2px 8px",fontSize:9.5,cursor:"pointer",color:C.textSm}}>🕒 Histórico</button>
      </div>
    </div>;
  };return <div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.3rem"}}><h1 style={{margin:0,fontSize:21,fontWeight:700,color:C.text}}>Jornada do Cliente</h1><Btn variant="secondary" sm onClick={()=>setShowMgr(true)}><Edit2 size={12}/>Gerenciar etapas</Btn></div><p style={{margin:"0 0 1.5rem",fontSize:13,color:C.textXs}}>Arraste os cards entre as etapas</p>{showMgr&&<EtapasModal etapas={etapas} setEtapas={setEtapas} contracts={contracts} setContracts={setContracts} setConfMod={setConfMod} onClose={()=>setShowMgr(false)} isLead={false}/>}<KanbanBoard lanes={etapas} cards={contracts.filter(c=>c.st!=="Cancelado")} getLane={getL} onMove={mv} renderCard={renderCard}/></div>;}

function FollowBadge({data}){if(!data)return null;const hoje=todayS();const eH=data===hoje;const at=!eH&&!(data>hoje);const cor=at?"#8A3838":eH?"#7A5A18":"#2F5480";const bg=at?"#F8EAEA":eH?"#FDF8EE":"#E8EFF8";return <span style={{display:"inline-flex",alignItems:"center",gap:4,color:cor,fontWeight:600,background:bg,borderRadius:20,padding:"2px 8px",fontSize:10.5}}>{"🔔 "+fmtD(data)+(at?" · Atrasado!":eH?" · Hoje!":"")}</span>;}

function LeadsView({leads,setLeads,servicos,services=[],leadEtapas=[],setLeadEtapas,onConvert,setConfMod,onShowH}:any){
  const[add,setAdd]=useState(false);
  const[edit,setEdit]=useState(null);
  const[conv,setConv]=useState(null);
  const[aviso,setAviso]=useState(null);
  const[showMgr,setShowMgr]=useState(false);

  const LF = [
    {key:"nome",label:"Nome do Lead *",ph:"Nome completo",full:true},
    {key:"tel",label:"Telefone",ph:"(71) 99999-9999",mask:maskPhone},
    {key:"email",label:"E-mail",ph:"email@exemplo.com"},
    {key:"servico",label:"Serviço de interesse",ph:"Ex: Newborn, Gestante..."},
    {key:"valor",label:"Valor estimado (R$)",type:"number"},
    {key:"origem",label:"Origem",type:"select",opts:ORIGENS,blank:"Selecione"},
    {key:"proximoFollowup",label:"Próximo Follow-up",type:"date"},
    {key:"obs",label:"Observações",type:"textarea",full:true}
  ];

  const dias=d=>Math.floor((new Date()-new Date(d+"T12:00:00"))/(1000*60*60*24));
  const tot=leads.length,fe=leads.filter(l=>l.etapa==="fechado").length,pe=leads.filter(l=>l.etapa==="perdido").length;

  const mv=(id,et)=>{
    const lead=leads.find(l=>l.id===id);
    if(!lead) return;
    const currentLane = leadEtapas.find(e=>e.id===(lead.etapa||leadEtapas[0]?.id));
    const allowed = currentLane?.movesTo || [];
    
    if(!allowed.includes(et) && et !== lead.etapa) return; // Bloqueia se não permitido

    const target = leadEtapas.find(e=>e.id===et);
    const log = {
      id: uid(),
      data: new Date().toISOString(),
      tipo: "movimentacao",
      msg: `Movido de "${currentLane?.label || "Início"}" para "${target?.label || "Fim"}"`,
      de: currentLane?.id,
      para: et
    };

    setLeads(p=>p.map(l=>l.id===id?{...l,etapa:et,historico:[...(l.historico||[]),log]}:l));
    if(target?.converts) setAviso(lead);
  };

  const save = d => {
    const old = leads.find(l => l.id === d.id);
    let logs = [...(d.historico || [])];
    if (old) {
      if (old.etapa !== d.etapa) {
        const target = leadEtapas.find(e => e.id === d.etapa);
        logs.push({ id: uid(), data: new Date().toISOString(), tipo: "evento", msg: `Etapa alterada para "${target?.label || d.etapa}"` });
      }
      if (Number(old.valor) !== Number(d.valor)) {
        logs.push({ id: uid(), data: new Date().toISOString(), tipo: "evento", msg: `Valor estimado alterado de ${fmtR(old.valor)} para ${fmtR(d.valor)}` });
      }
    } else {
      logs.push({ id: uid(), data: new Date().toISOString(), tipo: "evento", msg: "Lead criado" });
    }
    const registro = { ...d, historico: logs };
    setLeads(p => d.id ? p.map(l => l.id === d.id ? registro : l) : [...p, { ...registro, id: uid() }]);
    setAdd(false);
    setEdit(null);
  };
  const del=id=>{
    setConfMod({
      title: "Excluir lead",
      msg: "Deseja realmente excluir este lead?",
      onConfirm: () => setLeads(p=>p.filter(l=>l.id!==id))
    });
  };

  const renderCard=(l:any,lane:any,lanes:any,onMove:any)=>{
    const moves = lane.movesTo || [];
    const canConv = !!lane.converts;
    
    return (
      <div style={{background:C.card,borderRadius:9,padding:"0.8rem",boxShadow:"0 1px 4px rgba(0,0,0,0.07)",cursor:"grab",border:"1px solid "+(canConv?"#C4A882":C.border),userSelect:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
          <div style={{flex:1}}><p style={{margin:0,fontSize:12.5,fontWeight:600,color:C.text,lineHeight:1.3}}>{l.nome}</p>{l.origem&&<span style={{fontSize:10,color:C.textXs}}>{"via "+l.origem}</span>}</div>
          <div style={{display:"flex",gap:3,flexShrink:0,marginLeft:4}}>
            <button onClick={()=>setEdit(l)} style={{background:"none",border:"1px solid "+C.border,borderRadius:5,padding:"2px 5px",cursor:"pointer",color:C.textSm}}><Edit2 size={9}/></button>
            <button onClick={(e)=>{e.stopPropagation(); del(l.id);}} style={{background:"none",border:"1px solid #DFB8B8",borderRadius:5,padding:"2px 5px",cursor:"pointer",color:"#8A3838"}}><Trash2 size={9}/></button>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:8,fontSize:11,color:C.textSm}}>
          {l.tel&&<span>{"📱 "+l.tel}</span>}
          {l.servico&&<span>{"🎯 "+l.servico}</span>}
          {Number(l.valor)>0&&<span>{"💰 "+fmtR(l.valor)}</span>}
          <FollowBadge data={l.proximoFollowup}/>
          {l.obs&&<p style={{margin:"2px 0 0",fontSize:10.5,color:C.textXs,fontStyle:"italic"}}>{l.obs}</p>}
        </div>
        {canConv&&<div style={{background:"#FDF8EE",border:"1px solid #E8D898",borderRadius:6,padding:"5px 8px",marginBottom:6}}><p style={{margin:0,fontSize:10,color:"#7A5A18",fontWeight:500}}>🎉 Pronto para fechar! Clique em <b>→ Cliente</b>.</p></div>}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:6,borderTop:"1px solid "+C.border,marginBottom:7}}>
          <span style={{fontSize:10,color:C.textXs}}>{dias(l.dataCriacao)+" dias"}</span>
          {(canConv && l.etapa!=="fechado") && <button onClick={()=>setConv(l)} style={{fontSize:10,padding:"3px 9px",borderRadius:20,border:"1px solid #3D6B42",background:"#E6EFE7",color:"#3D6B42",cursor:"pointer",fontWeight:600}}>→ Cliente</button>}
        </div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {lanes.filter((e:any)=>moves.includes(e.id)).map((e:any)=><button key={e.id} onClick={()=>onMove(l.id,e.id)} title={e.label} style={{fontSize:9,padding:"2px 5px",borderRadius:20,border:"1px solid "+e.color+"40",background:e.bg,color:e.color,cursor:"pointer"}}>{e.icon}</button>)}
          <button onClick={()=>onShowH(l)} style={{background:"none",border:"1px solid "+C.border,borderRadius:20,padding:"2px 8px",fontSize:9,cursor:"pointer",color:C.textSm}}>🕒 Histórico</button>
        </div>
      </div>
    );
  };

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"1rem"}}>
      <div><h1 style={{margin:"0 0 0.2rem",fontSize:21,fontWeight:700,color:C.text}}>Jornada do Lead</h1><p style={{margin:0,fontSize:13,color:C.textXs}}>Do primeiro contato ao fechamento</p></div>
      <div style={{display:"flex",gap:8}}>
        <Btn variant="secondary" sm onClick={()=>setShowMgr(true)}><Edit2 size={12}/>Gerenciar etapas</Btn>
        <Btn onClick={()=>setAdd(true)}><Plus size={13}/>Novo lead</Btn>
      </div>
    </div>
    <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
      {[["Ativos",tot-fe-pe,C.text],["Fechados",fe,"#3D6B42"],["Não fecharam",pe,"#7A3838"],["Conversão",(tot>0?Math.round((fe/tot)*100):0)+"%",fe/tot>=0.5?"#3D6B42":"#7A5A18"]].map(([l,v,c])=><div key={l} style={{background:C.card,border:"1px solid "+C.border,borderRadius:10,padding:"0.9rem 1.1rem",flex:1,minWidth:110}}><p style={{margin:0,fontSize:10,color:C.textXs,textTransform:"uppercase"}}>{l}</p><p style={{margin:"4px 0 0",fontSize:20,fontWeight:700,color:c}}>{v}</p></div>)}
    </div>
    <KanbanBoard lanes={leadEtapas} cards={leads} getLane={l=>l.etapa} onMove={mv} renderCard={renderCard} extraLaneStyle={lane=>(lane.id==="fechado"||lane.id==="perdido")?{border:"2px solid "+lane.color+"50"}:{}}/>
    {showMgr&&<EtapasModal etapas={leadEtapas} setEtapas={setLeadEtapas} contracts={leads} setContracts={setLeads} setConfMod={setConfMod} onClose={()=>setShowMgr(false)} isLead={true}/>}
    {add&&<LeadFormModal data={{etapa:"contato",dataCriacao:todayS()}} isEdit={false} servicos={servicos} services={services} leadEtapas={leadEtapas} onSave={save} onClose={()=>setAdd(false)}/>}
    {edit&&<LeadFormModal data={edit} isEdit={true} servicos={servicos} services={services} leadEtapas={leadEtapas} onSave={save} onClose={()=>setEdit(null)}/>}
    {conv&&<Modal title="Converter em cliente" onClose={()=>setConv(null)}>
      <div style={{textAlign:"center",padding:"1rem 0"}}>
        <p style={{fontSize:32,margin:"0 0 10px"}}>🎉</p>
        <p style={{fontSize:15,fontWeight:600,color:C.text,margin:"0 0 8px"}}>{conv.nome+" fechou!"}</p>
        <p style={{fontSize:13,color:C.textSm,margin:"0 0 20px"}}>O lead será convertido em cliente e um card criado na primeira etapa da Jornada do Cliente.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}><Btn variant="secondary" onClick={()=>setConv(null)}>Agora não</Btn><Btn onClick={()=>{onConvert(conv);setConv(null);}}>Converter em cliente</Btn></div>
      </div>
    </Modal>}
    {aviso&&<Modal title="🎉 Lead pronto para fechar!" onClose={()=>setAviso(null)}>
      <div style={{textAlign:"center",padding:"1rem 0"}}>
        <p style={{fontSize:36,margin:"0 0 10px"}}>✍️</p>
        <p style={{fontSize:15,fontWeight:600,color:C.text,margin:"0 0 8px"}}>{aviso.nome}</p>
        <p style={{fontSize:13,color:C.textSm,margin:"0 0 6px"}}>Este lead chegou à penúltima etapa da jornada.</p>
        <p style={{fontSize:13,color:C.textSm,margin:"0 0 20px"}}>Quando o contrato for assinado, clique em <b>→ Cliente</b> no card para convertê-lo e criar automaticamente um card na Jornada do Cliente.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <Btn variant="secondary" onClick={()=>setAviso(null)}>Entendi, farei depois</Btn>
          <Btn onClick={()=>{onConvert(aviso);setAviso(null);}}>→ Converter agora</Btn>
        </div>
      </div>
    </Modal>}
  </div>;
}


function Timeline({history=[]}:any){
  if(!history || history.length===0) return <div style={{textAlign:"center",padding:"2rem",color:C.textXs,background:"#FDFBF8",borderRadius:10,border:"1px dashed "+C.border}}>Nenhum registro no histórico ainda.</div>;
  return <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:300,overflowY:"auto",padding:"5px"}}>{history.slice().reverse().map((h:any)=><div key={h.id} style={{display:"flex",gap:12,position:"relative"}}><div style={{display:"flex",flexDirection:"column",alignItems:"center"}}><div style={{width:10,height:10,borderRadius:"50%",background:h.tipo==="movimentacao"?C.accentDk:"#3D6B42",zIndex:2}}/><div style={{width:2,flex:1,background:C.border,marginTop:2,marginBottom:2}}/></div><div style={{flex:1,paddingBottom:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3}}><span style={{fontSize:12,fontWeight:700,color:C.text}}>{h.tipo==="movimentacao"?"🔄 Movimentação":"ℹ️ Evento"}</span><span style={{fontSize:10,color:C.textXs}}>{new Date(h.data).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</span></div><p style={{margin:0,fontSize:11.5,color:C.textSm,lineHeight:1.4}}>{h.msg}</p></div></div>)}</div>;
}

function LeadFormModal({data,isEdit,servicos=[],services=[],leadEtapas=[],onSave,onClose}:any){
  const[tab,setTab]=useState("dados");
  const[f,setF]=useState({nome:"",tel:"",email:"",servico:servicos[0]||"",origem:"Instagram",valor:"",etapa:"contato",proximoFollowup:"",favorecido:"",obs:"",dataCriacao:todayS(),historico:[],...data});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  
  const srvOpts = services.length > 0 ? services.map(s => s.nome) : servicos;

  const fields=[{key:"nome",label:"Cliente (Contratante) *",ph:"Nome do lead",full:true},{key:"tel",label:"Telefone",ph:"(71) 99999-9999"},{key:"email",label:"E-mail",ph:"email@exemplo.com"},{key:"servico",label:"Serviço",type:"select",opts:srvOpts,blank:"Selecione..."},{key:"origem",label:"Origem",type:"select",opts:ORIGENS},{key:"valor",label:"Valor estimado (R$)",type:"number",ph:"0.00"},{key:"favorecido",label:"Alvo da Sessão (Favorecido)",ph:"Ex: Nome do bebê, casal, etc.",full:true},{key:"etapa",label:"Etapa",type:"select",opts:leadEtapas.map(e=>e.id),blank:null},{key:"proximoFollowup",label:"Próximo follow up",type:"date"},{key:"obs",label:"Observações",type:"textarea",ph:"Notas...",full:true}];
  
  return <Modal title={isEdit?"Detalhes do Lead":"Novo lead"} onClose={onClose} wide>
    <div style={{display:"flex",gap:20,borderBottom:"1px solid "+C.border,marginBottom:20}}>{[["dados","Dados Gerais"],["hist","Histórico e Timeline"]].map(([id,l])=><button key={id} onClick={()=>setTab(id)} style={{background:"none",border:"none",borderBottom:tab===id?"3px solid "+C.accentDk:"3px solid transparent",padding:"8px 4px",fontSize:13,fontWeight:tab===id?700:500,color:tab===id?C.text:C.textSm,cursor:"pointer",transition:"0.2s"}}>{l}</button>)}</div>
    
    {tab==="dados" ? (
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        {fields.map(fld=>{let inp;if(fld.key==="etapa")inp=<select style={IS} value={f.etapa} onChange={e=>s("etapa",e.target.value)}>{leadEtapas.map(e=><option key={e.id} value={e.id}>{e.label}</option>)}</select>;else if(fld.type==="select")inp=<select style={IS} value={f[fld.key]||""} onChange={e=>s(fld.key,e.target.value)}>{fld.blank&&<option value="">{fld.blank}</option>}{(fld.opts||[]).map(o=><option key={o}>{o}</option>)}</select>;else if(fld.type==="date")inp=<input style={IS} type="date" value={f[fld.key]||""} onChange={e=>s(fld.key,e.target.value)}/>;else if(fld.type==="number")inp=<input style={IS} type="number" value={f[fld.key]||""} onChange={e=>s(fld.key,e.target.value)} placeholder={fld.ph||""}/>;else if(fld.type==="textarea")inp=<textarea style={{...IS,minHeight:80,resize:"vertical"}} value={f[fld.key]||""} onChange={e=>s(fld.key,e.target.value)} placeholder={fld.ph||""}/>;else inp=<input style={IS} value={f[fld.key]||""} onChange={e=>s(fld.key,e.target.value)} placeholder={fld.ph||""}/>;return <div key={fld.key} style={{marginBottom:13,gridColumn:fld.full?"1/-1":"auto"}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>{fld.label}</label>{inp}</div>;})}
      </div>
    ) : (
      <div style={{background:"#FDFBF8",padding:"1rem",borderRadius:12,border:"1px solid "+C.border}}><Timeline history={f.historico}/></div>
    )}
    
    <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:18,paddingTop:14,borderTop:"1px solid "+C.border}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={()=>{if(f.nome.trim())onSave(f);}}>Salvar Alterações</Btn></div>
  </Modal>;
}

function ImportModal({onClose,onImport}:any){const fr=useRef(null);const[rows,setRows]=useState<any>(null);const[err,setErr]=useState("");const[map,setMap]=useState<any>({});const[done,setDone]=useState(false);const FIELDS=["nome","tel","email","cidade","cpf","endereco","estadoCivil","nasc","favorecido","favorecido_nasc","favorecido_parentesco","parceiro","telParceiro","obs"];const parseCSV=t=>{const lines=t.trim().split(/\r?\n/);if(lines.length<2)return null;const sep=lines[0].includes(";")?";":",";const hdr=lines[0].split(sep).map(h=>h.trim().replace(/^"|"$/g,""));const data=lines.slice(1).map(l=>{const v=l.split(sep).map(x=>x.trim().replace(/^"|"$/g,""));return Object.fromEntries(hdr.map((h,i)=>[h,v[i]||""]));}).filter(r=>Object.values(r).some(v=>v));return{hdr,data};};const hFile=e=>{setErr("");setRows(null);setMap({});const f=e.target.files[0];if(!f)return;if(!["csv","txt"].includes(f.name.split(".").pop().toLowerCase())){setErr("Aceito CSV ou TXT.");return;}const r=new FileReader();r.onload=ev=>{const p=parseCSV(ev.target.result as string);if(!p||!p.data.length){setErr("CSV inválido.");return;}const am:any={};FIELDS.forEach(k=>{const m=p.hdr.find(h=>h.toLowerCase().includes(k.toLowerCase()));if(m)am[k]=m;});setRows(p);setMap(am);};r.readAsText(f,"UTF-8");};const doImp=()=>{if(!map.nome){setErr("Mapeie o campo Nome.");return;}const imp=rows.data.map(r=>{const c:any={id:uid(),nacionalidade:"brasileira"};FIELDS.forEach(k=>{if(map[k])c[k]=r[map[k]]||"";});return c;}).filter(c=>c.nome?.trim());onImport(imp);setDone(true);};return <Modal title="Importar clientes" onClose={onClose} wide>{done?<div style={{textAlign:"center",padding:"2rem"}}><p style={{fontSize:32,margin:"0 0 10px"}}>✅</p><p style={{fontSize:15,fontWeight:600,color:C.text,margin:"0 0 20px"}}>Importado!</p><Btn onClick={onClose}>Fechar</Btn></div>:<><div onClick={()=>fr.current.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();hFile({target:{files:e.dataTransfer.files}});}} style={{border:"2px dashed "+C.border,borderRadius:9,padding:"1.5rem",textAlign:"center",cursor:"pointer",background:"#FDFBF8",marginBottom:14}}><p style={{margin:"0 0 4px",fontSize:22}}>📄</p><p style={{margin:0,fontSize:13,color:C.text}}>{rows?"✓ "+rows.data.length+" clientes":"Clique ou arraste o CSV"}</p></div><input ref={fr} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={hFile}/>{err&&<p style={{color:"#8A3838",fontSize:12,marginBottom:10}}>{err}</p>}{rows&&<><p style={{margin:"0 0 8px",fontSize:12,fontWeight:600,color:C.text}}>Associe as colunas</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px",marginBottom:14}}>{FIELDS.map(k=><div key={k} style={{marginBottom:10}}><label style={{display:"block",fontSize:11,color:C.textSm,marginBottom:3,fontWeight:500}}>{k}</label><select style={{...IS,fontSize:12}} value={map[k]||""} onChange={e=>setMap(p=>({...p,[k]:e.target.value}))}><option value="">— ignorar —</option>{rows.hdr.map(h=><option key={h} value={h}>{h}</option>)}</select></div>)}</div></>}<div style={{display:"flex",gap:9,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn>{rows&&<Btn onClick={doImp} disabled={!map.nome}>Importar {rows.data.length}</Btn>}</div></>}</Modal>;}

function PreCadModal({onSave,onClose}:any){const CLF=[{key:"nome",label:"Cliente (Contratante) *",ph:"Nome",full:true},{key:"cpf",label:"CPF",ph:"000.000.000-00",mask:maskCPF},{key:"nasc",label:"Data de nascimento",type:"date"},{key:"estadoCivil",label:"Estado civil",type:"select",opts:["solteira","casada","divorciada","viúva","união estável"],blank:"Selecione"},{key:"tel",label:"Telefone *",ph:"(71) 99999-9999",mask:maskPhone},{key:"email",label:"E-mail",ph:"email@exemplo.com"},{key:"endereco",label:"Endereço completo",ph:"Rua, nº, bairro",full:true},{key:"cidade",label:"Cidade",ph:"Salvador"},{key:"sepF",label:"Alvo da Sessão (Favorecido)",sep:true},{key:"favorecido",label:"Nome do Favorecido",ph:"Nome"},{key:"favorecido_nasc",label:"Data nasc. Favorecido",type:"date"},{key:"favorecido_parentesco",label:"Parentesco com o Cliente",ph:"Ex: Filho, Cônjuge, etc."}, {key:"sepP",label:"Parceiro(a)",sep:true},{key:"parceiro",label:"Nome do parceiro(a)",ph:"Nome"},{key:"telParceiro",label:"Tel. parceiro(a)",ph:"(71) 99999-9999",mask:maskPhone}];const[f,setF]=useState<any>({nacionalidade:"brasileira"});return <Modal title="Formulário de pré-cadastro" onClose={onClose} wide><div style={{background:"#F8F4EF",borderRadius:8,padding:"0.9rem",marginBottom:14}}><p style={{margin:0,fontSize:12.5,color:"#7A5A18",fontWeight:500}}>📋 Entregue seu dispositivo para a cliente preencher os dados e clique em Salvar.</p></div><GForm fields={CLF} state={f} set={setF}/><div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:10}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={()=>{if(f.nome?.trim())onSave({...f,id:uid()});}}>Salvar cadastro</Btn></div></Modal>;}

function FavorecidoModal({data,onSave,onClose}:any){
  const PARENTESCOS = ["Filho(a)", "Cônjuge", "Mãe", "Pai", "Irmão(ã)", "Sobrinho(a)", "Neto(a)", "Modelo", "Próprio Cliente"];
  // Usaremos um truque: o parentesco é texto, mas o GForm mostrará opções
  const CLF=[
    {key:"nome",label:"Nome do Favorecido *",ph:"Ex: Joãozinho, Maria...",full:true},
    {key:"nasc",label:"Data de Nascimento",type:"date"},
    {key:"telefone",label:"Telefone de Contato",ph:"(71) 99999-9999",mask:maskPhone},
    {key:"parentesco",label:"Parentesco / Relação",ph:"Ex: Filho, Cônjuge, Modelo...", type:"select", opts: PARENTESCOS, blank: "Outro (digite abaixo)"},
    {key:"parentesco_custom",label:"Se escolheu 'Outro', digite aqui:", ph: "Ex: Afilhado, Primo...", full:true},
    {key:"obs",label:"Observações",type:"textarea",ph:"Alergias, preferências...",full:true}
  ];
  const[f,setF]=useState({nome:"",nasc:"",telefone:"",parentesco:"",parentesco_custom:"",obs:"",...data});
  
  const handleSave = async () => {
    if(!f.nome.trim()) {
      alert("Por favor, preencha o nome do favorecido.");
      return;
    }
    const finalParentesco = (f.parentesco === "" || f.parentesco === "Outro (digite abaixo)") ? f.parentesco_custom : f.parentesco;
    
    try {
      await onSave({...f, parentesco: finalParentesco});
    } catch (err: any) {
      alert("Erro ao salvar favorecido: " + err.message);
    }
  };

  return <Modal title={data.id?"Editar favorecido":"Novo favorecido"} onClose={onClose}>
    <GForm fields={CLF} state={f} set={setF}/>
    <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:18,paddingTop:14,borderTop:"1px solid "+C.border}}>
      <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
      <Btn onClick={handleSave}>Salvar</Btn>
    </div>
  </Modal>;
}

function ClienteModal({data,isEdit,onSave,onClose}:any){const CLF=[{key:"nome",label:"Cliente (Contratante) *",ph:"Nome da cliente",full:true},{key:"cpf",label:"CPF",ph:"000.000.000-00",mask:maskCPF},{key:"estadoCivil",label:"Estado civil",type:"select",opts:["solteira","casada","divorciada","viúva","união estável"],blank:"Selecione"},{key:"nacionalidade",label:"Nacionalidade",ph:"brasileira"},{key:"nasc",label:"Data nasc. (contratante)",type:"date"},{key:"tel",label:"Telefone",ph:"(71) 99999-9999",mask:maskPhone},{key:"email",label:"E-mail",ph:"email@exemplo.com"},{key:"endereco",label:"Endereço",ph:"Rua, nº, bairro",full:true},{key:"cidade",label:"Cidade",ph:"Salvador"},{key:"sep2",label:"Parceiro(a)",sep:true},{key:"parceiro",label:"Nome do parceiro(a)",ph:"Nome"},{key:"telParceiro",label:"Contato do parceiro(a)",ph:"(71) 99999-9999",mask:maskPhone},{key:"sep3",label:"",sep:true},{key:"obs",label:"Observações",type:"textarea",ph:"Notas...",full:true}];const[f,setF]=useState({nome:"",cpf:"",estadoCivil:"",nacionalidade:"brasileira",nasc:"",tel:"",email:"",endereco:"",cidade:"",parceiro:"",telParceiro:"",obs:"",...data});return <Modal title={isEdit?"Editar cliente":"Novo cliente"} onClose={onClose}><GForm fields={CLF} state={f} set={setF}/><div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:6}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={()=>{if(f.nome?.trim())onSave(f);}}>Salvar</Btn></div></Modal>;}

function HistoricoModal({data, onClose}: any) {
  const logs = [...(data.historico || [])].reverse();
  return (
    <Modal title={`Histórico: ${data.nome || data.srv || "Registro"}`} onClose={onClose}>
      <div style={{display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto", paddingRight: 8}}>
        {logs.length === 0 ? (
          <p style={{textAlign: "center", color: C.textXs, padding: 20}}>Nenhum evento registrado ainda.</p>
        ) : (
          logs.map((l: any) => (
            <div key={l.id} style={{borderLeft: `3px solid ${l.tipo === "movimentacao" ? C.accent : "#EAE4DB"}`, paddingLeft: 14, paddingBottom: 4, position: "relative"}}>
              <div style={{position: "absolute", left: -6, top: 0, width: 9, height: 9, borderRadius: "50%", background: l.tipo === "movimentacao" ? C.accent : "#C4A882", border: "2px solid #FFF"}} />
              <p style={{margin: 0, fontSize: 10, color: C.textXs, fontWeight: 600}}>{new Date(l.data).toLocaleString("pt-BR")}</p>
              <p style={{margin: "2px 0 0", fontSize: 13, color: C.text, lineHeight: 1.4}}>{l.msg}</p>
            </div>
          ))
        )}
      </div>
      <div style={{marginTop: 20, display: "flex", justifyContent: "flex-end"}}>
        <Btn onClick={onClose}>Fechar</Btn>
      </div>
    </Modal>
  );
}

function ContratoModal({data,isEdit,clients,favorecidos=[],servicos=[],services=[],onSave,onClose}:any){
  const[tab,setTab]=useState("dados");
  const[f,setF]=useState({cid:"",favorecido_id:"",srv:data.srv || servicos[0] || (services[0]?.nome) || "",nomeExp:"",qtdFotos:"",duracao:"",val:"",ent:"",formaPagamento:"",dc:todayS(),ds:"",st:"Pendente",obs:"",historico:[],...data});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));

  const selSrvObj = services.find(s => s.nome === f.srv);
  const pacotes = selSrvObj ? selSrvObj.pacotes : [];
  const favsDoCliente = favorecidos.filter(fv => fv.cliente_id === f.cid);

  return <Modal title={isEdit?"Detalhes do Projeto":"Novo contrato"} onClose={onClose} wide>
    <div style={{display:"flex",gap:20,borderBottom:"1px solid "+C.border,marginBottom:20}}>{[["dados","Informações"],["hist","Cronograma e Histórico"]].map(([id,l])=><button key={id} onClick={()=>setTab(id)} style={{background:"none",border:"none",borderBottom:tab===id?"3px solid "+C.accentDk:"3px solid transparent",padding:"8px 4px",fontSize:13,fontWeight:tab===id?700:500,color:tab===id?C.text:C.textSm,cursor:"pointer",transition:"0.2s"}}>{l}</button>)}</div>

    {tab==="dados" ? (
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>
        <div style={{gridColumn:"1/-1",marginBottom:13}}>
          <label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Cliente *</label>
          <select style={IS} value={f.cid} onChange={e=>setF(p=>({...p,cid:e.target.value,favorecido_id:""}))}>
            <option value="">Selecione...</option>
            {clients.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>



        <div style={{marginBottom:13}}>
          <label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Serviço *</label>
          <select style={IS} value={f.srv} onChange={e=>{
            const val = e.target.value;
            setF(p => ({...p, srv: val, nomeExp: "", val: ""}));
          }}>
            <option value="">Selecione...</option>
            {services.length > 0 
              ? services.map(s => <option key={s.id} value={s.nome}>{s.nome}</option>)
              : servicos.map(s => <option key={s} value={s}>{s}</option>)
            }
          </select>
        </div>

        <div style={{marginBottom:13}}>
          <label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Status</label>
          <select style={IS} value={f.st} onChange={e=>s("st",e.target.value)}>
            {STATUS.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {f.cid && f.srv && (
          <div style={{gridColumn:"1/-1",marginBottom:13}}>
            <label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Alvo da Sessão (Favorecido)</label>
            <select style={IS} value={f.favorecido_id || ""} onChange={e=>s("favorecido_id",e.target.value)}>
              <option value="">Não vinculado / Outro</option>
              {favsDoCliente.map(fv=><option key={fv.id} value={fv.id}>{fv.nome} {fv.parentesco?`(${fv.parentesco})`:""}</option>)}
            </select>
            <p style={{margin:"4px 0 0",fontSize:11,color:C.textXs}}>💡 Cadastre os filhos/modelos no perfil do cliente para que apareçam aqui.</p>
          </div>
        )}

        <div style={{gridColumn:"1/-1",marginBottom:13}}>
          <label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>Pacote / Experiência</label>
          {pacotes.length > 0 ? (
            <select style={IS} value={f.nomeExp} onChange={e=>{
              const val = e.target.value;
              const pkg = pacotes.find(p => p.nome === val);
              if(pkg) {
                setF(p => ({...p, nomeExp: val, val: pkg.preco}));
              } else {
                s("nomeExp", val);
              }
            }}>
              <option value="">Selecione...</option>
              {pacotes.map(p => <option key={p.id} value={p.nome}>{p.nome} ({fmtR(p.preco)})</option>)}
            </select>
          ) : (
            <input style={IS} value={f.nomeExp} onChange={e=>s("nomeExp",e.target.value)} placeholder="Ex: Pacote Luxo..."/>
          )}
        </div>

        {[["qtdFotos","Qtd de fotos","text"],["duracao","Duração","text"],["val","Valor total (R$)","number"],["ent","Entrada recebida (R$)","number"],["formaPagamento","Forma de pagamento","select",PGTOS],["dc","Data do contrato","date"],["ds","Data da sessão","date"],["obs","Observações","textarea","full"]].map(([k,l,t,ex])=>{const full=ex==="full";const opts=Array.isArray(ex)?ex:null;const inp=t==="select"?<select style={IS} value={f[k]||""} onChange={e=>s(k,e.target.value)}><option value="">Selecione...</option>{opts.map(o=><option key={o}>{o}</option>)}</select>:t==="date"?<input style={IS} type="date" value={f[k]||""} onChange={e=>s(k,e.target.value)}/>:t==="number"?<input style={IS} type="number" value={f[k]||""} onChange={e=>s(k,e.target.value)}/>:t==="textarea"?<textarea style={{...IS,minHeight:70,resize:"vertical"}} value={f[k]||""} onChange={e=>s(k,e.target.value)}/>:<input style={IS} value={f[k]||""} onChange={e=>s(k,e.target.value)}/>;return <div key={k} style={{marginBottom:13,gridColumn:full?"1/-1":"auto"}}><label style={{display:"block",fontSize:12,color:C.textSm,marginBottom:4,fontWeight:500}}>{l}</label>{inp}</div>;})}
      </div>
    ) : (
      <div style={{background:"#FDFBF8",padding:"1rem",borderRadius:12,border:"1px solid "+C.border}}><Timeline history={f.historico}/></div>
    )}

    <div style={{display:"flex",gap:9,justifyContent:"flex-end",marginTop:18,paddingTop:14,borderTop:"1px solid "+C.border}}><Btn variant="secondary" onClick={onClose}>Cancelar</Btn><Btn onClick={()=>onSave(f)} disabled={!f.cid||!f.srv}>Salvar Alterações</Btn></div>
  </Modal>;
}

export default function App(){
  const { user, loading: authLoading, signOut } = useAuth();

  // Auth loading
  if (authLoading) {
    return <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <p style={{fontSize:28,margin:'0 0 8px'}}>📷</p>
        <p style={{color:C.textSm,fontFamily:'Georgia,serif',fontSize:14}}>MyStudio</p>
        <p style={{color:C.textXs,fontSize:12,margin:'4px 0 0'}}>carregando...</p>
      </div>
    </div>;
  }

  // Not logged in
  if (!user) return <AuthPage />;

  // Logged in — AppDashboard handles profile/onboarding
  return <AppDashboard onLogout={signOut} />;
}

function AppDashboard({ onLogout }: { onLogout: () => void }) {
  const { profile, loading: profileLoading, hasProfile, saveProfile } = useProfile();
  const[view,setView]=useState("dashboard");
  const[clients,setClients]=useState<any[]>([]);
  const[contracts,setContracts]=useState<any[]>([]);
  const[templates,setTemplates]=useState<any>(DEF_TPLS);
  const[signature,setSignature]=useState<string|null>(null);
  const[etapas,setEtapas]=useState<any[]>(DEF_ETAPAS);
  const[servicos,setServicos]=useState<string[]>(DEF_SRVS);
  const[leads,setLeads]=useState<any[]>([]);
  const[services,setServices]=useState<any[]>([]);
  const[despesas,setDespesas]=useState<any[]>([]);
  const[leadEtapas,setLeadEtapas]=useState<any[]>(LEAD_ET);
  const[favorecidos,setFavorecidos]=useState<any[]>([]);
  const[ready,setReady]=useState(false);
  const[sel,setSel]=useState<any>(null);const[cMod,setCMod]=useState<any>(null);const[kMod,setKMod]=useState<any>(null);
  const[favMod,setFavMod]=useState<any>(null);
  const[hMod,setHMod]=useState<any>(null);
  const[confMod, setConfMod] = useState<{title:string, msg:string, onConfirm:()=>void} | null>(null);

  // ── Carregamento inicial a partir do Supabase ──────────────
  useEffect(()=>{
    (async()=>{
      try {
        const [cls, cts, lds, dsps, svs2, favs,
               tplVal, sgVal, etVal, svVal, leVal] = await Promise.all([
          fetchClientes(),
          fetchContratos(),
          fetchLeads(),
          fetchDespesas(),
          fetchServicosPortfolio(),
          fetchFavorecidos(),
          fetchConfig('bm_tp'),
          fetchConfig('bm_sg'),
          fetchConfig('bm_et'),
          fetchConfig('bm_sv'),
          fetchConfig('bm_le'),
        ]);
        setClients(cls.length ? cls : SC);
        setContracts(cts.length ? cts : SK);
        setLeads(lds.length ? lds : SL);
        if (dsps.length) setDespesas(dsps);
        if (svs2.length) setServices(svs2);
        if (favs && favs.length) setFavorecidos(favs);
        if (tplVal) setTemplates({...DEF_TPLS,...JSON.parse(tplVal)});
        if (sgVal)  setSignature(sgVal);
        if (etVal)  setEtapas(JSON.parse(etVal));
        if (svVal)  setServicos(JSON.parse(svVal));
        if (leVal)  setLeadEtapas(JSON.parse(leVal));
      } catch(e) {
        console.error('Erro ao carregar dados do Supabase:', e);
        setClients(SC); setContracts(SK); setLeads(SL);
      }
      setReady(true);
    })();
  }, []);

  // ── Persiste configs simples (templates, etapas, servicos, assinatura) ──
   const setEtapasSupa = async (val: any[]) => {
     await saveConfig('bm_et', JSON.stringify(val));
     setEtapas(val);
   };
   const setLeadEtapasSupa = async (val: any[]) => {
     await saveConfig('bm_le', JSON.stringify(val));
     setLeadEtapas(val);
   };
   const setServicosSupa = async (val: string[]) => {
     await saveConfig('bm_sv', JSON.stringify(val));
     setServicos(val);
   };
   const setSignatureSupa = async (val: string) => {
     await saveConfig('bm_sg', val);
     setSignature(val);
   };
   const setTemplatesSupa = async (val: any) => {
     await saveConfig('bm_tp', JSON.stringify(val));
     setTemplates(val);
   };

  // ── Importação CSV ─────────────────────────────────────────
  const imp = (list: any[]) => {
    setClients(p => {
      const em = new Set(p.map((c:any) => c.email?.toLowerCase()).filter(Boolean));
      const novos = list.filter((c:any) => !c.email || !em.has(c.email.toLowerCase()));
      novos.forEach((c:any) => upsertCliente(c).catch(()=>{}));
      return [...p, ...novos];
    });
  };

  // ── Conversão lead → cliente ───────────────────────────────
  const convL = (lead: any) => {
    if(lead.etapa === "fechado") return; // Trava contra dupla conversão
    const newCid = uid();
    const novoCliente = {id:newCid,nome:lead.nome,tel:lead.tel,email:lead.email||"",cpf:"",estadoCivil:"",nacionalidade:"brasileira",nasc:"",endereco:"",cidade:"",parceiro:"",telParceiro:"",obs:"Lead — "+lead.origem};
    
    // Se o lead tiver favorecido, cria o registro na tabela de favorecidos
    let novoFav = null;
    if (lead.favorecido) {
      novoFav = { id: uid(), cliente_id: newCid, nome: lead.favorecido, nasc: "", parentesco: "", obs: "" };
    }

    const primeiraEtapa = etapas[0]?.id || "agendado";
    const log = {
      id: uid(),
      data: new Date().toISOString(),
      tipo: "conversao",
      msg: "🚀 Convertido em Cliente e movido para a Jornada do Cliente",
      de: lead.etapa,
      para: primeiraEtapa
    };
    const leadAtualizado = {...lead, etapa:"fechado", historico:[...(lead.historico||[]), log]};
    const novoContrato = {id:uid(),cid:newCid,favorecido_id:novoFav?.id||null,srv:lead.servico||"",val:Number(lead.valor)||0,ent:0,formaPagamento:"",dc:todayS(),ds:"",st:"Pendente",nomeExp:"",qtdFotos:"",duracao:"",obs:"Convertido de lead",etapa:primeiraEtapa,dataEntrega:"",historico:[log]};
    
    upsertCliente(novoCliente).catch(()=>{});
    if (novoFav) upsertFavorecido(novoFav).catch(()=>{});
    upsertContrato(novoContrato).catch(()=>{});
    upsertLead(leadAtualizado).catch(()=>{});

    setClients(p => [...p, novoCliente]);
    if (novoFav) setFavorecidos(p => [...p, novoFav]);
    setContracts(p => [...p, novoContrato]);
    setLeads(p => p.map((l:any) => l.id===lead.id ? leadAtualizado : l));
  };

  // ── Favorecidos CRUD ───────────────────────────────────────
  const saveFav = async (d: any) => {
    const isEdit = !!d.id;
    const { parentesco_custom, ...cleanData } = d; // Limpa campo temporário
    const finalFav = isEdit ? cleanData : { ...cleanData, id: uid() };
    
    try {
      await upsertFavorecido(finalFav);
      setFavorecidos(p => isEdit ? p.map(f => f.id===d.id ? finalFav : f) : [...p, finalFav]);
      setFavMod(null);
    } catch (err: any) {
      console.error(err);
      throw err; // Propaga para o modal mostrar o alert
    }
  };
  const delFav = (id: string) => {
    setConfMod({
      title: "Excluir favorecido",
      msg: "Deseja remover este favorecido? Isso não afetará os contratos já existentes, mas removerá o vínculo futuro.",
      onConfirm: async () => {
        await deleteFavorecido(id);
        setFavorecidos(p => p.filter(f => f.id !== id));
      }
    });
  };

  // ── CRUD Clientes ──────────────────────────────────────────
  const saveCl = (d: any) => {
    const registro = d.id ? d : {...d, id:uid()};
    upsertCliente(registro).catch(err => alert("Erro ao salvar cliente: " + err.message));
    setClients(p => d.id ? p.map((c:any)=>c.id===d.id?d:c) : [...p, registro]);
    if (sel?.id === d.id) setSel(d);
    setCMod(null);
  };
  const delCl = (id: string) => {
    setConfMod({
      title: "Excluir cliente",
      msg: "Isso excluirá permanentemente o cliente e todos os seus contratos. Deseja continuar?",
      onConfirm: () => {
        deleteCliente(id).catch(err => alert("Erro ao excluir cliente: " + err.message));
        setClients(p => p.filter((c:any) => c.id !== id));
        setContracts(p => p.filter((c:any) => c.cid !== id));
        if (sel?.id === id) setSel(null);
      }
    });
  };

  // ── CRUD Contratos ─────────────────────────────────────────
  const saveCt = (d: any) => {
    const old = contracts.find(c => c.id === d.id);
    let logs: any[] = [...(d.historico || [])];

    if (old) {
      if (old.st !== d.st) {
        logs.push({ id: uid(), data: new Date().toISOString(), tipo: "evento", msg: `Status alterado de "${old.st}" para "${d.st}"` });
      }
      if (Number(old.val) !== Number(d.val)) {
        logs.push({ id: uid(), data: new Date().toISOString(), tipo: "evento", msg: `Valor alterado de ${fmtR(old.val)} para ${fmtR(d.val)}` });
      }
      if (old.favorecido_id !== d.favorecido_id) {
        const fav = favorecidos.find(f => f.id === d.favorecido_id);
        logs.push({ id: uid(), data: new Date().toISOString(), tipo: "evento", msg: `Vínculo de favorecido alterado para: ${fav ? fav.nome : "Nenhum"}` });
      }
    } else {
      logs.push({ id: uid(), data: new Date().toISOString(), tipo: "evento", msg: "Projeto/Sessão criado" });
    }

    const registro = { ...d, id: d.id || uid(), historico: logs };
    upsertContrato(registro).catch(err => alert("Erro ao salvar sessão: " + err.message));
    setContracts(p => d.id ? p.map((c:any)=>c.id===d.id ? registro : c) : [...p, registro]);
    setKMod(null);
  };
  const delCt = (id: string) => {
    setConfMod({
      title: "Excluir sessão",
      msg: "Deseja realmente excluir esta sessão de forma permanente?",
      onConfirm: () => {
        deleteContrato(id).catch(err => alert("Erro ao excluir contrato: " + err.message));
        setContracts(p => p.filter((c:any) => c.id !== id));
      }
    });
  };
  const go=(v:any,cl?:any)=>{setView(v);setSel(cl||null);};

  // ── Wrappers Supabase para views filhas ────────────────────
  const setLeadsSupa = (updater: any) => {
    setLeads((prev: any) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // upsert itens alterados / novos
      next.forEach((l:any) => {
        const old = prev.find((p:any) => p.id === l.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(l)) {
          upsertLead(l).catch(err => alert("Erro ao salvar lead: " + err.message));
        }
      });
      // deletar itens removidos
      prev.forEach((p:any) => {
        if (!next.find((l:any) => l.id === p.id)) deleteLead(p.id).catch(err => alert("Erro ao excluir lead: " + err.message));
      });
      return next;
    });
  };

  const setDespesasSupa = (updater: any) => {
    setDespesas((prev: any) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      next.forEach((d:any) => {
        const old = prev.find((p:any) => p.id === d.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(d)) {
          upsertDespesa(d).catch(err => alert("Erro ao salvar despesa: " + err.message));
        }
      });
      prev.forEach((p:any) => {
        if (!next.find((d:any) => d.id === p.id)) deleteDespesa(p.id).catch(err => alert("Erro ao excluir despesa: " + err.message));
      });
      return next;
    });
  };

  const setServicesSupa = (updater: any) => {
    setServices((prev: any) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      next.forEach((s:any) => {
        const old = prev.find((p:any) => p.id === s.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(s)) {
          upsertServicoPortfolio(s).catch(err => alert("Erro ao salvar serviço: " + err.message));
        }
      });
      prev.forEach((p:any) => {
        if (!next.find((s:any) => s.id === p.id)) deleteServicoPortfolio(p.id).catch(err => alert("Erro ao excluir serviço: " + err.message));
      });
      return next;
    });
  };

  const setContractsSupa = (updater: any) => {
    setContracts((prev: any) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      next.forEach((c:any) => {
        const old = prev.find((p:any) => p.id === c.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(c)) {
          upsertContrato(c).catch(err => alert("Erro ao salvar contrato: " + err.message));
        }
      });
      return next;
    });
  };

  // ── Guards pós-hooks ──────────────────────────────────────────
  if (profileLoading) {
    return <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <p style={{fontSize:28,margin:'0 0 8px'}}>📷</p>
        <p style={{color:C.textSm,fontFamily:'Georgia,serif',fontSize:14}}>MyStudio</p>
        <p style={{color:C.textXs,fontSize:12,margin:'4px 0 0'}}>carregando perfil...</p>
      </div>
    </div>;
  }
  if (!hasProfile) return <OnboardingPage />;

  if(!ready)return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:C.textXs,fontFamily:"Georgia,serif"}}>carregando dados...</p></div>;

  const fontFamily = "'Segoe UI',system-ui,sans-serif";
  return <div style={{display:"flex",minHeight:"100vh",background:C.bg,color:C.text,fontFamily}}>
    <Sidebar view={view} go={(v:any)=>go(v)} studioName={profile?.nome_estudio} ownerName={profile?.nome_profissional} onLogout={onLogout} logoUrl={profile?.logo_url}/>
    <main style={{flex:1,padding:"2rem 2.2rem",overflowY:"auto",maxHeight:"100vh"}}>
      {view==="dashboard"&&<DashboardView clients={clients} contracts={contracts} go={go}/>}
      {view==="clientes"&&!sel&&<ClientesView clients={clients} contracts={contracts} onAdd={()=>setCMod({data:{},isEdit:false})} onEdit={(c:any)=>setCMod({data:c,isEdit:true})} onDelete={delCl} onSelect={setSel} onImport={imp} onForm={(c:any)=>{
        const {favorecido, favorecido_nasc, favorecido_parentesco, ...clientData} = c;
        upsertCliente(clientData).catch(()=>{}); 
        setClients((p:any)=>[...p, clientData]);
        if (favorecido) {
          const newFav = { id: uid(), cliente_id: clientData.id, nome: favorecido, nasc: favorecido_nasc, parentesco: favorecido_parentesco, obs: "" };
          upsertFavorecido(newFav).catch(()=>{});
          setFavorecidos(p => [...p, newFav]);
        }
      }}/>}
      {view==="clientes"&&sel&&<ClienteCard client={sel} contracts={contracts.filter((c:any)=>c.cid===sel.id)} favorecidos={favorecidos} onBack={()=>setSel(null)} onEdit={()=>setCMod({data:sel,isEdit:true})} onAddK={()=>setKMod({data:{cid:sel.id},isEdit:false})} onEditK={(c:any)=>setKMod({data:c,isEdit:true})} onDeleteK={delCt} onAddFav={()=>setFavMod({cliente_id:sel.id})} onEditFav={setFavMod} onDelFav={delFav} />}
      {view==="financeiro"&&<FinanceiroView contracts={contracts} clients={clients} servicos={servicos} onEdit={(c:any)=>setKMod({data:c,isEdit:true})} onDelete={delCt} despesas={despesas} setDespesas={setDespesasSupa} setConfMod={setConfMod}/>}
      {view==="servicos"&&<ServicosView services={services} setServices={setServicesSupa} setConfMod={setConfMod}/>}
      {view==="contratos"&&<ContratosView clients={clients} contracts={contracts} templates={templates} setTemplates={setTemplatesSupa} signature={signature} setSignature={setSignatureSupa} servicos={servicos} setServicos={setServicosSupa} setConfMod={setConfMod}/>}
      {view==="jornada"&&<JornadaView clients={clients} contracts={contracts} favorecidos={favorecidos} setContracts={setContractsSupa} go={go} etapas={etapas} setEtapas={setEtapasSupa} setConfMod={setConfMod} onEditK={(c:any)=>setKMod({data:c,isEdit:true})} onShowH={setHMod} />}
      {view==="leads"&&<LeadsView leads={leads} setLeads={setLeadsSupa} servicos={servicos} services={services} leadEtapas={leadEtapas} setLeadEtapas={setLeadEtapasSupa} onConvert={convL} setConfMod={setConfMod} onShowH={setHMod} />}
      {view==="config"&&<ConfigView profile={profile} onSave={saveProfile} signature={signature} setSignature={setSignatureSupa} servicos={servicos} setServicos={setServicosSupa} templates={templates} setTemplates={setTemplatesSupa}/>}
    </main>
    {cMod&&<ClienteModal data={cMod.data} isEdit={cMod.isEdit} onSave={saveCl} onClose={()=>setCMod(null)}/>}
    {kMod&&<ContratoModal data={kMod.data} isEdit={kMod.isEdit} clients={clients} favorecidos={favorecidos} servicos={servicos} services={services} onSave={saveCt} onClose={()=>setKMod(null)}/>}
    {favMod&&<FavorecidoModal data={favMod} onSave={saveFav} onClose={()=>setFavMod(null)}/>}
    {hMod&&<HistoricoModal data={hMod} onClose={()=>setHMod(null)}/>}
    {confMod && (
      <Modal title={confMod.title} onClose={() => setConfMod(null)}>
        <p style={{margin: "0 0 20px", fontSize: 14, color: C.textSm, lineHeight: 1.5}}>{confMod.msg}</p>
        <div style={{display: "flex", gap: 10, justifyContent: "flex-end"}}>
          <Btn variant="secondary" onClick={() => setConfMod(null)}>Cancelar</Btn>
          <Btn variant="danger" onClick={() => { confMod.onConfirm(); setConfMod(null); }}>Confirmar Exclusão</Btn>
        </div>
      </Modal>
    )}
  </div>;
}
