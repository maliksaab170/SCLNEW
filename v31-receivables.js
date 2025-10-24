/* Star Cars — Receivables & Deposits mini-tab (safe add-on, keeps all features) */
(function(){
  const KEY='starcars_v17_db';
  let db = JSON.parse(localStorage.getItem(KEY)||'{}');
  const save=()=>localStorage.setItem(KEY, JSON.stringify(db));
  const money=n=>'£'+Number(n||0).toFixed(2);
  const uid = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const fmtUK = (d)=>{ if(!d) return ''; const [y,m,dd]=String(d).split('-'); return `${dd}/${m}/${y}`; };
  db.receivables = Array.isArray(db.receivables)?db.receivables:[];
  db.deposits    = Array.isArray(db.deposits)?db.deposits:[];
  const tabName = 'Receivables & Deposits';
  db.users = db.users && db.users.length ? db.users : [{username:'admin',password:'admin',role:'admin',perms:{}}];
  db.users.forEach(u=>{ u.perms = u.perms||{}; if(!u.perms[tabName]) u.perms[tabName] = {view:true,add:(u.role==='admin'),edit:(u.role==='admin'),delete:(u.role==='admin')}; });
  save();
  function viewRecDep(){
    const wrap=document.createElement('div'); wrap.className='card';
    const totRec = db.receivables.filter(x=>x.status!=='paid').reduce((a,x)=>a+Number(x.amount||0),0);
    const totDep = db.deposits.filter(x=>x.status!=='paid').reduce((a,x)=>a+Number(x.amount||0),0);
    wrap.innerHTML = `
      <h2>Receivables & Deposits</h2>
      <div class="kpi">
        <div class="card"><div class="small">Open Receivables</div><div style="font-weight:700;font-size:20px">${money(totRec)}</div></div>
        <div class="card"><div class="small">Open Deposits (liability)</div><div style="font-weight:700;font-size:20px">${money(totDep)}</div></div>
      </div>
      <div class="card">
        <h3>Add Receivable (someone owes you)</h3>
        <div class="filters">
          <input id="r_date" type="date"><input id="r_name" placeholder="From (e.g., Mechanic A)"><input id="r_reg" placeholder="Reg (optional)">
          <input id="r_amt" type="number" step="0.01" placeholder="Amount"><input id="r_note" placeholder="Note"><button id="r_add">Add</button>
        </div>
      </div>
      <div class="card">
        <h3>Add Customer Deposit (liability)</h3>
        <div class="filters">
          <input id="d_date" type="date"><input id="d_name" placeholder="Customer name"><input id="d_reg" placeholder="Reg (optional)">
          <input id="d_amt" type="number" step="0.01" placeholder="Amount"><input id="d_note" placeholder="Note"><button id="d_add">Add</button>
        </div>
      </div>
      <div class="card">
        <h3>Open Receivables</h3>
        <table class="table" id="tbl_r"><thead><tr><th>Date</th><th>From</th><th>Reg</th><th class="right">Amount</th><th>Note</th><th></th></tr></thead><tbody></tbody></table>
      </div>
      <div class="card">
        <h3>Open Deposits</h3>
        <table class="table" id="tbl_d"><thead><tr><th>Date</th><th>Customer</th><th>Reg</th><th class="right">Amount</th><th>Note</th><th></th></tr></thead><tbody></tbody></table>
      </div>
      <div class="card">
        <h3>History (Paid)</h3>
        <table class="table" id="tbl_h"><thead><tr><th>Date</th><th>Type</th><th>Name</th><th>Reg</th><th class="right">Amount</th><th>Note</th><th>Paid on</th></tr></thead><tbody></tbody></table>
      </div>`;
    function pushAndSave(arr, obj){ arr.unshift(obj); save(); renderLists(); }
    function markPaid(list, id){ const it = list.find(x=>x.id===id); if(!it) return; it.status='paid'; it.paidDate = new Date().toISOString().slice(0,10); save(); renderLists(); }
    function delItem(list, id){ const i = list.findIndex(x=>x.id===id); if(i>-1){ list.splice(i,1); save(); renderLists(); } }
    wrap.querySelector('#r_add').onclick=()=>{
      const obj = { id:uid(), date:wrap.querySelector('#r_date').value || new Date().toISOString().slice(0,10), name:wrap.querySelector('#r_name').value.trim(),
        reg:(wrap.querySelector('#r_reg').value||'').toUpperCase(), amount:Number(wrap.querySelector('#r_amt').value||0), note:wrap.querySelector('#r_note').value||'', status:'open', t:'recv' };
      if(!obj.name || !obj.amount){ alert('Name and amount required'); return; } pushAndSave(db.receivables, obj); ['#r_name','#r_reg','#r_amt','#r_note'].forEach(s=> wrap.querySelector(s).value='');
    };
    wrap.querySelector('#d_add').onclick=()=>{
      const obj = { id:uid(), date:wrap.querySelector('#d_date').value || new Date().toISOString().slice(0,10), name:wrap.querySelector('#d_name').value.trim(),
        reg:(wrap.querySelector('#d_reg').value||'').toUpperCase(), amount:Number(wrap.querySelector('#d_amt').value||0), note:wrap.querySelector('#d_note').value||'', status:'open', t:'dep' };
      if(!obj.name || !obj.amount){ alert('Name and amount required'); return; } pushAndSave(db.deposits, obj); ['#d_name','#d_reg','#d_amt','#d_note'].forEach(s=> wrap.querySelector(s).value='');
    };
    function renderLists(){
      const tbR = wrap.querySelector('#tbl_r tbody'); tbR.innerHTML='';
      db.receivables.filter(x=>x.status!=='paid').forEach(x=>{
        const tr=document.createElement('tr');
        tr.innerHTML = `<td>${fmtUK(x.date)}</td><td>${x.name}</td><td>${x.reg||''}</td><td class="right">${money(x.amount)}</td><td>${x.note||''}</td>
          <td class="right"><button data-id="${x.id}" class="mp">Mark paid</button> <button data-id="${x.id}" class="del">Delete</button></td>`;
        tbR.appendChild(tr);
      });
      const tbD = wrap.querySelector('#tbl_d tbody'); tbD.innerHTML='';
      db.deposits.filter(x=>x.status!=='paid').forEach(x=>{
        const tr=document.createElement('tr');
        tr.innerHTML = `<td>${fmtUK(x.date)}</td><td>${x.name}</td><td>${x.reg||''}</td><td class="right">${money(x.amount)}</td><td>${x.note||''}</td>
          <td class="right"><button data-id="${x.id}" class="mpd">Mark paid</button> <button data-id="${x.id}" class="deld">Delete</button></td>`;
        tbD.appendChild(tr);
      });
      const hist = [].concat(db.receivables.filter(x=>x.status==='paid').map(x=>({...x,type:'Receivable'}))).concat(db.deposits.filter(x=>x.status==='paid').map(x=>({...x,type:'Deposit'})));
      hist.sort((a,b)=> (a.paidDate||'') < (b.paidDate||'') ? 1 : -1);
      const tbH = wrap.querySelector('#tbl_h tbody'); tbH.innerHTML='';
      hist.forEach(x=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>${fmtUK(x.date)}</td><td>${x.type}</td><td>${x.name}</td><td>${x.reg||''}</td>
          <td class="right">${money(x.amount)}</td><td>${x.note||''}</td><td>${fmtUK(x.paidDate)}</td>`; tbH.appendChild(tr); });
      wrap.querySelectorAll('.mp').forEach(b=> b.onclick=()=> markPaid(db.receivables, b.dataset.id));
      wrap.querySelectorAll('.del').forEach(b=> b.onclick=()=> delItem(db.receivables, b.dataset.id));
      wrap.querySelectorAll('.mpd').forEach(b=> b.onclick=()=> markPaid(db.deposits, b.dataset.id));
      wrap.querySelectorAll('.deld').forEach(b=> b.onclick=()=> delItem(db.deposits, b.dataset.id));
    }
    renderLists(); return wrap;
  }
  function addNavBtn(){ const nav=document.getElementById('nav'); if(!nav) return; if(nav.querySelector('#btn_recdep')) return;
    const btn=document.createElement('button'); btn.id='btn_recdep'; btn.textContent='Receivables & Deposits';
    btn.onclick=()=>{ const app=document.getElementById('app'); app.innerHTML=''; app.appendChild(viewRecDep()); }; nav.appendChild(btn); }
  addNavBtn();
  const orig_viewReports = window.viewReports;
  if(typeof orig_viewReports==='function'){
    window.viewReports = function(user){
      const w = orig_viewReports(user);
      try{
        const openRec = db.receivables.filter(x=>x.status!=='paid').reduce((a,x)=>a+Number(x.amount||0),0);
        const openDep = db.deposits.filter(x=>x.status!=='paid').reduce((a,x)=>a+Number(x.amount||0),0);
        const card=document.createElement('div'); card.className='card';
        card.innerHTML = `<h3>Snapshot — Receivables & Deposits</h3>
          <div class="kpi">
            <div class="card"><div class="small">Open Receivables</div><div style="font-weight:700;font-size:20px">£${Number(openRec).toFixed(2)}</div></div>
            <div class="card"><div class="small">Open Deposits (liability)</div><div style="font-weight:700;font-size:20px">£${Number(openDep).toFixed(2)}</div></div>
          </div>`;
        w.appendChild(card);
      }catch(e){}
      return w;
    };
  }
  if(window.render) window.render();
})();