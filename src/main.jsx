import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LayoutDashboard,Plus,ClipboardList,Clock3,CheckCircle2,XCircle,Package,ShoppingCart,Tags,LogOut,Search,ChevronDown,IndianRupee,AlertTriangle,UserRound,Menu,X,Upload,Pencil,Eye,Boxes,Truck,Store,WalletCards,Save,RefreshCw} from 'lucide-react';
import './styles.css';

const BASE_CATEGORIES=['Hand-Painted Diyas','Chenille / Pipe Cleaner','Crochet','Handmade / Ready-Made Rangolis'];
const COLOURS=['Red','Green','Pink','Blue','Yellow','White','Orange','Purple'];
const PRODUCT_SEED=[
  ['Hand-Painted Diyas','Small Round Diya'],['Hand-Painted Diyas','Shri Diya'],['Hand-Painted Diyas','Leaf Diya'],['Hand-Painted Diyas','Classic Round Diya'],['Hand-Painted Diyas','Swastik Diya'],['Hand-Painted Diyas','Designer Flower Diya'],['Hand-Painted Diyas','Mirror Work Diya'],['Hand-Painted Diyas','Classic Candle Diya'],['Hand-Painted Diyas','Matka Candle Diya'],
  ['Chenille / Pipe Cleaner','Lotus Tea Light Holder'],['Chenille / Pipe Cleaner','Designer Hangings'],['Chenille / Pipe Cleaner','Flower Door Hanging'],['Chenille / Pipe Cleaner','Lotus Hanging'],['Chenille / Pipe Cleaner','Flower Toran'],
  ['Crochet','Small Flower Tea Light Holder'],['Crochet','Round Tea Light Holder / Coaster'],['Crochet','Designer Tea Light Holder'],['Crochet','Beautiful Flower Tea Light Holder'],['Crochet','Dual Color Tea Light Holder / Coaster'],['Crochet','Elegant Big Flower Tea Light Holder'],['Crochet','Curved Petal Tea Light Holder']
].map(([category,name],i)=>({id:'seed-'+i,category,name,imageUrl:'',sellingPricePiece:0,sellingPriceSet2:0,colours:COLOURS.join('|'),source:category==='Crochet'?'Outsourced':'In-house',active:true}));
const TEAM=[{name:'Samiksha',email:'samsknack@gmail.com'},{name:'Snehal',email:'snehalshinde302001@gmail.com'},{name:'Sandesh',email:'sandeshshinde15@gmail.com'},{name:'Anket',email:'anket.nalawade42@gmail.com'}];
const DEMO_INVENTORY=[{id:'d1',product:'Leaf Diya',category:BASE_CATEGORIES[0],colour:'Red',stock:20,minimum:10,unit:'pcs',source:'In-house'},{id:'d2',product:'Leaf Diya',category:BASE_CATEGORIES[0],colour:'Pink',stock:8,minimum:10,unit:'pcs',source:'In-house'},{id:'d3',product:'Shri Diya',category:BASE_CATEGORIES[0],colour:'Red',stock:32,minimum:10,unit:'pcs',source:'In-house'},{id:'d4',product:'Lotus Tea Light Holder',category:BASE_CATEGORIES[1],colour:'Pink',stock:25,minimum:10,unit:'pcs',source:'In-house'},{id:'d5',product:'Small Flower Tea Light Holder',category:BASE_CATEGORIES[2],colour:'Dark Pink',stock:6,minimum:10,unit:'pcs',source:'Outsourced'},{id:'d6',product:'Rangoli Set',category:BASE_CATEGORIES[3],colour:'Standard',stock:18,minimum:8,unit:'sets',source:'In-house'}];
const DEMO_PACKAGING=[{id:'p1',item:'Small Box',stock:42,minimum:50,unit:'pcs'},{id:'p2',item:'Large Box',stock:18,minimum:20,unit:'pcs'},{id:'p3',item:'Thank-you Card',stock:85,minimum:100,unit:'pcs'},{id:'p4',item:'Bubble Wrap',stock:6,minimum:3,unit:'rolls'}];
const DEMO_EXPENSES=[{id:'e1',date:'2026-09-03',expenseType:'Stall / Exhibition',item:'Diwali Stall Booking',quantity:1,unit:'booking',pricePerUnit:5000,amount:5000,allocation:'General Business',paidBy:'Samiksha'},{id:'e2',date:'2026-09-03',expenseType:'Raw Material',item:'Paint & Decorative Material',quantity:1,unit:'lot',pricePerUnit:1800,amount:1800,allocation:'Hand-Painted Diyas',paidBy:'Snehal'},{id:'e3',date:'2026-09-02',expenseType:'Outsourcing',item:'Crochet Pieces',quantity:1,unit:'lot',pricePerUnit:3000,amount:3000,allocation:'Crochet',paidBy:'Samiksha'}];
const CACHE_KEY='samsknack_data_cache_v2';

const apiBase=import.meta.env.VITE_API_BASE||'/api';
async function api(action,payload={},credential){const r=await fetch(apiBase+'/backend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload,credential})});const text=await r.text();let d;try{d=JSON.parse(text)}catch{d={ok:false,error:text||('HTTP '+r.status)}}if(!r.ok||!d.ok)throw new Error(d.error||('Request failed ('+r.status+')'));return d;}
function localId(){return crypto?.randomUUID?.()||String(Date.now());}
function initialData(){try{const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');if(cached)return normalize(cached);}catch{}return {orders:[],order_items:[],products:PRODUCT_SEED,inventory:DEMO_INVENTORY,packaging:DEMO_PACKAGING,purchases_expenses:DEMO_EXPENSES,customers:[],team:TEAM,categories:BASE_CATEGORIES};}

function App(){
  const cached=useMemo(()=>initialData(),[]);
  const [credential,setCredential]=useState(sessionStorage.getItem('sk_credential')||'');
  const [user,setUser]=useState(JSON.parse(sessionStorage.getItem('sk_user')||'null'));
  const [data,setData]=useState(cached);
  const [page,setPage]=useState('home');
  const [menu,setMenu]=useState(false);
  const [userMenu,setUserMenu]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const signedIn=!!credential&&!!user;
  const categories=data.categories?.length?data.categories:BASE_CATEGORIES;

  const load=async(c=credential,showLoading=false)=>{
    if(showLoading)setLoading(true);
    setError('');
    try{
      const r=await api('list',{entity:'all'},c);
      const next=normalize(r.data);
      setData(next);
      try{localStorage.setItem(CACHE_KEY,JSON.stringify(next));}catch{}
    }catch(e){setError(e.message||'Could not sync with Google Sheets.');}
    finally{if(showLoading)setLoading(false);}
  };

  useEffect(()=>{if(signedIn)load(credential,false);},[signedIn]);

  const login=async(cred,profile)=>{
    setLoading(true);setError('');
    try{
      const r=await api('bootstrap',{},cred);
      const verified=r.user||profile;
      sessionStorage.setItem('sk_credential',cred);
      sessionStorage.setItem('sk_user',JSON.stringify(verified));
      setCredential(cred);setUser(verified);
    }catch(e){sessionStorage.clear();setCredential('');setUser(null);setError(e.message||'This Google account is not approved for Samsknack.');}
    finally{setLoading(false);}
  };
  const logout=()=>{sessionStorage.clear();setCredential('');setUser(null);setUserMenu(false);setData(initialData());setPage('home');};
  const nav=p=>{setPage(p);setMenu(false);setUserMenu(false);};
  const updateCategories=next=>setData(d=>({...d,categories:next}));

  if(!signedIn)return <Login onLogin={login} error={error} loading={loading}/>;
  return <div className="app-shell"><Sidebar page={page} navigate={nav} open={menu} onClose={()=>setMenu(false)} categories={categories}/><main className="main"><header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMenu(true)} aria-label="Open menu"><Menu size={20}/></button><div className="crumb">{pageLabel(page)}</div><div className="top-actions"><button className="icon-btn" onClick={()=>load(credential,true)} title="Re-sync"><RefreshCw size={16}/></button><div className="user-menu-wrap"><button className="user-chip user-chip-btn" onClick={()=>setUserMenu(v=>!v)} aria-expanded={userMenu}><div className="avatar">{user.name?.[0]||'S'}</div><span>{user.name}</span><ChevronDown size={14}/></button>{userMenu&&<div className="user-dropdown"><button onClick={logout}><LogOut size={15}/> Logout</button></div>}</div></div></header><div className="content">{error&&<div className="error-banner">{error}</div>}{loading&&<div className="loading-bar">Syncing with Google Sheets…</div>}{page==='home'&&<Dashboard user={user} data={data} navigate={nav}/>} {page==='new-order'&&<NewOrder user={user} data={data} credential={credential} onSaved={()=>load(credential,false)} navigate={nav}/>} {['all-orders','pending','delivered','cancelled'].includes(page)&&<OrdersView page={page} data={data} credential={credential} onSaved={()=>load(credential,true)} navigate={nav} categories={categories}/>} {page==='inventory'&&<Inventory data={data} credential={credential} onSaved={()=>load(credential,true)} categories={categories}/>} {page==='packaging'&&<Packaging data={data} credential={credential} onSaved={()=>load(credential,true)}/>} {page==='expenses'&&<Expenses data={data} credential={credential} onSaved={()=>load(credential,true)} categories={categories}/>} {page==='finances'&&<Finances data={data}/>} {page==='products'&&<Products data={data} credential={credential} onSaved={()=>load(credential,true)} categories={categories} onCategoriesChange={updateCategories}/>} {page==='settings'&&<Settings user={user} logout={logout}/>}</div></main><MobileNav page={page} navigate={nav}/></div>;
}

function normalize(d){const categories=[...new Set([...(d.categories||[]),...BASE_CATEGORIES,...(d.products||[]).map(p=>p.category).filter(Boolean)])];return {orders:d.orders||[],order_items:d.order_items||[],products:(d.products&&d.products.length?d.products:PRODUCT_SEED),inventory:d.inventory||DEMO_INVENTORY,packaging:d.packaging||DEMO_PACKAGING,purchases_expenses:d.purchases_expenses||DEMO_EXPENSES,customers:d.customers||[],team:d.team||TEAM,categories};}
function Login({onLogin,error,loading}){const client=import.meta.env.VITE_GOOGLE_CLIENT_ID;const divRef=useRef(null);useEffect(()=>{if(!client)return;let t=setInterval(()=>{if(window.google?.accounts?.id&&divRef.current){clearInterval(t);window.google.accounts.id.initialize({client_id:client,callback:r=>{const p=parseJwt(r.credential);onLogin(r.credential,{name:p.name||p.given_name||'Team member',email:p.email})}});window.google.accounts.id.renderButton(divRef.current,{theme:'outline',size:'large',width:340,text:'continue_with'});}},100);return()=>clearInterval(t)},[client]);return <div className="login-page"><div className="login-art"><div className="brand-mark"><img src="/logo-transparent.png" alt="Sam's Knack"/></div><div className="login-copy"><div className="eyebrow">INTERNAL BUSINESS MANAGER</div><h1>Keep every order,<br/>purchase & stock<br/><em>in one place.</em></h1><p>A simple private workspace for the Samsknack team.</p></div></div><div className="login-panel"><div className="login-card"><div className="mini-logo"><img src="/logo-transparent.png" alt="Sam's Knack"/></div><div className="login-kicker">WELCOME BACK</div><h2>Sign in to Samsknack</h2><p className="login-muted">Use your approved Google account to access the internal manager.</p>{client?<div ref={divRef} className="google-holder"/>:<div className="config-box">Add <b>VITE_GOOGLE_CLIENT_ID</b> to <b>.env.local</b> first.</div>}{error&&<div className="login-error">{error}</div>}{loading&&<div style={{position:'fixed',inset:0,zIndex:100,background:'rgba(255,255,255,.82)',display:'flex',alignItems:'center',justifyContent:'center'}}><div style={{background:'#fff',border:'1px solid #eadde3',borderRadius:14,padding:'18px 24px',boxShadow:'0 10px 30px rgba(45,24,36,.12)',color:'#49333e',fontSize:12,fontWeight:750}}>Signing you in…</div></div>}<div className="login-note">Only authorised Samsknack team accounts can access this workspace.</div><div className="team-preview">{TEAM.map(t=><span key={t.email}>{t.name}</span>)}</div></div></div></div>}
function parseJwt(token){try{return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))}catch{return {}}}
function Sidebar({page,navigate,open,onClose}){const item=(id,label,I)=><button className={'nav-item '+(page===id?'active':'')} onClick={()=>navigate(id)}><I size={18}/><span>{label}</span></button>;return <>{open&&<div className="sidebar-overlay" onClick={onClose}/>}<aside className={'sidebar '+(open?'mobile-open':'')}><div className="sidebar-brand"><img src="/logo-transparent.png" alt="Sam's Knack"/></div><div className="nav-scroll"><div className="nav-section">WORKSPACE</div>{item('home','Home',LayoutDashboard)}<div className="nav-section">ORDERS</div>{item('new-order','New Order',Plus)}{item('all-orders','All Orders',ClipboardList)}{item('pending','Pending Orders',Clock3)}{item('delivered','Delivered Orders',CheckCircle2)}{item('cancelled','Cancelled / Damaged',XCircle)}<div className="nav-section">STOCK & SPEND</div>{item('inventory','Product Inventory',Package)}{item('packaging','Packaging Inventory',Boxes)}{item('expenses','Purchases & Expenses',ShoppingCart)}{item('finances','Finances',WalletCards)}<div className="nav-section">CATALOGUE</div>{item('products','Products',Tags)}<div className="nav-section">SYSTEM</div>{item('settings','Settings',UserRound)}</div><div className="sidebar-foot">SK · Internal use only</div></aside></>}
function MobileNav({page,navigate}){return <nav className="mobile-bottom-nav"><button className={page==='home'?'active':''} onClick={()=>navigate('home')}><LayoutDashboard size={19}/><span>Home</span></button><button className={page==='new-order'?'active':''} onClick={()=>navigate('new-order')}><Plus size={21}/><span>New Order</span></button><button className={['all-orders','pending','delivered','cancelled'].includes(page)?'active':''} onClick={()=>navigate('all-orders')}><ClipboardList size={19}/><span>Orders</span></button><button className={['inventory','packaging'].includes(page)?'active':''} onClick={()=>navigate('inventory')}><Package size={19}/><span>Stock</span></button><button className={['products','expenses','finances','settings'].includes(page)?'active':''} onClick={()=>navigate(page==='products'?'products':'settings')}><Menu size={19}/><span>More</span></button></nav>}
function Dashboard({user,data,navigate}){const orders=data.orders;const active=orders.filter(o=>!['Delivered','Cancelled / Damaged'].includes(o.status)).length;const deliver=orders.filter(o=>!['Delivered','Cancelled / Damaged'].includes(o.status)).length;const low=data.inventory.filter(i=>Number(i.stock)<=Number(i.minimum)).length+data.packaging.filter(i=>Number(i.stock)<=Number(i.minimum)).length;const revenue=orders.reduce((s,o)=>s+Number(o.totalAmount||o.finalTotal||o.total||0),0);const exp=data.purchases_expenses.reduce((s,e)=>s+Number(e.amount||0),0);const profit=revenue-exp;return <><div className="page-heading"><div><div className="eyebrow">DASHBOARD</div><h1>Hi, {user.name} 👋</h1><p>Welcome back. Here's your Samsknack overview.</p></div><button className="primary-btn" onClick={()=>navigate('new-order')}><Plus size={18}/> New Order</button></div><div className="metric-grid"><Metric icon={ClipboardList} label="Orders to Make" value={active} note="Active orders"/><Metric icon={Truck} label="Orders to Deliver" value={deliver} note="Not yet delivered"/><Metric icon={AlertTriangle} label="Low Stock Items" value={low} note="Need attention"/><Metric icon={IndianRupee} label="Estimated Profit" value={'₹'+profit.toLocaleString('en-IN')} note="From recorded sales & spend"/></div><div className="dashboard-grid"><section className="panel chart-panel"><PanelTitle title="Order Status" subtitle="Current order pipeline"/><div className="bar-chart">{['Pending','In Production','Ready','Delivered'].map(s=>{const v=orders.filter(o=>o.status===s).length;return <div className="bar-row" key={s}><div className="bar-label"><span>{s}</span><b>{v}</b></div><div className="bar-track"><div className="bar-fill" style={{width:`${Math.max(v?8:0,v/Math.max(1,orders.length)*100)}%`}}/></div></div>})}</div></section><section className="panel"><PanelTitle title="Inventory Snapshot" subtitle="Stock by category"/><div className="category-list">{(data.categories?.length?data.categories:BASE_CATEGORIES).map((c,i)=>{const count=data.inventory.filter(x=>x.category===c).reduce((s,x)=>s+Number(x.stock||0),0);return <div className="category-row" key={c}><div className="cat-icon">{i===0?'🪔':i===1?'🌸':i===2?'🧶':'🌼'}</div><div className="cat-info"><strong>{c}</strong><span>{count} units</span></div><div className="cat-value">{count}</div></div>})}</div></section></div><section className="panel profit-panel"><PanelTitle title="Business Overview" subtitle="Sales, expenses and estimated profit"/><div className="profit-grid"><div><span>Order Revenue</span><strong>₹{revenue.toLocaleString('en-IN')}</strong></div><div><span>Purchases & Expenses</span><strong>₹{exp.toLocaleString('en-IN')}</strong></div><div><span>Estimated Profit</span><strong className="profit-value">₹{profit.toLocaleString('en-IN')}</strong></div></div></section></>}
function Metric({icon:Icon,label,value,note}){return <div className="metric-card"><div className="metric-icon"><Icon size={19}/></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>}
function PanelTitle({title,subtitle}){return <div className="panel-title"><div><h3>{title}</h3><span>{subtitle}</span></div></div>}

function NewOrder({user,data,credential,onSaved,navigate}){
  const [name,setName]=useState(''),[phone,setPhone]=useState(''),[address,setAddress]=useState(''),[delivery,setDelivery]=useState(''),[notes,setNotes]=useState(''),[paid,setPaid]=useState('0'),[discount,setDiscount]=useState('0'),[found,setFound]=useState(null),[saving,setSaving]=useState(false),[items,setItems]=useState([blankItem()]);
  const suggestions=useMemo(()=>{const n=name.trim().toLowerCase(),p=phone.trim();if(!n&&!p)return[];return data.orders.filter(o=>(n&&String(o.customer||'').toLowerCase().includes(n))||(p&&String(o.phone||'').includes(p))).slice(0,4)},[name,phone,data.orders]);
  const existingItems=useMemo(()=>{if(!found)return [];const rows=Array.isArray(data.order_items)?data.order_items:[];const keys=new Set([String(found.id||''),String(found.code||'')].filter(Boolean));return rows.filter(i=>keys.has(String(i?.orderId||'')));},[found,data.order_items]);
  const totalPieces=items.reduce((s,x)=>s+Number(x.quantity||0)*Number(x.piecesPerUnit||1),0);const bulk=totalPieces>50;
  const subtotal=items.reduce((s,x)=>s+Number(x.unitPrice||0)*Number(x.quantity||0),0);const discountAmount=Math.min(Math.max(0,Number(discount)||0),subtotal);const finalTotal=Math.max(0,subtotal-discountAmount);const paidAmount=Math.max(0,Number(paid)||0);const tipAmount=Math.max(0,paidAmount-finalTotal);const balance=Math.max(0,finalTotal-paidAmount);const paymentStatus=paidAmount<=0?'Not Paid':paidAmount>=finalTotal?'Paid':'Partially Paid';
  const update=(idx,key,val)=>setItems(a=>a.map((x,i)=>i===idx?({...x,[key]:val}):x)); const addLine=()=>setItems(a=>[...a,blankItem()]); const removeLine=i=>setItems(a=>a.filter((_,j)=>j!==i));
  const resetForm=()=>{setName('');setPhone('');setAddress('');setDelivery('');setNotes('');setPaid('0');setDiscount('0');setFound(null);setItems([blankItem()]);};
  const submit=async e=>{e.preventDefault();const normalized=[];for(const x of items){if(!x.product||Number(x.quantity||0)<1){alert('Please select a product and quantity for every product.');return}const allocations=Array.isArray(x.colourAllocations)?x.colourAllocations:[];const cleanAllocations=allocations.map(a=>({colour:String(a?.colour||'').trim(),quantity:Number(a?.quantity||0)})).filter(a=>a.quantity>0);const allocatedQty=cleanAllocations.reduce((s,a)=>s+a.quantity,0);if(!cleanAllocations.length||cleanAllocations.some(a=>!a.colour)){alert('Please select a colour for every allocation.');return}if(allocatedQty!==Number(x.quantity)){alert(`Colour quantities for ${x.product} must equal the product quantity (${x.quantity}).`);return}const piecesPerUnit=x.sellingUnit==='Set of 2'?2:1;for(const a of cleanAllocations){normalized.push({...x,piecesPerUnit,quantity:a.quantity,colour:a.colour,colourAllocations:undefined,unitPrice:Number(x.unitPrice||0),lineTotal:Number(x.unitPrice||0)*a.quantity})}}if(normalized.some(x=>x.customizationRequired&&!String(x.customizationDetails||'').trim())){alert('Customization details are required when customization is selected.');return}const normalizedPieces=normalized.reduce((s,x)=>s+Number(x.quantity||0)*Number(x.piecesPerUnit||1),0);const normalizedSubtotal=normalized.reduce((s,x)=>s+Number(x.lineTotal||0),0);const normalizedDiscount=Math.min(Math.max(0,Number(discount)||0),normalizedSubtotal);const normalizedFinalTotal=Math.max(0,normalizedSubtotal-normalizedDiscount);const normalizedPaid=Math.max(0,Number(paid)||0);const normalizedTip=Math.max(0,normalizedPaid-normalizedFinalTotal);const normalizedBalance=Math.max(0,normalizedFinalTotal-normalizedPaid);const normalizedPaymentStatus=normalizedPaid<=0?'Not Paid':normalizedPaid>=normalizedFinalTotal?'Paid':'Partially Paid';setSaving(true);const existingOrderId=found&&found.id?String(found.id):'';const payload={order:{id:existingOrderId||undefined,existingOrderId:existingOrderId,customer:name,phone,address,delivery,notes,subtotal:normalizedSubtotal,discountAmount:normalizedDiscount,finalTotal:normalizedFinalTotal,totalAmount:normalizedFinalTotal,paidAmount:normalizedPaid,paymentStatus:normalizedPaymentStatus,tipAmount:normalizedTip,balance:normalizedBalance,status:'Pending',type:normalizedPieces>50?'Bulk':'Personal',actualPieces:normalizedPieces,items:normalized}};try{await api('createOrder',payload,credential);await onSaved();resetForm();alert('Order successfully saved.');}catch(e){alert(e.message)}finally{setSaving(false)}};

  return <div><div className="page-heading"><div><div className="eyebrow">ORDERS</div><h1>New Order</h1><p>Enter the customer once, then add as many products as needed.</p></div></div><form className="order-layout" onSubmit={submit}><section className="panel auto-type-banner"><div className="auto-type-icon">{bulk?'📦':'🛍️'}</div><div><span className="auto-type-kicker">ORDER TYPE · AUTOMATIC</span><strong>{bulk?'Bulk Order':'Personal Order'}</strong><p>{totalPieces} actual pieces · {bulk?'51+ pieces → SKC':'50 pieces or less → Personal'}</p></div>{bulk&&<span className="skc-badge">SKC</span>}</section><section className="panel form-panel"><PanelTitle title="Customer Details" subtitle="Existing orders are suggested while you type"/><div className="form-grid"><label>Customer Name<input value={name} onChange={e=>{setName(e.target.value);setFound(null)}} placeholder="e.g. Varsha Patwardhan" required/></label><label>Phone Number<input value={phone} onChange={e=>{setPhone(e.target.value);setFound(null)}} placeholder="10-digit number" required/></label></div>{suggestions.length>0&&<div className="suggestions"><div className="suggestion-head">Existing orders found</div>{suggestions.map(o=><button type="button" className="suggestion" key={o.id} onClick={()=>{const selectedOrder={...o,id:o.id||o.code,code:o.code||o.id};setFound(selectedOrder);setName(String(o.customer||''));setPhone(String(o.phone||''));setAddress(String(o.address||''));setDelivery(dateInputValue(o.delivery));setNotes(String(o.notes||''));}}><div className="avatar small">{String(o.customer||'?')[0]}</div><div><strong>{o.customer}</strong><span>{o.code?o.code+' · ':''}{formatDate(o.delivery)} · {o.status}</span></div><Eye size={16}/></button>)}</div>}{found&&<div className="found-box"><CheckCircle2 size={18}/><div><strong>Existing order selected</strong><p>{found.code||found.id} · {found.customer} · {formatDate(found.delivery)} · {found.status}</p></div><button type="button" onClick={()=>setFound(null)}>Create new order</button></div>}{found&&<div className="existing-items-box"><div className="existing-items-head"><div><strong>Already in this order</strong><span>These products are already attached to {found.code||found.id}.</span></div><span className="existing-items-count">{existingItems.length} {existingItems.length===1?'item':'items'}</span></div>{existingItems.length>0?<div className="existing-items-list">{existingItems.map((it,idx)=><div className="existing-item" key={String(it?.id||`${it?.orderId||'order'}-${idx}-${it?.product||'product'}`)}><div className="existing-item-main"><strong>{String(it?.product||'Product')}</strong><span>{String(it?.sellingUnit||'Per Piece')} · {String(it?.colour||'Colour not set')}</span></div><b>{Number(it?.quantity||0)} × ₹{Number(it?.unitPrice||0).toLocaleString('en-IN')}</b></div>)}</div>:<div className="existing-items-empty">No products are attached to this order yet.</div>}</div>}<div className="form-grid one-three"><label>Delivery Address<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="House / flat, area, city" required/></label><label>Delivery Date<input type="date" value={delivery} onChange={e=>setDelivery(e.target.value)} required/></label></div><div className="form-grid one-three"><label>Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="General order notes..."/></label><div className="punched-by"><span>PUNCHED BY</span><strong>{user.name}</strong><small>{user.email}</small></div></div></section>{items.map((it,idx)=><ProductLine key={it._key} index={idx} item={it} products={data.products} update={update} remove={removeLine} canRemove={items.length>1}/>)}<div className="add-line-wrap"><button type="button" className="outline-btn add-line" onClick={addLine}><Plus size={16}/> Add Another Product</button></div><section className="panel form-panel order-summary"><PanelTitle title="Order Total" subtitle="Prices come automatically from the selected product"/><div className="summary-grid"><div><span>Subtotal</span><strong>₹{subtotal.toLocaleString('en-IN')}</strong></div><label>Discount<input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0"/></label><div className="summary-total"><span>Final Total</span><strong>₹{finalTotal.toLocaleString('en-IN')}</strong></div></div></section><section className="panel form-panel"><PanelTitle title="Payment" subtitle="Payment status is calculated automatically"/><div className="form-grid payment-grid"><div><span className="field-label">Total Amount</span><strong className="payment-number">₹{finalTotal.toLocaleString('en-IN')}</strong></div><label>Paid Amount<input type="number" min="0" value={paid} onChange={e=>setPaid(e.target.value)}/><small className="field-note">Enter the amount actually received. Tips are allowed.</small></label><div><span className="field-label">Payment Status</span><strong className={'payment-status '+paymentStatus.toLowerCase().replaceAll(' ','-')}>{paymentStatus}</strong></div><div><span className="field-label">Balance</span><strong className="payment-number">₹{balance.toLocaleString('en-IN')}</strong></div><div><span className="field-label">Tip / Extra</span><strong className="payment-number">₹{tipAmount.toLocaleString('en-IN')}</strong><small className="field-note">Automatically calculated from overpayment.</small></div></div></section><div className="submit-row"><span><b>{totalPieces}</b> actual pieces · {bulk?'Bulk / SKC':'Personal'} · <b>₹{finalTotal.toLocaleString('en-IN')}</b></span><button className="primary-btn" disabled={saving}><Save size={17}/> {saving?'Saving…':'Save Order'}</button></div></form></div>
}
function blankItem(){return {_key:localId(),product:'',productId:'',productSearch:'',category:'',productImage:'',sellingUnit:'Per Piece',piecesPerUnit:1,quantity:1,colourAllocations:[{colour:'',quantity:1}],customizationRequired:false,customizationDetails:'',referenceImageUrl:'',unitPrice:0}}
function ProductLine({index,item,products,update,remove,canRemove}){
  const selected=products.find(p=>String(p.id)===String(item.productId))||products.find(p=>p.name===item.product)||null;
  const colours=selected?.colours?String(selected.colours).split('|').filter(Boolean):COLOURS;
  const allocationColours=[...new Set([...colours,'Any Colour'])];
  const allocations=Array.isArray(item.colourAllocations)&&item.colourAllocations.length?item.colourAllocations:[{colour:'',quantity:Number(item.quantity||1)}];
  const allocatedQty=allocations.reduce((s,a)=>s+Number(a.quantity||0),0);
  const matches=useMemo(()=>{const q=String(item.productSearch||'').trim().toLowerCase();if(!q)return [];return products.filter(p=>String(p.name).toLowerCase().includes(q)||String(p.category||'').toLowerCase().includes(q)).slice(0,8)},[item.productSearch,products]);
  const chooseProduct=p=>{update(index,'productId',p.id);update(index,'product',p.name);update(index,'productSearch',p.name);update(index,'category',p.category||'');update(index,'productImage',p.imageUrl||'');update(index,'unitPrice',Number(item.sellingUnit==='Set of 2'?p.sellingPriceSet2||0:p.sellingPricePiece||0));update(index,'colourAllocations',[{colour:'',quantity:Number(item.quantity||1)}]);};
  const onSearch=v=>{update(index,'productSearch',v);if(selected&&v!==selected.name){update(index,'productId','');update(index,'product','');update(index,'productImage','');update(index,'unitPrice',0);update(index,'colourAllocations',[{colour:'',quantity:Number(item.quantity||1)}]);}}
  const changeQuantity=v=>{const q=Math.max(1,Number(v)||1);update(index,'quantity',q);if(allocations.length===1)update(index,'colourAllocations',[{...allocations[0],quantity:q}])};
  const updateAllocation=(aidx,key,val)=>{const next=allocations.map((a,i)=>i===aidx?({...a,[key]:key==='quantity'?Math.max(0,Number(val)||0):val}):a);update(index,'colourAllocations',next)};
  const addAllocation=()=>update(index,'colourAllocations',[...allocations,{colour:'',quantity:Math.max(0,Number(item.quantity||0)-allocatedQty)}]);
  const removeAllocation=aidx=>{if(allocations.length===1)return;update(index,'colourAllocations',allocations.filter((_,i)=>i!==aidx))};
  const upload=async e=>{const f=e.target.files?.[0];if(!f)return;update(index,'_uploading',true);try{const data=await fileData(f);const r=await api('uploadImage',{file:{name:f.name,mimeType:f.type,data}},window.sessionStorage.getItem('sk_credential'));update(index,'referenceImageUrl',r.data.url)}catch(err){alert(err.message)}finally{update(index,'_uploading',false)}};
  return <section className="panel form-panel"><div className="line-heading"><div><div className="line-title">Product {index+1}</div><span>Search and select directly from the catalogue</span></div>{canRemove&&<button type="button" className="icon-btn" onClick={()=>remove(index)}><X size={16}/></button>}</div><div className="product-order-card"><div className="product-choice"><label>Product<input value={item.productSearch} onChange={e=>onSearch(e.target.value)} placeholder="Search product by name…" autoComplete="off"/>{!selected&&String(item.productSearch||'').trim()&&<div className="product-search-popover">{matches.length>0?matches.map(p=><button type="button" key={p.id} onClick={()=>chooseProduct(p)}><div className="search-product-thumb">{p.imageUrl?<img src={p.imageUrl} alt=""/>:<Tags size={15}/>}</div><div><strong>{p.name}</strong><span>{shortCategory(p.category)}</span></div></button>):<div className="product-search-empty">No matching products found.</div>}</div>}</label>{selected&&<div className="selected-product"><div className="selected-product-image">{selected.imageUrl?<img src={selected.imageUrl} alt={selected.name}/>:<div className="product-placeholder"><Tags size={26}/><span>No catalogue image</span></div>}</div><div className="selected-product-info"><strong>{selected.name}</strong><span>{selected.category}</span><small>{selected.source||'In-house'}</small><button type="button" className="text-btn" onClick={()=>{update(index,'productSearch','');update(index,'productId','');update(index,'product','');update(index,'productImage','');update(index,'unitPrice',0);update(index,'colourAllocations',[{colour:'',quantity:Number(item.quantity||1)}])}}>Change product</button></div></div>}</div><div className="product-fields"><div className="form-grid compact-grid"><label>Quantity<input type="number" min="1" value={item.quantity} onChange={e=>changeQuantity(e.target.value)}/></label><label>Sold As<select value={item.sellingUnit} onChange={e=>{const v=e.target.value;update(index,'sellingUnit',v);update(index,'piecesPerUnit',v==='Set of 2'?2:1);update(index,'unitPrice',Number(v==='Set of 2'?selected?.sellingPriceSet2||0:selected?.sellingPricePiece||0))}} disabled={!selected}><option>Per Piece</option><option>Set of 2</option></select></label></div><div className="colour-allocation-box"><div className="colour-allocation-head"><div><b>Colour Allocation</b><span>Split the product quantity across colours.</span></div><span className={allocatedQty===Number(item.quantity)?'allocation-ok':'allocation-error'}>{allocatedQty} / {Number(item.quantity||0)} allocated</span></div>{allocations.map((a,aidx)=><div className="colour-allocation-row" key={`${item._key}-colour-${aidx}`}><select value={a.colour} onChange={e=>updateAllocation(aidx,'colour',e.target.value)} required disabled={!selected}><option value="">Select colour</option>{allocationColours.map(c=><option key={c}>{c}</option>)}</select><input type="number" min="0" max={Number(item.quantity||0)} value={a.quantity} onChange={e=>updateAllocation(aidx,'quantity',e.target.value)} disabled={!selected}/><button type="button" className="icon-btn" onClick={()=>removeAllocation(aidx)} disabled={allocations.length===1} aria-label="Remove colour allocation"><X size={14}/></button></div>)}<button type="button" className="text-btn add-colour-allocation" onClick={addAllocation} disabled={!selected}><Plus size={14}/> Add another colour</button></div><div className="unit-price-display"><span>Unit Price</span><strong>₹{Number(item.unitPrice||0).toLocaleString('en-IN')}</strong><small>Automatically taken from Products</small></div></div></div><div className="custom-row"><label className="check-label"><input type="checkbox" checked={item.customizationRequired} onChange={e=>update(index,'customizationRequired',e.target.checked)} disabled={!selected}/> Customization required</label>{item.customizationRequired&&<div className="custom-fields"><label>Customization Details *<textarea required value={item.customizationDetails} onChange={e=>update(index,'customizationDetails',e.target.value)} placeholder="Enter exactly what the customer wants…"/></label><label className="upload-box"><Upload size={15}/>{item._uploading?'Uploading…':item.referenceImageUrl?'Reference image added':'Add reference image (optional)'}<input type="file" accept="image/*" onChange={upload}/></label></div>}</div></section>
}
function fileData(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}

function OrdersView({page,data,credential,onSaved,navigate,categories}){
  const [q,setQ]=useState(''),[type,setType]=useState('All'),[cat,setCat]=useState('All Categories'),[status,setStatus]=useState('All Statuses'),[payment,setPayment]=useState('All Payments'),[editing,setEditing]=useState(null);
  const wanted=page==='pending'?[...data.orders].filter(o=>!['Delivered','Cancelled / Damaged'].includes(o.status)).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)):page==='delivered'?[...data.orders].filter(o=>o.status==='Delivered').sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)):page==='cancelled'?[...data.orders].filter(o=>o.status==='Cancelled / Damaged').sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)):[...data.orders].sort((a,b)=>{const rank=o=>o.status==='Cancelled / Damaged'?2:o.status==='Delivered'?1:0;return rank(a)-rank(b)||new Date(b.createdAt||0)-new Date(a.createdAt||0)});
  const filtered=wanted.filter(o=>{const text=((o.customer||'')+' '+(o.phone||'')+' '+(o.code||'')).toLowerCase();const items=data.order_items.filter(i=>String(i.orderId)===String(o.id));const cats=[...(o.categories||[]),...items.map(i=>i.category)];return text.includes(q.toLowerCase())&&(type==='All'||o.type===type)&&(cat==='All Categories'||cats.includes(cat))&&(status==='All Statuses'||o.status===status)&&(payment==='All Payments'||(o.paymentStatus||'Not Paid')===payment)});
  const change=async(o,s)=>{try{await api('updateOrder',{order:{id:o.id,status:s}},credential);await onSaved()}catch(e){alert(e.message)}};
  const openEdit=o=>setEditing(o);
  const editSaved=async()=>{setEditing(null);await onSaved()};
  return <div><div className="page-heading"><div><div className="eyebrow">ORDERS</div><h1>{page==='all-orders'?'All Orders':page==='pending'?'Pending Orders':page==='delivered'?'Delivered Orders':'Cancelled / Damaged Orders'}</h1><p>Search, edit and update orders from any phone.</p></div><button className="primary-btn" onClick={()=>navigate('new-order')}><Plus size={18}/> New Order</button></div><section className="panel table-panel"><div className="filters"><div className="search"><Search size={17}/><input placeholder="Search customer, phone or SKC…" value={q} onChange={e=>setQ(e.target.value)}/></div><select value={type} onChange={e=>setType(e.target.value)}><option>All</option><option>Personal</option><option>Bulk</option></select><select value={cat} onChange={e=>setCat(e.target.value)}><option>All Categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option>All Statuses</option>{['Pending','In Production','Ready','Delivered','Cancelled / Damaged'].map(s=><option key={s}>{s}</option>)}</select><select value={payment} onChange={e=>setPayment(e.target.value)}><option>All Payments</option><option>Not Paid</option><option>Partially Paid</option><option>Paid</option></select></div><div className="desktop-table"><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Items / Order Details</th><th>Delivery</th><th>Amount</th><th>Status</th><th>Payment</th><th>Action</th></tr></thead><tbody>{filtered.map(o=><OrderRow key={o.id} o={o} data={data} change={change} edit={openEdit}/>)}</tbody></table></div></div><div className="mobile-order-list">{filtered.map(o=><div className="mobile-order-card" key={o.id}><div className="mobile-order-top"><div className="customer-cell"><div className="avatar small">{String(o.customer||'?')[0]}</div><div><strong>{o.customer}</strong><span>{o.phone}</span>{o.code&&<small className="order-card-code">{o.code}</small>}</div></div><button type="button" className="outline-btn mobile-edit-order" onClick={()=>openEdit(o)}><Pencil size={13}/> Edit</button></div><div className="mobile-order-item">{orderDetails(o,data,true)}</div><div className="mobile-order-meta"><span><b>Delivery</b>{formatDate(o.delivery)}</span><span><b>Payment</b>{o.paymentStatus||'Not Paid'}</span><span><b>Amount</b>₹{Number(o.totalAmount||o.finalTotal||o.total||0).toLocaleString('en-IN')}</span></div><div className="mobile-order-actions"><select className={'status-select '+statusClass(o.status)} value={o.status} onChange={e=>change(o,e.target.value)}>{statusOptions()}</select></div></div>)}{filtered.length===0&&<div className="empty">No orders found.</div>}</div></section>{editing&&<OrderEditModal order={editing} data={data} credential={credential} categories={categories} close={()=>setEditing(null)} onSaved={editSaved}/>}</div>
}

function OrderRow({o,data,change,edit}){return <tr><td><div className="customer-cell"><div className="avatar small">{String(o.customer||'?')[0]}</div><div><strong>{o.customer}</strong><span>{o.phone}</span>{o.code&&<small className="table-sub">{o.code}</small>}</div></div></td><td>{orderDetails(o,data,false)}</td><td>{formatDate(o.delivery)}</td><td>₹{Number(o.finalTotal||o.totalAmount||o.total||0).toLocaleString('en-IN')}</td><td><select className={'status-select '+statusClass(o.status)} value={o.status} onChange={e=>change(o,e.target.value)}>{statusOptions()}</select></td><td>{o.paymentStatus||'Not Paid'}</td><td><button type="button" className="outline-btn order-edit-btn" onClick={()=>edit(o)}><Pencil size={13}/> Edit</button></td></tr>}

function statusOptions(){return ['Pending','In Production','Ready','Delivered','Cancelled / Damaged'].map(s=><option key={s}>{s}</option>)}
function orderItems(o,data){return data.order_items.filter(i=>String(i.orderId)===String(o.id))}
function cloneEditItem(i={}){return {_key:localId(),product:String(i.product||''),productId:String(i.productId||''),productSearch:String(i.product||''),category:String(i.category||''),productImage:String(i.productImage||''),sellingUnit:String(i.sellingUnit||'Per Piece'),piecesPerUnit:Number(i.piecesPerUnit||1),quantity:Number(i.quantity||1),colourAllocations:[{colour:String(i.colour||''),quantity:Number(i.quantity||1)}],customizationRequired:!!i.customizationRequired,customizationDetails:String(i.customizationDetails||''),referenceImageUrl:String(i.referenceImageUrl||''),unitPrice:Number(i.unitPrice||0)}}

function OrderEditModal({order,data,credential,onSaved,close}){
  const existing=useMemo(()=>{
    const rows=orderItems(order,data);
    const groups=[];

    rows.forEach(i=>{
      const key=[
        i.product||'',
        i.sellingUnit||'Per Piece',
        i.customizationDetails||'',
        i.referenceImageUrl||''
      ].join('||');

      let g=groups.find(x=>x.key===key);

      if(!g){
        g={
          _key:localId(),
          product:i.product||'',
          productId:i.productId||'',
          productSearch:i.product||'',
          category:i.category||'',
          productImage:i.productImage||'',
          sellingUnit:i.sellingUnit||'Per Piece',
          piecesPerUnit:Number(i.piecesPerUnit||1),
          quantity:0,
          unitPrice:Number(i.unitPrice||0),
          colourAllocations:[],
          customizationRequired:!!i.customizationRequired,
          customizationDetails:String(i.customizationDetails||''),
          referenceImageUrl:String(i.referenceImageUrl||'')
        };
        groups.push(g);
      }

      g.quantity+=Number(i.quantity||0);

      const colour=String(i.colour||'').trim();
      if(colour){
        const found=g.colourAllocations.find(a=>a.colour===colour);
        if(found) found.quantity+=Number(i.quantity||0);
        else g.colourAllocations.push({
          colour,
          quantity:Number(i.quantity||0)
        });
      }
    });

    return groups;
  },[order,data]);

  const [form,setForm]=useState({
    customer:String(order.customer||''),
    phone:String(order.phone||''),
    address:String(order.address||''),
    delivery:dateInputValue(order.delivery),
    notes:String(order.notes||''),
    status:String(order.status||'Pending'),
    discountAmount:Number(order.discountAmount||0),
    paidAmount:Number(order.paidAmount||0),
    items:existing
  });

  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    setForm({
      customer:String(order.customer||''),
      phone:String(order.phone||''),
      address:String(order.address||''),
      delivery:dateInputValue(order.delivery),
      notes:String(order.notes||''),
      status:String(order.status||'Pending'),
      discountAmount:Number(order.discountAmount||0),
      paidAmount:Number(order.paidAmount||0),
      items:existing
    });
  },[order,existing]);

  const update=(key,value)=>{
    setForm(f=>({...f,[key]:value}));
  };

  const updateItem=(index,key,value)=>{
    setForm(f=>({
      ...f,
      items:f.items.map((x,i)=>i===index?({...x,[key]:value}):x)
    }));
  };

  const removeItem=index=>{
    setForm(f=>({
      ...f,
      items:f.items.filter((_,i)=>i!==index)
    }));
  };

  const addItem=()=>{
    setForm(f=>({
      ...f,
      items:[
        ...f.items,
        {
          _key:localId(),
          product:'',
          productId:'',
          productSearch:'',
          category:'',
          productImage:'',
          sellingUnit:'Per Piece',
          piecesPerUnit:1,
          quantity:1,
          unitPrice:0,
          colourAllocations:[{colour:'',quantity:1}],
          customizationRequired:false,
          customizationDetails:'',
          referenceImageUrl:''
        }
      ]
    }));
  };

  const subtotal=form.items.reduce(
    (sum,x)=>sum+Number(x.unitPrice||0)*Number(x.quantity||0),
    0
  );

  const discount=Math.min(
    Math.max(0,Number(form.discountAmount)||0),
    subtotal
  );

  const finalTotal=Math.max(0,subtotal-discount);
  const paid=Math.max(0,Number(form.paidAmount)||0);
  const balance=Math.max(0,finalTotal-paid);
  const tip=Math.max(0,paid-finalTotal);

  const paymentStatus=
    paid<=0
      ? 'Not Paid'
      : paid>=finalTotal
        ? 'Paid'
        : 'Partially Paid';

  const actualPieces=form.items.reduce(
    (sum,x)=>sum+
      Number(x.quantity||0)*Number(x.piecesPerUnit||1),
    0
  );

  const save=async e=>{
    e.preventDefault();

    if(!form.customer.trim()){
      alert('Customer name is required.');
      return;
    }

    if(!form.phone.trim()){
      alert('Phone number is required.');
      return;
    }

    if(!form.address.trim()){
      alert('Delivery address is required.');
      return;
    }

    if(!form.delivery){
      alert('Delivery date is required.');
      return;
    }

    if(!form.items.length){
      alert('At least one product is required.');
      return;
    }

    const normalized=[];

    for(const item of form.items){

      if(!item.product){
        alert('Please select a product for every product line.');
        return;
      }

      if(Number(item.quantity||0)<1){
        alert(`Quantity for ${item.product} must be at least 1.`);
        return;
      }

      const allocations=
        Array.isArray(item.colourAllocations)
          ? item.colourAllocations
          : [];

      const cleanAllocations=allocations
        .map(a=>({
          colour:String(a?.colour||'').trim(),
          quantity:Number(a?.quantity||0)
        }))
        .filter(a=>a.quantity>0);

      const allocatedQty=cleanAllocations.reduce(
        (sum,a)=>sum+a.quantity,
        0
      );

      if(
        !cleanAllocations.length ||
        cleanAllocations.some(a=>!a.colour)
      ){
        alert(`Please complete colour allocation for ${item.product}.`);
        return;
      }

      if(allocatedQty!==Number(item.quantity)){
        alert(
          `Colour quantities for ${item.product} must equal the product quantity (${item.quantity}).`
        );
        return;
      }

      if(
        item.customizationRequired &&
        !String(item.customizationDetails||'').trim()
      ){
        alert(`Customization details are required for ${item.product}.`);
        return;
      }

      const piecesPerUnit=
        item.sellingUnit==='Set of 2'?2:1;

      cleanAllocations.forEach(a=>{
        normalized.push({
          ...item,
          colour:a.colour,
          quantity:a.quantity,
          piecesPerUnit,
          unitPrice:Number(item.unitPrice||0),
          lineTotal:
            Number(item.unitPrice||0)*a.quantity,
          colourAllocations:undefined
        });
      });
    }

    if(paid<0){
      alert('Paid amount cannot be negative.');
      return;
    }

    if(paid>finalTotal){
      alert(
        'Paid amount is greater than the final total. The excess will be treated as Tip / Extra. Please use the calculated amount intentionally.'
      );
    }

    setSaving(true);

    try{
      await api(
        'updateOrder',
        {
          order:{
            id:order.id,
            customer:form.customer,
            phone:form.phone,
            address:form.address,
            delivery:form.delivery,
            notes:form.notes,
            status:form.status,
            discountAmount:discount,
            paidAmount:paid,
            paymentStatus,
            subtotal,
            finalTotal,
            totalAmount:finalTotal,
            tipAmount:tip,
            balance,
            actualPieces,
            type:actualPieces>50?'Bulk':'Personal',
            items:normalized
          }
        },
        credential
      );

      await onSaved();
      close();
    }catch(e){
      alert(e.message);
    }finally{
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal order-edit-modal">

        <div className="modal-head order-edit-header">
          <div>
            <div className="order-edit-kicker">ORDER MANAGEMENT</div>
            <h3>Edit Order · {order.code||order.id}</h3>
            <p>Update customer, products, payment and delivery details.</p>
          </div>

         <button
  type="button"
  className="icon-btn"
  onClick={(e)=>{
    e.preventDefault();
    e.stopPropagation();
    close();
  }}
  aria-label="Close Edit Order"
>
  <X size={17}/>
</button>
        </div>

        <form onSubmit={save}>

          {/* CUSTOMER DETAILS */}

          <section className="order-edit-section">

            <div className="order-edit-section-title">
              <div>
                <strong>Customer Details</strong>
                <span>Edit the order information.</span>
              </div>
            </div>

            <div className="order-edit-grid">

              <label>
                Customer Name
                <input
                  value={form.customer}
                  onChange={e=>update('customer',e.target.value)}
                />
              </label>

              <label>
                Phone Number
                <input
                  value={form.phone}
                  onChange={e=>update('phone',e.target.value)}
                />
              </label>

              <label>
                Delivery Address
                <input
                  value={form.address}
                  onChange={e=>update('address',e.target.value)}
                />
              </label>

              <label>
                Delivery Date
                <input
                  type="date"
                  value={form.delivery}
                  onChange={e=>update('delivery',e.target.value)}
                />
              </label>

              <label className="order-edit-notes">
                Notes
                <textarea
                  value={form.notes}
                  onChange={e=>update('notes',e.target.value)}
                />
              </label>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={e=>update('status',e.target.value)}
                >
                  {statusOptions()}
                </select>
              </label>

            </div>
          </section>

          {/* PRODUCTS */}

          <section className="order-edit-section">

            <div className="order-edit-section-title">
              <div>
                <strong>Products</strong>
                <span>Edit quantity, colour, sold as, price and customization.</span>
              </div>

              <span className="order-edit-count">
                {form.items.length}
                {form.items.length===1?' Product':' Products'}
              </span>
            </div>

            <div className="order-edit-products">

              {form.items.map((item,index)=>(
                <EditProductLine
                  key={item._key}
                  index={index}
                  item={item}
                  products={data.products}
                  update={updateItem}
                  remove={removeItem}
                  canRemove={form.items.length>1}
                />
              ))}

            </div>

            {/* ADD PRODUCT AFTER THE LAST PRODUCT */}

            <button
              type="button"
              className="outline-btn order-edit-add-product"
              onClick={addItem}
            >
              <Plus size={15}/>
              Add Product
            </button>

          </section>

          {/* ORDER SUMMARY */}

          <section className="order-edit-section order-edit-finance">

            <div className="order-edit-section-title">
              <div>
                <strong>Order Summary</strong>
                <span>Totals update automatically from the products and discount.</span>
              </div>
            </div>

            <div className="order-edit-money-grid">

              <div className="order-edit-money-card">
                <span>Subtotal</span>
                <strong>
                  ₹{subtotal.toLocaleString('en-IN')}
                </strong>
              </div>

              <label className="order-edit-money-card editable-money">
                <span>Discount</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={form.discountAmount}
                  onChange={e=>update('discountAmount',e.target.value)}
                />
              </label>

              <div className="order-edit-money-card total-money">
                <span>Final Total</span>
                <strong>
                  ₹{finalTotal.toLocaleString('en-IN')}
                </strong>
              </div>

            </div>

          </section>

          {/* PAYMENT */}

          <section className="order-edit-section order-edit-finance">

            <div className="order-edit-section-title">
              <div>
                <strong>Payment</strong>
                <span>Payment can be updated at any time, including after delivery.</span>
              </div>
            </div>

            <div className="order-edit-money-grid">

              <div className="order-edit-money-card">
                <span>Total Amount</span>
                <strong>
                  ₹{finalTotal.toLocaleString('en-IN')}
                </strong>
              </div>

              <label className="order-edit-money-card editable-money">
                <span>Paid Amount</span>
                <input
                  type="number"
                  min="0"
                  value={form.paidAmount}
                  onChange={e=>update('paidAmount',e.target.value)}
                />
              </label>

              <div className="order-edit-money-card">
                <span>Payment Status</span>
                <strong className={
                  'payment-status '+
                  paymentStatus.toLowerCase().replaceAll(' ','-')
                }>
                  {paymentStatus}
                </strong>
              </div>

              <div className="order-edit-money-card">
                <span>Balance</span>
                <strong>
                  ₹{balance.toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="order-edit-money-card">
                <span>Tip / Extra</span>
                <strong>
                  ₹{tip.toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="order-edit-money-card">
                <span>Actual Pieces</span>
                <strong>
                  {actualPieces}
                </strong>
              </div>

            </div>

          </section>

          {/* FOOTER */}

          <div className="order-edit-footer">

            <button
  type="button"
  className="outline-btn"
  onClick={(e)=>{
    e.preventDefault();
    e.stopPropagation();
    close();
  }}
>
  Cancel
</button>

            <button
              type="submit"
              className="primary-btn"
              disabled={saving}
            >
              <Save size={16}/>
              {saving?'Saving…':'Save Changes'}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}


function EditProductLine({
  index,
  item,
  products,
  update,
  remove,
  canRemove
}){
  const selected=
    products.find(p=>String(p.id)===String(item.productId)) ||
    products.find(p=>p.name===item.product) ||
    null;

  const colours=
    selected?.colours
      ? String(selected.colours).split('|').filter(Boolean)
      : COLOURS;

  const allocationColours=[
    ...new Set([...colours,'Any Colour'])
  ];

  const allocations=
    Array.isArray(item.colourAllocations) &&
    item.colourAllocations.length
      ? item.colourAllocations
      : [{colour:'',quantity:Number(item.quantity||1)}];

  const allocatedQty=allocations.reduce(
    (sum,a)=>sum+Number(a.quantity||0),
    0
  );

  const matches=useMemo(()=>{
    const q=String(item.productSearch||'')
      .trim()
      .toLowerCase();

    if(!q)return [];

    return products
      .filter(p=>
        String(p.name||'').toLowerCase().includes(q) ||
        String(p.category||'').toLowerCase().includes(q)
      )
      .slice(0,8);
  },[item.productSearch,products]);

  const updateLocal=(key,value)=>{
    update(index,key,value);
  };

  const chooseProduct=p=>{
    update(index,'productId',p.id);
    update(index,'product',p.name);
    update(index,'productSearch',p.name);
    update(index,'category',p.category||'');
    update(index,'productImage',p.imageUrl||'');

    const price=
      item.sellingUnit==='Set of 2'
        ? Number(p.sellingPriceSet2||0)
        : Number(p.sellingPricePiece||0);

    update(index,'unitPrice',price);

    update(index,'colourAllocations',[
      {
        colour:'',
        quantity:Number(item.quantity||1)
      }
    ]);
  };

  const changeSearch=value=>{
    update(index,'productSearch',value);

    if(selected && value!==selected.name){
      update(index,'productId','');
      update(index,'product','');
      update(index,'productImage','');
      update(index,'unitPrice',0);
      update(index,'colourAllocations',[
        {
          colour:'',
          quantity:Number(item.quantity||1)
        }
      ]);
    }
  };

  const changeQuantity=value=>{
    const q=Math.max(1,Number(value)||1);

    update(index,'quantity',q);

    if(allocations.length===1){
      update(index,'colourAllocations',[
        {
          ...allocations[0],
          quantity:q
        }
      ]);
    }
  };

  const changeSoldAs=value=>{
    update(index,'sellingUnit',value);
    update(
      index,
      'piecesPerUnit',
      value==='Set of 2'?2:1
    );

    if(selected){
      update(
        index,
        'unitPrice',
        Number(
          value==='Set of 2'
            ? selected.sellingPriceSet2||0
            : selected.sellingPricePiece||0
        )
      );
    }
  };

  const updateAllocation=(aidx,key,value)=>{
    const next=allocations.map((a,i)=>
      i===aidx
        ? {
            ...a,
            [key]:
              key==='quantity'
                ? Math.max(0,Number(value)||0)
                : value
          }
        : a
    );

    update(index,'colourAllocations',next);
  };

  const addAllocation=()=>{
    update(index,'colourAllocations',[
      ...allocations,
      {
        colour:'',
        quantity:Math.max(
          0,
          Number(item.quantity||0)-allocatedQty
        )
      }
    ]);
  };

  const removeAllocation=aidx=>{
    if(allocations.length===1)return;

    update(
      index,
      'colourAllocations',
      allocations.filter((_,i)=>i!==aidx)
    );
  };

  const upload=async e=>{
    const f=e.target.files?.[0];
    if(!f)return;

    update(index,'_uploading',true);

    try{
      const file=await fileData(f);

      const r=await api(
        'uploadImage',
        {
          file:{
            name:f.name,
            mimeType:f.type,
            data:file
          }
        },
        window.sessionStorage.getItem('sk_credential')
      );

      update(index,'referenceImageUrl',r.data.url);
    }catch(err){
      alert(err.message);
    }finally{
      update(index,'_uploading',false);
    }
  };

  return (
    <div className="order-edit-product">

      <div className="order-edit-product-head">

        <div>
          <span className="order-edit-product-number">
            PRODUCT {index+1}
          </span>
          <strong>
            {selected?.name||item.product||'Add a product'}
          </strong>
        </div>

        {canRemove&&(
          <button
            type="button"
            onClick={()=>remove(index)}
          >
            <X size={13}/>
            Remove
          </button>
        )}

      </div>

      {/* PRODUCT SEARCH */}

      <div className="order-edit-product-search">

        <label>
          Product

          <input
            value={item.productSearch||''}
            onChange={e=>changeSearch(e.target.value)}
            placeholder="Search product..."
            autoComplete="off"
          />

          {!selected &&
            String(item.productSearch||'').trim() && (
              <div className="product-search-popover">

                {matches.length>0
                  ? matches.map(p=>(
                      <button
                        type="button"
                        key={p.id}
                        onClick={()=>chooseProduct(p)}
                      >
                        <div className="search-product-thumb">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt=""/>
                            : <Tags size={15}/>
                          }
                        </div>

                        <div>
                          <strong>{p.name}</strong>
                          <span>{shortCategory(p.category)}</span>
                        </div>
                      </button>
                    ))
                  : (
                    <div className="product-search-empty">
                      No matching products found.
                    </div>
                  )
                }

              </div>
            )
          }

        </label>

      </div>

      {/* SELECTED PRODUCT */}

      {selected&&(
        <div className="order-edit-selected-product">

          <div className="order-edit-selected-image">

            {selected.imageUrl
              ? <img
                  src={selected.imageUrl}
                  alt={selected.name}
                />
              : <div className="product-placeholder">
                  <Tags size={25}/>
                  <span>No image</span>
                </div>
            }

          </div>

          <div className="order-edit-selected-info">

            <strong>{selected.name}</strong>

            <span>
              {selected.category}
            </span>

            <small>
              {selected.source||'In-house'}
            </small>

          </div>

        </div>
      )}

      {/* QUANTITY / SOLD AS / PRICE */}

      <div className="order-edit-product-fields">

        <label>
          Quantity
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={e=>changeQuantity(e.target.value)}
          />
        </label>

        <label>
          Sold As
          <select
            value={item.sellingUnit}
            onChange={e=>changeSoldAs(e.target.value)}
            disabled={!selected}
          >
            <option>Per Piece</option>
            <option>Set of 2</option>
          </select>
        </label>

        <label>
          Unit Price
          <input
            type="number"
            min="0"
            value={item.unitPrice}
            onChange={e=>
              updateLocal(
                'unitPrice',
                Math.max(0,Number(e.target.value)||0)
              )
            }
          />
        </label>

      </div>

      {/* COLOUR */}

      <div className="order-edit-colour-box">

        <div className="order-edit-colour-head">

          <div>
            <strong>Colour Allocation</strong>
            <span>
              Split the product quantity across colours.
            </span>
          </div>

          <span
            className={
              allocatedQty===Number(item.quantity)
                ? 'allocation-ok'
                : 'allocation-error'
            }
          >
            {allocatedQty} / {Number(item.quantity||0)}
          </span>

        </div>

        {allocations.map((a,aidx)=>(
          <div
            className="order-edit-colour-row"
            key={`${item._key}-colour-${aidx}`}
          >

            <select
              value={a.colour}
              onChange={e=>
                updateAllocation(
                  aidx,
                  'colour',
                  e.target.value
                )
              }
              disabled={!selected}
            >
              <option value="">
                Select colour
              </option>

              {allocationColours.map(c=>(
                <option key={c}>{c}</option>
              ))}

            </select>

            <input
              type="number"
              min="0"
              max={Number(item.quantity||0)}
              value={a.quantity}
              onChange={e=>
                updateAllocation(
                  aidx,
                  'quantity',
                  e.target.value
                )
              }
              disabled={!selected}
            />

            <button
              type="button"
              className="icon-btn"
              onClick={()=>removeAllocation(aidx)}
              disabled={allocations.length===1}
            >
              <X size={13}/>
            </button>

          </div>
        ))}

        <button
          type="button"
          className="text-btn order-edit-add-colour"
          onClick={addAllocation}
          disabled={!selected}
        >
          <Plus size={13}/>
          Add another colour
        </button>

      </div>

      {/* CUSTOMIZATION */}

      <div className="order-edit-custom">

        <label className="check-label">
          <input
            type="checkbox"
            checked={!!item.customizationRequired}
            onChange={e=>
              updateLocal(
                'customizationRequired',
                e.target.checked
              )
            }
            disabled={!selected}
          />
          Customization required
        </label>

        {item.customizationRequired&&(
          <div className="order-edit-custom-grid">

            <label>
              Customization Details *
              <textarea
                required
                value={item.customizationDetails||''}
                onChange={e=>
                  updateLocal(
                    'customizationDetails',
                    e.target.value
                  )
                }
                placeholder="Enter exactly what the customer wants..."
              />
            </label>

            <label className="upload-box order-edit-upload">
              <Upload size={15}/>

              {item._uploading
                ? 'Uploading…'
                : item.referenceImageUrl
                  ? 'Reference image added'
                  : 'Add reference image'
              }

              <input
                type="file"
                accept="image/*"
                onChange={upload}
              />
            </label>

          </div>
        )}

      </div>

    </div>
  );
}

function orderDetails(o,data,compact=false){
  const its=orderItems(o,data);
  if(!its.length)return <span className="muted">No product details</span>;

  const groups=[];
  its.forEach(i=>{
    const key=[i.product||'',i.sellingUnit||'',i.customizationDetails||'',i.referenceImageUrl||''].join('||');
    let g=groups.find(x=>x.key===key);

    if(!g){
      g={
        key,
        product:i.product||'Product',
        sellingUnit:i.sellingUnit||'Per Piece',
        quantity:0,
        colours:[],
        customizationDetails:String(i.customizationDetails||''),
        referenceImageUrl:String(i.referenceImageUrl||'')
      };
      groups.push(g);
    }

    g.quantity+=Number(i.quantity||0);

    const c=String(i.colour||'').trim();
    if(c){
      const existing=g.colours.find(x=>x.colour===c);
      if(existing)existing.quantity+=Number(i.quantity||0);
      else g.colours.push({colour:c,quantity:Number(i.quantity||0)});
    }
  });

  return <div className={'order-details '+(compact?'compact':'')}>
    {groups.map(g=><div className="order-detail-group" key={g.key}>
      <div className="order-detail-main">
        <strong>{g.product}</strong>
        <span>{g.quantity} × {g.sellingUnit}</span>
      </div>

      <div className="order-detail-colours">
        {g.colours.map(c=><span key={c.colour}>{c.colour}: {c.quantity}</span>)}
      </div>

      {g.customizationDetails&&<div className="order-customization">
        <b>Customization</b>
        <span>{g.customizationDetails}</span>
      </div>}

      {g.referenceImageUrl&&<a className="order-reference" href={g.referenceImageUrl} target="_blank" rel="noreferrer">
        <img src={g.referenceImageUrl} alt="Customization reference"/>
        <span>Reference image</span>
      </a>}
    </div>)}
  </div>
}

function itemSummary(o,data){return orderItems(o,data).map(i=>`${i.quantity} × ${i.product}${i.sellingUnit?' ('+i.sellingUnit+')':''}${i.colour?' · '+i.colour:''}`).join(' · ')||o.items||'—'}
function categorySummary(o,data){const cats=[...(o.categories||[]),...orderItems(o,data).map(i=>i.category)];return [...new Set(cats)].filter(Boolean).map(c=><span className="category-pill" key={c}>{shortCategory(c)}</span>)}
function Inventory({data,credential,onSaved,categories}){const [cat,setCat]=useState('All Categories');const [open,setOpen]=useState(false);const [form,setForm]=useState({category:categories[0],product:'',colour:'',stock:0,minimum:0,unit:'pcs',source:'In-house'});const list=data.inventory.filter(i=>cat==='All Categories'||i.category===cat);const save=async()=>{try{await api('createInventory',{item:form},credential);setOpen(false);await onSaved()}catch(e){alert(e.message)}};return <div><div className="page-heading"><div><div className="eyebrow">INVENTORY</div><h1>Product Inventory</h1><p>Track stock down to product + colour/variant.</p></div><button className="primary-btn" onClick={()=>setOpen(true)}><Plus size={18}/> Add Stock</button></div><div className="category-tabs">{['All Categories',...categories].map(c=><button className={cat===c?'active':''} key={c} onClick={()=>setCat(c)}>{c}</button>)}</div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Colour / Variant</th><th>Stock</th><th>Minimum</th><th>Need to Order</th><th>Status</th></tr></thead><tbody>{list.map(i=>{const need=Math.max(0,Number(i.minimum)-Number(i.stock));return <tr key={i.id}><td><strong>{i.product}</strong></td><td>{shortCategory(i.category)}</td><td>{i.colour}</td><td>{i.stock} {i.unit}</td><td>{i.minimum}</td><td><b>{need}</b></td><td>{need?<span className="stock-low">Low Stock</span>:<span className="stock-good">Healthy</span>}</td></tr>})}</tbody></table></div></section>{open&&<Modal title="Add Product Stock" close={()=>setOpen(false)}><SimpleInventory form={form} setForm={setForm} data={data} categories={categories}/><button className="primary-btn full" onClick={save}><Save size={16}/> Save Stock</button></Modal>}</div>}
function SimpleInventory({form,setForm,data,categories}){const ps=data.products.filter(p=>p.category===form.category);return <div className="modal-form"><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value,product:''})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Product<select value={form.product} onChange={e=>setForm({...form,product:e.target.value})}><option value="">Select product</option>{ps.map(p=><option key={p.id}>{p.name}</option>)}</select></label><label>Colour / Variant<select value={form.colour} onChange={e=>setForm({...form,colour:e.target.value})}><option value="">Select</option>{COLOURS.map(c=><option key={c}>{c}</option>)}</select></label><label>Stock<input type="number" value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})}/></label><label>Minimum Stock<input type="number" value={form.minimum} onChange={e=>setForm({...form,minimum:Number(e.target.value)})}/></label><label>Unit<input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/></label></div>}
function Packaging({data,credential,onSaved}){const [open,setOpen]=useState(false),[form,setForm]=useState({item:'',stock:0,minimum:0,unit:'pcs'});const save=async()=>{try{await api('createPackaging',{item:form},credential);setOpen(false);await onSaved()}catch(e){alert(e.message)}};return <div><div className="page-heading"><div><div className="eyebrow">INVENTORY</div><h1>Packaging Inventory</h1><p>Track boxes, cards, wrap and other packaging.</p></div><button className="primary-btn" onClick={()=>setOpen(true)}><Plus size={18}/> Add Packaging</button></div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Item</th><th>Stock</th><th>Unit</th><th>Minimum</th><th>Need to Order</th><th>Status</th></tr></thead><tbody>{data.packaging.map(i=>{const n=Math.max(0,Number(i.minimum)-Number(i.stock));return <tr key={i.id}><td><strong>{i.item}</strong></td><td>{i.stock}</td><td>{i.unit}</td><td>{i.minimum}</td><td>{n}</td><td>{n?<span className="stock-low">Restock</span>:<span className="stock-good">Healthy</span>}</td></tr>})}</tbody></table></div></section>{open&&<Modal title="Add Packaging" close={()=>setOpen(false)}><div className="modal-form"><label>Item<input value={form.item} onChange={e=>setForm({...form,item:e.target.value})}/></label><label>Stock<input type="number" value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})}/></label><label>Minimum<input type="number" value={form.minimum} onChange={e=>setForm({...form,minimum:Number(e.target.value)})}/></label><label>Unit<input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/></label></div><button className="primary-btn full" onClick={save}><Save size={16}/> Save</button></Modal>}</div>}
function Expenses({data,credential,onSaved,categories}){const total=data.purchases_expenses.reduce((s,e)=>s+Number(e.amount||0),0),[open,setOpen]=useState(false),[form,setForm]=useState({date:new Date().toISOString().slice(0,10),expenseType:'Raw Material',item:'',quantity:1,unit:'pcs',pricePerUnit:0,allocation:'General Business',supplier:'',paymentStatus:'Paid',notes:''});const save=async()=>{try{await api('createExpense',{item:{...form,amount:Number(form.quantity||0)*Number(form.pricePerUnit||0)}},credential);setOpen(false);await onSaved()}catch(e){alert(e.message)}};return <div><div className="page-heading"><div><div className="eyebrow">FINANCE</div><h1>Purchases & Expenses</h1><p>Record everything you spend so profit can be estimated.</p></div><button className="primary-btn" onClick={()=>setOpen(true)}><Plus size={18}/> Add Expense</button></div><div className="metric-grid three"><Metric icon={ShoppingCart} label="Total Recorded" value={'₹'+total.toLocaleString('en-IN')} note="All recorded spend"/><Metric icon={Store} label="Stall / Exhibition" value={'₹'+data.purchases_expenses.filter(e=>e.expenseType==='Stall / Exhibition').reduce((s,e)=>s+Number(e.amount||0),0).toLocaleString('en-IN')} note="Business expense"/><Metric icon={WalletCards} label="Expense Entries" value={data.purchases_expenses.length} note="Recorded purchases & spend"/></div><section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Date</th><th>Expense</th><th>Type</th><th>Allocation</th><th>Amount</th><th>Paid By</th></tr></thead><tbody>{data.purchases_expenses.map(e=><tr key={e.id}><td>{formatDate(e.date)}</td><td><strong>{e.item}</strong></td><td>{e.expenseType}</td><td><span className="category-pill">{e.allocation}</span></td><td><strong>₹{Number(e.amount||0).toLocaleString('en-IN')}</strong></td><td>{e.paidBy||'—'}</td></tr>)}</tbody></table></div></section>{open&&<Modal title="Add Purchase / Expense" close={()=>setOpen(false)}><div className="modal-form"><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Expense Type<select value={form.expenseType} onChange={e=>setForm({...form,expenseType:e.target.value})}>{['Raw Material','Finished Products','Packaging','Outsourcing','Transportation','Delivery','Stall / Exhibition','Marketing','Equipment / Tools','Other Business Expense'].map(x=><option key={x}>{x}</option>)}</select></label><label>What was bought / paid for<input value={form.item} onChange={e=>setForm({...form,item:e.target.value})}/></label><label>Quantity<input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:Number(e.target.value)})}/></label><label>Price per Unit<input type="number" value={form.pricePerUnit} onChange={e=>setForm({...form,pricePerUnit:Number(e.target.value)})}/></label><label>Allocation<select value={form.allocation} onChange={e=>setForm({...form,allocation:e.target.value})}>{['General Business',...categories,'Specific Order'].map(x=><option key={x}>{x}</option>)}</select></label><label>Supplier<input value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})}/></label><label>Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label></div><button className="primary-btn full" onClick={save}><Save size={16}/> Save Expense</button></Modal>}</div>}

function Finances({data}){const orders=data.orders||[];const expenses=data.purchases_expenses||[];const subtotal=orders.reduce((s,o)=>s+Number(o.subtotal??o.totalAmount??o.total??0),0);const discounts=orders.reduce((s,o)=>s+Number(o.discountAmount||o.discount||0),0);const revenue=orders.reduce((s,o)=>s+Number(o.finalTotal??o.totalAmount??o.total??0),0);const collected=orders.reduce((s,o)=>s+Number(o.paidAmount||o.paid||0),0);const tips=orders.reduce((s,o)=>s+Number(o.tipAmount||Math.max(0,Number(o.paidAmount||0)-Number(o.finalTotal??o.totalAmount??0))),0);const receivable=orders.reduce((s,o)=>s+Math.max(0,Number(o.finalTotal??o.totalAmount??0)-Number(o.paidAmount||o.paid||0)),0);const spend=expenses.reduce((s,e)=>s+Number(e.amount||0),0);const profit=collected-spend;return <div><div className="page-heading"><div><div className="eyebrow">FINANCE</div><h1>Finances</h1><p>All sales, payments, discounts, tips and business spending in one place.</p></div></div><div className="finance-grid"><Metric icon={IndianRupee} label="Order Value" value={'₹'+revenue.toLocaleString('en-IN')} note={'Before tips · '+orders.length+' orders'}/><Metric icon={WalletCards} label="Collected" value={'₹'+collected.toLocaleString('en-IN')} note="Money received from customers"/><Metric icon={WalletCards} label="Pending from Customers" value={'₹'+receivable.toLocaleString('en-IN')} note="Still to be collected"/><Metric icon={IndianRupee} label="Tips / Extra" value={'₹'+tips.toLocaleString('en-IN')} note="Overpayments received"/><Metric icon={ShoppingCart} label="Discounts Given" value={'₹'+discounts.toLocaleString('en-IN')} note="Discounts on orders"/><Metric icon={Store} label="Business Spending" value={'₹'+spend.toLocaleString('en-IN')} note="Purchases & expenses"/><Metric icon={IndianRupee} label="Estimated Cash Profit" value={'₹'+profit.toLocaleString('en-IN')} note="Collected minus recorded spending"/><Metric icon={ClipboardList} label="Product Subtotal" value={'₹'+subtotal.toLocaleString('en-IN')} note="Before discounts"/></div><section className="panel finance-table-panel"><PanelTitle title="Order Money" subtitle="Order-wise financial picture"/><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Subtotal</th><th>Discount</th><th>Final Total</th><th>Paid</th><th>Tip / Extra</th><th>Balance</th><th>Status</th></tr></thead><tbody>{orders.map(o=>{const sub=Number(o.subtotal??o.totalAmount??o.total??0),disc=Number(o.discountAmount||o.discount||0),total=Number(o.finalTotal??o.totalAmount??o.total??0),pd=Number(o.paidAmount||o.paid||0),tip=Math.max(0,pd-total),bal=Math.max(0,total-pd);return <tr key={o.id}><td><strong>{o.customer}</strong><span className="table-sub">{o.phone}</span></td><td>₹{sub.toLocaleString('en-IN')}</td><td>₹{disc.toLocaleString('en-IN')}</td><td><strong>₹{total.toLocaleString('en-IN')}</strong></td><td>₹{pd.toLocaleString('en-IN')}</td><td>₹{tip.toLocaleString('en-IN')}</td><td>₹{bal.toLocaleString('en-IN')}</td><td>{o.paymentStatus||'Not Paid'}</td></tr>})}</tbody></table></div>{orders.length===0&&<div className="empty">No order finances yet.</div>}</section></div>}

function Products({data,credential,onSaved,categories,onCategoriesChange}){
  const [cat,setCat]=useState('All Categories');const [open,setOpen]=useState(false);const [edit,setEdit]=useState(null);const [categoryOpen,setCategoryOpen]=useState(false);const [newCategory,setNewCategory]=useState('');const [form,setForm]=useState({category:categories[0]||BASE_CATEGORIES[0],name:'',sellingPricePiece:0,sellingPriceSet2:0,colours:[...COLOURS],source:'In-house',active:true});
  const visible=data.products.filter(p=>cat==='All Categories'||p.category===cat);
  const startEdit=p=>{setEdit(p);setForm({category:p.category||categories[0],name:p.name||'',sellingPricePiece:Number(p.sellingPricePiece||0),sellingPriceSet2:Number(p.sellingPriceSet2||0),colours:String(p.colours||'').split('|').filter(Boolean).length?String(p.colours).split('|').filter(Boolean):COLOURS,source:p.source||'In-house',active:p.active!==false});setOpen(true)};
  const save=async()=>{try{const payload={...form,colours:Array.isArray(form.colours)?form.colours.join('|'):form.colours};if(edit)await api('updateProduct',{product:{id:edit.id,...payload}},credential);else await api('createProduct',{product:payload},credential);setOpen(false);setEdit(null);await onSaved()}catch(e){alert(e.message)}};
  const upload=async p=>{const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=async()=>{const f=input.files?.[0];if(!f)return;try{const r=await api('uploadImage',{file:{name:f.name,mimeType:f.type,data:await fileData(f)}},credential);await api('updateProduct',{product:{id:p.id,imageUrl:r.data.url}},credential);await onSaved()}catch(e){alert(e.message)}};input.click()};
  const addCategory=async()=>{const c=newCategory.trim();if(!c)return;if(categories.some(x=>x.toLowerCase()===c.toLowerCase())){alert('That category already exists.');return}try{await api('createCategory',{category:c},credential)}catch{}onCategoriesChange([...categories,c]);setNewCategory('');setCategoryOpen(false)};
  return <div><div className="page-heading"><div><div className="eyebrow">CATALOGUE</div><h1>Products</h1><p>Manage product images, prices, colours and categories from one place.</p></div><div className="heading-actions"><button className="outline-btn" onClick={()=>setCategoryOpen(true)}><Plus size={15}/> Add Category</button><button className="primary-btn" onClick={()=>{setEdit(null);setForm({category:categories[0]||BASE_CATEGORIES[0],name:'',sellingPricePiece:0,sellingPriceSet2:0,colours:[...COLOURS],source:'In-house',active:true});setOpen(true)}}><Plus size={18}/> Add Product</button></div></div><div className="category-tabs">{['All Categories',...categories].map(c=><button className={cat===c?'active':''} key={c} onClick={()=>setCat(c)}>{c}</button>)}</div><div className="product-grid">{visible.map(p=><div className="catalog-card" key={p.id}>{p.imageUrl?<img className="catalog-image" src={p.imageUrl} alt={p.name}/>:<div className="catalog-image placeholder"><Tags size={27}/><span>No image yet</span></div>}<div className="catalog-body"><strong>{p.name}</strong><span>{shortCategory(p.category)} · {p.source||'In-house'}</span><div className="price-row"><span>Piece <b>₹{Number(p.sellingPricePiece||0).toLocaleString('en-IN')}</b></span><span>Set of 2 <b>₹{Number(p.sellingPriceSet2||0).toLocaleString('en-IN')}</b></span></div><div className="card-actions"><button className="outline-btn" onClick={()=>startEdit(p)}><Pencil size={14}/> Edit</button><button className="outline-btn" onClick={()=>upload(p)}><Upload size={14}/> {p.imageUrl?'Change Image':'Add Image'}</button></div></div></div>)}</div>{open&&<Modal title={edit?'Edit Product':'Add Product'} close={()=>{setOpen(false);setEdit(null)}}><div className="modal-form"><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Product Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></label><label>Per Piece Price<input type="number" min="0" value={form.sellingPricePiece} onChange={e=>setForm({...form,sellingPricePiece:Number(e.target.value)})}/></label><label>Set of 2 Price<input type="number" min="0" value={form.sellingPriceSet2} onChange={e=>setForm({...form,sellingPriceSet2:Number(e.target.value)})}/></label><label>Colours<select multiple value={form.colours} onChange={e=>setForm({...form,colours:[...e.target.selectedOptions].map(x=>x.value)})}>{COLOURS.map(c=><option key={c}>{c}</option>)}</select><small className="field-note">Hold Ctrl/Cmd to select multiple on desktop. On mobile, use the native multi-select if available.</small></label><label>Source<select value={form.source} onChange={e=>setForm({...form,source:e.target.value})}><option>In-house</option><option>Outsourced</option></select></label></div><button className="primary-btn full" onClick={save}><Save size={16}/> {edit?'Update Product':'Save Product'}</button></Modal>}{categoryOpen&&<Modal title="Add Product Category" close={()=>setCategoryOpen(false)}><label>Category Name<input value={newCategory} onChange={e=>setNewCategory(e.target.value)} placeholder="e.g. Candles"/></label><p className="modal-hint">The new category will be added to the current product catalogue. We will persist it in the database when the backend category action is connected.</p><button className="primary-btn full" onClick={addCategory}><Save size={16}/> Add Category</button></Modal>}</div>
}
function Modal({title,close,children}){return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={close}><X size={17}/></button></div>{children}</div></div>}
function Settings({user,logout}){return <div><div className="page-heading"><div><div className="eyebrow">SYSTEM</div><h1>Settings</h1><p>Approved team access and your current account.</p></div></div><section className="panel settings-panel"><PanelTitle title="Signed-in account" subtitle="Authenticated with Google"/><div className="account-row"><div className="avatar large">{user.name?.[0]||'S'}</div><div><strong>{user.name}</strong><span>{user.email}</span></div></div></section><section className="panel settings-panel"><PanelTitle title="Approved Samsknack accounts" subtitle="Access is enforced by Apps Script"/><div>{TEAM.map(t=><div className="team-row" key={t.email}><div className="avatar small">{t.name[0]}</div><div><strong>{t.name}</strong><span>{t.email}</span></div><span className="access">Approved</span></div>)}</div></section><button className="danger-btn" onClick={logout}><LogOut size={17}/> Sign out</button></div>}
function pageLabel(p){return ({home:'Home','new-order':'New Order','all-orders':'All Orders',pending:'Pending Orders',delivered:'Delivered Orders',cancelled:'Cancelled / Damaged',inventory:'Product Inventory',packaging:'Packaging Inventory',expenses:'Purchases & Expenses',finances:'Finances',products:'Products',settings:'Settings'})[p]||'Samsknack'}
function shortCategory(c){return String(c||'').replace('Hand-Painted ','').replace('Handmade / Ready-Made ','').replace(' / Pipe Cleaner','')}
function statusClass(s){return String(s||'').toLowerCase().replaceAll(' ','-').replaceAll('/','')}
function formatDate(d){if(!d)return '—';const x=new Date(String(d).slice(0,10)+'T00:00:00');return isNaN(x)?String(d):x.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
function dateInputValue(d){if(!d)return '';const s=String(d).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const x=new Date(s);if(isNaN(x))return '';return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`}
createRoot(document.getElementById('root')).render(<App/>);
