const {app,BrowserWindow,Menu,protocol,session,shell,dialog}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');

const smokeIndex=process.argv.indexOf('--smoke-test');
const smokeReport=smokeIndex>=0?process.argv[smokeIndex+1]:null;
const profileIndex=process.argv.indexOf('--profile-dir');
const testProfile=profileIndex>=0?process.argv[profileIndex+1]:null;
const root=path.resolve(__dirname,'..');
app.setName('HDLBits');
app.setAppUserModelId('net.hdlbits.zh.desktop');
if(smokeReport)app.setPath('userData',path.join(path.dirname(path.resolve(smokeReport)),'smoke-profile'));
else if(testProfile)app.setPath('userData',path.resolve(testProfile));
else app.setPath('userData',path.join(app.getPath('appData'),'HDLBits-Desktop'));
protocol.registerSchemesAsPrivileged([{scheme:'hdlbits',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
let mainWindow;
const ownsLock=app.requestSingleInstanceLock();
if(!ownsLock){app.quit();}
else{
 app.on('second-instance',()=>{if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus();}});
 app.on('window-all-closed',()=>app.quit());
 app.whenReady().then(start).catch(async error=>{
  if(smokeReport)await fs.writeFile(smokeReport,JSON.stringify({ok:false,error:error.stack},null,2));
  else dialog.showErrorBox('HDLBits 启动失败',error.message);
  app.exit(1);
 });
}

async function start(){
 if(app.isPackaged)process.env.HDLBITS_RUNTIME_ROOT=path.join(process.resourcesPath,'runtime');
 const {simulate,getHealth,stopSimulations}=await import(pathToFileURL(path.join(root,'server.mjs')).href);
 app.on('before-quit',stopSimulations);
 const {APP_ORIGIN,createProtocolHandler,isAppURL}=await import(pathToFileURL(path.join(__dirname,'protocol.mjs')).href);
 const handler=createProtocolHandler({dist:path.join(root,'dist'),simulate,getHealth});
 protocol.handle('hdlbits',handler);
 session.defaultSession.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
 if(smokeReport){
  const {smokeTest}=await import(pathToFileURL(path.join(__dirname,'smoke.mjs')).href);
  const report=await smokeTest({handler,root,resourcesPath:process.resourcesPath,isPackaged:app.isPackaged,exe:app.getPath('exe'),versions:process.versions});
  if(report.ok){
   try{report.checks.push(...await require('./renderer-smoke.cjs')({BrowserWindow,origin:APP_ORIGIN,reportPath:path.resolve(smokeReport)}));}
   catch(error){report.ok=false;report.error=error.stack;}
  }
  await fs.writeFile(path.resolve(smokeReport),JSON.stringify(report,null,2));
  app.exit(report.ok?0:1);return;
 }
 mainWindow=new BrowserWindow({width:1280,height:900,minWidth:800,minHeight:600,show:false,backgroundColor:'#ffffff',title:'HDLBits',icon:path.join(root,'dist','assets','logo270.png'),webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,spellcheck:false}});
 const load=page=>mainWindow.loadURL(APP_ORIGIN+'/wiki/'+page);
 const external=url=>{try{const u=new URL(url);if(u.protocol==='https:'||u.protocol==='http:')shell.openExternal(url);}catch{}};
 mainWindow.webContents.setWindowOpenHandler(({url})=>{
  if(isAppURL(url))mainWindow.loadURL(url);else external(url);
  return {action:'deny'};
 });
 mainWindow.webContents.on('will-navigate',(event,url)=>{if(!isAppURL(url)){event.preventDefault();external(url);}});
 mainWindow.webContents.on('will-attach-webview',event=>event.preventDefault());
 mainWindow.once('ready-to-show',()=>mainWindow.show());
 Menu.setApplicationMenu(Menu.buildFromTemplate([
  {label:'文件',submenu:[{label:'首页',accelerator:'Alt+Home',click:()=>load('Main_Page')},{label:'题目集',click:()=>load('Problem_sets')},{label:'资料与备份',click:()=>load('Special:VlgProfile')},{type:'separator'},{label:'退出',role:'quit'}]},
  {label:'编辑',submenu:[{label:'撤销',role:'undo'},{label:'重做',role:'redo'},{type:'separator'},{label:'剪切',role:'cut'},{label:'复制',role:'copy'},{label:'粘贴',role:'paste'},{label:'全选',role:'selectAll'}]},
  {label:'视图',submenu:[{label:'后退',accelerator:'Alt+Left',click:()=>{if(mainWindow.webContents.navigationHistory.canGoBack())mainWindow.webContents.navigationHistory.goBack();}},{label:'前进',accelerator:'Alt+Right',click:()=>{if(mainWindow.webContents.navigationHistory.canGoForward())mainWindow.webContents.navigationHistory.goForward();}},{label:'刷新',role:'reload'},{label:'实际大小',role:'resetZoom'},{label:'放大',role:'zoomIn'},{label:'缩小',role:'zoomOut'},{label:'全屏',role:'togglefullscreen'}]},
  {label:'帮助',submenu:[{label:'使用说明',click:()=>load('Help')},{label:'关于',click:()=>load('Project:About')}]} 
 ]));
 await load('Main_Page');
}
