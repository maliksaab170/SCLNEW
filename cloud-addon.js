// Cloud add-on for Star Cars (data-only sync via Firebase)
(function(){
  let fb=null, auth=null, fs=null;
  function loadFirebase(){
    if(window.firebase) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const urls=[
        'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js',
        'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js'
      ];
      let left=urls.length;
      urls.forEach(u=>{ const s=document.createElement('script'); s.src=u;
        s.onload=()=>{ if(--left===0) resolve(); }; s.onerror=reject; document.head.appendChild(s); });
    });
  }
  function cfgGet(){ return JSON.parse(localStorage.getItem('starcars_cloud_cfg')||'{}'); }
  function cfgSet(v){ localStorage.setItem('starcars_cloud_cfg', JSON.stringify(v||{})); }
  async function cloudInit(){
    const cfg=cfgGet(); if(!cfg.apiKey||!cfg.projectId) throw new Error('Missing Firebase config');
    await loadFirebase();
    fb = firebase.initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain || `${cfg.projectId}.firebaseapp.com`, projectId: cfg.projectId });
    auth = firebase.auth(); fs = firebase.firestore();
  }
  async function cloudLogin(email,pass){ await cloudInit(); await auth.signInWithEmailAndPassword(email,pass); return auth.currentUser; }
  function strippedDB(){ const KEY='starcars_v17_db'; const j=JSON.parse(localStorage.getItem(KEY)||'{}'); delete j.logo; (j.vehicles||[]).forEach(v=>{ delete v.photos; delete v.docs; }); return j; }
  async function cloudPush(){ const cfg=cfgGet(); if(!cfg.orgId) throw new Error('Set Org ID'); await cloudInit(); if(!auth.currentUser) throw new Error('Not signed in');
    const data=strippedDB(); await fs.collection('orgs').doc(cfg.orgId).collection('db').doc('starcars').set({data,t:Date.now()}); alert('Uploaded to cloud'); }
  async function cloudPull(){ const cfg=cfgGet(); if(!cfg.orgId) throw new Error('Set Org ID'); await cloudInit(); if(!auth.currentUser) throw new Error('Not signed in');
    const snap=await fs.collection('orgs').doc(cfg.orgId).collection('db').doc('starcars').get(); if(!snap.exists){ alert('No cloud data yet'); return; }
    const incoming=snap.data().data; localStorage.setItem('starcars_v17_db', JSON.stringify(incoming)); alert('Downloaded from cloud. Refreshing…'); location.reload(); }
  const addUI = ()=>{ const app=document.getElementById('app'); if(!app) return; const h2=[...app.querySelectorAll('h2')].find(x=>/Settings/i.test(x.textContent||'')); if(!h2) return; if(document.getElementById('cloudBox')) return;
    const box=document.createElement('div'); box.className='card'; box.id='cloudBox';
    box.innerHTML=`<h3>Cloud Sync (FREE via Firebase) — data only</h3>
      <label>apiKey <input id="c_api"></label>
      <label>projectId <input id="c_pid"></label>
      <label>auth email <input id="c_email" placeholder="admin@starcars.local"></label>
      <label>auth password <input id="c_pass" type="password"></label>
      <label>Org ID (pick a unique name) <input id="c_org" placeholder="starcars"></label>
      <div class="actions">
        <button id="c_save">Save Cloud Config</button>
        <button id="c_sign">Sign In & Connect</button>
        <button id="c_up">Upload (Sync → Cloud)</button>
        <button id="c_dn">Download (Cloud → App)</button>
      </div>
      <p class="small">Note: Cloud sync is <b>data only</b> (no photos/docs/logo). Use Backup for a full archive.</p>`;
    h2.parentElement.appendChild(box);
    const cfg=cfgGet(); ['c_api','c_pid','c_email','c_pass','c_org'].forEach(id=>{
      const i=box.querySelector('#'+id); const key=id==='c_api'?'apiKey':id==='c_pid'?'projectId':id==='c_email'?'email':id==='c_pass'?'pass':'orgId'; i.value=cfg[key]||''; });
    box.querySelector('#c_save').onclick=()=>{ const v={ apiKey:box.querySelector('#c_api').value.trim(), projectId:box.querySelector('#c_pid').value.trim(), email:box.querySelector('#c_email').value.trim(), pass:box.querySelector('#c_pass').value, orgId:(box.querySelector('#c_org').value.trim()||'starcars') }; cfgSet(v); alert('Cloud config saved'); };
    box.querySelector('#c_sign').onclick=async ()=>{ try{ const v=cfgGet(); if(!v.email||!v.pass) return alert('Enter email & password'); await cloudLogin(v.email,v.pass); alert('Signed in'); }catch(e){ alert('Login error: '+e.message); } };
    box.querySelector('#c_up').onclick=async ()=>{ try{ await cloudPush(); }catch(e){ alert(e.message); } };
    box.querySelector('#c_dn').onclick=async ()=>{ try{ await cloudPull(); }catch(e){ alert(e.message); } };
  };
  const obs=new MutationObserver(()=>addUI()); obs.observe(document.documentElement,{childList:true,subtree:true}); window.addEventListener('load', addUI);
})();