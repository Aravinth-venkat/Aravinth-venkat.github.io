/**
 * Aravinth.dev backend
 * Google Apps Script + Google Sheets + Google Drive + email notifications.
 *
 * Setup:
 * 1. Create a Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Paste this file.
 * 4. Replace OWNER_EMAIL.
 * 5. Run setup() once and authorize.
 * 6. Deploy -> New deployment -> Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 7. Put the /exec URL into backend-config.js.
 */
const OWNER_EMAIL="YOUR_EMAIL@example.com";
const SITE_URL="https://aravinth-venkat.github.io";
const SPREADSHEET_ID="";
const DRIVE_FOLDER_ID="";

function setup(){
 const p=PropertiesService.getScriptProperties();let ss;
 const sid=SPREADSHEET_ID||p.getProperty("SPREADSHEET_ID");
 if(sid)ss=SpreadsheetApp.openById(sid);else{ss=SpreadsheetApp.create("Aravinth Portfolio Data");p.setProperty("SPREADSHEET_ID",ss.getId())}
 const tabs={
  Visitors:["visitorId","firstSeen","lastSeen","visitCount","lastPath","ownerMode"],
  Events:["timestamp","visitorId","action","path","title","referrer","userAgent","screen","ownerMode"],
  Referrals:["timestamp","visitorId","name","email","company","type","message","fileName","fileUrl"],
  Questions:["timestamp","visitorId","name","email","topic","urgency","question"],
  Feedback:["timestamp","visitorId","name","email","rating","comment"],
  Challenges:["timestamp","roomId","visitorId","name","email","status","page"],
  Rooms:["roomId","createdAt","updatedAt","fen","lastMove","history","playerWhite","playerBlack"],
  Moves:["timestamp","roomId","visitorId","move","fen"]
 };
 Object.keys(tabs).forEach(n=>{let s=ss.getSheetByName(n);if(!s)s=ss.insertSheet(n);if(s.getLastRow()===0)s.appendRow(tabs[n])});
 let fid=DRIVE_FOLDER_ID||p.getProperty("DRIVE_FOLDER_ID");
 if(!fid){fid=DriveApp.createFolder("Aravinth Portfolio Uploads").getId();p.setProperty("DRIVE_FOLDER_ID",fid)}
 p.setProperty("SPREADSHEET_ID",ss.getId());return{spreadsheetId:ss.getId(),driveFolderId:fid};
}
function db_(){const p=PropertiesService.getScriptProperties(),id=SPREADSHEET_ID||p.getProperty("SPREADSHEET_ID");if(!id)throw Error("Run setup() first.");return SpreadsheetApp.openById(id)}
function out_(o,cb){const t=ContentService.createTextOutput(cb?cb+"("+JSON.stringify(o)+")":JSON.stringify(o));return t.setMimeType(cb?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON)}
function doGet(e){
 const a=e.parameter.action||"health",cb=e.parameter.callback;let d;
 try{
  if(a==="availability"){
   const rows=db_().getSheetByName("Visitors").getDataRange().getValues(),cut=Date.now()-90000;let online=false;
   for(let i=1;i<rows.length;i++)if((rows[i][5]===true||rows[i][5]==="true")&&rows[i][2]&&new Date(rows[i][2]).getTime()>cut){online=true;break}
   d={ok:true,online};
  }else if(a==="room"){
   const rows=db_().getSheetByName("Rooms").getDataRange().getValues();let x=null;
   for(let i=1;i<rows.length;i++)if(String(rows[i][0])===String(e.parameter.roomId))x=rows[i];
   d=x?{ok:true,roomId:x[0],fen:x[3],lastMove:x[4],history:String(x[5]||"").split("|").filter(Boolean)}:{ok:false};
  }else d={ok:true,service:"Aravinth.dev backend"};
 }catch(err){d={ok:false,error:String(err)}}
 return out_(d,cb);
}
function doPost(e){
 let d={};try{d=JSON.parse(e.postData.contents||"{}")}catch(err){return out_({ok:false,error:"Invalid JSON"})}
 try{
  const a=d.action||"event";
  if(a==="visit"||a==="heartbeat"||a==="owner_heartbeat")visitor_(d);
  if(a==="referral")referral_(d);
  if(a==="question")question_(d);
  if(a==="feedback")feedback_(d);
  if(a==="challenge")challenge_(d);
  if(a==="room_create")roomCreate_(d);
  if(a==="room_move")roomMove_(d);
  event_(d);return out_({ok:true});
 }catch(err){return out_({ok:false,error:String(err)})}
}
function visitor_(d){
 const s=db_().getSheetByName("Visitors"),rows=s.getDataRange().getValues(),id=String(d.visitorId||"");let row=-1;
 for(let i=1;i<rows.length;i++)if(String(rows[i][0])===id){row=i+1;break}
 const now=new Date();
 if(row<0)s.appendRow([id,now,now,1,d.path||"",!!d.owner]);
 else{s.getRange(row,3,1,4).setValues([[now,Number(s.getRange(row,4).getValue()||0)+1,d.path||"",!!d.owner]])}
}
function event_(d){db_().getSheetByName("Events").appendRow([new Date(),d.visitorId||"",d.action||"",d.path||"",d.title||"",d.referrer||"",d.userAgent||"",d.screen||"",!!d.owner])}
function referral_(d){
 let url="";if(d.fileData&&d.fileName){const p=PropertiesService.getScriptProperties(),folder=DriveApp.getFolderById(DRIVE_FOLDER_ID||p.getProperty("DRIVE_FOLDER_ID"));url=folder.createFile(Utilities.newBlob(Utilities.base64Decode(d.fileData),d.fileType||MimeType.PDF,d.fileName)).getUrl()}
 db_().getSheetByName("Referrals").appendRow([new Date(),d.visitorId||"",d.name||"",d.email||"",d.company||"",d.type||"",d.message||"",d.fileName||"",url]);
 notify_("New portfolio referral from "+(d.name||"visitor"),"Name: "+d.name+"\nEmail: "+d.email+"\nCompany: "+d.company+"\nType: "+d.type+"\n\n"+d.message+"\n\nResume: "+url);
}
function question_(d){db_().getSheetByName("Questions").appendRow([new Date(),d.visitorId||"",d.name||"",d.email||"",d.topic||"",d.urgency||"",d.question||""]);notify_("New ServiceNow question from "+(d.name||"visitor"),"Email: "+d.email+"\nTopic: "+d.topic+"\nUrgency: "+d.urgency+"\n\n"+d.question)}
function feedback_(d){db_().getSheetByName("Feedback").appendRow([new Date(),d.visitorId||"",d.name||"",d.email||"",d.rating||"",d.comment||""])}
function challenge_(d){
 const room="ARV-"+Utilities.getUuid().slice(0,8).toUpperCase();
 db_().getSheetByName("Challenges").appendRow([new Date(),room,d.visitorId||"",d.name||"",d.email||"","pending",d.page||""]);
 notify_("♟ New chess challenge for Aravinth","Player: "+d.name+"\nEmail: "+d.email+"\nRoom: "+room+"\nOpen: "+SITE_URL+"/chess.html?room="+room);
}
function roomCreate_(d){db_().getSheetByName("Rooms").appendRow([d.roomId,new Date(),new Date(),d.fen||"","","",d.visitorId||"",""])}
function roomMove_(d){
 const s=db_().getSheetByName("Rooms"),rows=s.getDataRange().getValues();
 for(let i=1;i<rows.length;i++)if(String(rows[i][0])===String(d.roomId)){const r=i+1,h=String(rows[i][5]||""),next=h?(h+"|"+d.move):d.move;s.getRange(r,3,1,4).setValues([[new Date(),d.fen||"",d.move||"",next]]);db_().getSheetByName("Moves").appendRow([new Date(),d.roomId||"",d.visitorId||"",d.move||"",d.fen||""]);break}
}
function notify_(subject,body){if(OWNER_EMAIL&&OWNER_EMAIL.indexOf("@")>0)MailApp.sendEmail(OWNER_EMAIL,subject,body)}
