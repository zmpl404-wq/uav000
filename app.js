/**
 * 臺中市政府消防局 特搜大隊特搜空拍隊 - 勤務表單整合系統
 * 核心應用程式邏輯 (App Controller) - 戰術優化升級版
 */

(function () {
  'use strict';

  // 狀態管理
  const state = {
    currentFormId: 'borrow',
    theme: localStorage.getItem('uav_theme') || 'dark',
    history: JSON.parse(localStorage.getItem('uav_history') || '[]'),
    activeInventoryBlock: null
  };

  // 快取 DOM 元素
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    historyDrawerBtn: document.getElementById('historyDrawerBtn'),
    historyModal: document.getElementById('historyModal'),
    historyCloseBtn: document.getElementById('historyCloseBtn'),
    historyList: document.getElementById('historyList'),
    tabNavContainer: document.getElementById('tabNavContainer'),
    mobileNavContainer: document.getElementById('mobileNavContainer'),
    formHeaderTitle: document.getElementById('formHeaderTitle'),
    formHeaderDesc: document.getElementById('formHeaderDesc'),
    formBadge: document.getElementById('formBadge'),
    formOfficialLink: document.getElementById('formOfficialLink'),
    formRenderArea: document.getElementById('formRenderArea'),
    submitBtn: document.getElementById('submitBtn'),
    submitBtnText: document.getElementById('submitBtnText'),
    confirmModal: document.getElementById('confirmModal'),
    confirmSummaryContent: document.getElementById('confirmSummaryContent'),
    confirmCancelBtn: document.getElementById('confirmCancelBtn'),
    confirmSubmitBtn: document.getElementById('confirmSubmitBtn'),
    inventorySectionModal: document.getElementById('inventorySectionModal'),
    secModalIcon: document.getElementById('secModalIcon'),
    secModalTitle: document.getElementById('secModalTitle'),
    secModalSub: document.getElementById('secModalSub'),
    secModalItemsList: document.getElementById('secModalItemsList'),
    secModalProgress: document.getElementById('secModalProgress'),
    btnSecQuickAll: document.getElementById('btnSecQuickAll'),
    secModalCloseBtn: document.getElementById('secModalCloseBtn'),
    secModalDoneBtn: document.getElementById('secModalDoneBtn'),
    successModal: document.getElementById('successModal'),
    successModalClose: document.getElementById('successModalClose'),
    successNextBtn: document.getElementById('successNextBtn'),
    successSummaryContent: document.getElementById('successSummaryContent'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toastNotification'),
    toastMsg: document.getElementById('toastMsg')
  };

  // 每日裝備清點：依照原始表單分區（辦公室、器材室、1樓室外停車格、地下室）
  const INVENTORY_SECTIONS = [
    {
      id: 'sec_office',
      title: '辦公室',
      icon: 'fas fa-building',
      color: 'from-blue-600/25 to-indigo-600/25 border-blue-500/30 text-blue-400',
      badgeColor: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      desc: '器材箱(一)(二)、電腦桌、無線電櫃、油卡',
      sectionTitle: '辦公室'
    },
    {
      id: 'sec_equipment_room',
      title: '器材室',
      icon: 'fas fa-warehouse',
      color: 'from-cyan-600/25 to-teal-600/25 border-cyan-500/30 text-cyan-400',
      badgeColor: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
      desc: '可移動螢幕、Skydio X10、新樂飛、速創',
      sectionTitle: '器材室'
    },
    {
      id: 'sec_parking',
      title: '1樓室外停車格',
      icon: 'fas fa-square-parking',
      color: 'from-amber-600/25 to-orange-600/25 border-amber-500/30 text-amber-400',
      badgeColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      desc: '備勤車42車、西屯43車(帳棚/桌椅)',
      sectionTitle: '1樓室外停車格'
    },
    {
      id: 'sec_basement',
      title: '地下室',
      icon: 'fas fa-bolt',
      color: 'from-purple-600/25 to-rose-600/25 border-purple-500/30 text-purple-400',
      badgeColor: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      desc: 'HONDA EU22i 小型發電機',
      sectionTitle: '地下室'
    }
  ];

  // 初始化程式
  function init() {
    localStorage.removeItem('uav_custom_members'); // 自訂人員為一次性，不予持久保存
    localStorage.removeItem('uav_custom_locations'); // 自訂地點為一次性，不予持久保存
    localStorage.removeItem('uav_custom_coords'); // 自訂座標為一次性，不予持久保存
    localStorage.removeItem('uav_custom_drones'); // 自訂無人機為一次性，不予持久保存
    applyTheme(state.theme);
    renderNavigation();
    switchForm(state.currentFormId);
    setupEventListeners();
  }

  // 主題切換
  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('uav_theme', theme);
    if (theme === 'dark') {
      document.body.classList.remove('tactical-light');
      document.body.classList.add('tactical-dark');
      elements.themeToggleBtn.innerHTML = '<i class="fas fa-moon text-amber-400"></i>';
    } else {
      document.body.classList.remove('tactical-dark');
      document.body.classList.add('tactical-light');
      elements.themeToggleBtn.innerHTML = '<i class="fas fa-sun text-amber-500"></i>';
    }
  }

  // 渲染頂部與手機版導覽列
  function renderNavigation() {
    if (!window.FORMS_DATA || !window.FORMS_DATA.forms) return;
    const forms = window.FORMS_DATA.forms;

    // 桌面版橫向 Tab
    elements.tabNavContainer.innerHTML = forms.map(f => `
      <button type="button" data-form-id="${f.id}" 
        class="form-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap
        ${f.id === state.currentFormId ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 font-bold' : 'hover:bg-slate-700/40 text-slate-400 hover:text-slate-100'}">
        <i class="${f.icon}"></i>
        <span>${f.badge}</span>
      </button>
    `).join('');

    // 手機版底部導覽列
    elements.mobileNavContainer.innerHTML = forms.map(f => `
      <button type="button" data-form-id="${f.id}"
        class="mobile-nav-btn flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors
        ${f.id === state.currentFormId ? 'text-red-500 font-black' : 'text-slate-400'}">
        <i class="${f.icon} text-base mb-0.5"></i>
        <span class="scale-90 font-medium">${f.badge}</span>
      </button>
    `).join('');
  }

  // 切換表單
  function switchForm(formId) {
    const formConfig = window.FORMS_DATA.forms.find(f => f.id === formId);
    if (!formConfig) return;

    state.currentFormId = formId;

    // 更新導覽列高亮
    document.querySelectorAll('.form-tab-btn').forEach(btn => {
      const isCurrent = btn.dataset.formId === formId;
      btn.className = `form-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
        isCurrent ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 font-bold active' : 'hover:bg-slate-700/40 text-slate-400 hover:text-slate-200'
      }`;
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      const isCurrent = btn.dataset.formId === formId;
      btn.className = `mobile-nav-btn flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
        isCurrent ? 'text-red-500 font-black' : 'text-slate-400'
      }`;
    });

    // 更新表頭資訊（僅保留紅色標籤框框與原表單連結）
    if (elements.formBadge) elements.formBadge.innerText = formConfig.badge;
    if (elements.formOfficialLink) elements.formOfficialLink.href = formConfig.viewUrl;

    // 渲染該表單的所有輸入欄位
    renderFormFields(formConfig);

    // 捲動至表單頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 判斷是否為時間欄位（時:分）
  function isTimeField(item) {
    if (item.type === 'time') return true;
    const t = item.title || '';
    return t.includes('時:分') || t.includes('時間') && (t.includes('出勤') || t.includes('返隊') || t.includes('起飛') || t.includes('發生'));
  }

  // 判斷是否為人員欄位（排除人員傷亡相關調查欄位）
  function isPersonField(item) {
    const t = item.title || '';
    if (t.includes('傷亡')) return false;
    return (item.type === 'radio' || item.type === 'checkbox') && (
      t.includes('清點人員') || t.includes('出勤人員') || t.includes('通報人') || 
      t.includes('操作人') || t.includes('填寫人') || t.includes('出借點收人') || t.includes('點收人')
    );
  }

  // 判斷是否為經緯度/座標欄位
  function isCoordField(item) {
    const t = item.title || '';
    return t.includes('經緯度') || t.includes('座標');
  }

  // 渲染表單欄位核心函數
  function renderFormFields(formConfig) {
    const container = elements.formRenderArea;
    container.innerHTML = '';

    // 建立表單外殼 (指向 Google Form action)
    const formEl = document.createElement('form');
    formEl.id = `active_form_${formConfig.id}`;
    formEl.action = formConfig.actionUrl;
    formEl.method = 'POST';
    formEl.target = 'gform_sink_iframe';
    formEl.className = 'space-y-4';

    // 每日清點表單：加入 pageHistory=0,1,2,3,4（5頁多頁表單必要欄位）
    if (formConfig.id === 'inventory') {
      const phInput = document.createElement('input');
      phInput.type = 'hidden';
      phInput.name = 'pageHistory';
      phInput.value = '0,1,2,3,4';
      formEl.appendChild(phInput);
    }

    // 飛安通報表單：加入 pageHistory=0,1（2頁多頁表單必要欄位）
    if (formConfig.id === 'accident') {
      const phInput = document.createElement('input');
      phInput.type = 'hidden';
      phInput.name = 'pageHistory';
      phInput.value = '0,1';
      formEl.appendChild(phInput);
    }

    // 加入 fvv=1 標準 Google Form 隱藏參數
    const fvvInput = document.createElement('input');
    fvvInput.type = 'hidden';
    fvvInput.name = 'fvv';
    fvvInput.value = '1';
    formEl.appendChild(fvvInput);

    // ==========================================
    // 特殊模式：每日清點表單 6 大格戰術儀表板
    // ==========================================
    if (formConfig.id === 'inventory') {
      renderInventorySpecialLayout(formEl, formConfig);
    } else {
      // 其他一般表單渲染
      renderStandardLayout(formEl, formConfig);
    }

    container.appendChild(formEl);

    // 綁定動態生成的輸入框互動 (晶片選取、一鍵清點、經緯度GPS、自訂選項等)
    bindDynamicFormEvents(formEl, formConfig);
  }

  // 渲染標準表單區段
  function renderStandardLayout(formEl, formConfig) {
    formConfig.sections.forEach((section, sIndex) => {
      const secCard = document.createElement('div');
      secCard.className = 'form-section-card rounded-2xl p-4 sm:p-5 space-y-4';

      // 區段標題
      const secHeader = document.createElement('div');
      secHeader.className = 'border-b border-slate-700/40 pb-2.5 flex items-center justify-between';
      secHeader.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-md bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center text-[11px] font-black">${sIndex + 1}</span>
          <h3 class="font-bold text-sm sm:text-base text-slate-100">${escapeHtml(section.title)}</h3>
        </div>
        ${section.description ? `<span class="text-xs text-slate-400">${escapeHtml(section.description)}</span>` : ''}
      `;
      secCard.appendChild(secHeader);

      // 區段內項目
      section.items.forEach(item => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'form-item-wrapper space-y-1.5';

        // 判斷是否為無人機借出物品 (Grid 特殊優化：改為下拉選單 + 0個選擇)
        if (formConfig.id === 'borrow' && item.type === 'grid' && item.title.includes('借出物品')) {
          itemWrapper.appendChild(renderBorrowGridAsDropdowns(item));
        } else if (item.type === 'grid') {
          itemWrapper.appendChild(renderStandardGrid(item));
        } else {
          itemWrapper.appendChild(renderSingleField(item, formConfig));
        }

        secCard.appendChild(itemWrapper);
      });

      formEl.appendChild(secCard);
    });
  }

  // 渲染每日裝備清點特殊佈局 (置頂填寫 + 原生4大分區儀表板 + 備註)
  function renderInventorySpecialLayout(formEl, formConfig) {
    // 1. 置頂：清點日期與清點人員卡片
    const topCard = document.createElement('div');
    topCard.className = 'form-section-card rounded-2xl p-4 sm:p-5 space-y-3.5';
    topCard.innerHTML = `
      <div class="border-b border-slate-700/40 pb-2 flex items-center justify-between">
        <span class="font-bold text-sm text-slate-200 flex items-center gap-2">
          <i class="fas fa-calendar-check text-emerald-400"></i> 清點基本資料
        </span>
        <button type="button" id="btnMarkAllChecked" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5">
          <i class="fas fa-check-double"></i> ⚡ 全表單一鍵全數「已清點」
        </button>
      </div>
    `;

    // 取得 Section 1 項目
    const sec1 = formConfig.sections[0];
    if (sec1 && sec1.items) {
      sec1.items.forEach(item => {
        const itemWrap = document.createElement('div');
        itemWrap.className = 'form-item-wrapper space-y-1.5';
        itemWrap.appendChild(renderSingleField(item, formConfig));
        topCard.appendChild(itemWrap);
      });
    }
    formEl.appendChild(topCard);

    // 2. 中間：依照原始表單分區（辦公室、器材室、1樓室外停車格、地下室）4 大格卡片
    const dashboardSection = document.createElement('div');
    dashboardSection.className = 'space-y-2';
    dashboardSection.innerHTML = `
      <div class="flex items-center justify-between px-1">
        <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <i class="fas fa-th-large text-amber-400"></i> 分區裝備清點（點擊分類開啟清點視窗）
        </span>
        <span id="invGlobalCountBadge" class="text-[11px] font-mono text-slate-400">總進度：0 / 56 已清點</span>
      </div>
      <div class="grid grid-cols-2 gap-2.5 sm:gap-4" id="invDashboardGrid">
        ${INVENTORY_SECTIONS.map(blk => `
          <div class="inv-grid-card glass-panel rounded-2xl p-3 sm:p-4 border border-slate-700/60 bg-gradient-to-br ${blk.color} relative overflow-hidden flex flex-col justify-between"
               data-section-id="${blk.id}">
            <div class="flex items-start justify-between">
              <div class="w-9 h-9 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center text-lg">
                <i class="${blk.icon}"></i>
              </div>
              <span class="blk-badge px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                待清點
              </span>
            </div>
            <div class="mt-2.5">
              <h4 class="font-extrabold text-sm sm:text-base text-slate-100">${blk.title}</h4>
              <p class="text-[10px] sm:text-xs text-slate-400 line-clamp-1 mt-0.5">${blk.desc}</p>
            </div>
            <div class="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-xs text-slate-400 font-mono">
              <span class="blk-count">0 / 0</span>
              <span class="text-amber-400 flex items-center gap-1 font-sans font-medium">開啟清點 <i class="fas fa-chevron-right text-[8px]"></i></span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    formEl.appendChild(dashboardSection);

    // 3. 將所有裝備的隱藏 Radio 項目注入到 formEl（保證即使不開彈窗也能完整透過 form 提交）
    const hiddenRowsContainer = document.createElement('div');
    hiddenRowsContainer.id = 'invAllRowsContainer';
    hiddenRowsContainer.className = 'hidden'; // 隱藏於底層，資料由視窗同步

    // 收集所有 grid 項目放入底層
    formConfig.sections.forEach(sec => {
      sec.items.forEach(it => {
        if (it.type === 'grid' && it.rows) {
          it.rows.forEach(row => {
            const rowHolder = document.createElement('div');
            rowHolder.className = 'inventory-data-row';
            rowHolder.dataset.rowEntry = row.entryName;
            rowHolder.dataset.secTitle = sec.title;
            rowHolder.dataset.gridTitle = it.title;
            rowHolder.dataset.rowLabel = row.label;
            rowHolder.innerHTML = `
              <input type="radio" name="${row.entryName}" value="已清點" class="grid-radio" data-opt="已清點">
              <input type="radio" name="${row.entryName}" value="有異常" class="grid-radio" data-opt="有異常">
              <input type="radio" name="${row.entryName}" value="出借" class="grid-radio" data-opt="出借">
            `;
            hiddenRowsContainer.appendChild(rowHolder);
          });
        }
      });
    });
    formEl.appendChild(hiddenRowsContainer);

    // 4. 置底：異常詳述與備註欄位
    const bottomCard = document.createElement('div');
    bottomCard.className = 'form-section-card rounded-2xl p-4 sm:p-5 space-y-3.5';
    bottomCard.innerHTML = `
      <div class="border-b border-slate-700/40 pb-2">
        <span class="font-bold text-sm text-slate-200 flex items-center gap-2">
          <i class="fas fa-file-pen text-amber-400"></i> 異常狀況說明與交接事項
        </span>
      </div>
    `;

    // 取得 Section 5 異常詳述與備註
    const sec5 = formConfig.sections[4];
    if (sec5 && sec5.items) {
      sec5.items.forEach(item => {
        if (item.type !== 'grid') {
          const itemWrap = document.createElement('div');
          itemWrap.className = 'form-item-wrapper space-y-1.5';
          itemWrap.appendChild(renderSingleField(item, formConfig));
          bottomCard.appendChild(itemWrap);
        }
      });
    }
    formEl.appendChild(bottomCard);
  }

  // 渲染無人機借出物品（下拉式選單 + 新增 0 個）
  function renderBorrowGridAsDropdowns(item) {
    const wrap = document.createElement('div');
    wrap.className = 'space-y-2';
    wrap.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <label class="block font-bold text-xs sm:text-sm text-slate-200">
          ${escapeHtml(item.title)} <span class="text-xs text-amber-400 font-normal">（可依需求調整借出數量）</span>
        </label>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${item.rows.map(row => `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <span class="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-1.5">
              <i class="fas fa-box-open text-slate-500 text-xs"></i>
              ${escapeHtml(row.label)}
            </span>
            <select name="${row.entryName}" class="borrow-item-select tactical-input w-24 py-1 px-2.5 text-xs font-bold bg-slate-900 border border-slate-700 rounded-lg cursor-pointer" data-row-label="${escapeHtml(row.label)}">
              <option value="0個" selected>0 個</option>
              <option value="1個">1 個</option>
              <option value="2個">2 個</option>
              <option value="3個">3 個</option>
              <option value="4個">4 個</option>
              <option value="5個">5 個</option>
              <option value="6個">6 個</option>
            </select>
          </div>
        `).join('')}
      </div>
    `;
    return wrap;
  }

  // 渲染標準網格項目
  function renderStandardGrid(item) {
    const wrap = document.createElement('div');
    wrap.className = 'space-y-2';
    wrap.innerHTML = `
      <div class="flex items-center justify-between mb-1">
        <label class="block font-semibold text-xs sm:text-sm text-slate-200">
          ${escapeHtml(item.title)}
        </label>
      </div>
      <div class="space-y-2">
        ${item.rows.map(row => `
          <div class="inventory-row flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/30 border border-slate-700/40" data-row-entry="${row.entryName}">
            <span class="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
              <i class="fas fa-cube text-slate-500 text-xs"></i>
              ${escapeHtml(row.label)}
              ${row.required ? '<span class="text-red-500">*</span>' : ''}
            </span>
            <div class="status-pill-group self-end sm:self-auto flex items-center gap-1">
              ${['已清點', '有異常', '出借'].map(opt => `
                <label class="status-pill-btn cursor-pointer px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1">
                  <input type="radio" name="${row.entryName}" value="${escapeHtml(opt)}" 
                    ${row.required && opt === '已清點' ? '' : ''} class="hidden grid-radio" data-opt="${opt}">
                  <span>${escapeHtml(opt)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    return wrap;
  }

  // 取得本地時區（臺灣時間）的今日年月日字串 (YYYY-MM-DD)，避免 UTC 轉換造成跨日或凌晨顯示為昨天的問題
  function getLocalTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 渲染單一輸入欄位 (包含下拉式時間、人員自訂、經緯度GPS定位按鈕等)
  function renderSingleField(item, formConfig) {
    const isReq = item.required;
    const reqTag = isReq ? '<span class="text-red-500 font-bold ml-1">*</span>' : '<span class="text-slate-500 text-xs font-normal ml-1">(選填)</span>';
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'space-y-1.5';

    // 1. 時間欄位：改為下拉式選單 (時:分)
    if (isTimeField(item)) {
      const now = new Date();
      const curH = String(now.getHours()).padStart(2, '0');
      const curM = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0');
      const initialTime = `${curH}:${curM}`;

      const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
      const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

      fieldContainer.innerHTML = `
        <label class="block text-xs sm:text-sm font-semibold text-slate-200">
          ${escapeHtml(item.title)} ${reqTag}
        </label>
        <div class="flex items-center gap-2 time-dropdown-group" data-entry-name="${item.entryName}">
          <input type="hidden" name="${item.entryName}" value="${initialTime}" class="time-combined-input" ${isReq ? 'required' : ''}>
          <div class="flex-1 flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 rounded-xl p-1.5">
            <span class="text-xs text-slate-400 pl-2 font-mono">時</span>
            <select class="time-hour-select bg-slate-800 text-slate-100 font-mono text-sm py-1 px-2 rounded-lg border-0 outline-none flex-1 cursor-pointer">
              ${hours.map(h => `<option value="${h}" ${h === curH ? 'selected' : ''}>${h} 點</option>`).join('')}
            </select>
            <span class="text-slate-500 font-bold">:</span>
            <span class="text-xs text-slate-400 font-mono">分</span>
            <select class="time-min-select bg-slate-800 text-slate-100 font-mono text-sm py-1 px-2 rounded-lg border-0 outline-none flex-1 cursor-pointer">
              ${minutes.map(m => `<option value="${m}" ${m === curM ? 'selected' : ''}>${m} 分</option>`).join('')}
            </select>
          </div>
        </div>
      `;
      return fieldContainer;
    }

    // 2. 人員選擇欄位：提供 + 自訂新增選項（自訂人員為當次填寫一次性，不予持久保留）
    if (isPersonField(item)) {
      const allMembers = [...item.options];
      const isCheckbox = item.type === 'checkbox';

      fieldContainer.innerHTML = `
        <div class="flex items-center justify-between">
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(item.title)} ${reqTag}
          </label>
          <button type="button" class="btn-add-custom-person text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition" data-entry-name="${item.entryName}" data-input-type="${item.type}">
            <i class="fas fa-user-plus text-[11px]"></i> 新增自訂人員
          </button>
        </div>
        <div class="flex flex-wrap gap-2 pt-1 person-chips-container" data-entry-name="${item.entryName}">
          ${allMembers.map(opt => `
            <label class="choice-chip group">
              <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="${item.entryName}" value="${escapeHtml(opt)}">
              <span class="w-3.5 h-3.5 ${isCheckbox ? 'rounded-md' : 'rounded-full'} border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                ${isCheckbox ? '<i class="fas fa-check text-[9px] text-transparent transition"></i>' : '<span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span>'}
              </span>
              <span>${escapeHtml(opt)}</span>
            </label>
          `).join('')}
        </div>
      `;
      return fieldContainer;
    }

    // 3. 日期欄位 (移除今日按鈕，精確預設為本地當下日期)
    if (item.type === 'date') {
      const todayStr = getLocalTodayDateString();
      fieldContainer.innerHTML = `
        <label class="block text-xs sm:text-sm font-semibold text-slate-200">
          ${escapeHtml(item.title)} ${reqTag}
        </label>
        <input type="date" name="${item.entryName}" value="${todayStr}" ${isReq ? 'required' : ''} 
          class="tactical-input font-mono text-sm">
      `;
      return fieldContainer;
    }

    // 4. 經緯度/座標欄位 (提供 📍 取得目前 GPS 按鈕)
    if (isCoordField(item)) {
      if (item.type === 'radio') {
        // 單選晶片 (如出勤地點經緯度) + 自訂經緯度輸入
        fieldContainer.innerHTML = `
          <div class="flex items-center justify-between">
            <label class="block text-xs sm:text-sm font-semibold text-slate-200">
              ${escapeHtml(item.title)} ${reqTag}
            </label>
            <button type="button" class="btn-get-gps text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition" data-target-entry="${item.entryName}">
              <i class="fas fa-location-crosshairs text-[11px]"></i> 📍 取得目前 GPS 座標
            </button>
          </div>
          <div class="flex flex-wrap gap-2 pt-1 coord-radio-container" data-entry-name="${item.entryName}">
            ${item.options.map(opt => `
              <label class="choice-chip group">
                <input type="radio" name="${item.entryName}" value="${escapeHtml(opt)}">
                <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                  <span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span>
                </span>
                <span>${escapeHtml(opt)}</span>
              </label>
            `).join('')}
            <div class="w-full flex items-center gap-2 mt-1">
              <input type="text" placeholder="自訂座標：例 24.1234, 120.6789 或點右側按鈕帶入" class="tactical-input flex-1 text-xs font-mono custom-coord-input" data-for-entry="${item.entryName}">
              <button type="button" class="btn-apply-custom-coord px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition whitespace-nowrap">
                帶入自訂
              </button>
            </div>
          </div>
        `;
      } else {
        // 純文字輸入框 + GPS 按鈕
        fieldContainer.innerHTML = `
          <div class="flex items-center justify-between">
            <label class="block text-xs sm:text-sm font-semibold text-slate-200">
              ${escapeHtml(item.title)} ${reqTag}
            </label>
            <button type="button" class="btn-get-gps text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition" data-target-entry="${item.entryName}">
              <i class="fas fa-location-crosshairs text-[11px]"></i> 📍 取得目前 GPS
            </button>
          </div>
          <div class="relative">
            <input type="text" name="${item.entryName}" ${isReq ? 'required' : ''}
              placeholder="例：24.0963, 120.6937 或點上方按鈕自動定位"
              class="tactical-input font-mono text-sm pr-10 coord-text-input">
          </div>
        `;
      }
      return fieldContainer;
    }

    // 4.5 借出表單：無人機機體 (增加一次性自訂選項)
    if (formConfig.id === 'borrow' && item.title.includes('無人機機體')) {
      fieldContainer.innerHTML = `
        <div class="flex items-center justify-between">
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(item.title)} ${reqTag}
          </label>
          <button type="button" class="btn-add-custom-drone text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition" data-entry-name="${item.entryName}">
            <i class="fas fa-plus text-[11px]"></i> 新增自訂機體
          </button>
        </div>
        <div class="flex flex-wrap gap-2 pt-1 drone-chips-container" data-entry-name="${item.entryName}">
          ${item.options.map(opt => `
            <label class="choice-chip group">
              <input type="checkbox" name="${item.entryName}" value="${escapeHtml(opt)}">
              <span class="w-3.5 h-3.5 rounded-md border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                <i class="fas fa-check text-[9px] text-transparent transition"></i>
              </span>
              <span>${escapeHtml(opt)}</span>
            </label>
          `).join('')}
          <div class="w-full flex items-center gap-2 mt-1">
            <input type="text" placeholder="自訂機體/序號：例 DJI Matrice 350 或其他機型" class="tactical-input flex-1 text-xs custom-drone-input" data-for-entry="${item.entryName}">
            <button type="button" class="btn-apply-custom-drone px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition whitespace-nowrap">
              帶入自訂
            </button>
          </div>
        </div>
      `;
      return fieldContainer;
    }

    // 5. 出勤地點欄位 (增加 + 自訂地點)
    if (formConfig.id === 'mission' && item.title.includes('出勤地點') && item.type === 'radio') {
      fieldContainer.innerHTML = `
        <div class="flex items-center justify-between">
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(item.title)} ${reqTag}
          </label>
        </div>
        <div class="flex flex-wrap gap-2 pt-1 mission-loc-container" data-entry-name="${item.entryName}">
          ${item.options.map(opt => `
            <label class="choice-chip group">
              <input type="radio" name="${item.entryName}" value="${escapeHtml(opt)}">
              <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                <span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span>
              </span>
              <span>${escapeHtml(opt)}</span>
            </label>
          `).join('')}
          <div class="w-full flex items-center gap-2 mt-1">
            <input type="text" placeholder="自訂地點：例 北屯區太原路三段123號" class="tactical-input flex-1 text-xs custom-location-input" data-for-entry="${item.entryName}">
            <button type="button" class="btn-apply-custom-loc px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition whitespace-nowrap">
              帶入自訂
            </button>
          </div>
        </div>
      `;
      return fieldContainer;
    }

    // 6. 其他常規項目 (textarea, select, radio, checkbox, text)
    let inputHtml = '';
    switch (item.type) {
      case 'textarea':
        inputHtml = `
          <textarea name="${item.entryName}" rows="3" ${isReq ? 'required' : ''} 
            placeholder="${escapeHtml(item.description || '請輸入詳細說明...')}"
            class="tactical-input text-xs sm:text-sm"></textarea>
        `;
        break;

      case 'select':
        inputHtml = `
          <select name="${item.entryName}" ${isReq ? 'required' : ''} class="tactical-input cursor-pointer text-xs sm:text-sm">
            <option value="">-- 請選擇項目 --</option>
            ${item.options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
          </select>
        `;
        break;

      case 'radio':
        inputHtml = `
          <div class="flex flex-wrap gap-2 pt-1">
            ${item.options.map(opt => `
              <label class="choice-chip group">
                <input type="radio" name="${item.entryName}" value="${escapeHtml(opt)}">
                <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                  <span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span>
                </span>
                <span>${escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;

      case 'checkbox':
        inputHtml = `
          <div class="flex flex-wrap gap-2 pt-1">
            ${item.options.map(opt => `
              <label class="choice-chip group">
                <input type="checkbox" name="${item.entryName}" value="${escapeHtml(opt)}">
                <span class="w-3.5 h-3.5 rounded-md border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                  <i class="fas fa-check text-[9px] text-transparent transition"></i>
                </span>
                <span>${escapeHtml(opt)}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;

      case 'text':
      default:
        let placeholder = escapeHtml(item.description || '請輸入...');
        inputHtml = `
          <input type="text" name="${item.entryName}" ${isReq ? 'required' : ''}
            placeholder="${placeholder}"
            class="tactical-input text-xs sm:text-sm">
        `;
        break;
    }

    fieldContainer.innerHTML = `
      <label class="block text-xs sm:text-sm font-semibold text-slate-200">
        ${escapeHtml(item.title)} ${reqTag}
      </label>
      ${item.description && item.type !== 'textarea' ? `<p class="text-xs text-slate-400">${escapeHtml(item.description)}</p>` : ''}
      ${inputHtml}
    `;
    return fieldContainer;
  }

  // 綁定表單動態元件行為
  function bindDynamicFormEvents(formEl, formConfig) {
    // 1. 晶片單選與多選點擊樣式連動
    formEl.querySelectorAll('.choice-chip input').forEach(input => {
      input.addEventListener('change', function () {
        if (this.type === 'radio') {
          // 單選：取消同群組其他晶片樣式
          formEl.querySelectorAll(`input[name="${this.name}"]`).forEach(sibling => {
            const chip = sibling.closest('.choice-chip');
            if (chip) {
              chip.classList.remove('active');
              const dot = chip.querySelector('.dot');
              if (dot) dot.classList.replace('bg-white', 'bg-transparent');
            }
          });
          const currentChip = this.closest('.choice-chip');
          if (currentChip) {
            currentChip.classList.add('active');
            const dot = currentChip.querySelector('.dot');
            if (dot) dot.classList.replace('bg-transparent', 'bg-white');
          }

          // 勤務表單專屬：點選地點自動帶入經緯度
          if (formConfig.id === 'mission' && this.name.includes('1591612449')) {
            syncCoordinatesByLocation(formEl, this.value);
          }
        } else if (this.type === 'checkbox') {
          // 多選：切換自己
          const chip = this.closest('.choice-chip');
          const checkIcon = chip.querySelector('i');
          if (this.checked) {
            chip.classList.add('active');
            if (checkIcon) checkIcon.classList.replace('text-transparent', 'text-white');
          } else {
            chip.classList.remove('active');
            if (checkIcon) checkIcon.classList.replace('text-white', 'text-transparent');
          }

          // 借出表單專屬：勾選任一無人機時自動帶入標配件（機體*1、遙控器*1、充電器*1、電池*3）
          if (formConfig.id === 'borrow' && this.name.includes('1253125050')) {
            handleDroneBorrowAutoFill(formEl);
          }
        }
      });
    });

    // 2. 時間下拉選單連動 (時、分更新至 hidden input)
    formEl.querySelectorAll('.time-dropdown-group').forEach(grp => {
      const hSel = grp.querySelector('.time-hour-select');
      const mSel = grp.querySelector('.time-min-select');
      const hiddenInput = grp.querySelector('.time-combined-input');

      function updateTime() {
        if (hSel && mSel && hiddenInput) {
          hiddenInput.value = `${hSel.value}:${mSel.value}`;
        }
      }

      if (hSel) hSel.addEventListener('change', updateTime);
      if (mSel) mSel.addEventListener('change', updateTime);
    });

    // 3. 經緯度 GPS 定位按鈕
    formEl.querySelectorAll('.btn-get-gps').forEach(btn => {
      btn.addEventListener('click', function () {
        const targetEntry = this.dataset.targetEntry;
        if (!navigator.geolocation) {
          showToast('⚠️ 瀏覽器不支援 GPS 定位功能', 'error');
          return;
        }

        showToast('📡 正在獲取當前精確 GPS 座標，請稍候...');
        navigator.geolocation.getCurrentPosition(
          pos => {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            const coordsStr = `${lat}, ${lng}`;

            // 若目標是純文字框
            const txtInput = formEl.querySelector(`input[name="${targetEntry}"].coord-text-input`);
            if (txtInput) {
              txtInput.value = coordsStr;
              showToast(`📍 已成功取得 GPS 座標：${coordsStr}`);
              return;
            }

            // 若目標是 radio 群組 (自訂經緯度)
            const customInput = formEl.querySelector(`.custom-coord-input[data-for-entry="${targetEntry}"]`);
            if (customInput) {
              customInput.value = coordsStr;
              applyCustomCoordinate(formEl, targetEntry, coordsStr);
            }
          },
          err => {
            console.warn(err);
            showToast('⚠️ 無法取得 GPS 定位，請檢查位置存取權限或手動輸入。', 'error');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    });

    // 4. 自訂經緯度套用按鈕
    formEl.querySelectorAll('.btn-apply-custom-coord').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('.custom-coord-input');
        if (input && input.value.trim()) {
          const entryName = input.dataset.forEntry;
          applyCustomCoordinate(formEl, entryName, input.value.trim());
        }
      });
    });

    // 5. 自訂地點套用按鈕
    formEl.querySelectorAll('.btn-apply-custom-loc').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('.custom-location-input');
        if (input && input.value.trim()) {
          const entryName = input.dataset.forEntry;
          applyCustomLocation(formEl, entryName, input.value.trim());
        }
      });
    });

    // 5.1 借出表單：自訂無人機機體按鈕與輸入框
    formEl.querySelectorAll('.btn-apply-custom-drone').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('.custom-drone-input');
        if (input && input.value.trim()) {
          const entryName = input.dataset.forEntry;
          applyCustomDrone(formEl, entryName, input.value.trim());
        }
      });
    });

    formEl.querySelectorAll('.btn-add-custom-drone').forEach(btn => {
      btn.addEventListener('click', function () {
        const entryName = this.dataset.entryName;
        const name = prompt('請輸入自訂無人機型號或序號（例：DJI Matrice 350）：');
        if (name && name.trim()) {
          applyCustomDrone(formEl, entryName, name.trim());
        }
      });
    });

    // 6. 新增自訂人員按鈕
    formEl.querySelectorAll('.btn-add-custom-person').forEach(btn => {
      btn.addEventListener('click', function () {
        const entryName = this.dataset.entryName;
        const inputType = this.dataset.inputType;
        const name = prompt('請輸入新增人員姓名（例：王大明）：');
        if (name && name.trim()) {
          addCustomPersonToForm(formEl, entryName, inputType, name.trim());
        }
      });
    });

    // 7. 每日清點分區卡片點選開啟彈窗
    if (formConfig.id === 'inventory') {
      formEl.querySelectorAll('.inv-grid-card').forEach(card => {
        card.addEventListener('click', function () {
          const secId = this.dataset.sectionId;
          openInventorySectionModal(secId, formEl);
        });
      });

      // 全表單一鍵全數已清點按鈕
      const btnMarkAll = formEl.querySelector('#btnMarkAllChecked');
      if (btnMarkAll) {
        btnMarkAll.addEventListener('click', () => {
          markAllInventoryItems(formEl, '已清點');
          showToast('⚡ 已將全表單 56 項裝備全數標記為「已清點」！');
        });
      }

      // 初始化各格卡片進度狀態
      updateAllInventoryBlockBadges(formEl);
    }

    // 8. 一般網格狀態按鈕 (已清點 / 有異常 / 出借)
    formEl.querySelectorAll('.status-pill-btn input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', function () {
        const group = this.closest('.status-pill-group');
        if (group) {
          group.querySelectorAll('.status-pill-btn').forEach(btn => btn.classList.remove('active', 'btn-normal', 'btn-abnormal', 'btn-borrow'));
        }
        const parentBtn = this.closest('.status-pill-btn');
        if (parentBtn) {
          if (this.dataset.opt === '已清點') {
            parentBtn.classList.add('active', 'btn-normal');
          } else if (this.dataset.opt === '有異常') {
            parentBtn.classList.add('active', 'btn-abnormal');
          } else if (this.dataset.opt === '出借') {
            parentBtn.classList.add('active', 'btn-borrow');
          }
        }
      });
    });
  }

  // 借用表單：勾選無人機時自動帶入標配件（機體*1、遙控器*1、充電器*1、電池*3）
  function handleDroneBorrowAutoFill(formEl) {
    const checkedDrones = formEl.querySelectorAll('input[name="entry.1253125050"]:checked');
    if (checkedDrones.length > 0) {
      // 找到機體、遙控器、充電器、電池
      const selects = formEl.querySelectorAll('.borrow-item-select');
      selects.forEach(sel => {
        const label = sel.dataset.rowLabel || '';
        if (label.includes('機體')) {
          sel.value = '1個';
        } else if (label.includes('遙控器')) {
          sel.value = '1個';
        } else if (label.includes('充電器')) {
          sel.value = '1個';
        } else if (label.includes('電池')) {
          sel.value = '3個';
        }
      });
      showToast('🚁 已自動為您帶入標配套件數量（機體*1、遙控器*1、充電器*1、電池*3）');
    }
  }

  // 套用自訂經緯度（當次有效，一次性使用，送出或切換表單後即清除）
  function applyCustomCoordinate(formEl, entryName, coordValue) {
    const container = formEl.querySelector(`.coord-radio-container[data-entry-name="${entryName}"]`);
    if (!container) return;

    // 檢查是否已有該自訂選項
    let chip = container.querySelector(`input[value="${coordValue}"]`);
    if (!chip) {
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-emerald-500/50 bg-emerald-500/10';
      label.setAttribute('data-is-custom', 'true');
      label.innerHTML = `
        <input type="radio" name="${entryName}" value="${escapeHtml(coordValue)}" checked>
        <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
          <span class="dot w-1.5 h-1.5 rounded-full bg-white transition"></span>
        </span>
        <span class="text-emerald-400 font-mono font-bold">${escapeHtml(coordValue)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400 text-xs px-1" title="移除此自訂座標">
          <i class="fas fa-times text-[10px]"></i>
        </button>
      `;
      container.insertBefore(label, container.querySelector('.custom-coord-input').parentElement);
      chip = label.querySelector('input');

      // 移除按鈕點擊
      const removeBtn = label.querySelector('.btn-remove-custom-chip');
      if (removeBtn) {
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          label.remove();
          showToast(`已移除自訂座標：${coordValue}`);
        });
      }

      // 綁定點擊事件
      chip.addEventListener('change', function () {
        formEl.querySelectorAll(`input[name="${this.name}"]`).forEach(sibling => {
          const c = sibling.closest('.choice-chip');
          if (c) {
            c.classList.remove('active');
            const d = c.querySelector('.dot');
            if (d) d.classList.replace('bg-white', 'bg-transparent');
          }
        });
        label.classList.add('active');
        const d = label.querySelector('.dot');
        if (d) d.classList.replace('bg-transparent', 'bg-white');
      });
    }

    chip.checked = true;
    chip.dispatchEvent(new Event('change', { bubbles: true }));

    // 清空輸入框
    const input = container.querySelector('.custom-coord-input');
    if (input) input.value = '';

    showToast(`📍 已選定自訂座標：${coordValue}（當次有效，送出後即清除）`);
  }

  // 套用自訂出勤地點（當次有效，一次性使用，送出或切換表單後即清除）
  function applyCustomLocation(formEl, entryName, locationValue) {
    const container = formEl.querySelector(`.mission-loc-container[data-entry-name="${entryName}"]`);
    if (!container) return;

    let chip = container.querySelector(`input[value="${locationValue}"]`);
    if (!chip) {
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-amber-500/50 bg-amber-500/10';
      label.setAttribute('data-is-custom', 'true');
      label.innerHTML = `
        <input type="radio" name="${entryName}" value="${escapeHtml(locationValue)}" checked>
        <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
          <span class="dot w-1.5 h-1.5 rounded-full bg-white transition"></span>
        </span>
        <span class="text-amber-400 font-bold">${escapeHtml(locationValue)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400 text-xs px-1" title="移除此自訂地點">
          <i class="fas fa-times text-[10px]"></i>
        </button>
      `;
      container.insertBefore(label, container.querySelector('.custom-location-input').parentElement);
      chip = label.querySelector('input');

      // 移除按鈕點擊
      const removeBtn = label.querySelector('.btn-remove-custom-chip');
      if (removeBtn) {
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          label.remove();
          showToast(`已移除自訂地點：${locationValue}`);
        });
      }

      // 綁定點擊事件
      chip.addEventListener('change', function () {
        formEl.querySelectorAll(`input[name="${this.name}"]`).forEach(sibling => {
          const c = sibling.closest('.choice-chip');
          if (c) {
            c.classList.remove('active');
            const d = c.querySelector('.dot');
            if (d) d.classList.replace('bg-white', 'bg-transparent');
          }
        });
        label.classList.add('active');
        const d = label.querySelector('.dot');
        if (d) d.classList.replace('bg-transparent', 'bg-white');
      });
    }

    chip.checked = true;
    chip.dispatchEvent(new Event('change', { bubbles: true }));

    // 清空輸入框
    const input = container.querySelector('.custom-location-input');
    if (input) input.value = '';

    showToast(`🏢 已選定自訂地點：${locationValue}（當次有效，送出後即清除）`);
  }

  // 套用自訂無人機機體（當次有效，一次性使用，送出或切換表單後即清除）
  function applyCustomDrone(formEl, entryName, droneValue) {
    const container = formEl.querySelector(`.drone-chips-container[data-entry-name="${entryName}"]`);
    if (!container) return;

    let chip = container.querySelector(`input[value="${droneValue}"]`);
    if (!chip) {
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-amber-500/50 bg-amber-500/10';
      label.setAttribute('data-is-custom', 'true');
      label.innerHTML = `
        <input type="checkbox" name="${entryName}" value="${escapeHtml(droneValue)}" checked>
        <span class="w-3.5 h-3.5 rounded-md border border-slate-500 mr-1.5 flex items-center justify-center transition">
          <i class="fas fa-check text-[9px] text-white transition"></i>
        </span>
        <span class="text-amber-300 font-bold">${escapeHtml(droneValue)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400 text-xs px-1" title="移除此自訂機體">
          <i class="fas fa-times text-[10px]"></i>
        </button>
      `;
      container.insertBefore(label, container.querySelector('.custom-drone-input').parentElement);
      chip = label.querySelector('input');

      // 移除按鈕點擊
      const removeBtn = label.querySelector('.btn-remove-custom-chip');
      if (removeBtn) {
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          label.remove();
          showToast(`已移除自訂機體：${droneValue}`);
        });
      }

      // 綁定點擊事件
      chip.addEventListener('change', function () {
        if (this.checked) {
          label.classList.add('active');
          label.querySelector('i')?.classList.replace('text-transparent', 'text-white');
        } else {
          label.classList.remove('active');
          label.querySelector('i')?.classList.replace('text-white', 'text-transparent');
        }
        handleDroneBorrowAutoFill(formEl);
      });
    }

    chip.checked = true;
    chip.dispatchEvent(new Event('change', { bubbles: true }));

    // 清空輸入框
    const input = container.querySelector('.custom-drone-input');
    if (input) input.value = '';

    // 自動帶入標配件（機體*1、遙控器*1、充電器*1、電池*3）
    handleDroneBorrowAutoFill(formEl);

    showToast(`🚁 已新增自訂機體：${droneValue}（當次有效，送出後即清除）`);
  }

  // 新增自訂人員（僅在當次填寫表單有效，一次性使用，送出或切換表單後即清除）
  function addCustomPersonToForm(formEl, entryName, inputType, name) {
    const container = formEl.querySelector(`.person-chips-container[data-entry-name="${entryName}"]`);
    if (!container) return;

    let chip = container.querySelector(`input[value="${name}"]`);
    if (!chip) {
      const isCheckbox = inputType === 'checkbox';
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-amber-500/50 bg-amber-500/10';
      label.setAttribute('data-is-custom', 'true');
      label.innerHTML = `
        <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="${entryName}" value="${escapeHtml(name)}" checked>
        <span class="w-3.5 h-3.5 ${isCheckbox ? 'rounded-md' : 'rounded-full'} border border-slate-500 mr-1.5 flex items-center justify-center transition">
          ${isCheckbox ? '<i class="fas fa-check text-[9px] text-white transition"></i>' : '<span class="dot w-1.5 h-1.5 rounded-full bg-white transition"></span>'}
        </span>
        <span class="text-amber-300 font-bold">${escapeHtml(name)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400 text-xs px-1" title="移除此自訂人員">
          <i class="fas fa-times text-[10px]"></i>
        </button>
      `;
      container.appendChild(label);
      chip = label.querySelector('input');

      // 移除按鈕點擊
      const removeBtn = label.querySelector('.btn-remove-custom-chip');
      if (removeBtn) {
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          label.remove();
          showToast(`已移除自訂人員：${name}`);
        });
      }

      // 綁定點擊事件
      chip.addEventListener('change', function () {
        if (this.type === 'radio') {
          formEl.querySelectorAll(`input[name="${this.name}"]`).forEach(sibling => {
            const c = sibling.closest('.choice-chip');
            if (c) {
              c.classList.remove('active');
              const d = c.querySelector('.dot');
              if (d) d.classList.replace('bg-white', 'bg-transparent');
            }
          });
          label.classList.add('active');
          const d = label.querySelector('.dot');
          if (d) d.classList.replace('bg-transparent', 'bg-white');
        } else {
          if (this.checked) {
            label.classList.add('active');
            label.querySelector('i')?.classList.replace('text-transparent', 'text-white');
          } else {
            label.classList.remove('active');
            label.querySelector('i')?.classList.replace('text-white', 'text-transparent');
          }
        }
      });
    }

    chip.checked = true;
    showToast(`👤 已新增並選取人員：${name}（當次有效，送出後即清除）`);
  }

  // 智慧連動：地點對應座標
  function syncCoordinatesByLocation(formEl, locationValue) {
    const coordMap = {
      '北區豬事圓滿公園': '240918.81,1204200.25 (諸事圓滿)',
      '梧棲區梧棲分隊': '241558.63,1203202.97 (梧棲分隊)',
      '大里區十九甲溜冰場': '240600.15,1204147.52 (十九甲溜冰場)',
      '大里區創宇飛訓中心': '24.0963, 120.6937 (創宇飛訓中心)'
    };

    const targetCoord = coordMap[locationValue];
    if (targetCoord) {
      const coordRadio = formEl.querySelector(`input[name="entry.1894204307"][value="${targetCoord}"]`);
      if (coordRadio) {
        coordRadio.checked = true;
        coordRadio.dispatchEvent(new Event('change', { bubbles: true }));
        showToast(`已自動連動帶入預設經緯度：${locationValue}`);
      }
    }
  }

  // ==========================================
  // 每日裝備清點：原生分區儀表板彈窗與狀態同步核心
  // ==========================================

  // 打開特定分區（辦公室、器材室、1樓室外停車格、地下室）詳細清點視窗
  function openInventorySectionModal(sectionId, formEl) {
    formEl = formEl || document.getElementById('active_form_inventory');
    if (!formEl) return;

    const blk = INVENTORY_SECTIONS.find(b => b.id === sectionId);
    if (!blk) return;

    state.activeInventoryBlock = blk;
    elements.secModalTitle.innerText = blk.title;
    elements.secModalSub.innerText = blk.desc;
    elements.secModalIcon.innerHTML = `<i class="${blk.icon}"></i>`;

    const formConfig = window.FORMS_DATA.forms.find(f => f.id === 'inventory');
    const targetSection = formConfig ? formConfig.sections.find(s => s.title === blk.sectionTitle) : null;
    if (!targetSection) return;

    // 依照原始方式：按次分類 (裝備器材箱(一)、裝備器材箱(二)、辦公室電腦桌、無線電櫃、賜典抽屜...) 逐一子區塊卡片渲染
    let html = '';
    const sectionRows = [];

    targetSection.items.forEach(it => {
      if (it.type === 'grid' && it.rows) {
        html += `
          <div class="sub-grid-box rounded-2xl p-3 sm:p-4 bg-slate-900/80 border border-slate-800 space-y-2.5 shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span class="text-xs sm:text-sm font-extrabold text-slate-200 flex items-center gap-2">
                <i class="fas fa-folder-open text-amber-400 text-xs"></i>
                ${escapeHtml(it.title)} <span class="text-red-500 font-bold">*</span>
              </span>
            </div>
            <div class="space-y-2">
              ${it.rows.map(row => {
                const targetRowEl = formEl.querySelector(`.inventory-data-row[data-row-entry="${row.entryName}"]`);
                if (targetRowEl) sectionRows.push(targetRowEl);
                const checkedInput = targetRowEl ? targetRowEl.querySelector('input:checked') : null;
                const currentVal = checkedInput ? checkedInput.value : '';

                return `
                  <div class="modal-inv-item-row flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40" data-row-entry="${row.entryName}">
                    <span class="text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-2">
                      <i class="fas fa-cube text-slate-500 text-xs"></i>
                      ${escapeHtml(row.label)}
                    </span>
                    <div class="flex items-center gap-1.5 self-end sm:self-auto">
                      ${['已清點', '有異常', '出借'].map(opt => `
                        <button type="button" class="btn-modal-opt px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-700/60 ${
                          currentVal === opt 
                            ? (opt === '已清點' ? 'bg-emerald-600 text-white shadow-md' : (opt === '有異常' ? 'bg-rose-600 text-white shadow-md' : 'bg-amber-600 text-white shadow-md'))
                            : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                        }" data-opt="${opt}">
                          ${opt === '已清點' ? '<i class="fas fa-check text-[10px]"></i>' : (opt === '有異常' ? '<i class="fas fa-triangle-exclamation text-[10px]"></i>' : '<i class="fas fa-handshake text-[10px]"></i>')}
                          ${opt}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
    });

    elements.secModalItemsList.innerHTML = html;

    // 綁定按鈕點擊更新
    elements.secModalItemsList.querySelectorAll('.btn-modal-opt').forEach(btn => {
      btn.addEventListener('click', function () {
        const rowWrap = this.closest('.modal-inv-item-row');
        const entryName = rowWrap.dataset.rowEntry;
        const opt = this.dataset.opt;

        // 更新底層 formEl 的 radio input
        const targetRadio = formEl.querySelector(`.inventory-data-row[data-row-entry="${entryName}"] input[value="${opt}"]`);
        if (targetRadio) {
          targetRadio.checked = true;
        }

        // 更新 Modal 上的樣式
        rowWrap.querySelectorAll('.btn-modal-opt').forEach(b => {
          b.className = 'btn-modal-opt px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-700/60 bg-slate-800/80 text-slate-400 hover:text-slate-200';
        });

        if (opt === '已清點') {
          this.className = 'btn-modal-opt px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-emerald-500 bg-emerald-600 text-white shadow-md';
        } else if (opt === '有異常') {
          this.className = 'btn-modal-opt px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-rose-500 bg-rose-600 text-white shadow-md';
        } else if (opt === '出借') {
          this.className = 'btn-modal-opt px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-amber-500 bg-amber-600 text-white shadow-md';
        }

        updateModalProgress(sectionRows);
        updateInventoryBlockBadge(blk, formEl);
      });
    });

    // 視窗內「⚡ 全數正常」按鈕
    elements.btnSecQuickAll.onclick = () => {
      sectionRows.forEach(r => {
        const radio = r.querySelector('input[value="已清點"]');
        if (radio) radio.checked = true;
      });
      openInventorySectionModal(sectionId, formEl);
      updateInventoryBlockBadge(blk, formEl);
      showToast(`⚡ 已將【${blk.title}】全數標記為已清點！`);
    };

    updateModalProgress(sectionRows);
    elements.inventorySectionModal.classList.remove('hidden');
    elements.inventorySectionModal.classList.add('flex');
  }

  // 更新 Modal 進度指示
  function updateModalProgress(matchedRows) {
    let checkedCount = 0;
    matchedRows.forEach(r => {
      if (r.querySelector('input:checked')) checkedCount++;
    });
    elements.secModalProgress.innerText = `已清點：${checkedCount} / ${matchedRows.length}`;
  }

  // 標記全表單已清點
  function markAllInventoryItems(formEl, opt = '已清點') {
    const radios = formEl.querySelectorAll(`.inventory-data-row input[value="${opt}"]`);
    radios.forEach(r => r.checked = true);
    updateAllInventoryBlockBadges(formEl);
  }

  // 更新單一卡片進度與徽章
  function updateInventoryBlockBadge(blk, formEl) {
    const card = formEl.querySelector(`.inv-grid-card[data-section-id="${blk.id}"]`);
    if (!card) return;

    const matched = formEl.querySelectorAll(`.inventory-data-row[data-sec-title="${blk.sectionTitle}"]`);

    let checkedCount = 0;
    let hasIssue = false;
    let hasBorrow = false;

    matched.forEach(r => {
      const checked = r.querySelector('input:checked');
      if (checked) {
        checkedCount++;
        if (checked.value === '有異常') hasIssue = true;
        if (checked.value === '出借') hasBorrow = true;
      }
    });

    const badge = card.querySelector('.blk-badge');
    const countSpan = card.querySelector('.blk-count');

    countSpan.innerText = `${checkedCount} / ${matched.length}`;
    card.classList.remove('all-checked', 'has-issue', 'has-borrow');

    if (hasIssue) {
      card.classList.add('has-issue');
      badge.className = 'blk-badge px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white shadow-sm';
      badge.innerText = '有異常 ⚠️';
    } else if (hasBorrow) {
      card.classList.add('has-borrow');
      badge.className = 'blk-badge px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-600 text-white shadow-sm';
      badge.innerText = '有出借 🟡';
    } else if (checkedCount === matched.length && matched.length > 0) {
      card.classList.add('all-checked');
      badge.className = 'blk-badge px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-600 text-white shadow-sm';
      badge.innerText = '已完成 ✅';
    } else {
      badge.className = 'blk-badge px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700';
      badge.innerText = `${checkedCount}/${matched.length} 待驗`;
    }

    updateGlobalInventoryCount(formEl);
  }

  // 更新所有 4 格分區卡片狀態
  function updateAllInventoryBlockBadges(formEl) {
    INVENTORY_SECTIONS.forEach(blk => updateInventoryBlockBadge(blk, formEl));
  }

  // 更新全域已清點進度數字
  function updateGlobalInventoryCount(formEl) {
    const globalSpan = formEl.querySelector('#invGlobalCountBadge');
    if (!globalSpan) return;
    const total = formEl.querySelectorAll('.inventory-data-row').length;
    let done = 0;
    formEl.querySelectorAll('.inventory-data-row').forEach(r => {
      if (r.querySelector('input:checked')) done++;
    });
    globalSpan.innerText = `總進度：${done} / ${total} 已清點`;
  }

  // ==========================================
  // 表單驗證、確認視窗與提交發送核心
  // ==========================================

  // 點擊「確認送出至 Google 雲端後台」處理
  function handleFormSubmit() {
    const activeForm = document.getElementById(`active_form_${state.currentFormId}`);
    if (!activeForm) return;

    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
    if (!formConfig) return;

    // 嚴格檢查必填項目
    let firstInvalid = null;
    let missingName = '';

    // 若是每日清點，確保各區塊裝備均有清點
    if (formConfig.id === 'inventory') {
      const unCheckedRows = activeForm.querySelectorAll('.inventory-data-row:not(:has(input:checked))');
      if (unCheckedRows.length > 0) {
        const firstUnchecked = unCheckedRows[0];
        missingName = `裝備【${firstUnchecked.dataset.rowLabel}】尚未清點（可點擊「一鍵全數已清點」快速填寫）`;
        showToast(`⚠️ ${missingName}`, 'error');
        return;
      }
    }

    for (const section of formConfig.sections) {
      for (const item of section.items) {
        if (item.type === 'grid') {
          for (const row of item.rows) {
            if (row.required) {
              const checked = activeForm.querySelector(`input[name="${row.entryName}"]:checked`);
              if (!checked) {
                firstInvalid = activeForm.querySelector(`[data-row-entry="${row.entryName}"]`) || activeForm;
                missingName = row.label;
                break;
              }
            }
          }
        } else if (item.required) {
          if (item.type === 'radio' || item.type === 'checkbox') {
            const checked = activeForm.querySelector(`input[name="${item.entryName}"]:checked`);
            if (!checked) {
              firstInvalid = activeForm.querySelector(`input[name="${item.entryName}"]`)?.closest('.form-item-wrapper') || activeForm;
              missingName = item.title;
              break;
            }
          } else {
            const input = activeForm.querySelector(`[name="${item.entryName}"]`);
            if (!input || !input.value.trim()) {
              firstInvalid = input || activeForm;
              missingName = item.title;
              break;
            }
          }
        }
        if (firstInvalid) break;
      }
      if (firstInvalid) break;
    }

    if (firstInvalid) {
      if (typeof firstInvalid.focus === 'function') firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(`⚠️ 請填寫／選取必填欄位：${missingName.replace('*', '').trim()}`, 'error');
      return;
    }

    // 驗證通過 -> 彈出確認對話框！
    showConfirmModal(activeForm, formConfig);
  }

  // 彈出送出確認視窗 (Confirm Modal)
  function showConfirmModal(activeForm, formConfig) {
    const formData = new FormData(activeForm);
    const summaryItems = [];

    // 擷取關鍵摘要展示給使用者確認
    if (formConfig.id === 'borrow') {
      summaryItems.push({ label: '表單類型', val: formConfig.title });
      summaryItems.push({ label: '申請日期', val: formData.get('entry.1541598213') || '今日' });
      summaryItems.push({ label: '借用人／單位', val: formData.get('entry.1276211814') });
      summaryItems.push({ label: '借用事由', val: formData.get('entry.682423378') });
      summaryItems.push({ label: '借用機型', val: formData.getAll('entry.1253125050').join(', ') || '無' });
    } else if (formConfig.id === 'inventory') {
      summaryItems.push({ label: '表單類型', val: formConfig.title });
      summaryItems.push({ label: '清點日期', val: formData.get('entry.358359977') });
      summaryItems.push({ label: '清點人員', val: formData.get('entry.758490419') });
      summaryItems.push({ label: '裝備清點項數', val: '56 項裝備已全數核對完成' });
    } else if (formConfig.id === 'mission') {
      summaryItems.push({ label: '表單類型', val: formConfig.title });
      summaryItems.push({ label: '出勤日期', val: formData.get('entry.1209667024') });
      summaryItems.push({ label: '出勤單號', val: formData.get('entry.316344842') });
      summaryItems.push({ label: '出勤時間', val: `${formData.get('entry.649405272')} ~ ${formData.get('entry.2035663237')}` });
      summaryItems.push({ label: '出勤地點', val: formData.get('entry.1591612449') });
      summaryItems.push({ label: '出勤人員', val: formData.getAll('entry.1732585170').join(', ') });
      summaryItems.push({ label: '機型', val: formData.getAll('entry.1085168777').join(', ') });
    } else if (formConfig.id === 'maintenance') {
      summaryItems.push({ label: '表單類型', val: formConfig.title });
      summaryItems.push({ label: '保養日期', val: formData.get('entry.1343208040') });
      summaryItems.push({ label: '填寫人', val: formData.getAll('entry.961194117').join(', ') });
      summaryItems.push({ label: '保養目的', val: formData.get('entry.327754613') });
      summaryItems.push({ label: '保養裝備', val: formData.getAll('entry.2004663302').join(', ') });
    } else if (formConfig.id === 'accident') {
      summaryItems.push({ label: '表單類型', val: formConfig.title });
      summaryItems.push({ label: '發生日期', val: formData.get('entry.727427685') });
      summaryItems.push({ label: '通報人/操作人', val: `${formData.getAll('entry.110497403').join(', ')} / ${formData.getAll('entry.1018051514').join(', ')}` });
      summaryItems.push({ label: '起飛/發生時間', val: `${formData.get('entry.193545756')} / ${formData.get('entry.146249523')}` });
      summaryItems.push({ label: '傷亡狀態', val: formData.get('entry.190411791') === '是' ? '⚠️ 有人員傷亡' : '無人員傷亡' });
    }

    elements.confirmSummaryContent.innerHTML = `
      <div class="space-y-2">
        ${summaryItems.map(it => `
          <div class="flex justify-between items-start gap-2 border-b border-slate-800 pb-1.5">
            <span class="text-slate-400 font-medium whitespace-nowrap">${escapeHtml(it.label)}：</span>
            <span class="text-slate-100 font-bold text-right break-all">${escapeHtml(it.val || '未填寫')}</span>
          </div>
        `).join('')}
      </div>
      <div class="mt-3 p-2.5 rounded-xl bg-red-950/30 border border-red-500/20 text-[11px] text-red-300 flex items-center gap-2">
        <i class="fas fa-info-circle text-red-400"></i>
        <span>確認內容無誤後，請點選「確認送出」送出表單。</span>
      </div>
    `;

    elements.confirmModal.classList.remove('hidden');
    elements.confirmModal.classList.add('flex');
  }

  // 確定送出資料至 Google Forms (由 Confirm Modal 觸發)
  async function executeFormSubmit() {
    elements.confirmModal.classList.add('hidden');
    elements.confirmModal.classList.remove('flex');

    const activeForm = document.getElementById(`active_form_${state.currentFormId}`);
    if (!activeForm) return;

    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
    if (!formConfig) return;

    // 收集表單資料
    const formData = new FormData(activeForm);
    const summaryData = {};
    for (const [key, value] of formData.entries()) {
      if (summaryData[key]) {
        summaryData[key] += `, ${value}`;
      } else {
        summaryData[key] = value;
      }
    }

    // 顯示載入遮罩
    elements.loadingOverlay.classList.remove('hidden');
    elements.loadingOverlay.classList.add('flex');

    try {
      // 構建 URL-encoded body
      const bodyParts = [];
      for (const [key, value] of formData.entries()) {
        // 針對借用表單借出物品：若為 0 個則不發送，避免觸發 Google Form 拒收
        if (formConfig.id === 'borrow' && value === '0個') {
          continue;
        }
        bodyParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      }
      const urlEncodedBody = bodyParts.join('&');

      await fetch(formConfig.actionUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlEncodedBody
      });

      // 寫入本機歷史紀錄
      const record = {
        id: Date.now(),
        formId: formConfig.id,
        formTitle: formConfig.title,
        timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
        summary: summaryData
      };
      state.history.unshift(record);
      localStorage.setItem('uav_history', JSON.stringify(state.history.slice(0, 30)));

      // 送出表單後，立即清除當次表單的所有填寫內容與一次性自訂項目（人員、地點、座標等）
      resetAndPrepareNextForm();

      // 800ms 後顯示成功視窗
      setTimeout(() => {
        elements.loadingOverlay.classList.add('hidden');
        elements.loadingOverlay.classList.remove('flex');
        showSuccessModal(record);
      }, 850);

    } catch (err) {
      console.error(err);
      elements.loadingOverlay.classList.add('hidden');
      elements.loadingOverlay.classList.remove('flex');
      showToast('⚠️ 提交發生錯誤，請重試或前往官方表單。', 'error');
    }
  }

  // 重設並準備全新表單（清除一次性自訂人員、地點及座標等）
  function resetAndPrepareNextForm() {
    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
    if (formConfig) renderFormFields(formConfig);
  }

  // 成功彈窗展示
  function showSuccessModal(record) {
    elements.successModal.classList.remove('hidden');
    elements.successModal.classList.add('flex');

    elements.successSummaryContent.innerHTML = `
      <div class="space-y-2 text-xs sm:text-sm text-slate-300">
        <div class="flex justify-between border-b border-slate-700/50 pb-1.5">
          <span class="text-slate-400">表單名稱：</span>
          <span class="font-bold text-slate-100">${escapeHtml(record.formTitle)}</span>
        </div>
        <div class="flex justify-between border-b border-slate-700/50 pb-1.5">
          <span class="text-slate-400">提交時間：</span>
          <span class="font-mono text-emerald-400 font-bold">${escapeHtml(record.timestamp)}</span>
        </div>
        <div class="mt-3 text-slate-400 text-xs">填寫內容已同步直傳 Google Forms 後台試算表。</div>
      </div>
    `;
  }

  // 歷史紀錄抽屜
  function openHistoryDrawer() {
    elements.historyModal.classList.remove('hidden');
    elements.historyModal.classList.add('flex');

    if (state.history.length === 0) {
      elements.historyList.innerHTML = `
        <div class="text-center py-12 text-slate-500">
          <i class="fas fa-inbox text-4xl mb-3 opacity-40"></i>
          <p class="text-sm">尚未有任何提交紀錄</p>
        </div>
      `;
      return;
    }

    elements.historyList.innerHTML = state.history.map(item => `
      <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm text-slate-200">${escapeHtml(item.formTitle)}</span>
          <span class="text-xs text-slate-400 font-mono">${escapeHtml(item.timestamp)}</span>
        </div>
        <div class="text-xs text-slate-400 flex items-center gap-1">
          <i class="fas fa-circle-check text-emerald-400 text-[10px]"></i> 已成功同步送出至 Google 試算表後台
        </div>
      </div>
    `).join('');
  }

  // 提示訊息浮窗 (Toast)
  let toastTimer = null;
  function showToast(msg, type = 'success') {
    clearTimeout(toastTimer);
    elements.toastMsg.innerText = msg;
    elements.toast.classList.remove('hidden', 'translate-y-10', 'opacity-0');
    elements.toast.classList.add('translate-y-0', 'opacity-100');

    toastTimer = setTimeout(() => {
      elements.toast.classList.add('translate-y-10', 'opacity-0');
      setTimeout(() => elements.toast.classList.add('hidden'), 300);
    }, 3200);
  }

  // 事件監聽綁定
  function setupEventListeners() {
    // 導覽切換
    elements.tabNavContainer.addEventListener('click', e => {
      const btn = e.target.closest('.form-tab-btn');
      if (btn && btn.dataset.formId) switchForm(btn.dataset.formId);
    });

    elements.mobileNavContainer.addEventListener('click', e => {
      const btn = e.target.closest('.mobile-nav-btn');
      if (btn && btn.dataset.formId) switchForm(btn.dataset.formId);
    });

    // 主題切換
    elements.themeToggleBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    // 歷史紀錄按鈕
    elements.historyDrawerBtn.addEventListener('click', openHistoryDrawer);
    elements.historyCloseBtn.addEventListener('click', () => {
      elements.historyModal.classList.add('hidden');
      elements.historyModal.classList.remove('flex');
    });

    // 點擊送出按鈕 (觸發驗證與確認彈窗)
    elements.submitBtn.addEventListener('click', handleFormSubmit);

    // 確認視窗按鈕
    elements.confirmCancelBtn.addEventListener('click', () => {
      elements.confirmModal.classList.add('hidden');
      elements.confirmModal.classList.remove('flex');
    });
    elements.confirmSubmitBtn.addEventListener('click', executeFormSubmit);

    // 每日清點區塊視窗關閉與完成
    elements.secModalCloseBtn.addEventListener('click', () => {
      elements.inventorySectionModal.classList.add('hidden');
      elements.inventorySectionModal.classList.remove('flex');
    });
    elements.secModalDoneBtn.addEventListener('click', () => {
      elements.inventorySectionModal.classList.add('hidden');
      elements.inventorySectionModal.classList.remove('flex');
    });

    // 點擊背景遮罩關閉視窗
    [elements.inventorySectionModal, elements.confirmModal, elements.historyModal, elements.successModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', e => {
          if (e.target === modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            if (modal === elements.successModal) {
              resetAndPrepareNextForm();
            }
          }
        });
      }
    });

    // 成功視窗按鈕關閉與下一筆（清除一次性自訂人員及地點）
    elements.successModalClose.addEventListener('click', () => {
      elements.successModal.classList.add('hidden');
      elements.successModal.classList.remove('flex');
      resetAndPrepareNextForm();
    });

    elements.successNextBtn.addEventListener('click', () => {
      elements.successModal.classList.add('hidden');
      elements.successModal.classList.remove('flex');
      resetAndPrepareNextForm();
      showToast('已重設為全新表單，可繼續填寫下一筆！');
    });
  }

  // 工具函式：避免 XSS
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 啟動程式
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
