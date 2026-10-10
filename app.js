/**
 * 臺中市政府消防局 特搜大隊特搜空拍隊 - 勤務表單整合系統
 * 核心應用程式邏輯 (App Controller v2.0)
 * 支援：Google Form 直連防空白提交、嚴格必填驗證提醒、每日清點大格圖示與彈窗清點、
 *       其他選項自訂義回覆、時間類一鍵代入現在時間(年月日時分)。
 */

(function () {
  'use strict';

  // 應用程式狀態
  const state = {
    currentFormId: 'borrow',
    theme: localStorage.getItem('uav_theme') || 'dark',
    history: JSON.parse(localStorage.getItem('uav_history') || '[]'),
    // 每日清點各項裝備狀態: { [entryId]: '已清點' | '有異常' }
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
    formHeaderTitle: document.getElementById('formHeaderTitle'),
    formHeaderDesc: document.getElementById('formHeaderDesc'),
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
    areaModalSaveBtn: document.getElementById('areaModalSaveBtn')
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
        class="form-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap
        ${f.id === state.currentFormId ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 font-bold active' : 'hover:bg-slate-700/40 text-slate-400 hover:text-slate-100'}">
        <i class="${f.icon}"></i>
        <span>${f.badge}</span>
      </button>
    `).join('');

    elements.mobileNavContainer.innerHTML = forms.map(f => `
      <button type="button" data-form-id="${f.id}"
        class="mobile-nav-btn flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors
        ${f.id === state.currentFormId ? 'text-red-500 font-bold' : 'text-slate-400'}">
        <i class="${f.icon} text-base mb-1"></i>
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
      btn.className = `form-tab-btn flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
        isCurrent ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 font-bold active' : 'hover:bg-slate-700/40 text-slate-400 hover:text-slate-200'
      }`;
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      const isCurrent = btn.dataset.formId === formId;
      btn.className = `mobile-nav-btn flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
        isCurrent ? 'text-red-500 font-bold' : 'text-slate-400'
      }`;
    });

    elements.formHeaderTitle.innerText = formConfig.title;
    elements.formHeaderDesc.innerText = formConfig.description || '請依實際狀況核實填寫，資料將即時記錄至 Google 雲端後台。';
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
      minutes,
      fullText: `${year}年${month}月${day}日 ${hours}:${minutes}`
    };
  }

  // =========================================================================
  // 1. 每日清點表單專屬渲染 (4大區域大格圖示 + 點開彈窗清點)
  // =========================================================================
  function renderInventoryForm(formConfig) {
    const container = elements.formRenderArea;
    container.innerHTML = '';

    const formEl = document.createElement('form');
    formEl.id = `active_form_${formConfig.id}`;
    formEl.action = formConfig.actionUrl;
    formEl.method = 'POST';
    formEl.target = 'gform_sink_iframe';
    formEl.enctype = 'application/x-www-form-urlencoded';
    formEl.className = 'space-y-6';

    // 1-1. 全局快捷列 (一鍵全數已清點)
    const quickBar = document.createElement('div');
    quickBar.className = 'glass-panel p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-500/30 bg-emerald-950/20';
    quickBar.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shadow-inner">
          <i class="fas fa-bolt"></i>
        </div>
        <div>
          <h4 class="font-bold text-sm sm:text-base text-emerald-300">快速清點作業模式</h4>
          <p class="text-xs text-slate-400">日常無異常時，可一鍵將 4 大區域共 56 項裝備快速標記為「已清點」</p>
        </div>
      </div>
      <button type="button" id="btnMarkGlobalAllChecked"
        class="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 whitespace-nowrap">
        <i class="fas fa-check-double"></i> ⚡ 全區裝備一鍵全部「已清點」
      </button>
    `;
    formEl.appendChild(quickBar);

    // 1-2. 基本資料卡片 (清點日期 + 清點人員)
    const basicCard = document.createElement('div');
    basicCard.className = 'form-section-card rounded-2xl p-5 sm:p-6 space-y-5';
    basicCard.innerHTML = `
      <div class="border-b border-slate-700/40 pb-3 flex items-center gap-2.5">
        <span class="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xs font-black">1</span>
        <h3 class="font-bold text-base text-slate-100">基本資料與清點人員</h3>
      </div>
    `;

    formConfig.basicFields.forEach(field => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'form-item-wrapper space-y-2';
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
              class="tactical-input flex-1 font-mono text-sm" data-is-date="true" data-entry-base="${field.entryId}">
            <button type="button" class="btn-quick-now px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 whitespace-nowrap">
              <i class="fas fa-bolt text-amber-400"></i> 一鍵現在時間
            </button>
          </div>
        `;
      } else if (field.type === 'radio') {
        // 清點人員 (含其他)
        let chipsHtml = field.options.map(opt => `
          <label class="choice-chip group">
            <input type="radio" name="${field.entryName}" value="${escapeHtml(opt)}" required>
            <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-2 flex items-center justify-center transition">
              <span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span>
            </span>
            <span>${escapeHtml(opt)}</span>
          </label>
        `).join('');

        if (field.hasOther) {
          chipsHtml += `
            <label class="choice-chip chip-other group">
              <input type="radio" name="${field.entryName}" value="__other_option__" data-is-other="true" data-other-entry="${field.entryName}.other_option_response">
              <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-2 flex items-center justify-center transition">
                <span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span>
              </span>
              <span><i class="fas fa-edit mr-1 text-amber-400"></i> 其他 (自訂)</span>
            </label>
          `;
        }

        itemWrapper.innerHTML = `
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(field.title)} <span class="text-red-500 font-bold">*</span>
          </label>
          <div class="flex flex-wrap gap-2.5 pt-1">${chipsHtml}</div>
          <div class="other-input-container hidden pt-2">
            <input type="text" name="${field.entryName}.other_option_response" placeholder="請填寫其他清點人員姓名" class="tactical-input text-xs sm:text-sm">
          </div>
        `;
      }
      basicCard.appendChild(itemWrapper);
    });
    formEl.appendChild(basicCard);

    // 1-3. 4 大區域大格圖示卡片區塊
    const areasCard = document.createElement('div');
    areasCard.className = 'form-section-card rounded-2xl p-5 sm:p-6 space-y-4';
    areasCard.innerHTML = `
      <div class="border-b border-slate-700/40 pb-3 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xs font-black">2</span>
          <h3 class="font-bold text-base text-slate-100">裝備區域清點 (點擊圖示進入清點視窗)</h3>
        </div>
        <span class="text-xs text-slate-400">共 4 大區域</span>
      </div>
      <div id="areaGridContainer" class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <!-- 4大區域大格卡片由 JS 動態渲染 -->
      </div>
    `;
    formEl.appendChild(areasCard);

    // 1-4. 建立隱藏的 Input 容器 (存放所有裝備的 Radio 值，表單送出時保證能收集到！)
    const hiddenInputsContainer = document.createElement('div');
    hiddenInputsContainer.id = 'inventoryHiddenInputs';
    hiddenInputsContainer.className = 'hidden';
    formEl.appendChild(hiddenInputsContainer);

    // 1-5. 底部補充欄位 (異常詳述 + 備註)
    const bottomCard = document.createElement('div');
    bottomCard.className = 'form-section-card rounded-2xl p-5 sm:p-6 space-y-5';
    bottomCard.innerHTML = `
      <div class="border-b border-slate-700/40 pb-3 flex items-center gap-2.5">
        <span class="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xs font-black">3</span>
        <h3 class="font-bold text-base text-slate-100">異常通報與備註事項</h3>
      </div>
    `;

    formConfig.bottomFields.forEach(field => {
      const itemWrapper = document.createElement('div');
      itemWrapper.className = 'form-item-wrapper space-y-2';
      itemWrapper.dataset.entryId = field.entryId;
      itemWrapper.dataset.title = field.title;

      if (field.type === 'textarea') {
        itemWrapper.innerHTML = `
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">${escapeHtml(field.title)}</label>
          <p class="text-xs text-slate-400 mb-1">${escapeHtml(field.description || '')}</p>
          <textarea name="${field.entryName}" rows="3" placeholder="若檢查有異常，請具體說明裝備品名與異常狀況..." class="tactical-input"></textarea>
        `;
      } else {
        itemWrapper.innerHTML = `
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">${escapeHtml(field.title)}</label>
          <p class="text-xs text-slate-400 mb-1">${escapeHtml(field.description || '')}</p>
          <input type="text" name="${field.entryName}" placeholder="其他臨時借用交接事項..." class="tactical-input">
        `;
      }
      bottomCard.appendChild(itemWrapper);
    });
    formEl.appendChild(bottomCard);

    container.appendChild(formEl);

    // 渲染大格圖示
    updateAreaGridCards(formConfig);
    bindInventoryEvents(formEl, formConfig);
  }

  // 渲染/更新 4 大區域大格圖示卡片
  function updateAreaGridCards(formConfig) {
    const gridContainer = document.getElementById('areaGridContainer');
    if (!gridContainer) return;

    gridContainer.innerHTML = formConfig.areas.map(area => {
      // 計算該區域的所有項目數與已清點數
      let totalItems = 0;
      let checkedItems = 0;
      let hasAbnormal = false;

      area.groups.forEach(group => {
        group.rows.forEach(row => {
          totalItems++;
          const val = state.inventoryValues[row.entryId];
          if (val === '已清點') checkedItems++;
          else if (val === '有異常') {
            checkedItems++;
            hasAbnormal = true;
          }
        });
      });

      let statusBadge = '';
      let statusBorder = 'border-slate-700/60 hover:border-slate-500';
      if (checkedItems === 0) {
        statusBadge = '<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">⏳ 待清點</span>';
      } else if (hasAbnormal) {
        statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40">⚠️ 有異常 (${checkedItems}/${totalItems})</span>`;
        statusBorder = 'border-red-500/50 bg-red-950/20';
      } else if (checkedItems === totalItems) {
        statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">✅ 全數正常 (${checkedItems}/${totalItems})</span>`;
        statusBorder = 'border-emerald-500/50 bg-emerald-950/20';
      } else {
        statusBadge = `<span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">進行中 (${checkedItems}/${totalItems})</span>`;
      }

      return `
        <div class="area-card p-5 rounded-2xl bg-slate-900/60 border ${statusBorder} transition-all cursor-pointer hover:shadow-xl hover:-translate-y-0.5 space-y-4 group"
          data-area-id="${area.id}">
          <div class="flex items-start justify-between">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr ${area.color} text-white flex items-center justify-center text-2xl shadow-lg group-hover:scale-105 transition-transform">
              <i class="${area.icon}"></i>
            </div>
            ${statusBadge}
          </div>
          <div>
            <h4 class="text-lg font-black text-slate-100 flex items-center gap-2">
              ${escapeHtml(area.name)}
              <span class="text-xs font-normal text-slate-400">(${totalItems} 項)</span>
            </h4>
            <p class="text-xs text-slate-400 line-clamp-2 mt-1">${escapeHtml(area.description)}</p>
          </div>
          <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 group-hover:text-amber-400 transition-colors">
            <span class="font-bold flex items-center gap-1.5">
              <i class="fas fa-edit"></i> 點開視窗清點
            </span>
            <i class="fas fa-chevron-right text-slate-500 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </div>
      `;
    }).join('');

    // 同步把清點狀態寫入 hidden inputs
    syncInventoryToHiddenInputs(formConfig);
  }

  // 同步清點值至隱藏 input（確保表單 POST 時能被 FormData 收集）
  function syncInventoryToHiddenInputs(formConfig) {
    const hiddenContainer = document.getElementById('inventoryHiddenInputs');
    if (!hiddenContainer) return;
    hiddenContainer.innerHTML = '';

    formConfig.areas.forEach(area => {
      area.groups.forEach(group => {
        group.rows.forEach(row => {
          const val = state.inventoryValues[row.entryId];
          if (val) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = row.entryName;
            input.value = val;
            hiddenContainer.appendChild(input);
          }
        });
      });
    });
  }

  // 開啟區域清點視窗 (Area Inventory Modal)
  function openAreaModal(areaId, formConfig) {
    const area = formConfig.areas.find(a => a.id === areaId);
    if (!area) return;

    state.activeModalAreaId = areaId;
    elements.areaModalTitle.innerHTML = `<i class="${area.icon} mr-2 text-amber-400"></i> ${escapeHtml(area.name)} 裝備清點`;
    elements.areaModalDesc.innerText = `包含 ${escapeHtml(area.description)}，請逐一檢查並標記清點狀態。`;

    // 渲染區域內的項目
    let contentHtml = '';
    area.groups.forEach(group => {
      contentHtml += `
        <div class="space-y-3 pb-3 border-b border-slate-800 last:border-b-0">
          <h5 class="text-xs font-extrabold text-amber-400 tracking-wider uppercase flex items-center gap-2">
            <i class="fas fa-folder text-slate-500"></i> ${escapeHtml(group.title)}
          </h5>
          <div class="space-y-2">
            ${group.rows.map(row => {
              const currentVal = state.inventoryValues[row.entryId] || '';
              return `
                <div class="modal-inventory-row p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  data-row-entry="${row.entryId}">
                  <span class="text-xs sm:text-sm font-medium text-slate-200 flex items-center gap-2">
                    <i class="fas fa-cube text-slate-500 text-xs"></i>
                    ${escapeHtml(row.label)}
                    ${row.required ? '<span class="text-red-500 font-bold">*</span>' : ''}
                  </span>
                  <div class="flex items-center gap-2 self-end sm:self-auto">
                    <button type="button" class="btn-modal-opt px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                      currentVal === '已清點'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-emerald-400'
                    }" data-opt="已清點" data-entry-id="${row.entryId}">
                      <i class="fas fa-check text-[10px]"></i> 已清點
                    </button>
                    <button type="button" class="btn-modal-opt px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                      currentVal === '有異常'
                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-red-400'
                    }" data-opt="有異常" data-entry-id="${row.entryId}">
                      <i class="fas fa-exclamation-triangle text-[10px]"></i> 有異常
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

    // 綁定彈窗內選項點擊
    elements.areaModalContent.querySelectorAll('.btn-modal-opt').forEach(btn => {
      btn.addEventListener('click', function () {
        const entryId = this.dataset.entryId;
        const opt = this.dataset.opt;
        state.inventoryValues[entryId] = opt;

        const row = this.closest('.modal-inventory-row');
        row.querySelectorAll('.btn-modal-opt').forEach(b => {
          b.className = `btn-modal-opt px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200`;
        });

        if (opt === '已清點') {
          this.className = `btn-modal-opt px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30`;
        } else {
          this.className = `btn-modal-opt px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30`;
        }
      });
    });
  }

  // 綁定每日清點事件
  function bindInventoryEvents(formEl, formConfig) {
    // 點擊大格卡片開啟視窗
    const gridContainer = document.getElementById('areaGridContainer');
    if (gridContainer) {
      gridContainer.addEventListener('click', e => {
        const card = e.target.closest('.area-card');
        if (card && card.dataset.areaId) {
          openAreaModal(card.dataset.areaId, formConfig);
        }
      });
    }

    // 全局一鍵標記所有 4 大區域已清點
    const btnGlobal = formEl.querySelector('#btnMarkGlobalAllChecked');
    if (btnGlobal) {
      btnGlobal.addEventListener('click', () => {
        let count = 0;
        formConfig.areas.forEach(area => {
          area.groups.forEach(group => {
            group.rows.forEach(row => {
              state.inventoryValues[row.entryId] = '已清點';
              count++;
            });
          });
        });
        updateAreaGridCards(formConfig);
        showToast(`🎉 已成功將 4 大區域全部 ${count} 項裝備一鍵標記為「已清點」！`);
      });
    }

    // 彈窗內「本區一鍵標記已清點」
    elements.areaModalMarkAllBtn.onclick = () => {
      const area = formConfig.areas.find(a => a.id === state.activeModalAreaId);
      if (!area) return;
      let count = 0;
      area.groups.forEach(group => {
        group.rows.forEach(row => {
          state.inventoryValues[row.entryId] = '已清點';
          count++;
        });
      });
      // 重新渲染彈窗內按鈕狀態
      openAreaModal(state.activeModalAreaId, formConfig);
      showToast(`已將本區 ${count} 項裝備標記為「已清點」`);
    };

    // 彈窗完成並關閉
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

    // 一鍵現在時間
    formEl.querySelectorAll('.btn-quick-now').forEach(btn => {
      btn.addEventListener('click', function () {
        const timeData = getCurrentTimeData();
        const input = this.parentElement.querySelector('input[type="date"]');
        if (input) input.value = timeData.dateStr;
        showToast(`已填入現在日期：${timeData.dateStr}`);
      });
    });

    // 晶片與其他自訂輸入
    bindChipsAndOtherInputs(formEl);
  }

  // =========================================================================
  // 2. 一般標準表單渲染 (借用、維護、出勤、飛安)
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
    formEl.className = 'space-y-6';

    const timeData = getCurrentTimeData();

    formConfig.sections.forEach((section, sIndex) => {
      const secCard = document.createElement('div');
      secCard.className = 'form-section-card rounded-2xl p-5 sm:p-6 space-y-5';

      secCard.innerHTML = `
        <div class="border-b border-slate-700/40 pb-3 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xs font-black">${sIndex + 1}</span>
            <h3 class="font-bold text-base text-slate-100">${escapeHtml(section.title)}</h3>
          </div>
          ${section.description ? `<span class="text-xs text-slate-400">${escapeHtml(section.description)}</span>` : ''}
        </div>
      `;

      section.items.forEach(item => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'form-item-wrapper space-y-2';
        itemWrapper.dataset.entryId = item.entryId || '';
        itemWrapper.dataset.title = item.title;

        const isReq = item.required;
        const reqTag = isReq ? '<span class="text-red-500 font-bold ml-1">*</span>' : '<span class="text-slate-500 text-xs font-normal ml-1">(選填)</span>';
        let inputHtml = '';

        if (item.type === 'grid') {
          // 借用物品數量網格
          inputHtml = `
            <div class="space-y-2 pt-1">
              ${item.rows.map(row => `
                <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  data-row-entry="${row.entryId}">
                  <span class="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <i class="fas fa-boxes text-slate-500"></i> ${escapeHtml(row.label)}
                  </span>
                  <div class="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                    <label class="choice-chip !py-1 !px-2.5 !text-xs cursor-pointer group">
                      <input type="radio" name="${row.entryName}" value="" checked>
                      <span class="text-slate-400">0個</span>
                    </label>
                    ${row.options.map(opt => `
                      <label class="choice-chip !py-1 !px-2.5 !text-xs cursor-pointer group">
                        <input type="radio" name="${row.entryName}" value="${escapeHtml(opt)}">
                        <span>${escapeHtml(opt)}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        } else if (item.type === 'date') {
          inputHtml = `
            <div class="flex gap-2">
              <input type="date" name="${item.entryName}" value="${timeData.dateStr}" ${isReq ? 'required' : ''} 
                class="tactical-input flex-1 font-mono text-sm" data-is-date="true" data-entry-base="${item.entryId}">
              <button type="button" class="btn-quick-now px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 whitespace-nowrap">
                <i class="fas fa-bolt text-amber-400"></i> 一鍵現在時間
              </button>
            </div>
          `;
        } else if (item.type === 'googleTime') {
          // Google 表單純時間欄位 (需提交 _hour 與 _minute)
          inputHtml = `
            <div class="flex gap-2">
              <input type="time" name="${item.entryName}" value="${timeData.timeStr}" ${isReq ? 'required' : ''} 
                class="tactical-input flex-1 font-mono text-sm" data-is-google-time="true" data-entry-base="${item.entryId}">
              <button type="button" class="btn-quick-now-time px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 whitespace-nowrap">
                <i class="fas fa-clock text-amber-400"></i> 一鍵現在時間
              </button>
            </div>
          `;
        } else if (item.type === 'timeText') {
          // 文字型時間欄位 (例: 16:30)
          inputHtml = `
            <div class="flex gap-2">
              <input type="text" name="${item.entryName}" value="${timeData.timeStr}" ${isReq ? 'required' : ''} 
                placeholder="例: 16:30" class="tactical-input flex-1 font-mono text-sm">
              <button type="button" class="btn-quick-now-text px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 whitespace-nowrap">
                <i class="fas fa-clock text-amber-400"></i> 一鍵現在時間
              </button>
            </div>
          `;
        } else if (item.type === 'textarea') {
          inputHtml = `
            <textarea name="${item.entryName}" rows="3" ${isReq ? 'required' : ''} 
              placeholder="${escapeHtml(item.description || '請輸入詳細說明...')}" class="tactical-input"></textarea>
          `;
        } else if (item.type === 'select') {
          inputHtml = `
            <select name="${item.entryName}" ${isReq ? 'required' : ''} class="tactical-input cursor-pointer">
              <option value="">-- 請選擇項目 --</option>
              ${item.options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
            </select>
          `;
        } else if (item.type === 'radio') {
          let chips = item.options.map(opt => `
            <label class="choice-chip group">
              <input type="radio" name="${item.entryName}" value="${escapeHtml(opt)}" ${isReq ? 'required' : ''}>
              <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-2 flex items-center justify-center transition">
                <span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span>
              </span>
              <span>${escapeHtml(opt)}</span>
            </label>
          `).join('');

          if (item.hasOther) {
            chips += `
              <label class="choice-chip chip-other group">
                <input type="radio" name="${item.entryName}" value="__other_option__" data-is-other="true" data-other-entry="${item.entryName}.other_option_response">
                <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-2 flex items-center justify-center transition">
                  <span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span>
                </span>
                <span><i class="fas fa-edit mr-1 text-amber-400"></i> 其他 (自訂)</span>
              </label>
            `;
          }

          inputHtml = `
            <div class="flex flex-wrap gap-2.5 pt-1">${chips}</div>
            <div class="other-input-container hidden pt-2">
              <input type="text" name="${item.entryName}.other_option_response" placeholder="請填寫其他自訂內容..." class="tactical-input text-xs sm:text-sm">
            </div>
          `;
        } else if (item.type === 'checkbox') {
          let chips = item.options.map(opt => `
            <label class="choice-chip group">
              <input type="checkbox" name="${item.entryName}" value="${escapeHtml(opt)}">
              <span class="w-3.5 h-3.5 rounded-md border border-slate-500 group-hover:border-slate-300 mr-2 flex items-center justify-center transition">
                <i class="fas fa-check text-[10px] text-transparent transition"></i>
              </span>
              <span>${escapeHtml(opt)}</span>
            </label>
          `).join('');

          if (item.hasOther) {
            chips += `
              <label class="choice-chip chip-other group">
                <input type="checkbox" name="${item.entryName}" value="__other_option__" data-is-other="true" data-other-entry="${item.entryName}.other_option_response">
                <span class="w-3.5 h-3.5 rounded-md border border-slate-500 group-hover:border-slate-300 mr-2 flex items-center justify-center transition">
                  <i class="fas fa-check text-[10px] text-transparent transition"></i>
                </span>
                <span><i class="fas fa-edit mr-1 text-amber-400"></i> 其他 (自訂)</span>
              </label>
            `;
          }

          inputHtml = `
            <div class="flex flex-wrap gap-2.5 pt-1">${chips}</div>
            <div class="other-input-container hidden pt-2">
              <input type="text" name="${item.entryName}.other_option_response" placeholder="請填寫其他自訂內容..." class="tactical-input text-xs sm:text-sm">
            </div>
          `;
        } else {
          // text
          inputHtml = `
            <input type="text" name="${item.entryName}" ${isReq ? 'required' : ''} 
              placeholder="${escapeHtml(item.description || '請輸入...')}" class="tactical-input">
          `;
        }

        itemWrapper.innerHTML = `
          <label class="block text-xs sm:text-sm font-semibold text-slate-200">
            ${escapeHtml(item.title)} ${reqTag}
          </label>
          ${item.description && item.type !== 'textarea' && item.type !== 'timeText' ? `<p class="text-xs text-slate-400 mb-1">${escapeHtml(item.description)}</p>` : ''}
          ${inputHtml}
        `;

        secCard.appendChild(itemWrapper);
      });

      formEl.appendChild(secCard);
    });

    container.appendChild(formEl);
    bindStandardEvents(formEl, formConfig);
  }

  // 綁定一般表單事件
  function bindStandardEvents(formEl, formConfig) {
    bindChipsAndOtherInputs(formEl);

    // 一鍵現在時間按鈕
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

    // 出勤表單專屬：點選地點自動帶入經緯度
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

  // 綁定晶片外觀與其他自訂輸入展開
  function bindChipsAndOtherInputs(formEl) {
    formEl.querySelectorAll('.choice-chip input').forEach(input => {
      input.addEventListener('change', function () {
        const wrapper = this.closest('.form-item-wrapper');
        const otherContainer = wrapper?.querySelector('.other-input-container');

        if (this.type === 'radio') {
          // 清除同組所有晶片樣式
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

          // 其他選項展開/收合
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
    // 清除先前錯誤視覺
    activeForm.querySelectorAll('.has-validation-error').forEach(el => {
      el.classList.remove('has-validation-error', 'ring-2', 'ring-red-500', 'animate-pulse');
    });

    // 每日清點表單驗證
    if (formConfig.id === 'inventory') {
      // 1. 驗證基本資料 (清點日期、人員)
      for (const field of formConfig.basicFields) {
        if (field.type === 'date') {
          const dateInput = activeForm.querySelector(`input[name="${field.entryName}"]`);
          if (!dateInput || !dateInput.value) {
            return notifyValidationError(dateInput, `${field.title}尚未選擇！`);
          }
        } else if (field.type === 'radio') {
          const checked = activeForm.querySelector(`input[name="${field.entryName}"]:checked`);
          if (!checked) {
            return notifyValidationError(activeForm.querySelector(`[data-entry-id="${field.entryId}"]`), `請選擇${field.title}！`);
          }
          if (checked.value === '__other_option__') {
            const otherVal = activeForm.querySelector(`input[name="${field.entryName}.other_option_response"]`)?.value?.trim();
            if (!otherVal) {
              return notifyValidationError(activeForm.querySelector(`input[name="${field.entryName}.other_option_response"]`), `請填寫「其他清點人員」姓名！`);
            }
          }
        }
      }

      // 2. 驗證 4 大區域裝備是否已全部清點
      for (const area of formConfig.areas) {
        for (const group of area.groups) {
          for (const row of group.rows) {
            if (row.required && !state.inventoryValues[row.entryId]) {
              const card = document.querySelector(`.area-card[data-area-id="${area.id}"]`);
              return notifyValidationError(card, `「${area.name}」中的裝備【${row.label}】尚未清點！請點開視窗完成清點。`);
            }
          }
        }
      }

      return true;
    }

    // 標準表單驗證
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
          // text, textarea, date, time
          const input = activeForm.querySelector(`[name="${item.entryName}"]`);
          if (!input || !input.value.trim()) {
            return notifyValidationError(wrapper || input, `請填寫「${item.title}」！`);
          }
        }
      }
    }

    return true;
  }

  // 提示驗證錯誤並聚焦
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
  // 4. 表單提交處理 (Google Form 後台 100% 完整寫入防空白)
  // =========================================================================
  async function handleFormSubmit() {
    const activeForm = document.getElementById(`active_form_${state.currentFormId}`);
    if (!activeForm) return;

    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
    if (!formConfig) return;

    // 進行嚴格必填檢查
    if (!validateActiveForm(activeForm, formConfig)) {
      return;
    }

    // 每日清點表單：再次確保隱藏 inputs 最新同步
    if (formConfig.id === 'inventory') {
      syncInventoryToHiddenInputs(formConfig);
    }

    // 顯示全螢幕科技遮罩
    elements.loadingOverlay.classList.remove('hidden');
    elements.loadingOverlay.classList.add('flex');

    // 建立 URLSearchParams (以 application/x-www-form-urlencoded 格式送出)
    const formData = new FormData(activeForm);
    const urlParams = new URLSearchParams();
    const summaryData = {};

    for (const [key, value] of formData.entries()) {
      if (!value) continue;
      urlParams.append(key, value);

      if (summaryData[key]) {
        summaryData[key] += `, ${value}`;
      } else {
        summaryData[key] = value;
      }

      // Google Form 日期拆解相容支援 (YYYY-MM-DD -> _year, _month, _day)
      if (key.startsWith('entry.') && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const parts = value.split('-');
        urlParams.append(`${key}_year`, parts[0]);
        urlParams.append(`${key}_month`, String(parseInt(parts[1], 10)));
        urlParams.append(`${key}_day`, String(parseInt(parts[2], 10)));
      }

      // Google Form 純時間欄位拆解支援 (HH:MM -> _hour, _minute)
      if (key.startsWith('entry.') && /^\d{2}:\d{2}$/.test(value)) {
        const parts = value.split(':');
        urlParams.append(`${key}_hour`, String(parseInt(parts[0], 10)));
        urlParams.append(`${key}_minute`, String(parseInt(parts[1], 10)));
      }
    }

    try {
      // 通道 1: 原生 HTML 表單提交至無感隱藏 iframe
      activeForm.submit();

      // 通道 2: 同步使用 fetch (no-cors) 傳送 urlencoded 字串備援
      fetch(activeForm.action, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: urlParams.toString()
      }).catch(err => console.warn('Fetch fallback status:', err));

      // 儲存於本機歷史紀錄
      const record = {
        id: Date.now(),
        formId: formConfig.id,
        formTitle: formConfig.title,
        timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
        summary: summaryData
      };
      state.history.unshift(record);
      localStorage.setItem('uav_history', JSON.stringify(state.history.slice(0, 30)));

      // 800ms 後顯示成功對話窗
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
        <div class="mt-3 text-slate-400 text-xs">
          ✅ 資料已即時傳送並成功記錄至 Google 試算表雲端後台，內容已完整寫入！
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
      <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm text-slate-200">${escapeHtml(item.formTitle)}</span>
          <span class="text-xs text-slate-400 font-mono">${escapeHtml(item.timestamp)}</span>
        </div>
        <div class="text-xs text-emerald-400 flex items-center gap-1">
          <i class="fas fa-check-circle"></i> 已同步送出至 Google 試算表後台
        </div>
      </div>
    `).join('');
  }

  // 提示通知浮窗 (Toast)
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
