const CONFIG = {
  SPREADSHEET_ID: 'PASTE_GOOGLE_SHEET_ID_HERE',
  DRIVE_FOLDER_ID: 'PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE',
  GOOGLE_CLIENT_ID: 'PASTE_GOOGLE_OAUTH_WEB_CLIENT_ID_HERE',
  TEAM: {
    'samsknack@gmail.com':'Samiksha',
    'snehalshinde302001@gmail.com':'Snehal',
    'sandeshshinde15@gmail.com':'Sandesh',
    'anket.nalawade42@gmail.com':'Anket'
  }
};

const SHEETS = {
  ORDERS:['id','code','type','customer','phone','delivery','status','paymentStatus','totalAmount','paidAmount','balance','punchedBy','notes','createdAt','updatedAt'],
  ORDER_ITEMS:['id','orderId','category','product','productImage','sellingUnit','piecesPerUnit','quantity','totalPieces','colour','customizationRequired','customizationDetails','referenceImageUrl','unitPrice','lineTotal'],
  CUSTOMERS:['phone','name','lastOrderDate','lastStatus'],
  PRODUCTS:['id','category','name','imageUrl','sellingPricePiece','sellingPriceSet2','colours','source','active','createdAt','updatedAt'],
  INVENTORY:['id','category','product','colour','stock','minimum','unit','source','updatedAt'],
  PACKAGING:['id','item','stock','minimum','unit','updatedAt'],
  PURCHASES_EXPENSES:['id','date','expenseType','item','quantity','unit','pricePerUnit','amount','supplier','allocation','orderId','paidBy','paymentStatus','notes','createdAt'],
  TEAM:['name','email','active'],
  SETTINGS:['key','value']
};

function setupSamsknack(){ ensureSheets_(); bootstrap_(); return 'Samsknack setup complete. Sheets and starter products are ready.'; }

function doPost(e){
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const auth = verifyUser_(body.credential);
    const action = body.action || 'bootstrap';
    let result;
    switch(action){
      case 'bootstrap': result = bootstrap_(); break;
      case 'list': result = listData_(body.entity); break;
      case 'createOrder': result = createOrder_(body.order, auth); break;
      case 'updateOrder': result = updateOrder_(body.order, auth); break;
      case 'createProduct': result = createProduct_(body.product, auth); break;
      case 'updateProduct': result = updateProduct_(body.product, auth); break;
      case 'createInventory': result = createInventory_(body.item, auth); break;
      case 'updateInventory': result = updateInventory_(body.item, auth); break;
      case 'createPackaging': result = createPackaging_(body.item, auth); break;
      case 'updatePackaging': result = updatePackaging_(body.item, auth); break;
      case 'createExpense': result = createExpense_(body.item, auth); break;
      case 'uploadImage': result = uploadImage_(body.file, auth); break;
      default: throw new Error('Unknown action: '+action);
    }
    return json_({ok:true, user:auth, data:result});
  } catch(err){ return json_({ok:false,error:String(err.message || err)}); }
}
function doGet(){ return json_({ok:true,service:'Samsknack API',time:new Date().toISOString()}); }
function json_(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function verifyUser_(credential){
  if(!credential) throw new Error('Google sign-in credential missing.');
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(credential),{muteHttpExceptions:true});
  if(r.getResponseCode()!==200) throw new Error('Google sign-in could not be verified.');
  const t = JSON.parse(r.getContentText());
  if(CONFIG.GOOGLE_CLIENT_ID && CONFIG.GOOGLE_CLIENT_ID.indexOf('PASTE_')!==0 && t.aud !== CONFIG.GOOGLE_CLIENT_ID) throw new Error('Google client ID does not match.');
  const email = String(t.email||'').toLowerCase();
  if(!CONFIG.TEAM[email]) throw new Error('This Google account is not approved for Samsknack.');
  return {name:CONFIG.TEAM[email],email};
}
function ss_(){ return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); }
function ensureSheets_(){
  const ss=ss_();
  Object.keys(SHEETS).forEach(name=>{let sh=ss.getSheetByName(name);if(!sh) sh=ss.insertSheet(name); if(sh.getLastRow()===0) sh.getRange(1,1,1,SHEETS[name].length).setValues([SHEETS[name]]);});
  const team=ss.getSheetByName('TEAM'); if(team.getLastRow()<=1) Object.keys(CONFIG.TEAM).forEach(email=>team.appendRow([CONFIG.TEAM[email],email,true]));
}
function bootstrap_(){
  ensureSheets_();
  const ps=rows_('PRODUCTS');
  if(!ps.length){
    const seed=[
      ['Hand-Painted Diyas','Small Round Diya'],['Hand-Painted Diyas','Shri Diya'],['Hand-Painted Diyas','Leaf Diya'],['Hand-Painted Diyas','Classic Round Diya'],['Hand-Painted Diyas','Swastik Diya'],['Hand-Painted Diyas','Designer Flower Diya'],['Hand-Painted Diyas','Mirror Work Diya'],['Hand-Painted Diyas','Classic Candle Diya'],['Hand-Painted Diyas','Matka Candle Diya'],
      ['Chenille / Pipe Cleaner','Lotus Tea Light Holder'],['Chenille / Pipe Cleaner','Designer Hangings'],['Chenille / Pipe Cleaner','Flower Door Hanging'],['Chenille / Pipe Cleaner','Lotus Hanging'],['Chenille / Pipe Cleaner','Flower Toran'],
      ['Crochet','Small Flower Tea Light Holder'],['Crochet','Round Tea Light Holder / Coaster'],['Crochet','Designer Tea Light Holder'],['Crochet','Beautiful Flower Tea Light Holder'],['Crochet','Dual Color Tea Light Holder / Coaster'],['Crochet','Elegant Big Flower Tea Light Holder'],['Crochet','Curved Petal Tea Light Holder']
    ];
    seed.forEach(function(x,i){append_('PRODUCTS',{id:'seed-'+i,category:x[0],name:x[1],imageUrl:'',sellingPricePiece:0,sellingPriceSet2:0,colours:'Red|Green|Pink|Blue|Yellow|White|Orange|Purple',source:x[0]==='Crochet'?'Outsourced':'In-house',active:true,createdAt:now_(),updatedAt:now_()});});
  }
  return {entities:Object.keys(SHEETS),message:'Sheets ready'};
}
function rows_(entity){ ensureSheets_(); const sh=ss_().getSheetByName(entity.toUpperCase()); const values=sh.getDataRange().getValues(); if(values.length<2)return[]; const headers=values[0]; return values.slice(1).filter(r=>r.some(v=>v!=='' && v!==null)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]]))); }
function listData_(entity){ if(entity==='all'){return Object.fromEntries(Object.keys(SHEETS).map(k=>[k.toLowerCase(),rows_(k)]));} return rows_(entity); }
function append_(entity,obj){ ensureSheets_(); const sh=ss_().getSheetByName(entity.toUpperCase()); const headers=SHEETS[entity.toUpperCase()]; sh.appendRow(headers.map(h=>obj[h]===undefined?'':obj[h])); }
function id_(){return Utilities.getUuid();}
function now_(){return new Date().toISOString();}
function createOrder_(o,auth){
  if(!o || !o.customer || !o.phone || !o.delivery || !o.items || !o.items.length) throw new Error('Customer, phone, delivery date and at least one product are required.');
  const phone=String(o.phone).replace(/\D/g,'');
  if(phone.length<10) throw new Error('Please enter a valid phone number.');
  const cleanItems=o.items.map(function(x){
    const qty=Number(x.quantity||0);
    const ppu=Number(x.piecesPerUnit||1);
    if(qty<1) throw new Error('Every product must have quantity of at least 1.');
    if(ppu!==1 && ppu!==2) throw new Error('Selling option must be Per Piece or Set of 2.');
    if(x.customizationRequired && !String(x.customizationDetails||'').trim()) throw new Error('Customization details are required when customization is selected.');
    return Object.assign({},x,{quantity:qty,piecesPerUnit:ppu});
  });
  const totalPieces=cleanItems.reduce((s,x)=>s+Number(x.quantity)*Number(x.piecesPerUnit),0);
  const type=totalPieces>50?'Bulk':'Personal';

  // Prevent accidental duplicate entry for the same active customer order.
  // A customer can still place a new order after the previous one is delivered/cancelled.
  const activeStatuses=['Pending','In Production','Ready'];
  const existing=rows_('ORDERS').find(function(r){
    return String(r.phone).replace(/\D/g,'')===phone && activeStatuses.indexOf(String(r.status))>=0;
  });
  if(existing) throw new Error('An active order already exists for this phone number ('+String(existing.customer)+'). Open that order instead of creating a duplicate.');

  const id=id_(), code=type==='Bulk'?'SKC-'+Utilities.getUuid().replace(/-/g,'').slice(0,5).toUpperCase():'';
  const totalAmount=cleanItems.reduce((s,x)=>s+Number(x.lineTotal||0),0);
  const paid=Number(o.paidAmount||0);
  if(paid<0 || paid>totalAmount) throw new Error('Paid amount cannot be negative or greater than the order amount.');
  const created=now_();
  append_('ORDERS',{id,code,type,customer:String(o.customer).trim(),phone,delivery,status:o.status||'Pending',paymentStatus:o.paymentStatus||'Not Paid',totalAmount,paidAmount:paid,balance:totalAmount-paid,punchedBy:auth.name,notes:o.notes||'',createdAt:created,updatedAt:created});
  cleanItems.forEach(function(x){
    append_('ORDER_ITEMS',{id:id_(),orderId:id,category:x.category,product:x.product,productImage:x.productImage||'',sellingUnit:x.sellingUnit,piecesPerUnit:x.piecesPerUnit,quantity:x.quantity,totalPieces:Number(x.quantity)*Number(x.piecesPerUnit),colour:x.colour||'',customizationRequired:!!x.customizationRequired,customizationDetails:String(x.customizationDetails||''),referenceImageUrl:x.referenceImageUrl||'',unitPrice:Number(x.unitPrice||0),lineTotal:Number(x.lineTotal||0)});
  });
  upsertCustomer_(phone,String(o.customer).trim(),o.delivery,o.status||'Pending');
  return {id:id,code:code,type:type,totalPieces:totalPieces,totalAmount:totalAmount,balance:totalAmount-paid};
}
function updateOrder_(o,auth){
  if(!o.id) throw new Error('Order ID missing.'); const sh=ss_().getSheetByName('ORDERS'); const vals=sh.getDataRange().getValues(), h=vals[0], ix=h.indexOf('id');
  const row=vals.findIndex(r=>String(r[ix])===String(o.id)); if(row<1) throw new Error('Order not found.');
  const merged=Object.fromEntries(h.map((k,i)=>[k,o[k]!==undefined?o[k]:vals[row][i]])); merged.updatedAt=now_(); merged.balance=Number(merged.totalAmount||0)-Number(merged.paidAmount||0); merged.punchedBy=merged.punchedBy||auth.name;
  sh.getRange(row+1,1,h.length).setValues([h.map(k=>merged[k]??'')]); return merged;
}
function upsertCustomer_(phone,name,date,status){ const sh=ss_().getSheetByName('CUSTOMERS'), vals=sh.getDataRange().getValues(), h=vals[0], pi=h.indexOf('phone'); const i=vals.findIndex(r=>String(r[pi])===String(phone)); const row=[phone,name,date,status]; if(i<1)sh.appendRow(row);else sh.getRange(i+1,1,1,4).setValues([row]); }
function createProduct_(p,auth){const id=id_();append_('PRODUCTS',{id,category:p.category,name:p.name,imageUrl:p.imageUrl||'',sellingPricePiece:p.sellingPricePiece||0,sellingPriceSet2:p.sellingPriceSet2||0,colours:(p.colours||[]).join('|'),source:p.source||'In-house',active:p.active!==false,createdAt:now_(),updatedAt:now_()});return id;}
function updateProduct_(p){return updateGeneric_('PRODUCTS',p);}
function createInventory_(x){const id=id_();append_('INVENTORY',{id,category:x.category,product:x.product,colour:x.colour||'',stock:Number(x.stock||0),minimum:Number(x.minimum||0),unit:x.unit||'pcs',source:x.source||'In-house',updatedAt:now_()});return id;}
function updateInventory_(x){return updateGeneric_('INVENTORY',x);}
function createPackaging_(x){const id=id_();append_('PACKAGING',{id,item:x.item,stock:Number(x.stock||0),minimum:Number(x.minimum||0),unit:x.unit||'pcs',updatedAt:now_()});return id;}
function updatePackaging_(x){return updateGeneric_('PACKAGING',x);}
function createExpense_(x,auth){const id=id_();const qty=Number(x.quantity||1),ppu=Number(x.pricePerUnit||x.amount||0),amount=qty*ppu;append_('PURCHASES_EXPENSES',{id,date:x.date||Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd'),expenseType:x.expenseType||'Other Business Expense',item:x.item,quantity:qty,unit:x.unit||'pcs',pricePerUnit:ppu,amount,supplier:x.supplier||'',allocation:x.allocation||'General Business',orderId:x.orderId||'',paidBy:auth.name,paymentStatus:x.paymentStatus||'Paid',notes:x.notes||'',createdAt:now_()});return id;}
function updateGeneric_(entity,obj){const sh=ss_().getSheetByName(entity),vals=sh.getDataRange().getValues(),h=vals[0],ix=h.indexOf('id'),row=vals.findIndex(r=>String(r[ix])===String(obj.id));if(row<1)throw new Error('Record not found.');const merged=Object.fromEntries(h.map((k,i)=>[k,obj[k]!==undefined?obj[k]:vals[row][i]]));sh.getRange(row+1,1,h.length).setValues([h.map(k=>merged[k]??'')]);return merged;}
function uploadImage_(file,auth){if(!file||!file.data||!file.name)throw new Error('Image data missing.');const folder=DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);const bytes=Utilities.base64Decode(file.data.split(',').pop());const blob=Utilities.newBlob(bytes,file.mimeType||'image/jpeg',file.name);const f=folder.createFile(blob);return {url:f.getUrl(),id:f.getId(),name:f.getName()};}
