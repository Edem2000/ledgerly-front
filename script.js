
// ===== Utilities & Globals =====
const qs = (sel, root=document) => root.querySelector(sel);
const qsa = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// number formatters (UZS)
const nfK = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nfFull = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const fmtK = (k) => (k<0?'-':'') + nfK.format(Math.abs(k)) + 'k UZS';
const fmtFull = (k) => (k<0?'-':'') + nfFull.format(Math.abs(k)*1000) + ' UZS'; // k→full

// unit toggle (persisted)
let unitMode = 'k';
try { unitMode = localStorage.getItem('pfaUnit') || 'k'; } catch {}
const fmtAmount = (k) => unitMode === 'full' ? fmtFull(k) : fmtK(k);

// date helpers
const fmtDate = (s) => new Date(s + 'T00:00:00');
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

// ===== Demo Data =====
let budgets = {
    Groceries: 300,
    Rent: 500,
    Transport: 120,
    Entertainment: 120,
    Utilities: 150,
    Other: 120,
};

// load custom budgets
const BUDGETS_LS = 'pfaBudgets';
try {
    const savedBudgets = JSON.parse(localStorage.getItem(BUDGETS_LS) || 'null');
    if (savedBudgets && typeof savedBudgets === 'object') budgets = { ...budgets, ...savedBudgets };
} catch {}
const saveBudgets = () => { try { localStorage.setItem(BUDGETS_LS, JSON.stringify(budgets)); } catch {} };

// transactions: values in thousands UZS (k UZS). positive = income, negative = expense
let baseTransactions = [
    { date: '2025-10-02', amount: 1500.0, type: 'income',  category: 'Salary',        merchant: 'Employer Inc.' },
    { date: '2025-10-03', amount: -480.0, type: 'expense', category: 'Rent',          merchant: 'Landlord' },
    { date: '2025-10-04', amount:  -64.4, type: 'expense', category: 'Groceries',     merchant: 'Supermarket' },
    { date: '2025-10-05', amount:  -12.5, type: 'expense', category: 'Transport',     merchant: 'Metro' },
    { date: '2025-10-05', amount:  -21.9, type: 'expense', category: 'Entertainment', merchant: 'Cinema' },
    { date: '2025-10-06', amount:  -45.8, type: 'expense', category: 'Groceries',     merchant: 'Farmer Market' },
    { date: '2025-10-08', amount:  -14.2, type: 'expense', category: 'Transport',     merchant: 'Taxi' },
    { date: '2025-10-10', amount:  -57.6, type: 'expense', category: 'Utilities',     merchant: 'Energy Co.' },
    { date: '2025-10-12', amount:  120.0, type: 'income',  category: 'Other',         merchant: 'Freelance' },
    { date: '2025-10-13', amount:  -23.1, type: 'expense', category: 'Groceries',     merchant: 'Mini-Mart' },
    { date: '2025-10-15', amount:  -18.0, type: 'expense', category: 'Entertainment', merchant: 'Spotify' },
    { date: '2025-10-18', amount:   -6.8, type: 'expense', category: 'Other',         merchant: 'Coffee' },
    { date: '2025-10-20', amount:  -74.2, type: 'expense', category: 'Groceries',     merchant: 'Supermarket' },
    { date: '2025-10-22', amount:  -12.2, type: 'expense', category: 'Transport',     merchant: 'Bus' },
    { date: '2025-10-24', amount:  -95.0, type: 'expense', category: 'Utilities',     merchant: 'Water Co.' },
    { date: '2025-10-26', amount:   80.0, type: 'income',  category: 'Other',         merchant: 'FB Marketplace' },
    { date: '2025-10-28', amount:  -43.9, type: 'expense', category: 'Groceries',     merchant: 'Mini-Mart' },
    { date: '2025-10-28', amount:  -12.5, type: 'expense', category: 'Transport',     merchant: 'Metro' },
    { date: '2025-10-30', amount:  -25.0, type: 'expense', category: 'Entertainment', merchant: 'Movies' },
    { date: '2025-11-01', amount:  -68.0, type: 'expense', category: 'Groceries',     merchant: 'Supermarket' },
    { date: '2025-11-01', amount:   50.0, type: 'income',  category: 'Other',         merchant: 'Gift' },
];

// Persist user-added transactions
const LS_KEY = 'pfaExtras';
let extraTransactions = [];
try { extraTransactions = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { extraTransactions = []; }
const allTx = () => [...baseTransactions, ...extraTransactions];

// Budget sorting mode
const BUDGET_SORT_LS = 'pfaBudgetSort';
let budgetSortMode = 'name';
try { budgetSortMode = localStorage.getItem(BUDGET_SORT_LS) || 'name'; } catch {}

// ===== Element refs =====
const monthSelect = qs('#monthSelect');
const unitSelect  = qs('#unitSelect');
const resetBtn    = qs('#resetBtn');
const addBtn      = qs('#addBtn');
const addCard     = qs('#addFormCard');
const addForm     = qs('#addForm');
const cancelAdd   = qs('#cancelAdd');
const budgetsBoxEl= qs('#budgetsBox');
const addBudgetBtn= qs('#addBudgetBtn');
const sortSelect  = qs('#budgetSort');
const clearAddedBtn = qs('#clearAddedBtn');

// toast
function showToast(msg){ const t = qs('#toast'); if(!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1800); }

// ===== Setup filters =====
function refreshMonthOptions(preserve){
    const months = [...new Set(allTx().map(t => monthKey(fmtDate(t.date))))].sort();
    const prev = preserve ? monthSelect.value : null;
    monthSelect.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
    monthSelect.value = prev && months.includes(prev) ? prev : (months[months.length - 1] || '');
}
refreshMonthOptions(false);

if (unitSelect) { unitSelect.value = unitMode; unitSelect.addEventListener('change', ()=>{ unitMode = unitSelect.value; try { localStorage.setItem('pfaUnit', unitMode); } catch {}; render(); }); }
if (resetBtn) resetBtn.addEventListener('click', ()=>{ refreshMonthOptions(false); render(); });
if (monthSelect) monthSelect.addEventListener('change', render);

// ===== Add Transaction Form =====
function refreshCategoryDatalist(){
    const cats = [...new Set(allTx().map(t=>t.category).filter(Boolean))].sort();
    const dl = qs('#catList'); if(!dl) return; dl.innerHTML = cats.map(c=>`<option value="${c}"></option>`).join('');
}
function openAdd(){
    qs('#fDate').valueAsDate = new Date();
    qs('#fType').value = 'expense';
    qs('#fAmount').value = '';
    qs('#fCategory').value = '';
    qs('#fMerchant').value = '';
    refreshCategoryDatalist();
    addCard.style.display = 'block';
}
function closeAdd(){ addCard.style.display = 'none'; }

if (addBtn) addBtn.addEventListener('click', openAdd);
if (cancelAdd) cancelAdd.addEventListener('click', closeAdd);

if (addForm) addForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const date = qs('#fDate').value;
    const type = qs('#fType').value;
    const amountRaw = parseFloat(qs('#fAmount').value);
    const category = (qs('#fCategory').value||'Other').trim();
    const merchant = (qs('#fMerchant').value||'').trim();
    if(!date || !Number.isFinite(amountRaw) || amountRaw<=0) return;
    const amount = type==='expense' ? -Math.abs(amountRaw) : Math.abs(amountRaw);
    extraTransactions.push({ date, amount, type, category, merchant });
    try { localStorage.setItem(LS_KEY, JSON.stringify(extraTransactions)); } catch {}
    refreshMonthOptions(true); refreshCategoryDatalist(); render(); closeAdd();
});

// ===== Clear Added (double-click safety + spinner + toast) =====
let clearTimer = null;
if (clearAddedBtn){
    clearAddedBtn.addEventListener('click', ()=>{
        const armed = clearAddedBtn.getAttribute('data-armed') === '1';
        if(!armed){
            clearAddedBtn.setAttribute('data-armed','1');
            clearAddedBtn.classList.add('armed');
            const oldLabel = clearAddedBtn.getAttribute('data-old') || clearAddedBtn.textContent;
            clearAddedBtn.setAttribute('data-old', oldLabel);
            clearAddedBtn.textContent = 'Click again to confirm';
            if(clearTimer) clearTimeout(clearTimer);
            clearTimer = setTimeout(()=>{
                clearAddedBtn.textContent = clearAddedBtn.getAttribute('data-old') || 'Clear Added';
                clearAddedBtn.removeAttribute('data-armed');
                clearAddedBtn.classList.remove('armed');
            }, 3000);
            return;
        }
        // confirmed
        clearAddedBtn.removeAttribute('data-armed');
        clearAddedBtn.classList.remove('armed');
        clearAddedBtn.classList.add('loading');
        clearAddedBtn.textContent = clearAddedBtn.getAttribute('data-old') || 'Clear Added';
        setTimeout(()=>{
            extraTransactions = [];
            try { localStorage.setItem(LS_KEY, '[]'); } catch {}
            refreshMonthOptions(false); refreshCategoryDatalist(); render();
            clearAddedBtn.classList.remove('loading');
            showToast('Added transactions cleared');
        }, 350);
    });
}

// ===== Budgets: render helpers & interactions =====
if (sortSelect){ sortSelect.value = budgetSortMode; sortSelect.addEventListener('change', ()=>{ budgetSortMode = sortSelect.value; try { localStorage.setItem(BUDGET_SORT_LS, budgetSortMode); } catch {}; render(); }); }
if (addBudgetBtn){ addBudgetBtn.addEventListener('click', ()=>{
    const name = (prompt('Category name:', '')||'').trim();
    if(!name){ showToast('Category name required'); return; }
    const existing = budgets[name];
    const def = existing!=null ? String(existing) : '';
    const val = prompt(`Monthly limit for "${name}" (in thousands UZS):`, def);
    if (val === null) return;
    const n = parseFloat((val||'').replace(',', '.'));
    if (Number.isFinite(n) && n >= 0) { budgets[name] = n; saveBudgets(); render(); showToast(existing!=null ? `Limit for ${name} updated` : `Limit for ${name} added`); } else { showToast('Invalid number'); }
}); }

if (budgetsBoxEl){ budgetsBoxEl.addEventListener('click', (e)=>{
    const editBtn = e.target.closest('.edit-limit');
    const delBtn  = e.target.closest('.delete-limit');
    if (editBtn){
        const cat = editBtn.getAttribute('data-cat');
        const current = budgets[cat] ?? 0;
        const val = prompt(`New monthly limit for "${cat}" (in thousands UZS):`, String(current));
        if (val === null) return;
        const n = parseFloat((val||'').replace(',', '.'));
        if (Number.isFinite(n) && n >= 0) { budgets[cat] = n; saveBudgets(); render(); showToast(`Limit for ${cat} updated`); } else { showToast('Invalid number'); }
        return;
    }
    if (delBtn){
        const cat = delBtn.getAttribute('data-cat');
        if (!confirm(`Delete limit for "${cat}"?`)) return;
        delete budgets[cat]; saveBudgets(); render(); showToast(`Limit for ${cat} deleted`);
        return;
    }
}); }

// ===== Render =====
let pieChart;
function render(){
    try {
        const selectedMonth = monthSelect.value;
        const tx = allTx();
        const view = tx.filter(t => monthKey(fmtDate(t.date)) === selectedMonth);

        const income = view.filter(t=>t.amount>0).reduce((a,b)=>a+b.amount,0);
        const expense = Math.abs(view.filter(t=>t.amount<0).reduce((a,b)=>a+b.amount,0));
        const net = income - expense;

        qs('[data-testid="income"]').textContent = fmtAmount(income);
        qs('[data-testid="expense"]').textContent = fmtAmount(expense);
        qs('[data-testid="net"]').textContent = fmtAmount(net);
        qs('[data-testid="income-count"]').textContent = `${view.filter(t=>t.amount>0).length} transactions`;
        qs('[data-testid="expense-count"]').textContent = `${view.filter(t=>t.amount<0).length} transactions`;
        qs('[data-testid="net-note"]').textContent = net>=0 ? 'You are in surplus' : 'Deficit this month';

        // Budgets
        const spentByCat = view.filter(t=>t.amount<0).reduce((acc,t)=>{acc[t.category]=(acc[t.category]||0)+Math.abs(t.amount);return acc;},{});
        const budgetsBox = qs('#budgetsBox');
        // Union of categories: existing budgets + categories observed in this month
        const categories = Array.from(new Set([...Object.keys(budgets), ...Object.keys(spentByCat)]));
        const overMap = Object.fromEntries(categories.map(c=>[c, (spentByCat[c]||0) > ((budgets[c]??Infinity)===Infinity?Infinity:(budgets[c]||0))]));
        if (budgetSortMode === 'name') categories.sort((a,b)=>a.localeCompare(b));
        else if (budgetSortMode === 'spent') categories.sort((a,b)=>(spentByCat[b]||0)-(spentByCat[a]||0));
        else if (budgetSortMode === 'over') categories.sort((a,b)=> Number(overMap[b]) - Number(overMap[a]) || a.localeCompare(b));

        budgetsBox.innerHTML = categories.map(cat=>{
            const hasLimit = Number.isFinite(budgets[cat]);
            const limit = hasLimit ? budgets[cat] : null;
            const spent = spentByCat[cat]||0;
            const pctRaw = hasLimit && limit>0 ? (spent/limit)*100 : 0;
            const pct = Math.min(100, Math.round(pctRaw));
            const over = hasLimit ? (spent>limit) : false;
            const state = hasLimit ? (over ? 'bad' : (pct>80 ? 'warn' : 'good')) : 'warn';
            const badge = hasLimit
                ? (over ? '<span class="badge over" title="Over the limit">Over</span>' : '<span class="badge ok" title="Within limit">OK</span>')
                : '<span class="badge nolimit" title="No monthly limit set">No limit</span>';
            const statusText = hasLimit ? `${fmtAmount(spent)} / ${fmtAmount(limit)}` : `${fmtAmount(spent)} / Limit not defined`;
            const title = hasLimit
                ? `Spent ${pctRaw.toFixed(1)}% — ${spent}k / ${limit}k UZS`
                : `No limit set — Spent ${spent}k UZS`;
            const actions = hasLimit
                ? '<button class="mini edit-limit" data-cat="'+cat+'">Edit</button> <button class="mini delete-limit" data-cat="'+cat+'">Delete</button>'
                : '<button class="mini edit-limit" data-cat="'+cat+'">Set limit</button>';
            return `<div class="budget" title="${title}">
          <h4 class="budget-title">${cat}</h4>
          <div class="budget-stats"><span class="status ${state}">${statusText}</span>${badge}</div>
          <div class="progress ${over ? 'over' : ''}"><i style="width:${hasLimit && limit>0?Math.min(100,(spent/limit)*100):0}%"></i></div>
          <div class="budget-actions">${actions}</div>
        </div>`
        }).join('');

        // Table
        const tbody = qs('#txTable tbody');
        const rows = [...view].sort((a,b)=>fmtDate(b.date)-fmtDate(a.date)).slice(0,10).map(t=>`
        <tr>
          <td>${t.date}</td>
          <td>${t.merchant||t.note||''}</td>
          <td>${t.category||'—'}</td>
          <td class="t-amount">${fmtAmount(t.amount)}</td>
        </tr>`).join('');
        tbody.innerHTML = rows || `<tr><td colspan="4" class="muted">No transactions</td></tr>`;

        // Pie chart (by expense category)
        const catPairs = Object.entries(spentByCat);
        const ctx = document.getElementById('pie');
        const data = { labels: catPairs.map(([c])=>c), datasets: [{ data: catPairs.map(([,v])=>v) }] };
        if (pieChart) pieChart.destroy();
        pieChart = new Chart(ctx, { type: 'doughnut', data, options: { plugins: { legend: { labels: { color:'#e7ecf3' } } }, cutout: '60%' } });
    } catch (err) {
        console.error(err);
        showToast('Render error: ' + (err?.message || err));
    }
}

// initial
refreshCategoryDatalist();
render();