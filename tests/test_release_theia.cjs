/* Actual delivered THEIA under file://; final RC ZIP, downloads and gameplay. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),release=path.resolve(process.env.SYNODIC_RELEASE_DIR||path.join(root,'../SYNODIC-RELEASE/1.0.0-rc2'));
const manifest=JSON.parse(fs.readFileSync(path.join(release,'manifest.json'))),version=manifest.release_version;
const theia=path.resolve(process.env.THEIA_HTML||path.join(root,'../THEIA/dist/THEIA-1.0.1.html'));
const out=path.join(root,'builds','release-'+version);fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const inputs=[['pc',process.env.STG_RELEASE_PC_INPUT||path.join(root,'../STG 0.2PC.html')],['pc-c2',process.env.STG_RELEASE_C2_INPUT||path.join(root,'../STG 0.2PC.C2.html')]];
const report={version,scope:'Actual file:// THEIA delivery and final RC ZIP. Offline API list is a controlled empty response; SVG gameplay art is a fixture. No public Release/CDN/device claim.',core_sha256:sha(fs.readFileSync(path.join(release,manifest.asset_name))),inputs:[],gameplay:[],errors:[]};
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 report.browser=browser.version();
 for(const [key,name] of inputs){
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:400,height:760}}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('https://api.github.com/repos/ygyuuffut/Synodic/releases*',r=>r.fulfill({status:200,contentType:'application/json',body:'[]',headers:{'Access-Control-Allow-Origin':'*'}}));
  await page.goto(pathToFileURL(theia).href);
  const original=path.resolve(name),originalBytes=fs.readFileSync(original);
  await page.locator('#game-file').setInputFiles(original);
  await page.waitForFunction(()=>document.querySelector('#game-step').dataset.state==='complete'&&!document.querySelector('#game-button').disabled);
  await page.locator('#core-file').setInputFiles(path.join(release,manifest.asset_name));
  await page.waitForFunction(()=>!document.querySelector('#game-button').disabled);
  assert.equal(await page.locator('#release-step').getAttribute('data-state'),'complete',await page.locator('#message').textContent());
  assert.equal(await page.locator('#release-title').textContent(),'v'+version);
  assert(await page.locator('#install-button').isEnabled());
  const pending=page.waitForEvent('download');await page.locator('#install-button').click();const dl=await pending;
  const installed=path.join(out,key+'.theia.html');await dl.saveAs(installed);
  const oracle=path.join(out,key+'.python.html');
  const build=spawnSync(process.env.PYTHON||'python3',[path.join(root,'inject_mobile.py'),original,'-o',oracle],{encoding:'utf8'});
  assert.equal(build.status,0,build.stderr);const output=fs.readFileSync(installed);
  assert(output.equals(fs.readFileSync(oracle)),'THEIA output differs from Python: '+key);
  assert(originalBytes.equals(fs.readFileSync(original)),'Original was modified');
  assert(!output.includes(Buffer.from('id="lunar.api.hecate"')));
  assert(output.includes(Buffer.from('SYNODIC '+version)));
  assert.equal(await page.locator('#install-step').getAttribute('data-state'),'complete');
  report.inputs.push({input:key,raw_sha256:sha(originalBytes),output_sha256:sha(output),output_bytes:output.length,exact_python_equality:true,theia_import:true,original_unchanged:true});
  await page.screenshot({path:path.join(out,key+'-theia.png')});await context.close();
 }
 await browser.close();browser=null;
 for(const [key] of inputs)for(const test of ['test_b69_story_actions_live.cjs','test_b69_story_followup_live.cjs']){
  const dir=path.join(out,key,test.replace('.cjs',''));fs.mkdirSync(dir,{recursive:true});
  const start=Date.now(),run=spawnSync(process.execPath,[path.join(root,'tests',test)],{cwd:root,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024,
    env:{...process.env,STG_TEST_HTML:path.join(out,key+'.theia.html'),STORY_OUTPUT:dir,FOLLOWUP_OUTPUT:dir}});
  fs.writeFileSync(path.join(dir,'run.log'),(run.stdout||'')+(run.stderr||''));
  report.gameplay.push({input:key,test,pass:run.status===0,status:run.status,error:run.error?.message,elapsed_ms:Date.now()-start});
  console.log(JSON.stringify(report.gameplay.at(-1)));
 }
 assert(report.gameplay.every(j=>j.pass),'Final exported-game regression failed');assert.deepEqual(report.errors,[]);report.pass=true;
})().catch(e=>{report.pass=false;report.failure=e.stack;process.exitCode=1;}).finally(async()=>{
 if(browser)await browser.close();fs.writeFileSync(path.join(out,'acceptance.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({pass:report.pass,inputs:report.inputs.length,gameplay:report.gameplay.length,failure:report.failure}));
});
