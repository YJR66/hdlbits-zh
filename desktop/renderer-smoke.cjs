const assert=require('node:assert/strict');
const fs=require('node:fs/promises');

/** Exercise the real sandboxed renderer using an isolated smoke-test profile. */
module.exports=async function rendererSmoke({BrowserWindow,origin,reportPath}){
 const window=new BrowserWindow({show:false,width:1280,height:900,backgroundColor:'#ffffff',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,spellcheck:false,offscreen:true,backgroundThrottling:false}});
 const evaluate=script=>window.webContents.executeJavaScript(script);
 const waitFor=async expression=>{
  const deadline=Date.now()+15000;
  while(Date.now()<deadline){if(await evaluate(expression))return;await new Promise(resolve=>setTimeout(resolve,100));}
  throw new Error('Renderer smoke timeout: '+expression);
 };
 try{
  await window.loadURL(origin+'/wiki/Step_one');
  await waitFor("!!document.querySelector('#code-editor') && !document.querySelector('#run-code').disabled");
  await evaluate("const e=document.querySelector('#code-editor');e.value='module top_module(output one); assign one=1; endmodule';e.dispatchEvent(new Event('input'));document.querySelector('#run-code').click();");
  await waitFor("!!document.querySelector('#run-result .success')");
  assert.match(await evaluate("document.querySelector('#run-result').textContent"),/测试通过/);
  await window.loadURL(origin+'/wiki/Step_one');
  await waitFor("!!document.querySelector('#code-editor')");
  assert.match(await evaluate("document.querySelector('#code-editor').value"),/assign one=1/);
  assert.equal(await evaluate("JSON.parse(localStorage.getItem('hdlbits-zh-v1')).problems.step_one.passed"),true);
  await window.loadURL(origin+'/wiki/sim/circuit1');
  await waitFor("!!document.querySelector('.diagram svg')");
  await evaluate('document.fonts.ready');
  await new Promise(resolve=>setTimeout(resolve,300));
  const image=await window.webContents.capturePage(),pixels=image.toBitmap(),colors=new Set();
  for(let i=0;i<pixels.length;i+=4*67)colors.add(pixels.subarray(i,i+3).toString('hex'));
  assert.ok(colors.size>16,'Renderer screenshot must contain painted content');
  await fs.writeFile(reportPath+'.png',image.toPNG());
  return ['renderer-submit-passes','renderer-draft-and-progress-persist','renderer-reference-waveform'];
 }finally{window.destroy();}
};
