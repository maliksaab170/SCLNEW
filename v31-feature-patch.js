// v31 feature patch for Star Cars (keeps ALL tabs): Vehicles search + Directors' Funds
(function(){
  const KEY='starcars_v17_db';
  let db = JSON.parse(localStorage.getItem(KEY) || '{}');
  const save=()=>{ localStorage.setItem(KEY, JSON.stringify(db)); };
  db.partners = Array.isArray(db.partners) ? db.partners : [ { name:'Director A', balance:0, tx:[] }, { name:'Director B', balance:0, tx:[] } ];
  save();
  const fmtUK = (d)=>{ if(!d) return ''; const [y,m,dd]=String(d).split('-'); return `${dd}/${m}/${y}`; };
  const uid = ()=> Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  const sum=(a, pick)=> (a||[]).reduce((t,x)=> t + Number(pick?pick(x):x||0),0);
  const ov = window.viewVehicles;
  if(typeof ov==='function'){
    window.viewVehicles = function(user){
      const w = ov(user);
      try{
        const table = w.querySelector('table.table') || w.querySelector('table');
        if(table && !w.querySelector('#veh_search')){
          const wrap=document.createElement('div'); wrap.className='filters';
          wrap.innerHTML = `<label>Search in stock <input id="veh_search" placeholder="type reg, make or model"></label>
            <span class="small">Tip: type part of reg (e.g. AB1) or model (e.g. Focus)</span>`;
          table.parentElement.insertBefore(wrap, table);
          const input=wrap.querySelector('#veh_search'); const rows=Array.from(table.querySelectorAll('tbody tr'));
          input.addEventListener('input',()=>{ const q=(input.value||'').toLowerCase(); rows.forEach(tr=>{ const t=tr.textContent.toLowerCase(); tr.style.display = t.includes(q) ? '' : 'none'; }); });
        }
      }catch(e){}
      return w;
    };
  }
  function inMonth(val, y, m){ if(!val) return false; const t=new Date(val); return t.getFullYear()===y && (t.getMonth()+1)===m; }
  function realisedProfitForMonth(ym){
    const [yy,mm]=ym.split('-').map(Number);
    const sales=(db.sales||[]).filter(s=> inMonth(s.date,yy,mm));
    const showroom=(db.showroomExpenses||[]).filter(e=> inMonth(e.date,yy,mm));
    const totalShowroom=sum(showroom, e=> e.amount);
    const saleProfit=(sales||[]).reduce((acc,s)=>{ const v=(db.vehicles||[]).find(x=> x.id===s.vehicleId)||{}; const purchase=Number(v.purchase||0);
      const vexp=(db.vehicleExpenses||[]).filter(e=> e.vehicleId===s.vehicleId); const vexpTot=sum(vexp, e=> e.amount);
      return acc + (Number(s.salePrice||0) - purchase - vexpTot);
    },0);
    return {saleProfit,totalShowroom,net:saleProfit-totalShowroom};
  }
  function addTx(idx, amount, note, dateISO){
    const p=db.partners[idx]; if(!p) return;
    const tx={id:uid(), date:dateISO||new Date().toISOString().slice(0,10), amount:Number(amount||0), note:note||''};
    p.tx.unshift(tx); p.balance = Number(p.balance||0)+Number(amount||0); save();
  }
  const or = window.viewReports;
  if(typeof or==='function'){
    window.viewReports = function(user){
      const w = or(user);
      try{
        if(w.querySelector('#df_bal1')) return w;
        const wrap=document.createElement('div'); wrap.className='card';
        wrap.innerHTML=`
          <h2>Directors' Funds (50/50 profit split)</h2>
          <div class="filters">
            <label>Director 1 name <input id="df_n1"></label>
            <label>Director 2 name <input id="df_n2"></label>
            <button id="df_save_names">Save Names</button>
          </div>
          <div class="kpi">
            <div class="card"><div class="small" id="df_label1">Director A</div><div id="df_bal1" style="font-size:20px;font-weight:700">£0.00</div></div>
            <div class="card"><div class="small" id="df_label2">Director B</div><div id="df_bal2" style="font-size:20px;font-weight:700">£0.00</div></div>
          </div>
          <div class="filters">
            <label>Month to split <input id="df_month" type="month" value="${new Date().toISOString().slice(0,7)}"></label>
            <button id="df_calc">Preview profit</button>
            <button id="df_post">Post monthly split (50/50)</button>
          </div>
          <div class="filters">
            <label>Manual entry — Dir 1:
              <input id="df_amt1" type="number" step="0.01" placeholder="positive=contribution, negative=withdraw">
              <input id="df_note1" placeholder="note">
              <button id="df_add1">Add</button>
            </label>
            <label>Manual entry — Dir 2:
              <input id="df_amt2" type="number" step="0.01" placeholder="positive=contribution, negative=withdraw">
              <input id="df_note2" placeholder="note">
              <button id="df_add2">Add</button>
            </label>
          </div>
          <h3>Transactions</h3>
          <table class="table" id="df_tbl">
            <thead><tr><th>Date</th><th>Director</th><th class="right">Amount</th><th>Note</th></tr></thead>
            <tbody></tbody>
          </table>`;
        w.appendChild(wrap);
        const n1=wrap.querySelector('#df_n1'), n2=wrap.querySelector('#df_n2');
        n1.value=db.partners[0]?.name||'Director A'; n2.value=db.partners[1]?.name||'Director B';
        const lab1=wrap.querySelector('#df_label1'), lab2=wrap.querySelector('#df_label2');
        const bal1=wrap.querySelector('#df_bal1'), bal2=wrap.querySelector('#df_bal2');
        const money=(n)=>'£'+Number(n||0).toFixed(2);
        const renderBalances=()=>{ lab1.textContent=db.partners[0].name; lab2.textContent=db.partners[1].name; bal1.textContent=money(db.partners[0].balance||0); bal2.textContent=money(db.partners[1].balance||0); };
        renderBalances();
        wrap.querySelector('#df_save_names').onclick=()=>{ db.partners[0].name=n1.value.trim()||'Director A'; db.partners[1].name=n2.value.trim()||'Director B'; save(); renderBalances(); alert('Names saved.'); };
        const monthInp=wrap.querySelector('#df_month');
        wrap.querySelector('#df_calc').onclick=()=>{ const r=realisedProfitForMonth(monthInp.value); alert(`Net for ${monthInp.value}: ${money(r.net)} (half each = ${money(r.net/2)})`); };
        wrap.querySelector('#df_post').onclick=()=>{ const ym=monthInp.value; if(!ym) return alert('Choose a month'); const r=realisedProfitForMonth(ym); const half=r.net/2;
          const [yy,mm]=ym.split('-').map(Number); const last=new Date(yy,mm,0).toISOString().slice(0,10);
          addTx(0, +half, `Monthly profit split ${ym}`, last); addTx(1, +half, `Monthly profit split ${ym}`, last);
          renderBalances(); fillTx(); alert('Posted monthly split to both directors.'); };
        wrap.querySelector('#df_add1').onclick=()=>{ const a=Number(wrap.querySelector('#df_amt1').value||0); const note=wrap.querySelector('#df_note1').value||''; if(!a) return alert('Enter amount');
          addTx(0,a,note,new Date().toISOString().slice(0,10)); renderBalances(); fillTx(); wrap.querySelector('#df_amt1').value=''; wrap.querySelector('#df_note1').value=''; };
        wrap.querySelector('#df_add2').onclick=()=>{ const a=Number(wrap.querySelector('#df_amt2').value||0); const note=wrap.querySelector('#df_note2').value||''; if(!a) return alert('Enter amount');
          addTx(1,a,note,new Date().toISOString().slice(0,10)); renderBalances(); fillTx(); wrap.querySelector('#df_amt2').value=''; wrap.querySelector('#df_note2').value=''; };
        function fillTx(){ const tb=wrap.querySelector('#df_tbl tbody'); tb.innerHTML=''; const rows=[]; (db.partners||[]).forEach(p=> (p.tx||[]).forEach(t=> rows.push({date:t.date, who:p.name||'Director', amt:t.amount, note:t.note||''})));
          rows.sort((a,b)=> a.date<b.date?1:-1); rows.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${fmtUK(r.date)}</td><td>${r.who}</td><td class="right">£${Number(r.amt||0).toFixed(2)}</td><td>${r.note}</td>`; tb.appendChild(tr); }); }
        fillTx();
      }catch(e){}
      return w;
    };
  }
  if(window.render) window.render();
})();