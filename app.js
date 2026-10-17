/**
 * 臺中市政府消防局 特搜大隊特搜空拍隊 - 勤務表單整合系統
 * 核心應用程式邏輯 (App Controller) - 功能升級版
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
    toastMsg: document.getElementById('toastMsg'),

    // 後台數據檢視與密碼驗證 DOM 元素
    dashboardDrawerBtn: document.getElementById('dashboardDrawerBtn'),
    dashboardModal: document.getElementById('dashboardModal'),
    dashboardCloseBtn: document.getElementById('dashboardCloseBtn'),
    dashboardIframe: document.getElementById('dashboardIframe'),
    dashboardExternalLink: document.getElementById('dashboardExternalLink'),
    dashboardPasswordModal: document.getElementById('dashboardPasswordModal'),
    dashboardPasswordInput: document.getElementById('dashboardPasswordInput'),
    passwordSubmitBtn: document.getElementById('passwordSubmitBtn'),
    passwordCancelBtn: document.getElementById('passwordCancelBtn'),
    passwordErrorMsg: document.getElementById('passwordErrorMsg'),
    togglePasswordBtn: document.getElementById('togglePasswordBtn'),
    eyeIcon: document.getElementById('eyeIcon')
  };

  function lockBackgroundScroll() {
    document.body.style.overflow = 'hidden';
  }

  function unlockBackgroundScroll() {
    document.body.style.overflow = '';
  }

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

const CORRECT_PASSWORD = "119";
  const FORM_SHEET_URLS = [
    "https://docs.google.com/spreadsheets/d/1DpjFpJAVtQigJ6XZbysgRk-2_IiJ6pg9gghHU0EEDc8/edit?gid=1596896565#gid=1596896565", // 1. 裝備借用紀錄表單後台
    "https://docs.google.com/spreadsheets/d/1yr7Hys_fOuIFiv9mFWv5aMQmRJCo--V4DxivFqL3w0g/edit?gid=954761733#gid=954761733", // 2. 裝備定期清點表單後台
    "https://docs.google.com/spreadsheets/d/19KvBej7HR-SqoioTEr0aYHtGqOcfQHwa80IyNeDOVN8/edit?gid=1616503093#gid=1616503093", // 3. 裝備維修保養表單後台
    "https://docs.google.com/spreadsheets/d/1LLUgXskiF_3_As-tqY8imIxMp4wds-qHb_iVON_n22Y/edit?gid=1239965635#gid=1239965635", // 4. 勤務出擊表單後台
    "https://docs.google.com/spreadsheets/d/1vCO06rznPp71fDVohPvijUEXuWYPjj7VECbimVx1fZo/edit?gid=1312914898#gid=1312914898"   // 5. 飛安通報/事故報告表單後台
  ];

  function init() {
    localStorage.removeItem('uav_custom_members');
    localStorage.removeItem('uav_custom_locations');
    localStorage.removeItem('uav_custom_coords');
    localStorage.removeItem('uav_custom_drones');
    applyTheme(state.theme);
    renderNavigation();
    switchForm(state.currentFormId);
    setupEventListeners();
    setupDashboardSecurity();
  }

  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('uav_theme', theme);
    if (theme === 'dark') {
      document.body.classList.remove('tactical-light');
      document.body.classList.add('tactical-dark');
      if (elements.themeToggleBtn) elements.themeToggleBtn.innerHTML = '<i class="fas fa-moon text-amber-400"></i>';
    } else {
      document.body.classList.remove('tactical-dark');
      document.body.classList.add('tactical-light');
      if (elements.themeToggleBtn) elements.themeToggleBtn.innerHTML = '<i class="fas fa-sun text-amber-500"></i>';
    }
  }

  function renderNavigation() {
    if (!window.FORMS_DATA || !window.FORMS_DATA.forms) return;
    const forms = window.FORMS_DATA.forms;

    elements.tabNavContainer.innerHTML = forms.map(f => `
      <button type="button" data-form-id="${f.id}" 
        class="form-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap
        ${f.id === state.currentFormId ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 font-bold' : 'hover:bg-slate-700/40 text-slate-400 hover:text-slate-100'}">
        <i class="${f.icon}"></i>
        <span>${f.badge}</span>
      </button>
    `).join('');

    elements.mobileNavContainer.innerHTML = forms.map(f => `
      <button type="button" data-form-id="${f.id}"
        class="mobile-nav-btn flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors
        ${f.id === state.currentFormId ? 'text-red-500 font-black' : 'text-slate-400'}">
        <i class="${f.icon} text-base mb-0.5"></i>
        <span class="scale-90 font-medium">${f.badge}</span>
      </button>
    `).join('');
  }

  function switchForm(formId) {
    const forms = window.FORMS_DATA.forms;
    const formConfig = forms.find(f => f.id === formId);
    if (!formConfig) return;

    state.currentFormId = formId;
    window.currentFormIndex = forms.findIndex(f => f.id === formId);

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

    if (elements.formBadge) elements.formBadge.innerText = formConfig.badge;
    if (elements.formOfficialLink) elements.formOfficialLink.href = formConfig.viewUrl;

    renderFormFields(formConfig);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function isTimeField(item) {
    if (item.type === 'time') return true;
    const t = item.title || '';
    return t.includes('時:分') || t.includes('時間') && (t.includes('出勤') || t.includes('返隊') || t.includes('起飛') || t.includes('發生'));
  }

  function isPersonField(item) {
    const t = item.title || '';
    if (t.includes('傷亡')) return false;
    return (item.type === 'radio' || item.type === 'checkbox') && (
      t.includes('清點人員') || t.includes('出勤人員') || t.includes('通報人') || 
      t.includes('操作人') || t.includes('填寫人') || t.includes('出借點收人') || t.includes('點收人')
    );
  }

  function isTaskField(item) {
    const t = item.title || '';
    return (item.type === 'radio' || item.type === 'checkbox') && (t.includes('任務內容') || t.includes('勤務內容') || t.includes('勤務類型'));
  }

  function isCoordField(item) {
    const t = item.title || '';
    return t.includes('經緯度') || t.includes('座標');
  }

  function isPathField(item) {
    const t = item.title || '';
    return (item.type === 'radio' || item.type === 'checkbox') && (t.includes('檔案儲存路徑') || t.includes('儲存路徑'));
  }

  function isDroneField(item) {
    const t = item.title || '';
    return (item.type === 'radio' || item.type === 'checkbox') && (t.includes('無人機資料') || t.includes('無人機機體'));
  }

  function renderFormFields(formConfig) {
    const container = elements.formRenderArea;
    container.innerHTML = '';

    const formEl = document.createElement('form');
    formEl.id = `active_form_${formConfig.id}`;
    formEl.action = formConfig.actionUrl;
    formEl.method = 'POST';
    formEl.target = 'gform_sink_iframe';
    formEl.className = 'space-y-4';

    if (formConfig.id === 'inventory') {
      const phInput = document.createElement('input');
      phInput.type = 'hidden';
      phInput.name = 'pageHistory';
      phInput.value = '0,1,2,3,4';
      formEl.appendChild(phInput);
    }

    if (formConfig.id === 'accident') {
      const phInput = document.createElement('input');
      phInput.type = 'hidden';
      phInput.name = 'pageHistory';
      phInput.value = '0,1';
      formEl.appendChild(phInput);
    }

    const fvvInput = document.createElement('input');
    fvvInput.type = 'hidden';
    fvvInput.name = 'fvv';
    fvvInput.value = '1';
    formEl.appendChild(fvvInput);

    if (formConfig.id === 'inventory') {
      renderInventorySpecialLayout(formEl, formConfig);
    } else {
      renderStandardLayout(formEl, formConfig);
    }

    container.appendChild(formEl);
    bindDynamicFormEvents(formEl, formConfig);
  }

  function renderStandardLayout(formEl, formConfig) {
    formConfig.sections.forEach((section, sIndex) => {
      const secCard = document.createElement('div');
      secCard.className = 'form-section-card rounded-2xl p-4 sm:p-5 space-y-4';

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

      section.items.forEach(item => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'form-item-wrapper space-y-1.5';

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

  function renderInventorySpecialLayout(formEl, formConfig) {
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
          <div class="inv-grid-card glass-panel rounded-2xl p-3 sm:p-4 border border-slate-700/60 bg-gradient-to-br ${blk.color} relative overflow-hidden flex flex-col justify-between cursor-pointer"
               data-section-id="${blk.id}">
            <div class="flex items-start justify-between">
              <div class="w-9 h-9 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center text-lg">
                <i class="${blk.icon}"></i>
              </div>
              <span class="blk-badge px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">待清點</span>
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

    const hiddenRowsContainer = document.createElement('div');
    hiddenRowsContainer.id = 'invAllRowsContainer';
    hiddenRowsContainer.className = 'hidden';

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
              <input type="radio" name="${row.entryName}" value="正常" class="grid-radio">
              <input type="radio" name="${row.entryName}" value="異常" class="grid-radio">
            `;
            hiddenRowsContainer.appendChild(rowHolder);
          });
        }
      });
    });
    formEl.appendChild(hiddenRowsContainer);

    const bottomCard = document.createElement('div');
    bottomCard.className = 'form-section-card rounded-2xl p-4 sm:p-5 space-y-3.5';
    bottomCard.innerHTML = `
      <div class="border-b border-slate-700/40 pb-2">
        <span class="font-bold text-sm text-slate-200 flex items-center gap-2">
          <i class="fas fa-file-pen text-amber-400"></i> 異常狀況說明與交接事項
        </span>
      </div>
    `;

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
              ${['正常', '異常'].map(opt => `
                <label class="status-pill-btn cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700">
                  <input type="radio" name="${row.entryName}" value="${escapeHtml(opt)}" class="hidden grid-radio" data-opt="${opt}">
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

  function getLocalTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function renderSingleField(item, formConfig) {
    const isReq = item.required;
    const reqTag = isReq ? '<span class="text-red-500 font-bold ml-1">*</span>' : '<span class="text-slate-500 text-xs font-normal ml-1">(選填)</span>';
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'space-y-1.5';

    // 1. 時間欄位
    if (isTimeField(item)) {
      const now = new Date();
      const curH = String(now.getHours()).padStart(2, '0');
      const curM = String(now.getMinutes()).padStart(2, '0');
      const initialTime = `${curH}:${curM}`;

      const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
      const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

      fieldContainer.innerHTML = `
        <label class="block text-xs sm:text-sm font-semibold text-slate-200">
          ${escapeHtml(item.title)} ${reqTag}
        </label>
        <div class="flex items-center gap-2 time-dropdown-group" data-entry-name="${item.entryName}">
          <input type="hidden" name="${item.entryName}" value="${initialTime}" class="time-combined-input" ${isReq ? 'required' : ''}>
          <div class="flex-1 flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 rounded-xl p-2">
            <select class="time-hour-select bg-slate-800 text-slate-100 font-mono text-sm py-1 px-2 rounded-lg border-0 outline-none flex-1 cursor-pointer">
              ${hours.map(h => `<option value="${h}" ${h === curH ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
            <span class="text-xs text-slate-400 font-bold">時</span>
            <span class="text-slate-600">:</span>
            <select class="time-min-select bg-slate-800 text-slate-100 font-mono text-sm py-1 px-2 rounded-lg border-0 outline-none flex-1 cursor-pointer">
              ${minutes.map(m => `<option value="${m}" ${m === curM ? 'selected' : ''}>${m}</option>`).join('')}
            </select>
            <span class="text-xs text-slate-400 font-bold pr-1">分</span>
          </div>
        </div>
      `;
      return fieldContainer;
    }

    // 2. 人員選擇欄位
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

    // 3. 任務內容／勤務類型欄位
    if (isTaskField(item)) {
      const allTasks = [...item.options];
      if (!allTasks.includes('演習')) {
        allTasks.push('演習');
      }
      const isCheckbox = item.type === 'checkbox';

      fieldContainer.innerHTML = `
        <div class="flex items-center justify-between">
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(item.title)} ${reqTag}
          </label>
          <button type="button" class="btn-add-custom-task text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition" data-entry-name="${item.entryName}" data-input-type="${item.type}">
            <i class="fas fa-plus-circle text-[11px]"></i> 新增自訂選項
          </button>
        </div>
        <div class="flex flex-wrap gap-2 pt-1 task-chips-container" data-entry-name="${item.entryName}">
          ${allTasks.map(opt => `
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

    // 4. 檔案儲存路徑欄位
    if (isPathField(item)) {
      const allPaths = [...item.options];
      const isCheckbox = item.type === 'checkbox';

      fieldContainer.innerHTML = `
        <div class="flex items-center justify-between">
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(item.title)} ${reqTag}
          </label>
          <button type="button" class="btn-add-custom-path text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition" data-entry-name="${item.entryName}" data-input-type="${item.type}">
            <i class="fas fa-folder-plus text-[11px]"></i> 新增自訂路徑
          </button>
        </div>
        <div class="flex flex-wrap gap-2 pt-1 path-chips-container" data-entry-name="${item.entryName}">
          ${allPaths.map(opt => `
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

    // 5. 無人機資料欄位（飛安通報事故報告專用）
    if (isDroneField(item) && formConfig.id === 'accident') {
      const allDrones = [...item.options];
      const isCheckbox = item.type === 'checkbox';

      fieldContainer.innerHTML = `
        <div class="flex items-center justify-between">
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(item.title)} ${reqTag}
          </label>
          <button type="button" class="btn-add-custom-drone-accident text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition" data-entry-name="${item.entryName}" data-input-type="${item.type}">
            <i class="fas fa-plus text-[11px]"></i> 新增自訂選項
          </button>
        </div>
        <div class="flex flex-wrap gap-2 pt-1 drone-accident-chips-container" data-entry-name="${item.entryName}">
          ${allDrones.map(opt => `
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

    if (item.type === 'date') {
      const todayStr = getLocalTodayDateString();
      fieldContainer.innerHTML = `
        <label class="block text-xs sm:text-sm font-semibold text-slate-200">
          ${escapeHtml(item.title)} ${reqTag}
        </label>
        <input type="date" name="${item.entryName}" value="${todayStr}" ${isReq ? 'required' : ''} class="tactical-input font-mono text-sm">
      `;
      return fieldContainer;
    }

    if (isCoordField(item)) {
      if (item.type === 'radio') {
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
              <input type="text" placeholder="自訂座標..." class="tactical-input flex-1 text-xs font-mono custom-coord-input" data-for-entry="${item.entryName}">
              <button type="button" class="btn-apply-custom-coord px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition whitespace-nowrap">帶入自訂</button>
            </div>
          </div>
        `;
      } else {
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
            <input type="text" name="${item.entryName}" ${isReq ? 'required' : ''} placeholder="例：24.0963, 120.6937" class="tactical-input font-mono text-sm pr-10 coord-text-input">
          </div>
        `;
      }
      return fieldContainer;
    }

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
            <input type="text" placeholder="自訂機體..." class="tactical-input flex-1 text-xs custom-drone-input" data-for-entry="${item.entryName}">
            <button type="button" class="btn-apply-custom-drone px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition whitespace-nowrap">帶入自訂</button>
          </div>
        </div>
      `;
      return fieldContainer;
    }

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
            <input type="text" placeholder="自訂地點..." class="tactical-input flex-1 text-xs custom-location-input" data-for-entry="${item.entryName}">
            <button type="button" class="btn-apply-custom-loc px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition whitespace-nowrap">帶入自訂</button>
          </div>
        </div>
      `;
      return fieldContainer;
    }

    let inputHtml = '';
    switch (item.type) {
      case 'textarea':
        inputHtml = `<textarea name="${item.entryName}" rows="3" ${isReq ? 'required' : ''} placeholder="${escapeHtml(item.description || '請輸入詳細說明...')}" class="tactical-input text-xs sm:text-sm"></textarea>`;
        break;
      case 'select':
        inputHtml = `<select name="${item.entryName}" ${isReq ? 'required' : ''} class="tactical-input cursor-pointer text-xs sm:text-sm"><option value="">-- 請選擇項目 --</option>${item.options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}</select>`;
        break;
      case 'radio':
        inputHtml = `<div class="flex flex-wrap gap-2 pt-1">${item.options.map(opt => `<label class="choice-chip group"><input type="radio" name="${item.entryName}" value="${escapeHtml(opt)}"><span class="w-3.5 h-3.5 rounded-full border border-slate-500 mr-1.5 flex items-center justify-center transition"><span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span></span><span>${escapeHtml(opt)}</span></label>`).join('')}</div>`;
        break;
      case 'checkbox':
        inputHtml = `<div class="flex flex-wrap gap-2 pt-1">${item.options.map(opt => `<label class="choice-chip group"><input type="checkbox" name="${item.entryName}" value="${escapeHtml(opt)}"><span class="w-3.5 h-3.5 rounded-md border border-slate-500 mr-1.5 flex items-center justify-center transition"><i class="fas fa-check text-[9px] text-transparent transition"></i></span><span>${escapeHtml(opt)}</span></label>`).join('')}</div>`;
        break;
      case 'text':
      default:
        let placeholder = escapeHtml(item.description || '請輸入...');
        const isRegCodeField = item.title.includes('註冊碼');
        const extraClass = isRegCodeField ? ' drone-reg-code-input' : '';
        inputHtml = `<input type="text" name="${item.entryName}" ${isReq ? 'required' : ''} placeholder="${placeholder}" class="tactical-input text-xs sm:text-sm${extraClass}">`;
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

  function bindDynamicFormEvents(formEl, formConfig) {
    formEl.querySelectorAll('.choice-chip input').forEach(input => {
      input.addEventListener('change', function () {
        if (this.type === 'radio') {
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
          if (formConfig.id === 'mission' && this.name.includes('1591612449')) {
            syncCoordinatesByLocation(formEl, this.value);
          }
          if (formConfig.id === 'accident') {
            const title = this.closest('.form-item-wrapper')?.querySelector('label')?.innerText || '';
            if (title.includes('無人機資料')) {
              syncDroneRegCode(formEl, this.value);
            }
          }
        } else if (this.type === 'checkbox') {
          const chip = this.closest('.choice-chip');
          const checkIcon = chip.querySelector('i');
          if (this.checked) {
            chip.classList.add('active');
            if (checkIcon) checkIcon.classList.replace('text-transparent', 'text-white');
          } else {
            chip.classList.remove('active');
            if (checkIcon) checkIcon.classList.replace('text-white', 'text-transparent');
          }
          if (formConfig.id === 'borrow' && this.name.includes('1253125050')) {
            handleDroneBorrowAutoFill(formEl);
          }
        }
      });
    });

    formEl.querySelectorAll('.time-dropdown-group').forEach(grp => {
      const hSel = grp.querySelector('.time-hour-select');
      const mSel = grp.querySelector('.time-min-select');
      const hiddenInput = grp.querySelector('.time-combined-input');
      function updateTime() {
        if (hSel && mSel && hiddenInput) hiddenInput.value = `${hSel.value}:${mSel.value}`;
      }
      if (hSel) hSel.addEventListener('change', updateTime);
      if (mSel) mSel.addEventListener('change', updateTime);
    });

    formEl.querySelectorAll('.btn-get-gps').forEach(btn => {
      btn.addEventListener('click', function () {
        const targetEntry = this.dataset.targetEntry;
        if (!navigator.geolocation) {
          showToast('⚠️ 瀏覽器不支援 GPS 定位功能', 'error');
          return;
        }
        showToast('📡 正在獲取當前精確 GPS 座標...');
        navigator.geolocation.getCurrentPosition(
          pos => {
            const lat = pos.coords.latitude.toFixed(6);
            const lng = pos.coords.longitude.toFixed(6);
            const coordsStr = `${lat}, ${lng}`;
            const txtInput = formEl.querySelector(`input[name="${targetEntry}"].coord-text-input`);
            if (txtInput) {
              txtInput.value = coordsStr;
              showToast(`📍 已成功取得 GPS：${coordsStr}`);
              return;
            }
            const customInput = formEl.querySelector(`.custom-coord-input[data-for-entry="${targetEntry}"]`);
            if (customInput) {
              customInput.value = coordsStr;
              applyCustomCoordinate(formEl, targetEntry, coordsStr);
            }
          },
          () => showToast('⚠️ 無法取得 GPS 定位，請手動輸入。', 'error'),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    });

    formEl.querySelectorAll('.btn-apply-custom-coord').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('.custom-coord-input');
        if (input && input.value.trim()) applyCustomCoordinate(formEl, input.dataset.forEntry, input.value.trim());
      });
    });

    formEl.querySelectorAll('.btn-apply-custom-loc').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('.custom-location-input');
        if (input && input.value.trim()) applyCustomLocation(formEl, input.dataset.forEntry, input.value.trim());
      });
    });

    formEl.querySelectorAll('.btn-apply-custom-drone').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('.custom-drone-input');
        if (input && input.value.trim()) applyCustomDrone(formEl, input.dataset.forEntry, input.value.trim());
      });
    });

    formEl.querySelectorAll('.btn-add-custom-drone').forEach(btn => {
      btn.addEventListener('click', function () {
        const name = prompt('請輸入自訂無人機型號或序號：');
        if (name && name.trim()) applyCustomDrone(formEl, this.dataset.entryName, name.trim());
      });
    });

    formEl.querySelectorAll('.btn-add-custom-drone-accident').forEach(btn => {
      btn.addEventListener('click', function () {
        const name = prompt('請輸入自訂無人機資料與註冊碼（例: 機型 (B-AABXXXXXX)）：');
        if (name && name.trim()) addCustomAccidentDroneToForm(formEl, this.dataset.entryName, this.dataset.inputType, name.trim());
      });
    });

    formEl.querySelectorAll('.btn-add-custom-person').forEach(btn => {
      btn.addEventListener('click', function () {
        const name = prompt('請輸入新增人員姓名：');
        if (name && name.trim()) addCustomPersonToForm(formEl, this.dataset.entryName, this.dataset.inputType, name.trim());
      });
    });

    formEl.querySelectorAll('.btn-add-custom-task').forEach(btn => {
      btn.addEventListener('click', function () {
        const name = prompt('請輸入自訂選項名稱：');
        if (name && name.trim()) addCustomTaskToForm(formEl, this.dataset.entryName, this.dataset.inputType, name.trim());
      });
    });

    formEl.querySelectorAll('.btn-add-custom-path').forEach(btn => {
      btn.addEventListener('click', function () {
        const name = prompt('請輸入自訂檔案儲存路徑：');
        if (name && name.trim()) addCustomPathToForm(formEl, this.dataset.entryName, this.dataset.inputType, name.trim());
      });
    });

    if (formConfig.id === 'inventory') {
      formEl.querySelectorAll('.inv-grid-card').forEach(card => {
        card.addEventListener('click', function () {
          openInventorySectionModal(this.dataset.sectionId, formEl);
        });
      });
      const btnMarkAll = formEl.querySelector('#btnMarkAllChecked');
      if (btnMarkAll) {
        btnMarkAll.addEventListener('click', () => {
          markAllInventoryItems(formEl, '正常');
          showToast('⚡ 已將全表單裝備全數標記為「正常」！');
        });
      }
      updateAllInventoryBlockBadges(formEl);
    }

    // 表格 radio 選項（正常／異常）點選互斥與樣式切換事件
    formEl.querySelectorAll('.status-pill-btn input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', function () {
        const group = this.closest('.status-pill-group');
        if (!group) return;

        // 重置同組的所有按鈕樣式
        group.querySelectorAll('.status-pill-btn').forEach(btn => {
          btn.className = 'status-pill-btn cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700';
        });

        // 依據目前選取的 Radio 帶入選取樣式
        const parentBtn = this.closest('.status-pill-btn');
        if (parentBtn) {
          if (this.value === '正常') {
            parentBtn.className = 'status-pill-btn cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-emerald-600 text-white border border-emerald-500 shadow-md shadow-emerald-900/30';
          } else if (this.value === '異常') {
            parentBtn.className = 'status-pill-btn cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 bg-rose-600 text-white border border-rose-500 shadow-md shadow-rose-900/30';
          }
        }
      });
    });
  }

  function handleDroneBorrowAutoFill(formEl) {
    const checkedDrones = formEl.querySelectorAll('input[name="entry.1253125050"]:checked');
    if (checkedDrones.length > 0) {
      formEl.querySelectorAll('.borrow-item-select').forEach(sel => {
        const label = sel.dataset.rowLabel || '';
        if (label.includes('機體') || label.includes('遙控器') || label.includes('充電器')) sel.value = '1個';
        else if (label.includes('電池')) sel.value = '3個';
      });
      showToast('🚁 已自動帶入預設配件數量（機體/遙控器/充電器 1個、電池 3個）');
    }
  }

  function syncDroneRegCode(formEl, droneOptionValue) {
    const match = droneOptionValue.match(/\(([^)]+)\)/);
    const regCode = match ? match[1].trim() : droneOptionValue.trim();

    const regInput = formEl.querySelector('.drone-reg-code-input');
    if (regInput) {
      regInput.value = regCode;
      regInput.dispatchEvent(new Event('input', { bubbles: true }));
      showToast(`🚁 已自動帶入無人機註冊碼：${regCode}`);
    }
  }

  function applyCustomCoordinate(formEl, entryName, coordValue) {
    const container = formEl.querySelector(`.coord-radio-container[data-entry-name="${entryName}"]`);
    if (!container) return;
    let chip = container.querySelector(`input[value="${coordValue}"]`);
    if (!chip) {
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-emerald-500/50 bg-emerald-500/10';
      label.innerHTML = `
        <input type="radio" name="${entryName}" value="${escapeHtml(coordValue)}" checked>
        <span class="w-3.5 h-3.5 rounded-full border border-slate-500 mr-1.5 flex items-center justify-center"><span class="dot w-1.5 h-1.5 rounded-full bg-white"></span></span>
        <span class="text-emerald-400 font-mono font-bold">${escapeHtml(coordValue)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400"><i class="fas fa-times text-[10px]"></i></button>
      `;
      container.insertBefore(label, container.querySelector('.custom-coord-input').parentElement);
      chip = label.querySelector('input');
      label.querySelector('.btn-remove-custom-chip').addEventListener('click', (e) => { e.stopPropagation(); label.remove(); });
    }
    chip.checked = true;
    const input = container.querySelector('.custom-coord-input');
    if (input) input.value = '';
    showToast(`📍 已選定自訂座標：${coordValue}`);
  }

  function applyCustomLocation(formEl, entryName, locationValue) {
    const container = formEl.querySelector(`.mission-loc-container[data-entry-name="${entryName}"]`);
    if (!container) return;
    let chip = container.querySelector(`input[value="${locationValue}"]`);
    if (!chip) {
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-amber-500/50 bg-amber-500/10';
      label.innerHTML = `
        <input type="radio" name="${entryName}" value="${escapeHtml(locationValue)}" checked>
        <span class="w-3.5 h-3.5 rounded-full border border-slate-500 mr-1.5 flex items-center justify-center"><span class="dot w-1.5 h-1.5 rounded-full bg-white"></span></span>
        <span class="text-amber-400 font-bold">${escapeHtml(locationValue)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400"><i class="fas fa-times text-[10px]"></i></button>
      `;
      container.insertBefore(label, container.querySelector('.custom-location-input').parentElement);
      chip = label.querySelector('input');
      label.querySelector('.btn-remove-custom-chip').addEventListener('click', (e) => { e.stopPropagation(); label.remove(); });
    }
    chip.checked = true;
    const input = container.querySelector('.custom-location-input');
    if (input) input.value = '';
    showToast(`🏢 已選定自訂地點：${locationValue}`);
  }

  function applyCustomDrone(formEl, entryName, droneValue) {
    const container = formEl.querySelector(`.drone-chips-container[data-entry-name="${entryName}"]`);
    if (!container) return;
    let chip = container.querySelector(`input[value="${droneValue}"]`);
    if (!chip) {
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-amber-500/50 bg-amber-500/10';
      label.innerHTML = `
        <input type="checkbox" name="${entryName}" value="${escapeHtml(droneValue)}" checked>
        <span class="w-3.5 h-3.5 rounded-md border border-slate-500 mr-1.5 flex items-center justify-center"><i class="fas fa-check text-[9px] text-white"></i></span>
        <span class="text-amber-300 font-bold">${escapeHtml(droneValue)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400"><i class="fas fa-times text-[10px]"></i></button>
      `;
      container.insertBefore(label, container.querySelector('.custom-drone-input').parentElement);
      chip = label.querySelector('input');
      label.querySelector('.btn-remove-custom-chip').addEventListener('click', (e) => { e.stopPropagation(); label.remove(); });
    }
    chip.checked = true;
    const input = container.querySelector('.custom-drone-input');
    if (input) input.value = '';
    handleDroneBorrowAutoFill(formEl);
    showToast(`🚁 已新增自訂機體：${droneValue}`);
  }

  function addCustomAccidentDroneToForm(formEl, entryName, inputType, name) {
    const container = formEl.querySelector(`.drone-accident-chips-container[data-entry-name="${entryName}"]`);
    if (!container) return;
    let chip = container.querySelector(`input[value="${name}"]`);
    if (!chip) {
      const isCheckbox = inputType === 'checkbox';
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-amber-500/50 bg-amber-500/10';
      label.innerHTML = `
        <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="${entryName}" value="${escapeHtml(name)}" checked>
        <span class="w-3.5 h-3.5 ${isCheckbox ? 'rounded-md' : 'rounded-full'} border border-slate-500 mr-1.5 flex items-center justify-center">${isCheckbox ? '<i class="fas fa-check text-[9px] text-white"></i>' : '<span class="dot w-1.5 h-1.5 rounded-full bg-white"></span>'}</span>
        <span class="text-amber-300 font-bold">${escapeHtml(name)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400"><i class="fas fa-times text-[10px]"></i></button>
      `;
      container.appendChild(label);
      chip = label.querySelector('input');
      label.querySelector('.btn-remove-custom-chip').addEventListener('click', (e) => { e.stopPropagation(); label.remove(); });
    }
    chip.checked = true;
    syncDroneRegCode(formEl, name);
    showToast(`🚁 已新增並選取無人機資料：${name}`);
  }

  function addCustomPersonToForm(formEl, entryName, inputType, name) {
    const container = formEl.querySelector(`.person-chips-container[data-entry-name="${entryName}"]`);
    if (!container) return;
    let chip = container.querySelector(`input[value="${name}"]`);
    if (!chip) {
      const isCheckbox = inputType === 'checkbox';
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-amber-500/50 bg-amber-500/10';
      label.innerHTML = `
        <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="${entryName}" value="${escapeHtml(name)}" checked>
        <span class="w-3.5 h-3.5 ${isCheckbox ? 'rounded-md' : 'rounded-full'} border border-slate-500 mr-1.5 flex items-center justify-center">${isCheckbox ? '<i class="fas fa-check text-[9px] text-white"></i>' : '<span class="dot w-1.5 h-1.5 rounded-full bg-white"></span>'}</span>
        <span class="text-amber-300 font-bold">${escapeHtml(name)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400"><i class="fas fa-times text-[10px]"></i></button>
      `;
      container.appendChild(label);
      chip = label.querySelector('input');
      label.querySelector('.btn-remove-custom-chip').addEventListener('click', (e) => { e.stopPropagation(); label.remove(); });
    }
    chip.checked = true;
    showToast(`👤 已新增並選取人員：${name}`);
  }

  function addCustomTaskToForm(formEl, entryName, inputType, name) {
    const container = formEl.querySelector(`.task-chips-container[data-entry-name="${entryName}"]`);
    if (!container) return;
    let chip = container.querySelector(`input[value="${name}"]`);
    if (!chip) {
      const isCheckbox = inputType === 'checkbox';
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-amber-500/50 bg-amber-500/10';
      label.innerHTML = `
        <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="${entryName}" value="${escapeHtml(name)}" checked>
        <span class="w-3.5 h-3.5 ${isCheckbox ? 'rounded-md' : 'rounded-full'} border border-slate-500 mr-1.5 flex items-center justify-center">${isCheckbox ? '<i class="fas fa-check text-[9px] text-white"></i>' : '<span class="dot w-1.5 h-1.5 rounded-full bg-white"></span>'}</span>
        <span class="text-amber-300 font-bold">${escapeHtml(name)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400"><i class="fas fa-times text-[10px]"></i></button>
      `;
      container.appendChild(label);
      chip = label.querySelector('input');
      label.querySelector('.btn-remove-custom-chip').addEventListener('click', (e) => { e.stopPropagation(); label.remove(); });
    }
    chip.checked = true;
    showToast(`🎯 已新增並選取選項：${name}`);
  }

  function addCustomPathToForm(formEl, entryName, inputType, name) {
    const container = formEl.querySelector(`.path-chips-container[data-entry-name="${entryName}"]`);
    if (!container) return;
    let chip = container.querySelector(`input[value="${name}"]`);
    if (!chip) {
      const isCheckbox = inputType === 'checkbox';
      const label = document.createElement('label');
      label.className = 'choice-chip group active custom-added-chip border-amber-500/50 bg-amber-500/10';
      label.innerHTML = `
        <input type="${isCheckbox ? 'checkbox' : 'radio'}" name="${entryName}" value="${escapeHtml(name)}" checked>
        <span class="w-3.5 h-3.5 ${isCheckbox ? 'rounded-md' : 'rounded-full'} border border-slate-500 mr-1.5 flex items-center justify-center">${isCheckbox ? '<i class="fas fa-check text-[9px] text-white"></i>' : '<span class="dot w-1.5 h-1.5 rounded-full bg-white"></span>'}</span>
        <span class="text-amber-300 font-bold">${escapeHtml(name)}</span>
        <button type="button" class="btn-remove-custom-chip ml-1.5 text-slate-400 hover:text-red-400"><i class="fas fa-times text-[10px]"></i></button>
      `;
      container.appendChild(label);
      chip = label.querySelector('input');
      label.querySelector('.btn-remove-custom-chip').addEventListener('click', (e) => { e.stopPropagation(); label.remove(); });
    }
    chip.checked = true;
    showToast(`📁 已新增並選取路徑：${name}`);
  }

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
        showToast(`📍 已自動帶入預設經緯度：${targetCoord}`);
      }
    }
  }

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

    let html = '';
    const sectionRows = [];

    targetSection.items.forEach(it => {
      if (it.type === 'grid' && it.rows) {
        html += `
          <div class="sub-grid-box rounded-2xl p-3 sm:p-4 bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="text-xs sm:text-sm font-extrabold text-slate-200"><i class="fas fa-folder-open text-amber-400 mr-1.5"></i>${escapeHtml(it.title)}</span>
            </div>
            <div class="space-y-2">
              ${it.rows.map(row => {
                const targetRowEl = formEl.querySelector(`.inventory-data-row[data-row-entry="${row.entryName}"]`);
                if (targetRowEl) sectionRows.push(targetRowEl);
                const checkedInput = targetRowEl ? targetRowEl.querySelector('input:checked') : null;
                const currentVal = checkedInput ? checkedInput.value : '';

                return `
                  <div class="modal-inv-item-row flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40" data-row-entry="${row.entryName}">
                    <span class="text-xs sm:text-sm font-medium text-slate-200">${escapeHtml(row.label)}</span>
                    <div class="flex items-center gap-1.5 self-end sm:self-auto">
                      ${['正常', '異常'].map(opt => `
                        <button type="button" class="btn-modal-opt px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${currentVal === opt ? (opt === '正常' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500') : 'bg-slate-800 text-slate-400 border-slate-700'}" data-opt="${opt}">
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

    elements.secModalItemsList.querySelectorAll('.btn-modal-opt').forEach(btn => {
      btn.addEventListener('click', function () {
        const rowWrap = this.closest('.modal-inv-item-row');
        const entryName = rowWrap.dataset.rowEntry;
        const opt = this.dataset.opt;
        const targetRadio = formEl.querySelector(`.inventory-data-row[data-row-entry="${entryName}"] input[value="${opt}"]`);
        if (targetRadio) targetRadio.checked = true;

        rowWrap.querySelectorAll('.btn-modal-opt').forEach(b => {
          b.className = 'btn-modal-opt px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border bg-slate-800 text-slate-400 border-slate-700';
        });
        if (opt === '正常') this.className = 'btn-modal-opt px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border bg-emerald-600 text-white border-emerald-500';
        else if (opt === '異常') this.className = 'btn-modal-opt px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border bg-rose-600 text-white border-rose-500';

        updateModalProgress(sectionRows);
        updateInventoryBlockBadge(blk, formEl);
      });
    });

    elements.btnSecQuickAll.onclick = () => {
      sectionRows.forEach(r => { const radio = r.querySelector('input[value="正常"]'); if (radio) radio.checked = true; });
      openInventorySectionModal(sectionId, formEl);
      updateInventoryBlockBadge(blk, formEl);
      showToast(`⚡ 已將【${blk.title}】全數標記為正常！`);
    };

    updateModalProgress(sectionRows);
    lockBackgroundScroll();
    elements.inventorySectionModal.classList.remove('hidden');
    elements.inventorySectionModal.classList.add('flex');
  }

  function closeInventorySectionModal() {
    elements.inventorySectionModal.classList.add('hidden');
    elements.inventorySectionModal.classList.remove('flex');
    unlockBackgroundScroll();
  }

  function updateModalProgress(matchedRows) {
    let checkedCount = 0;
    matchedRows.forEach(r => { if (r.querySelector('input:checked')) checkedCount++; });
    elements.secModalProgress.innerText = `已清點：${checkedCount} / ${matchedRows.length}`;
  }

  function markAllInventoryItems(formEl, opt = '正常') {
    formEl.querySelectorAll(`.inventory-data-row input[value="${opt}"]`).forEach(r => r.checked = true);
    updateAllInventoryBlockBadges(formEl);
  }

  function updateInventoryBlockBadge(blk, formEl) {
    const card = formEl.querySelector(`.inv-grid-card[data-section-id="${blk.id}"]`);
    if (!card) return;
    const matched = formEl.querySelectorAll(`.inventory-data-row[data-sec-title="${blk.sectionTitle}"]`);
    let checkedCount = 0, hasIssue = false;

    matched.forEach(r => {
      const checked = r.querySelector('input:checked');
      if (checked) {
        checkedCount++;
        if (checked.value === '異常') hasIssue = true;
      }
    });

    const badge = card.querySelector('.blk-badge');
    const countSpan = card.querySelector('.blk-count');
    countSpan.innerText = `${checkedCount} / ${matched.length}`;

    if (hasIssue) {
      badge.className = 'blk-badge px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white';
      badge.innerText = '有異常 ⚠️';
    } else if (checkedCount === matched.length && matched.length > 0) {
      badge.className = 'blk-badge px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white';
      badge.innerText = '正常 ✅';
    } else {
      badge.className = 'blk-badge px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300';
      badge.innerText = `${checkedCount}/${matched.length} 待驗`;
    }
    updateGlobalInventoryCount(formEl);
  }

  function updateAllInventoryBlockBadges(formEl) {
    INVENTORY_SECTIONS.forEach(blk => updateInventoryBlockBadge(blk, formEl));
  }

  function updateGlobalInventoryCount(formEl) {
    const globalSpan = formEl.querySelector('#invGlobalCountBadge');
    if (!globalSpan) return;
    const total = formEl.querySelectorAll('.inventory-data-row').length;
    let done = 0;
    formEl.querySelectorAll('.inventory-data-row').forEach(r => { if (r.querySelector('input:checked')) done++; });
    globalSpan.innerText = `總進度：${done} / ${total} 已清點`;
  }

  function setupDashboardSecurity() {
    if (!elements.dashboardDrawerBtn) return;

    elements.dashboardDrawerBtn.addEventListener('click', () => {
      elements.dashboardPasswordInput.value = '';
      elements.passwordErrorMsg.classList.add('hidden');
      lockBackgroundScroll();
      elements.dashboardPasswordModal.classList.remove('hidden');
      elements.dashboardPasswordModal.classList.add('flex');
      elements.dashboardPasswordInput.focus();
    });

    elements.togglePasswordBtn.addEventListener('click', () => {
      if (elements.dashboardPasswordInput.type === 'password') {
        elements.dashboardPasswordInput.type = 'text';
        elements.eyeIcon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        elements.dashboardPasswordInput.type = 'password';
        elements.eyeIcon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });

    const verifyPassword = () => {
      if (elements.dashboardPasswordInput.value === CORRECT_PASSWORD) {
        elements.dashboardPasswordModal.classList.add('hidden');
        elements.dashboardPasswordModal.classList.remove('flex');

        const activeIndex = typeof window.currentFormIndex !== 'undefined' ? window.currentFormIndex : 0;
        const targetUrl = FORM_SHEET_URLS[activeIndex] || FORM_SHEET_URLS[0];

        elements.dashboardExternalLink.href = targetUrl;
        elements.dashboardIframe.src = targetUrl + "?rm=minimal";

        elements.dashboardModal.classList.remove('hidden');
        elements.dashboardModal.classList.add('flex');
      } else {
        elements.passwordErrorMsg.classList.remove('hidden');
        elements.dashboardPasswordInput.classList.add('border-red-500');
        setTimeout(() => elements.dashboardPasswordInput.classList.remove('border-red-500'), 1500);
      }
    };

    elements.passwordSubmitBtn.addEventListener('click', verifyPassword);
    elements.dashboardPasswordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') verifyPassword(); });

    const closePasswordModal = () => {
      elements.dashboardPasswordModal.classList.add('hidden');
      elements.dashboardPasswordModal.classList.remove('flex');
      unlockBackgroundScroll();
    };
    elements.passwordCancelBtn.addEventListener('click', closePasswordModal);
    elements.dashboardPasswordModal.addEventListener('click', (e) => { if (e.target === elements.dashboardPasswordModal) closePasswordModal(); });

    const closeDashboardModal = () => {
      elements.dashboardModal.classList.add('hidden');
      elements.dashboardModal.classList.remove('flex');
      elements.dashboardIframe.src = "about:blank";
      unlockBackgroundScroll();
    };
    elements.dashboardCloseBtn.addEventListener('click', closeDashboardModal);
    elements.dashboardModal.classList.add('hidden');
  }

  function setupEventListeners() {
    if (elements.themeToggleBtn) {
      elements.themeToggleBtn.addEventListener('click', () => {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark');
      });
    }

    if (elements.historyDrawerBtn) {
      elements.historyDrawerBtn.addEventListener('click', () => {
        openHistoryDrawer();
      });
    }

    if (elements.historyCloseBtn) {
      elements.historyCloseBtn.addEventListener('click', () => {
        elements.historyModal.classList.add('hidden');
        elements.historyModal.classList.remove('flex');
        unlockBackgroundScroll();
      });
    }

    document.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.form-tab-btn') || e.target.closest('.mobile-nav-btn');
      if (tabBtn && tabBtn.dataset.formId) {
        switchForm(tabBtn.dataset.formId);
      }
    });

    if (elements.submitBtn) {
      elements.submitBtn.addEventListener('click', handleFormSubmit);
    }

    elements.confirmCancelBtn.addEventListener('click', () => {
      elements.confirmModal.classList.add('hidden');
      elements.confirmModal.classList.remove('flex');
      unlockBackgroundScroll();
    });
    elements.confirmSubmitBtn.addEventListener('click', executeFormSubmit);

    elements.secModalCloseBtn.addEventListener('click', closeInventorySectionModal);
    elements.secModalDoneBtn.addEventListener('click', closeInventorySectionModal);

    [elements.inventorySectionModal, elements.confirmModal, elements.historyModal, elements.successModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', e => {
          if (e.target === modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            unlockBackgroundScroll();
            if (modal === elements.successModal) {
              resetAndPrepareNextForm();
            }
          }
        });
      }
    });

    elements.successModalClose.addEventListener('click', () => {
      elements.successModal.classList.add('hidden');
      elements.successModal.classList.remove('flex');
      unlockBackgroundScroll();
      resetAndPrepareNextForm();
    });

    elements.successNextBtn.addEventListener('click', () => {
      elements.successModal.classList.add('hidden');
      elements.successModal.classList.remove('flex');
      unlockBackgroundScroll();
      resetAndPrepareNextForm();
      showToast('已重設為全新表單，可繼續填寫下一筆！');
    });
  }

  function handleFormSubmit() {
    const activeForm = document.getElementById(`active_form_${state.currentFormId}`);
    if (!activeForm) return;
    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
    if (!formConfig) return;

    let firstInvalid = null;
    let missingName = '';

    if (formConfig.id === 'inventory') {
      const unCheckedRows = activeForm.querySelectorAll('.inventory-data-row:not(:has(input:checked))');
      if (unCheckedRows.length > 0) {
        showToast(`⚠️ 裝備【${unCheckedRows[0].dataset.rowLabel}】尚未點收`, 'error');
        return;
      }
    }

    if (formConfig.id === 'mission') {
      const savedFieldWrap = activeForm.querySelectorAll('.form-item-wrapper');
      let isSavedYes = false;
      savedFieldWrap.forEach(wrap => {
        const titleEl = wrap.querySelector('label');
        if (titleEl && titleEl.innerText.includes('存檔')) {
          const checkedYes = wrap.querySelector('input[value="是"]:checked');
          if (checkedYes) isSavedYes = true;
        }
      });

      if (isSavedYes) {
        let pathSelected = false;
        savedFieldWrap.forEach(wrap => {
          const titleEl = wrap.querySelector('label');
          if (titleEl && (titleEl.innerText.includes('檔案儲存路徑') || titleEl.innerText.includes('儲存路徑'))) {
            const checkedPath = wrap.querySelector('input:checked');
            if (checkedPath) pathSelected = true;
          }
        });

        if (!pathSelected) {
          showToast('⚠️ 飛行影像及飛行軌跡已選擇「是」，請務必選擇「檔案儲存路徑」！', 'error');
          return;
        }
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

    showConfirmModal(activeForm, formConfig);
  }

  function showConfirmModal(activeForm, formConfig) {
    const formData = new FormData(activeForm);
    const summaryItems = [];

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
      summaryItems.push({ label: '裝備點收項數', val: '56 項裝備已全數核對完成' });
    } else if (formConfig.id === 'mission') {
      summaryItems.push({ label: '表單類型', val: formConfig.title });
      summaryItems.push({ label: '出勤日期', val: formData.get('entry.1209667024') });
      summaryItems.push({ label: '出勤單號', val: formData.get('entry.316344842') });
      summaryItems.push({ label: '出勤時間', val: `${formData.get('entry.649405272')} ~ ${formData.get('entry.2035663237')}` });
      summaryItems.push({ label: '出勤地點', val: formData.get('entry.1591612449') });
      summaryItems.push({ label: '出勤人員', val: formData.getAll('entry.1732585170').join(', ') });
      summaryItems.push({ label: '任務內容', val: formData.getAll('entry.1122334455').join(', ') });
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
        <span>確認內容無誤後，請點選「確認送出」將資料直傳雲端後台。</span>
      </div>
    `;

    lockBackgroundScroll();
    elements.confirmModal.classList.remove('hidden');
    elements.confirmModal.classList.add('flex');
  }

  async function executeFormSubmit() {
    elements.confirmModal.classList.add('hidden');
    elements.confirmModal.classList.remove('flex');

    const activeForm = document.getElementById(`active_form_${state.currentFormId}`);
    if (!activeForm) return;
    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
    if (!formConfig) return;

    const formData = new FormData(activeForm);
    const summaryData = {};
    for (const [key, value] of formData.entries()) {
      if (summaryData[key]) summaryData[key] += `, ${value}`;
      else summaryData[key] = value;
    }

    elements.loadingOverlay.classList.remove('hidden');
    elements.loadingOverlay.classList.add('flex');

    try {
      const bodyParts = [];
      for (const [key, value] of formData.entries()) {
        if (formConfig.id === 'borrow' && value === '0個') continue;
        bodyParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
      }

      await fetch(formConfig.actionUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParts.join('&')
      });

      const record = {
        id: Date.now(),
        formId: formConfig.id,
        formTitle: formConfig.title,
        timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
        summary: summaryData
      };
      state.history.unshift(record);
      localStorage.setItem('uav_history', JSON.stringify(state.history.slice(0, 30)));

      resetAndPrepareNextForm();

      setTimeout(() => {
        elements.loadingOverlay.classList.add('hidden');
        elements.loadingOverlay.classList.remove('flex');
        showSuccessModal(record);
      }, 850);

    } catch (err) {
      console.error(err);
      elements.loadingOverlay.classList.add('hidden');
      elements.loadingOverlay.classList.remove('flex');
      unlockBackgroundScroll();
      showToast('⚠️ 提交發生錯誤，請檢查網路連線。', 'error');
    }
  }

  function resetAndPrepareNextForm() {
    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
    if (formConfig) renderFormFields(formConfig);
  }

  function showSuccessModal(record) {
    lockBackgroundScroll();
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
        <div class="mt-3 text-slate-400 text-xs">資料已成功同步至 Google 試算表後台。</div>
      </div>
    `;
  }

  function openHistoryDrawer() {
    lockBackgroundScroll();
    elements.historyModal.classList.remove('hidden');
    elements.historyModal.classList.add('flex');

    if (state.history.length === 0) {
      elements.historyList.innerHTML = `
        <div class="text-center py-12 text-slate-500">
          <i class="fas fa-inbox text-4xl mb-3 opacity-40"></i>
          <p class="text-sm">尚未有任何本機提交紀錄</p>
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

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();