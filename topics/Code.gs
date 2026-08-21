/**
 * Aravinth.dev Portfolio Backend
 * Google Apps Script Web App + Google Sheets + Google Drive + email notifications.
 *
 * 1) Create/open a Google Sheet.
 * 2) Extensions -> Apps Script.
 * 3) Paste this file.
 * 4) Set OWNER_EMAIL and SITE_URL.
 * 5) Run setup() once and authorize.
 * 6) Deploy -> New deployment -> Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 7) Copy the /exec URL into backend-config.js.
 *
 * The web app accepts simple POST text/plain requests from the static GitHub Pages site
 * and supports JSONP GET calls for availability and challenge-room polling.
 */

const OWNER_EMAIL = 'YOUR_EMAIL@example.com';
const SITE_URL = 'https://aravinth-venkat.github.io';
const SPREADSHEET_ID = ''; // Optional: leave blank to let setup() create one.
const DRIVE_FOLDER_ID = ''; // Optional: leave blank to let setup() create one.

function setup() {
  const props = PropertiesService.getScriptProperties();
  let ss;
  const existing = SPREADSHEET_ID || props.getProperty('SPREADSHEET_ID');
  if (existing) ss = SpreadsheetApp.openById(existing);
  else {
    ss = SpreadsheetApp.create('Aravinth Portfolio Data');
    props.setProperty('SPREADSHEET_ID', ss.getId());
  }
  const sheets = {
    Visitors:['visitorId','firstSeen','lastSeen','visitCount','lastPath','ownerMode'],
    Events:['timestamp','visitorId','action','path','title','referrer','userAgent','screen','ownerMode'],
    Referrals:['timestamp','visitorId','name','email','company','type','message','fileName','fileUrl'],
    Questions:['timestamp','visitorId','name','email','topic','urgency','question'],
    Feedback:['timestamp','visitorId','name','email','rating','comment'],
    Challenges:['timestamp','roomId','visitorId','name','email','status','page'],
    Rooms:['roomId','createdAt','updatedAt','fen','lastMove','history','playerWhite','playerBlack'],
    Moves:['timestamp','roomId','visitorId','move','fen']
  };
  Object.keys(sheets).forEach(name=>{
    let sh=ss.getSheetByName(name);
    if(!sh) sh=ss.insertSheet(name);
    if(sh.getLastRow()===0) sh.appendRow(sheets[name]);
  });
  let folderId=DRIVE_FOLDER_ID || props.getProperty('DRIVE_FOLDER_ID');
  if(!folderId){
    const folder=DriveApp.createFolder('Aravinth Portfolio Uploads');
    folderId=folder.getId();
    props.setProperty('DRIVE_FOLDER_ID',folderId);
  }
  props.setProperty('SPREADSHEET_ID',ss.getId());
  return {spreadsheetId:ss.getId(),driveFolderId:folderId};
}

function db_() {
  const p=PropertiesService.getScriptProperties();
  const id=SPREADSHEET_ID || p.getProperty('SPREADSHEET_ID');
  if(!id) throw new Error('Run setup() first.');
  return SpreadsheetApp.openById(id);
}

function doGet(e) {
  const action=e.parameter.action||'health';
  const callback=e.parameter.callback;
  let data;
  try {
    if(action==='availability') {
      const sh=db_().getSheetByName('Visitors');
      const rows=sh.getDataRange().getValues();
      const cutoff=Date.now()-90000;
      let online=false;
      for(let i=1;i<rows.length;i++){
        const last=rows[i][2];
        const owner=rows[i][5]===true || rows[i][5]==='true';
        if(owner && last && new Date(last).getTime()>cutoff){online=true;break;}
      }
      data={ok:true,online};
    } else if(action==='room') {
      const sh=db_().getSheetByName('Rooms');
      const rows=sh.getDataRange().getValues();
      let found=null;
      for(let i=1;i<rows.length;i++) if(String(rows[i][0])===String(e.parameter.roomId)) found=rows[i];
      data=found?{ok:true,roomId:found[0],fen:found[3],lastMove:found[4],history:String(found[5]||'').split('|').filter(Boolean)}:{ok:false};
    } else {
      data={ok:true,service:'Aravinth.dev backend'};
    }
  } catch(err){ data={ok:false,error:String(err)}; }
  const out=ContentService.createTextOutput((callback?callback+'('+JSON.stringify(data)+')':JSON.stringify(data)));
  return out.setMimeType(callback?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);
}

function doPost(e) {
  let d={};
  try { d=JSON.parse((e.postData&&e.postData.contents)||'{}'); } catch(err) { return json_({ok:false,error:'Invalid JSON'}); }
  try {
    const action=d.action||'event';
    if(action==='visit'||action==='heartbeat'||action==='owner_heartbeat') visitor_(d);
    if(action==='referral') referral_(d);
    if(action==='question') question_(d);
    if(action==='feedback') feedback_(d);
    if(action==='challenge') challenge_(d);
    if(action==='room_create') roomCreate_(d);
    if(action==='room_move') roomMove_(d);
    event_(d);
    return json_({ok:true});
  } catch(err) {
    return json_({ok:false,error:String(err)});
  }
}

function json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function visitor_(d){
  const sh=db_().getSheetByName('Visitors');
  const lock=LockService.getScriptLock(); lock.waitLock(10000);
  try{
    const rows=sh.getDataRange().getValues(), id=String(d.visitorId||'');
    let row=-1;
    for(let i=1;i<rows.length;i++) if(String(rows[i][0])===id){row=i+1;break;}
    const now=new Date();
    if(row<0) sh.appendRow([id,now,now,1,d.path||'',!!d.owner]);
    else {
      const count=Number(sh.getRange(row,4).getValue()||0)+1;
      sh.getRange(row,3,1,4).setValues([[now,count,d.path||'',!!d.owner]]);
    }
  } finally { lock.releaseLock(); }
}

function event_(d){
  db_().getSheetByName('Events').appendRow([new Date(),d.visitorId||'',d.action||'',d.path||'',d.title||'',d.referrer||'',d.userAgent||'',d.screen||'',!!d.owner]);
}

function referral_(d){
  let fileUrl='';
  if(d.fileData && d.fileName){
    const p=PropertiesService.getScriptProperties();
    const folder=DriveApp.getFolderById(DRIVE_FOLDER_ID||p.getProperty('DRIVE_FOLDER_ID'));
    const bytes=Utilities.base64Decode(d.fileData);
    const blob=Utilities.newBlob(bytes,d.fileType||MimeType.PDF,d.fileName);
    fileUrl=folder.createFile(blob).getUrl();
  }
  db_().getSheetByName('Referrals').appendRow([new Date(),d.visitorId||'',d.name||'',d.email||'',d.company||'',d.type||'',d.message||'',d.fileName||'',fileUrl]);
  notify_('New portfolio referral from '+(d.name||'visitor'), 'Name: '+d.name+'\nEmail: '+d.email+'\nCompany: '+d.company+'\nType: '+d.type+'\n\n'+d.message+'\n\nResume: '+fileUrl);
}

function question_(d){
  db_().getSheetByName('Questions').appendRow([new Date(),d.visitorId||'',d.name||'',d.email||'',d.topic||'',d.urgency||'',d.question||'']);
  notify_('New ServiceNow question from '+(d.name||'visitor'), 'Email: '+d.email+'\nTopic: '+d.topic+'\nUrgency: '+d.urgency+'\n\n'+d.question);
}

function feedback_(d){
  db_().getSheetByName('Feedback').appendRow([new Date(),d.visitorId||'',d.name||'',d.email||'',d.rating||'',d.comment||'']);
}

function challenge_(d){
  const room='ARV-'+Utilities.getUuid().slice(0,8).toUpperCase();
  db_().getSheetByName('Challenges').appendRow([new Date(),room,d.visitorId||'',d.name||'',d.email||'pending',d.status||'pending',d.page||'']);
  notify_('♟ New chess challenge for Aravinth','Player: '+d.name+'\nEmail: '+d.email+'\nRoom: '+room+'\nOpen: '+SITE_URL+'/chess.html?room='+room);
}

function roomCreate_(d){
  db_().getSheetByName('Rooms').appendRow([d.roomId,new Date(),new Date(),d.fen||'', '', '', d.visitorId||'', '']);
}

function roomMove_(d){
  const sh=db_().getSheetByName('Rooms'), rows=sh.getDataRange().getValues();
  for(let i=1;i<rows.length;i++) if(String(rows[i][0])===String(d.roomId)){
    const r=i+1; const hist=String(rows[i][5]||''); const next=hist?hist+'|'+d.move:d.move;
    sh.getRange(r,3,1,4).setValues([[new Date(),d.fen||'',d.move||'',next]]);
    db_().getSheetByName('Moves').appendRow([new Date(),d.roomId||'',d.visitorId||'',d.move||'',d.fen||'']);
    break;
  }
}

function notify_(subject,body){
  if(OWNER_EMAIL && OWNER_EMAIL.indexOf('@')>0) MailApp.sendEmail(OWNER_EMAIL,subject,body);
}
