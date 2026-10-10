/**
 * 臺中市政府消防局 特搜大隊特搜空拍隊 - 勤務表單整合系統
 * 核心應用程式邏輯 (App Controller)
 */

(function () {
  'use strict';

  // 狀態管理
  const state = {
    currentFormId: 'borrow',
    theme: localStorage.getItem('uav_theme') || 'dark',
    history: JSON.parse(localStorage.getItem('uav_history') || '[]'),
    drafts: JSON.parse(localStorage.getItem('uav_drafts') || '{}'),
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
    successModal: document.getElementById('successModal'),
    successModalClose: document.getElementById('successModalClose'),
    successNextBtn: document.getElementById('successNextBtn'),
    successSummaryContent: document.getElementById('successSummaryContent'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toastNotification'),
    toastMsg: document.getElementById('toastMsg')
  };

  // 初始化程式
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

  // 渲染頂部與手機版導覽列
  function renderNavigation() {
    if (!window.FORMS_DATA || !window.FORMS_DATA.forms) return;
    const forms = window.FORMS_DATA.forms;

    // 桌面版橫向 Tab
    elements.tabNavContainer.innerHTML = forms.map(f => `
      <button type="button" data-form-id="${f.id}" 
        class="form-tab-btn flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap
        ${f.id === state.currentFormId ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 font-semibold' : 'hover:bg-slate-700/40 text-slate-400 hover:text-slate-100'}">
        <i class="${f.icon}"></i>
        <span>${f.badge}</span>
      </button>
    `).join('');

    // 手機版底部導覽列
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

    // 更新導覽列高亮
    document.querySelectorAll('.form-tab-btn').forEach(btn => {
      const isCurrent = btn.dataset.formId === formId;
      btn.className = `form-tab-btn flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
        isCurrent ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 font-semibold active' : 'hover:bg-slate-700/40 text-slate-400 hover:text-slate-200'
      }`;
    });

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      const isCurrent = btn.dataset.formId === formId;
      btn.className = `mobile-nav-btn flex-1 flex flex-col items-center justify-center py-2 text-xs transition-colors ${
        isCurrent ? 'text-red-500 font-bold' : 'text-slate-400'
      }`;
    });

    // 更新表頭資訊
    elements.formHeaderTitle.innerText = formConfig.title;
    elements.formHeaderDesc.innerText = formConfig.description || '請依實際狀況核實填寫，資料將即時記錄至後台。';
    elements.formBadge.innerText = formConfig.badge;
    elements.formOfficialLink.href = formConfig.viewUrl;

    // 渲染該表單的所有輸入欄位
    renderFormFields(formConfig);

    // 捲動至表單頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    formEl.className = 'space-y-6';

    // 每日清點表單專屬：一鍵全數已清點按鈕
    if (formConfig.id === 'inventory') {
      const quickActionBar = document.createElement('div');
      quickActionBar.className = 'flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 shadow-inner';
      quickActionBar.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
            <i class="fas fa-bolt"></i>
          </div>
          <div>
            <h4 class="font-bold text-sm text-emerald-300">快速清點作業輔助</h4>
            <p class="text-xs text-slate-400">裝備無異常時可一鍵快速設定，遇異常單項再修改</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="btnMarkAllChecked" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2">
            <i class="fas fa-check-double"></i> ⚡ 一鍵標記全數「已清點」
          </button>
        </div>
      `;
      formEl.appendChild(quickActionBar);
    }

    // 遍歷所有區段 (Sections)
    formConfig.sections.forEach((section, sIndex) => {
      const secCard = document.createElement('div');
      secCard.className = 'form-section-card rounded-2xl p-5 sm:p-6 space-y-5';

      // 區段標題
      const secHeader = document.createElement('div');
      secHeader.className = 'border-b border-slate-700/40 pb-3 flex items-center justify-between';
      secHeader.innerHTML = `
        <div class="flex items-center gap-2.5">
          <span class="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center text-xs font-black">${sIndex + 1}</span>
          <h3 class="font-bold text-base text-slate-100">${escapeHtml(section.title)}</h3>
        </div>
        ${section.description ? `<span class="text-xs text-slate-400">${escapeHtml(section.description)}</span>` : ''}
      `;
      secCard.appendChild(secHeader);

      // 區段內的所有項目
      section.items.forEach(item => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'form-item-wrapper space-y-2';

        if (item.type === 'grid') {
          // 矩陣網格題目 (例如每日清點中的裝備項目組)
          itemWrapper.innerHTML = `
            <div class="flex items-center justify-between mb-2">
              <label class="block font-semibold text-sm text-slate-200">
                ${escapeHtml(item.title)}
              </label>
            </div>
            <div class="space-y-2.5">
              ${item.rows.map(row => `
                <div class="inventory-row flex flex-col sm:flex-row sm:items-center justify-between gap-2.5" data-row-entry="${row.entryName}">
                  <span class="text-xs sm:text-sm font-medium text-slate-300 flex items-center gap-2">
                    <i class="fas fa-cube text-slate-500 text-xs"></i>
                    ${escapeHtml(row.label)}
                    ${row.required ? '<span class="text-red-500">*</span>' : ''}
                  </span>
                  <div class="status-pill-group self-end sm:self-auto flex items-center gap-1.5">
                    ${row.options.map(opt => `
                      <label class="status-pill-btn cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        opt === '已清點' ? 'hover:text-emerald-400' : 'hover:text-rose-400'
                      }">
                        <input type="radio" name="${row.entryName}" value="${escapeHtml(opt)}" 
                          ${row.required ? 'required' : ''} class="hidden grid-radio" data-opt="${opt}">
                        <span class="opt-indicator w-2 h-2 rounded-full border border-current"></span>
                        <span>${escapeHtml(opt)}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        } else {
          // 一般輸入欄位 (Text, Date, Time, Radio, Checkbox, Select, Textarea)
          const isReq = item.required;
          const reqTag = isReq ? '<span class="text-red-500 font-bold ml-1">*</span>' : '<span class="text-slate-500 text-xs font-normal ml-1">(選填)</span>';
          
          let inputHtml = '';
          const todayStr = new Date().toISOString().split('T')[0];
          const nowStr = new Date().toTimeString().slice(0, 5);

          switch (item.type) {
            case 'date':
              inputHtml = `
                <div class="flex gap-2">
                  <input type="date" name="${item.entryName}" value="${todayStr}" ${isReq ? 'required' : ''} 
                    class="tactical-input flex-1 font-mono text-sm">
                  <button type="button" class="btn-set-today px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1">
                    <i class="fas fa-calendar-day text-amber-400"></i> 今日
                  </button>
                </div>
              `;
              break;

            case 'time':
              inputHtml = `
                <div class="flex gap-2">
                  <input type="time" name="${item.entryName}" value="${nowStr}" ${isReq ? 'required' : ''} 
                    class="tactical-input flex-1 font-mono text-sm">
                  <button type="button" class="btn-set-now px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition flex items-center gap-1">
                    <i class="fas fa-clock text-amber-400"></i> 現在
                  </button>
                </div>
              `;
              break;

            case 'textarea':
              inputHtml = `
                <textarea name="${item.entryName}" rows="3" ${isReq ? 'required' : ''} 
                  placeholder="${escapeHtml(item.description || '請輸入詳細說明...')}"
                  class="tactical-input"></textarea>
              `;
              break;

            case 'select':
              inputHtml = `
                <select name="${item.entryName}" ${isReq ? 'required' : ''} class="tactical-input cursor-pointer">
                  <option value="">-- 請選擇項目 --</option>
                  ${item.options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
                </select>
              `;
              break;

            case 'radio':
              // 單選晶片組
              inputHtml = `
                <div class="flex flex-wrap gap-2.5 pt-1">
                  ${item.options.map((opt, oIdx) => `
                    <label class="choice-chip group">
                      <input type="radio" name="${item.entryName}" value="${escapeHtml(opt)}" ${isReq && oIdx === 0 ? '' : ''}>
                      <span class="w-3.5 h-3.5 rounded-full border border-slate-500 group-hover:border-slate-300 mr-2 flex items-center justify-center transition">
                        <span class="dot w-1.5 h-1.5 rounded-full bg-transparent transition"></span>
                      </span>
                      <span>${escapeHtml(opt)}</span>
                    </label>
                  `).join('')}
                </div>
              `;
              break;

            case 'checkbox':
              // 多選晶片組 (可複選)
              inputHtml = `
                <div class="flex flex-wrap gap-2.5 pt-1">
                  ${item.options.map(opt => `
                    <label class="choice-chip group">
                      <input type="checkbox" name="${item.entryName}" value="${escapeHtml(opt)}">
                      <span class="w-3.5 h-3.5 rounded-md border border-slate-500 group-hover:border-slate-300 mr-2 flex items-center justify-center transition">
                        <i class="fas fa-check text-[10px] text-transparent transition"></i>
                      </span>
                      <span>${escapeHtml(opt)}</span>
                    </label>
                  `).join('')}
                </div>
              `;
              break;

            case 'text':
            default:
              // 文字輸入框 (若是經緯度或時間等，提供智慧預設與圖標)
              let placeholder = escapeHtml(item.description || '請輸入...');
              if (item.title.includes('經緯度')) {
                placeholder = '例：24.0963, 120.6937 或點選上方預設地點';
              } else if (item.title.includes('時:分')) {
                placeholder = '例：16:30';
              }

              inputHtml = `
                <input type="text" name="${item.entryName}" ${isReq ? 'required' : ''}
                  placeholder="${placeholder}"
                  class="tactical-input">
              `;
              break;
          }

          itemWrapper.innerHTML = `
            <label class="block text-xs sm:text-sm font-semibold text-slate-200">
              ${escapeHtml(item.title)} ${reqTag}
            </label>
            ${item.description && item.type !== 'textarea' ? `<p class="text-xs text-slate-400 mb-1">${escapeHtml(item.description)}</p>` : ''}
            ${inputHtml}
          `;
        }

        secCard.appendChild(itemWrapper);
      });

      formEl.appendChild(secCard);
    });

    container.appendChild(formEl);

    // 綁定動態生成的輸入框互動 (晶片選取、一鍵清點、今日日期等)
    bindDynamicFormEvents(formEl, formConfig);
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

          // 出勤表單專屬：點擊地點自動填入經緯度
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
        }
      });
    });

    // 2. 矩陣狀態按鈕 (已清點 / 有異常)
    formEl.querySelectorAll('.status-pill-btn input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', function () {
        const group = this.closest('.status-pill-group');
        group.querySelectorAll('.status-pill-btn').forEach(btn => btn.classList.remove('active', 'btn-normal', 'btn-abnormal'));
        
        const parentBtn = this.closest('.status-pill-btn');
        if (this.dataset.opt === '已清點') {
          parentBtn.classList.add('active', 'btn-normal');
        } else {
          parentBtn.classList.add('active', 'btn-abnormal');
        }
      });
    });

    // 3. 每日清點表單：一鍵標記全數「已清點」
    const btnMarkAll = formEl.querySelector('#btnMarkAllChecked');
    if (btnMarkAll) {
      btnMarkAll.addEventListener('click', () => {
        const gridRadios = formEl.querySelectorAll('.grid-radio[data-opt="已清點"]');
        let count = 0;
        gridRadios.forEach(radio => {
          radio.checked = true;
          const parentBtn = radio.closest('.status-pill-btn');
          const group = radio.closest('.status-pill-group');
          if (group) {
            group.querySelectorAll('.status-pill-btn').forEach(b => b.classList.remove('active', 'btn-normal', 'btn-abnormal'));
          }
          if (parentBtn) {
            parentBtn.classList.add('active', 'btn-normal');
          }
          count++;
        });
        showToast(`已成功標記全部 ${count} 項裝備為「已清點」！`);
      });
    }

    // 4. 今日與現在按鈕
    formEl.querySelectorAll('.btn-set-today').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('input[type="date"]');
        if (input) input.value = new Date().toISOString().split('T')[0];
      });
    });

    formEl.querySelectorAll('.btn-set-now').forEach(btn => {
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('input[type="time"]');
        if (input) input.value = new Date().toTimeString().slice(0, 5);
      });
    });
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
      // 找到經緯度 entry.1894204307 的 radio
      const coordRadio = formEl.querySelector(`input[name="entry.1894204307"][value="${targetCoord}"]`);
      if (coordRadio) {
        coordRadio.checked = true;
        coordRadio.dispatchEvent(new Event('change'));
        showToast(`已自動連動帶入地點經緯度：${locationValue}`);
      }
    }
  }

  // 表單驗證與送出處理
  async function handleFormSubmit() {
    const activeForm = document.getElementById(`active_form_${state.currentFormId}`);
    if (!activeForm) return;

    // 檢查必填項目
    const requiredInputs = activeForm.querySelectorAll('[required]');
    let firstInvalid = null;
    let missingName = '';

    for (const input of requiredInputs) {
      if (input.type === 'radio') {
        const checked = activeForm.querySelector(`input[name="${input.name}"]:checked`);
        if (!checked) {
          firstInvalid = input;
          const label = input.closest('.form-item-wrapper, .inventory-row')?.querySelector('label, span')?.innerText;
          missingName = label || '必選項目';
          break;
        }
      } else if (input.type === 'checkbox') {
        const checked = activeForm.querySelector(`input[name="${input.name}"]:checked`);
        if (!checked) {
          firstInvalid = input;
          const label = input.closest('.form-item-wrapper')?.querySelector('label')?.innerText;
          missingName = label || '必填勾選項';
          break;
        }
      } else {
        if (!input.value.trim()) {
          firstInvalid = input;
          const label = input.closest('.form-item-wrapper')?.querySelector('label')?.innerText;
          missingName = label || '必填項目';
          break;
        }
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(`⚠️ 請填寫必填欄位：${missingName.replace('*', '').trim()}`, 'error');
      return;
    }

    // 收集表單資料準備送出
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

    const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);

    try {
      // 1. 隱藏 iframe 提交
      activeForm.submit();

      // 2. 同步 fetch (no-cors 確保觸發)
      fetch(activeForm.action, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      }).catch(e => console.warn('Fetch fallback status:', e));

      // 模擬雲端接收並寫入本機歷史紀錄
      const record = {
        id: Date.now(),
        formId: formConfig.id,
        formTitle: formConfig.title,
        timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
        summary: summaryData
      };
      state.history.unshift(record);
      localStorage.setItem('uav_history', JSON.stringify(state.history.slice(0, 30)));

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

  // 成功彈窗展示
  function showSuccessModal(record) {
    const modal = elements.successModal;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // 產生摘要內容卡片
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
        <div class="mt-3 text-slate-400 text-xs">填寫內容摘要已即時記錄至後台試算表，可在本機歷史清單中隨時回溯查核。</div>
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
      <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
        <div class="flex items-center justify-between">
          <span class="font-bold text-sm text-slate-200">${escapeHtml(item.formTitle)}</span>
          <span class="text-xs text-slate-400 font-mono">${escapeHtml(item.timestamp)}</span>
        </div>
        <div class="text-xs text-slate-400">
          已成功同步送出至 Google 試算表後台
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
    // 頂部與底部導覽切換
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

    // 送出表單按鈕
    elements.submitBtn.addEventListener('click', handleFormSubmit);

    // 成功視窗關閉與下一筆
    elements.successModalClose.addEventListener('click', () => {
      elements.successModal.classList.add('hidden');
      elements.successModal.classList.remove('flex');
    });

    elements.successNextBtn.addEventListener('click', () => {
      elements.successModal.classList.add('hidden');
      elements.successModal.classList.remove('flex');
      const activeForm = document.getElementById(`active_form_${state.currentFormId}`);
      if (activeForm) activeForm.reset();
      // 重新渲染以套用今日日期等初始值
      const formConfig = window.FORMS_DATA.forms.find(f => f.id === state.currentFormId);
      if (formConfig) renderFormFields(formConfig);
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
