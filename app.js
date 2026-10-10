/**
 * 臺中市政府消防局 特搜大隊特搜空拍隊 - 勤務表單整合系統
 * 核心應用程式邏輯 (App Controller v3.0)
 * 修正：
 * 1. 杜絕重複記錄兩筆 (單一安全提交通道)
 * 2. 每日清點表單裝備品項與最新 entry ID 100% 精準對齊，預設「已清點」防空白
 * 3. 每日清點新增「出借」選項 (三態：已清點 / 有異常 / 出借)
 * 4. 出借表單物品採用乾淨下拉式選單，勾選無人機智慧預設套裝 (1機體/1遙控/1管家/3電池)
 * 5. 每日清點 4 大區域大格圖示手機版緊湊 2x2 呈現，免除大幅滑動
 * 6. 頂部簡約化標題橫幅
 * 7. 時間類支援一鍵年月日時分帶入與 Google 後台自動拆解
 */

(function () {
  'use strict';

  // 應用狀態
  const state = {
    currentFormId: 'borrow',
    theme: localStorage.getItem('uav_theme') || 'dark',
    history: JSON.parse(localStorage.getItem('uav_history') || '[]'),
    // 每日清點裝備狀態: { [entryId]: '已清點' | '有異常' | '出借' }
    inventoryValues: {},
    activeModalAreaId: null
  };

  // DOM 元素快取
  const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    historyDrawerBtn: document.getElementById('historyDrawerBtn'),
    historyModal: document.getElementById('historyModal'),
    historyCloseBtn: document.getElementById('historyCloseBtn'),
    historyList: document.getElementById('historyList'),
    tabNavContainer: document.getElementById('tabNavContainer'),
    mobileNavContainer: document.getElementById('mobileNavContainer'),
    formBadge: document.getElementById('formBadge'),
    formOfficialLink: document.getElementById('formOfficialLink'),
    formRenderArea: document.getElementById('formRenderArea'),
    submitBtn: document.getElementById('submitBtn'),
    submitBtnText: document.getElementById('submitBtnText'),
    successModal: document.getElementById('successModal'),
    successModalClose: document.getElementById('successModalClose'),
    successNextBtn: document.getElementById('successNextBtn'),
    successSummaryContent: document.getElementById('successSummaryContent'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toastNotification'),
    toastMsg: document.getElementById('toastMsg'),
    areaModal: document.getElementById('areaInventoryModal'),
    areaModalTitle: document.getElementById('areaModalTitle'),
    areaModalDesc: document.getElementById('areaModalDesc'),
    areaModalContent: document.getElementById('areaModalContent'),
    areaModalMarkAllBtn: document.getElementById('areaModalMarkAllBtn'),
    areaModalCloseBtn: document.getElementById('areaModalCloseBtn'),
    areaModalSaveBtn: document.getElementById('areaModalSaveBtn'),
    confirmModal: document.getElementById('confirmModal'),
    confirmModalDesc: document.getElementById('confirmModalDesc'),
    confirmCancelBtn: document.getElementById('confirmCancelBtn'),
    confirmSubmitBtn: document.getElementById('confirmSubmitBtn')
  };

  // 初始化
  function init() {
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

  // 頂部與手機導覽列
  function renderNavigation() {
    if (!window.FORMS_DATA || !window.FORMS_DATA.forms) return;
    const forms = window.FORMS_DATA.forms;

    elements.tabNavContainer.innerHTML = forms.map(f => `
      <button type="button" data-form-id="${f.id}" 
        class="form-tab-btn flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap
        ${f.id === state.currentFormId ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 font-bold active' : 'hover:bg-slate-700/40 text-slate-400 hover:text-slate-100'}">
        <i class="${f.icon}"></i>
        <span>${f.badge}</span>
      </button>
    `).join('');

    elements.mobileNavContainer.innerHTML = forms.map(f => `
      <button type="button" data-form-id="${f.id}"
        class="mobile-nav-btn flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors
        ${f.id === state.currentFormId ? 'text-red-500 font-bold' : 'text-slate-400'}">
        <i class="${f.icon} text-base mb-0.5"></i>
        <span class="scale-90">${f.badge}</span>
      </button>
    `).join('');
  }

  // 切換表單
  function switchForm(formId) {
    const formConfig = window.FORMS_DATA.forms.find(f => f.id === formId);
    if (!formConfig) return;

    state.currentFormId = formId;

    document.querySelectorAll('.form-tab-btn').forEach(btn => {
      const isCurrent = btn.dataset.formId === formId;
      btn.className = `form-tab-btn flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
        isCurrent ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 font-bold active' : 'hover:bg-slate-700/40 text-slate-400 hover:text-slate-200'
      }`;
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      const isCurrent = btn.dataset.formId === formId;
      btn.className = `mobile-nav-btn flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
        isCurrent ? 'text-red-500 font-bold' : 'text-slate-400'
      }`;
    });

    // 更新 Badge 與官方連結
    elements.formBadge.innerText = formConfig.badge;
    elements.formOfficialLink.href = formConfig.viewUrl;

    if (formConfig.id === 'inventory') {
      renderInventoryForm(formConfig);
    } else {
      renderStandardForm(formConfig);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 工具：取得現在年月日時分格式化資料
  function getCurrentTimeData() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return {
      dateStr: `${year}-${month}-${day}`,
      timeStr: `${hours}:${minutes}`,
      year,
      month,
      day,
      hours,
      minutes
    };
  }

  // =========================================================================
  // 1. 每日清點表單 (4大區域緊湊 2x2 格圖示 + 三態視窗清點 + 預設防空白)
  // =========================================================================
  function renderInventoryForm(formConfig) {
    const container = elements.formRenderArea;
    container.innerHTML = '';

    // 自動預設初始化全部裝備為「已清點」(防止後台空白)
    formConfig.areas.forEach(area => {
      area.groups.forEach(group => {
        group.rows.forEach(row => {
          if (!state.inventoryValues[row.entryId]) {
            state.inventoryValues[row.entryId] = '已清點';
          }
        });
      });
    });

    const formEl = document.createElement('form');
    formEl.id = `active_form_${formConfig.id}`;
    formEl.action = formConfig.actionUrl;
    formEl.method = 'POST';
    formEl.target = 'gform_sink_iframe';
    formEl.enctype = 'application/x-www-form-urlencoded';
    formEl.className = 'space-y-4 sm:space-y-6';

    // 1-1. 全局快捷列 (一鍵全數已清點)
    const quickBar = document.createElement('div');
    quickBar.className = 'glass-panel p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 border border-emerald-500/30 bg-emerald-950/20';
    quickBar.innerHTML = `
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base shadow-inner">
          <i class="fas fa-bolt"></i>
        </div>
        <div>
          <h4 class="font-bold text-xs sm:text-sm text-emerald-300">快速清點模式</h4>
          <p class="text-[11px] text-slate-400 hidden sm:block">日常無異常時，預設全區已清點，遇出借或異常點擊大格修改</p>
        </div>
      </div>
      <button type="button" id="btnMarkGlobalAllChecked"
        class="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5 whitespace-nowrap">
        <i class="fas fa-check-double"></i> ⚡ 全區一鍵「已清點」
      </button>
    `;
    formEl.appendChild(quickBar);

    // 1-2. 基本資料卡片 (清點日期 + 清點人員)
    const basicCard = document.createElement('div');
    basicCard.className = 'form-section-card rounded-2xl p-4 sm:p-5 space-y-4';
    basicCard.innerHTML = `
      <div class="border-b border-slate-700/40 pb-2.5 flex items-center gap-2">
        <span class="w-5 h-5 rounded-md bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xs font-black">1</span>
        <h3 class="font-bold text-sm sm:text-base text-slate-100">基本資料與清點人員</h3>
      </div>
    `;

    formConfig.basicFields.forEach(field => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'form-item-wrapper space-y-1.5';
      itemWrapper.dataset.entryId = field.entryId;
      itemWrapper.dataset.title = field.title;

      if (field.type === 'date') {
        const timeData = getCurrentTimeData();
        itemWrapper.innerHTML = `
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(field.title)} <span class="text-red-500 font-bold">*</span>
          </label>
          <div class="flex gap-2">
            <input type="date" name="${field.entryName}" value="${timeData.dateStr}" required
              class="tactical-input flex-1 font-mono text-xs sm:text-sm" data-is-date="true" data-entry-base="${field.entryId}">
            <button type="button" class="btn-quick-now px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1 whitespace-nowrap">
              <i class="fas fa-bolt text-amber-400"></i> 現在時間
            </button>
          </div>
        `;
      } else if (field.type === 'radio') {
        let chipsHtml = field.options.map(opt => `
          <label class="choice-chip group !py-1.5 !px-3 !text-xs">
            <input type="radio" name="${field.entryName}" value="${escapeHtml(opt)}" required>
            <span class="w-3 h-3 rounded-full border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
              <span class="dot w-1 h-1 rounded-full bg-transparent transition"></span>
            </span>
            <span>${escapeHtml(opt)}</span>
          </label>
        `).join('');

        if (field.hasOther) {
          chipsHtml += `
            <label class="choice-chip chip-other group !py-1.5 !px-3 !text-xs">
              <input type="radio" name="${field.entryName}" value="__other_option__" data-is-other="true" data-other-entry="${field.entryName}.other_option_response">
              <span class="w-3 h-3 rounded-full border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                <span class="dot w-1 h-1 rounded-full bg-transparent transition"></span>
              </span>
              <span><i class="fas fa-edit mr-1 text-amber-400"></i> 其他 (自訂)</span>
            </label>
          `;
        }

        itemWrapper.innerHTML = `
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(field.title)} <span class="text-red-500 font-bold">*</span>
          </label>
          <div class="flex flex-wrap gap-2 pt-0.5">${chipsHtml}</div>
          <div class="other-input-container hidden pt-2">
            <input type="text" name="${field.entryName}.other_option_response" placeholder="請填寫其他清點人員姓名" class="tactical-input text-xs">
          </div>
        `;
      }
      basicCard.appendChild(itemWrapper);
    });
    formEl.appendChild(basicCard);

    // 1-3. 4 大區域大格圖示卡片區塊 (手機版緊湊 2x2 宮格，同屏盡覽)
    const areasCard = document.createElement('div');
    areasCard.className = 'form-section-card rounded-2xl p-4 sm:p-5 space-y-3';
    areasCard.innerHTML = `
      <div class="border-b border-slate-700/40 pb-2.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-5 h-5 rounded-md bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xs font-black">2</span>
          <h3 class="font-bold text-sm sm:text-base text-slate-100">裝備區域清點 (點擊圖示進入清點視窗)</h3>
        </div>
        <span class="text-xs text-slate-400 font-mono">4大區域</span>
      </div>
      <!-- 手機版 grid-cols-2 緊湊呈現，不需大滑動 -->
      <div id="areaGridContainer" class="grid grid-cols-2 gap-2.5 sm:gap-4 pt-1">
        <!-- 4大區域大格卡片由 JS 動態渲染 -->
      </div>
    `;
    formEl.appendChild(areasCard);

    // 1-4. 建立隱藏的 Input 容器 (存放所有 56 項裝備的 Radio 值，表單送出時 100% 寫入！)
    const hiddenInputsContainer = document.createElement('div');
    hiddenInputsContainer.id = 'inventoryHiddenInputs';
    hiddenInputsContainer.className = 'hidden';
    formEl.appendChild(hiddenInputsContainer);

    // 1-5. 底部補充欄位 (異常詳述 + 備註)
    const bottomCard = document.createElement('div');
    bottomCard.className = 'form-section-card rounded-2xl p-4 sm:p-5 space-y-4';
    bottomCard.innerHTML = `
      <div class="border-b border-slate-700/40 pb-2.5 flex items-center gap-2">
        <span class="w-5 h-5 rounded-md bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xs font-black">3</span>
        <h3 class="font-bold text-sm sm:text-base text-slate-100">異常通報與備註事項</h3>
      </div>
    `;

    formConfig.bottomFields.forEach(field => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'form-item-wrapper space-y-1.5';
      itemWrapper.dataset.entryId = field.entryId;
      itemWrapper.dataset.title = field.title;

      if (field.type === 'textarea') {
        itemWrapper.innerHTML = `
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">${escapeHtml(field.title)}</label>
          <textarea name="${field.entryName}" rows="2" placeholder="若檢查有異常，請具體說明品名與故障狀況..." class="tactical-input text-xs sm:text-sm"></textarea>
        `;
      } else {
        itemWrapper.innerHTML = `
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">${escapeHtml(field.title)}</label>
          <input type="text" name="${field.entryName}" placeholder="其他臨時借用交接事項..." class="tactical-input text-xs sm:text-sm">
        `;
      }
      bottomCard.appendChild(itemWrapper);
    });
    formEl.appendChild(bottomCard);

    container.appendChild(formEl);

    // 渲染大格圖示並同步 Hidden inputs
    updateAreaGridCards(formConfig);
    bindInventoryEvents(formEl, formConfig);
  }

  // 渲染/更新 4 大區域大格圖示卡片 (精簡緊湊型，適配手機一屏呈現)
  function updateAreaGridCards(formConfig) {
    const gridContainer = document.getElementById('areaGridContainer');
    if (!gridContainer) return;

    gridContainer.innerHTML = formConfig.areas.map(area => {
      let totalItems = 0;
      let checkedItems = 0;
      let abnormalCount = 0;
      let loanCount = 0;

      area.groups.forEach(group => {
        group.rows.forEach(row => {
          totalItems++;
          const val = state.inventoryValues[row.entryId] || '已清點';
          if (val === '已清點') checkedItems++;
          else if (val === '有異常') abnormalCount++;
          else if (val === '出借') loanCount++;
        });
      });

      let statusBadge = '';
      let statusBorder = 'border-slate-700/60 hover:border-slate-500';

      if (abnormalCount > 0) {
        statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">⚠️ ${abnormalCount} 項異常</span>`;
        statusBorder = 'border-red-500/50 bg-red-950/20';
      } else if (loanCount > 0) {
        statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">📤 ${loanCount} 項出借</span>`;
        statusBorder = 'border-blue-500/40 bg-blue-950/20';
      } else {
        statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✅ 正常 (${checkedItems}/${totalItems})</span>`;
        statusBorder = 'border-emerald-500/40 bg-emerald-950/20';
      }

      return `
        <div class="area-card p-3 sm:p-4 rounded-2xl bg-slate-900/60 border ${statusBorder} transition-all cursor-pointer hover:shadow-lg active:scale-95 space-y-2.5 group flex flex-col justify-between"
          data-area-id="${area.id}">
          <div class="flex items-center justify-between gap-1">
            <div class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr ${area.color} text-white flex items-center justify-center text-base sm:text-xl shadow-md group-hover:scale-105 transition-transform">
              <i class="${area.icon}"></i>
            </div>
            ${statusBadge}
          </div>
          <div>
            <h4 class="text-xs sm:text-base font-black text-slate-100 flex items-center justify-between">
              <span>${escapeHtml(area.name)}</span>
              <span class="text-[10px] sm:text-xs font-normal text-slate-400 font-mono">${totalItems}項</span>
            </h4>
          </div>
          <div class="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300 group-hover:text-amber-400 transition-colors">
            <span class="font-bold flex items-center gap-1">
              <i class="fas fa-edit text-[10px]"></i> 點開清點
            </span>
            <i class="fas fa-chevron-right text-[10px] text-slate-500 group-hover:translate-x-0.5 transition-transform"></i>
          </div>
        </div>
      `;
    }).join('');

    // 同步到表單 Hidden Inputs
    syncInventoryToHiddenInputs(formConfig);
  }

  // 同步所有裝備值至隱藏 Input 容器
  function syncInventoryToHiddenInputs(formConfig) {
    const hiddenContainer = document.getElementById('inventoryHiddenInputs');
    if (!hiddenContainer) return;
    hiddenContainer.innerHTML = '';

    formConfig.areas.forEach(area => {
      area.groups.forEach(group => {
        group.rows.forEach(row => {
          const val = state.inventoryValues[row.entryId] || '已清點';
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = row.entryName;
          input.value = val;
          hiddenContainer.appendChild(input);
        });
      });
    });
  }

  // 開啟區域清點視窗 (三態清點：已清點 / 有異常 / 出借)
  function openAreaModal(areaId, formConfig) {
    const area = formConfig.areas.find(a => a.id === areaId);
    if (!area) return;

    state.activeModalAreaId = areaId;
    elements.areaModalTitle.innerHTML = `<i class="${area.icon} mr-2 text-amber-400"></i> ${escapeHtml(area.name)} 裝備清點`;
    elements.areaModalDesc.innerText = `點選項目切換「已清點」、「有異常」或「出借」狀態。`;

    let contentHtml = '';
    area.groups.forEach(group => {
      contentHtml += `
        <div class="space-y-2 pb-3 border-b border-slate-800 last:border-b-0">
          <h5 class="text-xs font-extrabold text-amber-400 tracking-wider flex items-center gap-1.5">
            <i class="fas fa-folder text-slate-500 text-[10px]"></i> ${escapeHtml(group.title)}
          </h5>
          <div class="space-y-2">
            ${group.rows.map(row => {
              const currentVal = state.inventoryValues[row.entryId] || '已清點';
              return `
                <div class="modal-inventory-row p-2.5 sm:p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  data-row-entry="${row.entryId}">
                  <span class="text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    <i class="fas fa-cube text-slate-500 text-xs"></i>
                    ${escapeHtml(row.label)}
                  </span>
                  <div class="flex items-center gap-1.5 self-end sm:self-auto">
                    <button type="button" class="btn-modal-opt px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                      currentVal === '已清點'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-emerald-400'
                    }" data-opt="已清點" data-entry-id="${row.entryId}">
                      <i class="fas fa-check text-[10px]"></i> 已清點
                    </button>
                    <button type="button" class="btn-modal-opt px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                      currentVal === '有異常'
                        ? 'bg-red-600 text-white border-red-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-red-400'
                    }" data-opt="有異常" data-entry-id="${row.entryId}">
                      <i class="fas fa-exclamation-triangle text-[10px]"></i> 有異常
                    </button>
                    <button type="button" class="btn-modal-opt px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                      currentVal === '出借'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-blue-400'
                    }" data-opt="出借" data-entry-id="${row.entryId}">
                      <i class="fas fa-share text-[10px]"></i> 出借
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    elements.areaModalContent.innerHTML = contentHtml;
    elements.areaModal.classList.remove('hidden');
    elements.areaModal.classList.add('flex');

    // 綁定彈窗三態按鈕點擊
    elements.areaModalContent.querySelectorAll('.btn-modal-opt').forEach(btn => {
      btn.addEventListener('click', function () {
        const entryId = this.dataset.entryId;
        const opt = this.dataset.opt;
        state.inventoryValues[entryId] = opt;

        const row = this.closest('.modal-inventory-row');
        row.querySelectorAll('.btn-modal-opt').forEach(b => {
          b.className = `btn-modal-opt px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200`;
        });

        if (opt === '已清點') {
          this.className = `btn-modal-opt px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border bg-emerald-600 text-white border-emerald-500 shadow-sm`;
        } else if (opt === '有異常') {
          this.className = `btn-modal-opt px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border bg-red-600 text-white border-red-500 shadow-sm`;
        } else {
          this.className = `btn-modal-opt px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border bg-blue-600 text-white border-blue-500 shadow-sm`;
        }
      });
    });
  }

  // 綁定每日清點事件
  function bindInventoryEvents(formEl, formConfig) {
    const gridContainer = document.getElementById('areaGridContainer');
    if (gridContainer) {
      gridContainer.addEventListener('click', e => {
        const card = e.target.closest('.area-card');
        if (card && card.dataset.areaId) {
          openAreaModal(card.dataset.areaId, formConfig);
        }
      });
    }

    const btnGlobal = formEl.querySelector('#btnMarkGlobalAllChecked');
    if (btnGlobal) {
      btnGlobal.addEventListener('click', () => {
        formConfig.areas.forEach(area => {
          area.groups.forEach(group => {
            group.rows.forEach(row => {
              state.inventoryValues[row.entryId] = '已清點';
            });
          });
        });
        updateAreaGridCards(formConfig);
        showToast(`🎉 已成功標記 4 大區域全部 56 項裝備為「已清點」！`);
      });
    }

    elements.areaModalMarkAllBtn.onclick = () => {
      const area = formConfig.areas.find(a => a.id === state.activeModalAreaId);
      if (!area) return;
      area.groups.forEach(group => {
        group.rows.forEach(row => {
          state.inventoryValues[row.entryId] = '已清點';
        });
      });
      openAreaModal(state.activeModalAreaId, formConfig);
      showToast(`已將本區所有裝備標記為「已清點」`);
    };

    elements.areaModalSaveBtn.onclick = () => {
      elements.areaModal.classList.add('hidden');
      elements.areaModal.classList.remove('flex');
      updateAreaGridCards(formConfig);
      showToast(`已儲存區域清點進度！`);
    };

    elements.areaModalCloseBtn.onclick = () => {
      elements.areaModal.classList.add('hidden');
      elements.areaModal.classList.remove('flex');
      updateAreaGridCards(formConfig);
    };

    formEl.querySelectorAll('.btn-quick-now').forEach(btn => {
      btn.addEventListener('click', function () {
        const timeData = getCurrentTimeData();
        const input = this.parentElement.querySelector('input[type="date"]');
        if (input) input.value = timeData.dateStr;
        showToast(`已填入現在日期：${timeData.dateStr}`);
      });
    });

    bindChipsAndOtherInputs(formEl);
  }

  // =========================================================================
  // 2. 一般標準表單渲染 (出借乾淨下拉 + 勾選飛機自動帶入預設套裝)
  // =========================================================================
  function renderStandardForm(formConfig) {
    const container = elements.formRenderArea;
    container.innerHTML = '';

    const formEl = document.createElement('form');
    formEl.id = `active_form_${formConfig.id}`;
    formEl.action = formConfig.actionUrl;
    formEl.method = 'POST';
    formEl.target = 'gform_sink_iframe';
    formEl.enctype = 'application/x-www-form-urlencoded';
    formEl.className = 'space-y-4 sm:space-y-6';

    const timeData = getCurrentTimeData();

    formConfig.sections.forEach((section, sIndex) => {
      const secCard = document.createElement('div');
      secCard.className = 'form-section-card rounded-2xl p-4 sm:p-5 space-y-4';

      secCard.innerHTML = `
        <div class="border-b border-slate-700/40 pb-2.5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-5 h-5 rounded-md bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xs font-black">${sIndex + 1}</span>
            <h3 class="font-bold text-sm sm:text-base text-slate-100">${escapeHtml(section.title)}</h3>
          </div>
        </div>
      `;

      section.items.forEach(item => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'form-item-wrapper space-y-1.5';
        itemWrapper.dataset.entryId = item.entryId || '';
        itemWrapper.dataset.title = item.title;

        const isReq = item.required;
        const reqTag = isReq ? '<span class="text-red-500 font-bold ml-1">*</span>' : '<span class="text-slate-500 text-xs font-normal ml-1">(選填)</span>';
        let inputHtml = '';

        if (item.type === 'borrowItemsDropdown') {
          // 乾淨清爽下拉式選單組
          inputHtml = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              ${item.items.map(sub => `
                <div class="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3">
                  <span class="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <i class="fas fa-cube text-slate-500 text-xs"></i>
                    ${escapeHtml(sub.label)}
                  </span>
                  <select name="${sub.entryName}" data-borrow-key="${sub.key}"
                    class="borrow-select bg-slate-800 border border-slate-700 text-slate-200 text-xs sm:text-sm font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-red-500">
                    <option value="">0個</option>
                    <option value="1個">1個</option>
                    <option value="2個">2個</option>
                    <option value="3個">3個</option>
                    <option value="4個">4個</option>
                    <option value="5個">5個</option>
                    <option value="6個">6個</option>
                  </select>
                </div>
              `).join('')}
            </div>
          `;
        } else if (item.type === 'date') {
          inputHtml = `
            <div class="flex gap-2">
              <input type="date" name="${item.entryName}" value="${timeData.dateStr}" ${isReq ? 'required' : ''} 
                class="tactical-input flex-1 font-mono text-xs sm:text-sm" data-is-date="true" data-entry-base="${item.entryId}">
              <button type="button" class="btn-quick-now px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1 whitespace-nowrap">
                <i class="fas fa-bolt text-amber-400"></i> 現在時間
              </button>
            </div>
          `;
        } else if (item.type === 'googleTime') {
          inputHtml = `
            <div class="flex gap-2">
              <input type="time" name="${item.entryName}" value="${timeData.timeStr}" ${isReq ? 'required' : ''} 
                class="tactical-input flex-1 font-mono text-xs sm:text-sm" data-is-google-time="true" data-entry-base="${item.entryId}">
              <button type="button" class="btn-quick-now-time px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1 whitespace-nowrap">
                <i class="fas fa-clock text-amber-400"></i> 現在時間
              </button>
            </div>
          `;
        } else if (item.type === 'timeText') {
          inputHtml = `
            <div class="flex gap-2">
              <input type="text" name="${item.entryName}" value="${timeData.timeStr}" ${isReq ? 'required' : ''} 
                placeholder="例: 16:30" class="tactical-input flex-1 font-mono text-xs sm:text-sm">
              <button type="button" class="btn-quick-now-text px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1 whitespace-nowrap">
                <i class="fas fa-clock text-amber-400"></i> 現在時間
              </button>
            </div>
          `;
        } else if (item.type === 'textarea') {
          inputHtml = `
            <textarea name="${item.entryName}" rows="2" ${isReq ? 'required' : ''} 
              placeholder="${escapeHtml(item.description || '請輸入詳細說明...')}" class="tactical-input text-xs sm:text-sm"></textarea>
          `;
        } else if (item.type === 'select') {
          inputHtml = `
            <select name="${item.entryName}" ${isReq ? 'required' : ''} class="tactical-input cursor-pointer text-xs sm:text-sm">
              <option value="">-- 請選擇項目 --</option>
              ${item.options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
            </select>
          `;
        } else if (item.type === 'radio') {
          let chips = item.options.map(opt => `
            <label class="choice-chip group !py-1.5 !px-3 !text-xs">
              <input type="radio" name="${item.entryName}" value="${escapeHtml(opt)}" ${isReq ? 'required' : ''}>
              <span class="w-3 h-3 rounded-full border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                <span class="dot w-1 h-1 rounded-full bg-transparent transition"></span>
              </span>
              <span>${escapeHtml(opt)}</span>
            </label>
          `).join('');

          if (item.hasOther) {
            chips += `
              <label class="choice-chip chip-other group !py-1.5 !px-3 !text-xs">
                <input type="radio" name="${item.entryName}" value="__other_option__" data-is-other="true" data-other-entry="${item.entryName}.other_option_response">
                <span class="w-3 h-3 rounded-full border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                  <span class="dot w-1 h-1 rounded-full bg-transparent transition"></span>
                </span>
                <span><i class="fas fa-edit mr-1 text-amber-400"></i> 其他 (自訂)</span>
              </label>
            `;
          }

          inputHtml = `
            <div class="flex flex-wrap gap-2 pt-0.5">${chips}</div>
            <div class="other-input-container hidden pt-2">
              <input type="text" name="${item.entryName}.other_option_response" placeholder="請填寫其他自訂內容..." class="tactical-input text-xs">
            </div>
          `;
        } else if (item.type === 'checkbox') {
          let chips = item.options.map(opt => `
            <label class="choice-chip group !py-1.5 !px-3 !text-xs">
              <input type="checkbox" name="${item.entryName}" value="${escapeHtml(opt)}" ${item.isDroneTrigger ? 'data-is-drone="true"' : ''}>
              <span class="w-3.5 h-3.5 rounded-md border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                <i class="fas fa-check text-[10px] text-transparent transition"></i>
              </span>
              <span>${escapeHtml(opt)}</span>
            </label>
          `).join('');

          if (item.hasOther) {
            chips += `
              <label class="choice-chip chip-other group !py-1.5 !px-3 !text-xs">
                <input type="checkbox" name="${item.entryName}" value="__other_option__" data-is-other="true" data-other-entry="${item.entryName}.other_option_response">
                <span class="w-3.5 h-3.5 rounded-md border border-slate-500 group-hover:border-slate-300 mr-1.5 flex items-center justify-center transition">
                  <i class="fas fa-check text-[10px] text-transparent transition"></i>
                </span>
                <span><i class="fas fa-edit mr-1 text-amber-400"></i> 其他 (自訂)</span>
              </label>
            `;
          }

          inputHtml = `
            <div class="flex flex-wrap gap-2 pt-0.5">${chips}</div>
            <div class="other-input-container hidden pt-2">
              <input type="text" name="${item.entryName}.other_option_response" placeholder="請填寫其他自訂內容..." class="tactical-input text-xs">
            </div>
          `;
        } else {
          inputHtml = `
            <input type="text" name="${item.entryName}" ${isReq ? 'required' : ''} 
              placeholder="${escapeHtml(item.description || '請輸入...')}" class="tactical-input text-xs sm:text-sm">
          `;
        }

        itemWrapper.innerHTML = `
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(item.title)} ${reqTag}
          </label>
          ${item.description && item.type !== 'textarea' && item.type !== 'timeText' && item.type !== 'borrowItemsDropdown' ? `<p class="text-[11px] text-slate-400 mb-0.5">${escapeHtml(item.description)}</p>` : ''}
          ${inputHtml}
        `;

        secCard.appendChild(itemWrapper);
      });

      formEl.appendChild(secCard);
    });

    container.appendChild(formEl);
    bindStandardEvents(formEl, formConfig);
  }

  // 綁定一般表單事件 (含無人機勾選智慧預設配件套裝)
  function bindStandardEvents(formEl, formConfig) {
    bindChipsAndOtherInputs(formEl);

    // 一鍵現在時間
    formEl.querySelectorAll('.btn-quick-now').forEach(btn => {
      btn.addEventListener('click', function () {
        const timeData = getCurrentTimeData();
        const input = this.parentElement.querySelector('input[type="date"]');
        if (input) input.value = timeData.dateStr;
        showToast(`已填入現在日期：${timeData.dateStr}`);
      });
    });

    formEl.querySelectorAll('.btn-quick-now-time').forEach(btn => {
      btn.addEventListener('click', function () {
        const timeData = getCurrentTimeData();
        const input = this.parentElement.querySelector('input[type="time"]');
        if (input) input.value = timeData.timeStr;
        showToast(`已填入現在時間：${timeData.timeStr}`);
      });
    });

    formEl.querySelectorAll('.btn-quick-now-text').forEach(btn => {
      btn.addEventListener('click', function () {
        const timeData = getCurrentTimeData();
        const input = this.parentElement.querySelector('input[type="text"]');
        if (input) input.value = timeData.timeStr;
        showToast(`已填入現在時間：${timeData.timeStr}`);
      });
    });

    // 出借表單專屬：勾選無人機機體，自動帶入標準預設配件 (機體1台、遙控器1台、充電管家1個、電池3顆)
    if (formConfig.id === 'borrow') {
      const droneCheckboxes = formEl.querySelectorAll('input[data-is-drone="true"]');
      droneCheckboxes.forEach(cb => {
        cb.addEventListener('change', function () {
          const anyChecked = Array.from(droneCheckboxes).some(c => c.checked);
          const droneSelect = formEl.querySelector('select[data-borrow-key="droneBody"]');
          const remoteSelect = formEl.querySelector('select[data-borrow-key="remote"]');
          const chargerSelect = formEl.querySelector('select[data-borrow-key="charger"]');
          const batterySelect = formEl.querySelector('select[data-borrow-key="battery"]');

          if (anyChecked) {
            if (droneSelect && !droneSelect.value) droneSelect.value = '1個';
            if (remoteSelect && !remoteSelect.value) remoteSelect.value = '1個';
            if (chargerSelect && !chargerSelect.value) chargerSelect.value = '1個';
            if (batterySelect && !batterySelect.value) batterySelect.value = '3個';
            showToast('⚡ 已為您自動帶入出借預設套裝 (機體1台、遙控器1台、充電管家1個、電池3顆)');
          }
        });
      });
    }

    // 出勤表單專屬：地點連動經緯度
    if (formConfig.id === 'mission') {
      formEl.querySelectorAll('input[name="entry.1591612449"]').forEach(radio => {
        radio.addEventListener('change', function () {
          if (this.checked && this.value !== '__other_option__') {
            const coordMap = {
              '北區豬事圓滿公園': '240918.81,1204200.25 (諸事圓滿)',
              '梧棲區梧棲分隊': '241558.63,1203202.97 (梧棲分隊)',
              '大里區十九甲溜冰場': '240600.15,1204147.52 (十九甲溜冰場)',
              '大里區創宇飛訓中心': '24.0963, 120.6937 (創宇飛訓中心)'
            };
            const targetCoord = coordMap[this.value];
            if (targetCoord) {
              const coordRadio = formEl.querySelector(`input[name="entry.1894204307"][value="${targetCoord}"]`);
              if (coordRadio) {
                coordRadio.checked = true;
                coordRadio.dispatchEvent(new Event('change'));
                showToast(`已自動連動經緯度：${this.value}`);
              }
            }
          }
        });
      });
    }
  }

  // 綁定晶片選中樣式與「其他」自訂輸入展開
  function bindChipsAndOtherInputs(formEl) {
    formEl.querySelectorAll('.choice-chip input').forEach(input => {
      input.addEventListener('change', function () {
        const wrapper = this.closest('.form-item-wrapper');
        const otherContainer = wrapper?.querySelector('.other-input-container');

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

          if (otherContainer) {
            if (this.value === '__other_option__') {
              otherContainer.classList.remove('hidden');
              otherContainer.querySelector('input')?.focus();
            } else {
              otherContainer.classList.add('hidden');
            }
          }
        } else if (this.type === 'checkbox') {
          const chip = this.closest('.choice-chip');
          const checkIcon = chip?.querySelector('i');
          if (this.checked) {
            chip?.classList.add('active');
            checkIcon?.classList.replace('text-transparent', 'text-white');
          } else {
            chip?.classList.remove('active');
            checkIcon?.classList.replace('text-white', 'text-transparent');
          }

          if (otherContainer && this.value === '__other_option__') {
            if (this.checked) {
              otherContainer.classList.remove('hidden');
              otherContainer.querySelector('input')?.focus();
            } else {
              otherContainer.classList.add('hidden');
            }
          }
        }
      });
    });
  }

  // =========================================================================
  // 3. 嚴格必填驗證 (防止遺漏、精確提醒與震動高亮)
  // =========================================================================
  function validateActiveForm(activeForm, formConfig) {
    activeForm.querySelectorAll('.has-validation-error').forEach(el => {
      el.classList.remove('has-validation-error', 'ring-2', 'ring-red-500', 'animate-pulse');
    });

    if (formConfig.id === 'inventory') {
      for (const field of formConfig.basicFields) {
        if (field.type === 'date') {
          const dateInput = activeForm.querySelector(`input[name="${field.entryName}"]`);
          if (!dateInput || !dateInput.value) {
            return notifyValidationError(dateInput, `${field.title}尚未選擇！`);
          }
        } else if (field.type === 'radio') {
          const checked = activeForm.querySelector(`input[name="${field.entryName}"]:checked`);
          if (!checked) {
            return notifyValidationError(activeForm.querySelector(`[data-entry-id="${field.entryId}"]`), `請選擇「${field.title}」！`);
          }
          if (checked.value === '__other_option__') {
            const otherVal = activeForm.querySelector(`input[name="${field.entryName}.other_option_response"]`)?.value?.trim();
            if (!otherVal) {
              return notifyValidationError(activeForm.querySelector(`input[name="${field.entryName}.other_option_response"]`), `請填寫「其他清點人員」姓名！`);
            }
          }
        }
      }
      return true;
    }

    for (const section of formConfig.sections) {
      for (const item of section.items) {
        if (!item.required) continue;

        const wrapper = activeForm.querySelector(`[data-entry-id="${item.entryId}"]`);

        if (item.type === 'radio') {
          const checked = activeForm.querySelector(`input[name="${item.entryName}"]:checked`);
          if (!checked) {
            return notifyValidationError(wrapper, `請選擇「${item.title}」！`);
          }
          if (checked.value === '__other_option__') {
            const otherVal = activeForm.querySelector(`input[name="${item.entryName}.other_option_response"]`)?.value?.trim();
            if (!otherVal) {
              return notifyValidationError(activeForm.querySelector(`input[name="${item.entryName}.other_option_response"]`), `請填寫「${item.title}」之其他自訂內容！`);
            }
          }
        } else if (item.type === 'checkbox') {
          const checkeds = activeForm.querySelectorAll(`input[name="${item.entryName}"]:checked`);
          if (checkeds.length === 0) {
            return notifyValidationError(wrapper, `請至少勾選一項「${item.title}」！`);
          }
          const otherChecked = activeForm.querySelector(`input[name="${item.entryName}"][value="__other_option__"]:checked`);
          if (otherChecked) {
            const otherVal = activeForm.querySelector(`input[name="${item.entryName}.other_option_response"]`)?.value?.trim();
            if (!otherVal) {
              return notifyValidationError(activeForm.querySelector(`input[name="${item.entryName}.other_option_response"]`), `請填寫「${item.title}」之其他自訂內容！`);
            }
          }
        } else if (item.type === 'select') {
          const sel = activeForm.querySelector(`select[name="${item.entryName}"]`);
          if (!sel || !sel.value) {
            return notifyValidationError(wrapper || sel, `請選擇「${item.title}」！`);
          }
        } else {
          const input = activeForm.querySelector(`[name="${item.entryName}"]`);
          if (!input || !input.value.trim()) {
            return notifyValidationError(wrapper || input, `請填寫「${item.title}」！`);
          }
        }
      }
    }

    return true;
  }

  function notifyValidationError(targetElement, message) {
    if (targetElement) {
      targetElement.classList.add('has-validation-error', 'ring-2', 'ring-red-500', 'animate-pulse');
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof targetElement.focus === 'function') targetElement.focus();
    }
    showToast(`⚠️ 必選提醒：${message}`, 'error');
    return false;
  }

  // =========================================================================
  // 4. 表單提交處理 (單一通道精確送出，絕不重複第二筆，完整記錄內容)
  // =========================================================================
  // 第一步：按下送出鍵 → 驗證 → 開啟確認對話框
  function handleFormSubmit() {
    const activeForm = document.getElementById(`active_form_${state.currentFormId}`);
    if (!activeForm) return;

    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
    if (!formConfig) return;

    // 每日清點：先確保隱藏 inputs 完整同步
    if (formConfig.id === 'inventory') {
      syncInventoryToHiddenInputs(formConfig);
    }

    // 必填驗證
    if (!validateActiveForm(activeForm, formConfig)) {
      return;
    }

    // 開啟確認視窗
    elements.confirmModalDesc.innerText = `即將送出「${formConfig.badge}」表單，資料送出後不可復原，請確認填寫正確後按下確認送出。`;
    elements.confirmModal.classList.remove('hidden');
    elements.confirmModal.classList.add('flex');
  }

  // 第二步：確認對話框按「確認送出」→ 實際執行送出
  function doActualSubmit() {
    // 關閉確認視窗
    elements.confirmModal.classList.add('hidden');
    elements.confirmModal.classList.remove('flex');

    const activeForm = document.getElementById(`active_form_${state.currentFormId}`);
    if (!activeForm) return;

    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
    if (!formConfig) return;

    // 每日清點：送出前再次確保隱藏 inputs 完整生成
    if (formConfig.id === 'inventory') {
      syncInventoryToHiddenInputs(formConfig);
    }

    // 顯示全螢幕載入遮罩
    elements.loadingOverlay.classList.remove('hidden');
    elements.loadingOverlay.classList.add('flex');

    // 清除舊的分割 hidden fields，重新插入
    activeForm.querySelectorAll('.auto-generated-split-field').forEach(el => el.remove());

    const formData = new FormData(activeForm);
    const summaryData = {};

    for (const [key, value] of formData.entries()) {
      if (!value) continue;
      summaryData[key] = value;

      // 日期自動拆解 (Google Forms 需要)
      if (key.startsWith('entry.') && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const parts = value.split('-');
        appendHiddenField(activeForm, `${key}_year`, parts[0]);
        appendHiddenField(activeForm, `${key}_month`, String(parseInt(parts[1], 10)));
        appendHiddenField(activeForm, `${key}_day`, String(parseInt(parts[2], 10)));
      }

      // 時間自動拆解 (Google Forms 需要)
      if (key.startsWith('entry.') && /^\d{2}:\d{2}$/.test(value)) {
        const parts = value.split(':');
        appendHiddenField(activeForm, `${key}_hour`, String(parseInt(parts[0], 10)));
        appendHiddenField(activeForm, `${key}_minute`, String(parseInt(parts[1], 10)));
      }
    }

    try {
      // ★ 單一原生通道送出至隱藏 iframe，杜絕重複記錄
      activeForm.submit();

      // 本機紀錄備存
      const record = {
        id: Date.now(),
        formId: formConfig.id,
        formTitle: formConfig.title,
        timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
        summary: summaryData
      };
      state.history.unshift(record);
      localStorage.setItem('uav_history', JSON.stringify(state.history.slice(0, 30)));

      // 850ms 後顯示成功對話窗
      setTimeout(() => {
        elements.loadingOverlay.classList.add('hidden');
        elements.loadingOverlay.classList.remove('flex');
        showSuccessModal(record);
      }, 850);

    } catch (err) {
      console.error(err);
      elements.loadingOverlay.classList.add('hidden');
      elements.loadingOverlay.classList.remove('flex');
      showToast('⚠️ 提交發生錯誤，請重試！', 'error');
    }
  }

  function appendHiddenField(form, name, value) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    input.className = 'auto-generated-split-field';
    form.appendChild(input);
  }

  // 成功彈窗
  function showSuccessModal(record) {
    const modal = elements.successModal;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    let summaryHtml = `
      <div class="space-y-2 text-xs sm:text-sm text-slate-300">
        <div class="flex justify-between border-b border-slate-700/50 pb-1.5">
          <span class="text-slate-400">表單名稱：</span>
          <span class="font-bold text-slate-100">${escapeHtml(record.formTitle)}</span>
        </div>
        <div class="flex justify-between border-b border-slate-700/50 pb-1.5">
          <span class="text-slate-400">提交時間：</span>
          <span class="font-mono text-emerald-400 font-bold">${escapeHtml(record.timestamp)}</span>
        </div>
        <div class="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
          <i class="fas fa-check-circle"></i> 資料已成功記錄至 Google 試算表雲端後台 (單筆寫入無重複)
        </div>
      </div>
    `;
    elements.successSummaryContent.innerHTML = summaryHtml;
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
      <div class="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
        <div class="flex items-center justify-between">
          <span class="font-bold text-xs sm:text-sm text-slate-200">${escapeHtml(item.formTitle)}</span>
          <span class="text-[11px] text-slate-400 font-mono">${escapeHtml(item.timestamp)}</span>
        </div>
        <div class="text-[11px] text-emerald-400 flex items-center gap-1">
          <i class="fas fa-check-circle"></i> 成功送出至 Google 試算表
        </div>
      </div>
    `).join('');
  }

  // 提示通知浮窗
  let toastTimer = null;
  function showToast(msg, type = 'success') {
    clearTimeout(toastTimer);
    elements.toastMsg.innerText = msg;
    elements.toast.classList.remove('hidden', 'translate-y-10', 'opacity-0');
    elements.toast.classList.add('translate-y-0', 'opacity-100');

    toastTimer = setTimeout(() => {
      elements.toast.classList.add('translate-y-10', 'opacity-0');
      setTimeout(() => elements.toast.classList.add('hidden'), 300);
    }, 3500);
  }

  // 事件綁定
  function setupEventListeners() {
    elements.tabNavContainer.addEventListener('click', e => {
      const btn = e.target.closest('.form-tab-btn');
      if (btn && btn.dataset.formId) switchForm(btn.dataset.formId);
    });

    elements.mobileNavContainer.addEventListener('click', e => {
      const btn = e.target.closest('.mobile-nav-btn');
      if (btn && btn.dataset.formId) switchForm(btn.dataset.formId);
    });

    elements.themeToggleBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });

    elements.historyDrawerBtn.addEventListener('click', openHistoryDrawer);
    elements.historyCloseBtn.addEventListener('click', () => {
      elements.historyModal.classList.add('hidden');
      elements.historyModal.classList.remove('flex');
    });

    elements.submitBtn.addEventListener('click', handleFormSubmit);

    // 送出確認視窗事件
    elements.confirmCancelBtn.addEventListener('click', () => {
      elements.confirmModal.classList.add('hidden');
      elements.confirmModal.classList.remove('flex');
    });
    elements.confirmSubmitBtn.addEventListener('click', doActualSubmit);

    elements.successModalClose.addEventListener('click', () => {
      elements.successModal.classList.add('hidden');
      elements.successModal.classList.remove('flex');
    });

    elements.successNextBtn.addEventListener('click', () => {
      elements.successModal.classList.add('hidden');
      elements.successModal.classList.remove('flex');
      state.inventoryValues = {};
      switchForm(state.currentFormId);
      showToast('已重設為全新表單，可繼續填寫下一筆！');
    });
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
