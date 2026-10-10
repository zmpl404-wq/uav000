/**
 * 臺中市政府消防局 特搜大隊特搜空拍隊 - 勤務表單設定資料 (Forms Data Schema v3.0)
 * 100% 吻合最新表單 entry ID、支援「已清點/有異常/出借」三態清點、
 * 出借表單下拉選單與勾選飛機智慧連動、緊湊版面結構。
 */

window.FORMS_DATA = {
  version: "3.0.0",
  lastUpdated: "2026-10-10",
  unit: "臺中市政府消防局 特搜大隊特搜空拍隊",
  forms: [
    // 1. 器材借用表單
    {
      id: "borrow",
      title: "特搜大隊特搜空拍隊無人機器材借用表單",
      actionUrl: "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfeN9cprtLdcBOrK1yTm39rIKmfkQYpJrphfhbHNQ0M4MqGYw/formResponse",
      viewUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfeN9cprtLdcBOrK1yTm39rIKmfkQYpJrphfhbHNQ0M4MqGYw/viewform",
      icon: "fas fa-dolly",
      badge: "器材借用",
      sections: [
        {
          title: "基本資訊",
          items: [
            {
              type: "date",
              entryId: "1541598213",
              entryName: "entry.1541598213",
              title: "申請日期",
              required: true
            },
            {
              type: "text",
              entryId: "1276211814",
              entryName: "entry.1276211814",
              title: "借用人 / 借用單位 / 連絡電話",
              description: "例如：小隊長 丁OO / 特搜大隊 / 0912-345678",
              required: true
            },
            {
              type: "text",
              entryId: "682423378",
              entryName: "entry.682423378",
              title: "借用事由",
              description: "例如：例行訓練 / 災害搜救任務",
              required: true
            },
            {
              type: "text",
              entryId: "291791128",
              entryName: "entry.291791128",
              title: "預計使用地點",
              description: "例如：臺中市太平區頭汴坑",
              required: true
            }
          ]
        },
        {
          title: "借用期間",
          items: [
            {
              type: "date",
              entryId: "1842310317",
              entryName: "entry.1842310317",
              title: "預計借用日期",
              required: true
            },
            {
              type: "date",
              entryId: "141287462",
              entryName: "entry.141287462",
              title: "預計歸還日期",
              required: true
            }
          ]
        },
        {
          title: "無人機機種與借出裝備",
          items: [
            {
              type: "checkbox",
              entryId: "1253125050",
              entryName: "entry.1253125050",
              title: "無人機機體／註冊序號",
              required: true,
              hasOther: true,
              isDroneTrigger: true, // 標記為飛機勾選連動源
              options: [
                "T4-110 (B-AAB09228)",
                "T4-100 (B-AAB12325)",
                "SKYDIO-X10 (B-AAB11860)",
                "速創 (B-AAB08270)"
              ]
            },
            {
              type: "borrowItemsDropdown", // 乾淨下拉式選單專屬型別
              title: "無人機借出物品數量 (勾選飛機自動帶入預設套裝)",
              items: [
                { entryId: "465295878", entryName: "entry.465295878", label: "無人機機體", key: "droneBody" },
                { entryId: "1160462732", entryName: "entry.1160462732", label: "遙控器", key: "remote" },
                { entryId: "491493784", entryName: "entry.491493784", label: "充電器 (充電管家)", key: "charger" },
                { entryId: "618159166", entryName: "entry.618159166", label: "電池", key: "battery" },
                { entryId: "715260453", entryName: "entry.715260453", label: "傳輸線", key: "cable" },
                { entryId: "1954683491", entryName: "entry.1954683491", label: "記憶卡", key: "sdcard" },
                { entryId: "2131286357", entryName: "entry.2131286357", label: "備用槳", key: "propeller" }
              ]
            }
          ]
        },
        {
          title: "點收與規則確認",
          items: [
            {
              type: "radio",
              entryId: "1829528281",
              entryName: "entry.1829528281",
              title: "借出點收狀態",
              required: true,
              hasOther: true,
              options: ["正常", "異常"]
            },
            {
              type: "radio",
              entryId: "298935638",
              entryName: "entry.298935638",
              title: "是否已閱讀「特搜空拍隊裝備器材借用規則」?",
              required: true,
              options: ["是", "否"]
            },
            {
              type: "checkbox",
              entryId: "136710580",
              entryName: "entry.136710580",
              title: "出借點收人",
              required: true,
              hasOther: true,
              options: ["呂昆育", "唐宏德", "黃世㨗", "陳賜典", "楊友甄", "吳灃恒", "張世源", "潘浚羱", "武煜揚"]
            },
            {
              type: "textarea",
              entryId: "25176776",
              entryName: "entry.25176776",
              title: "備註",
              description: "其他補充事項",
              required: false
            }
          ]
        }
      ]
    },

    // 2. 每日清點表單 (最新精準 entry ID + 三態清點: 已清點 / 有異常 / 出借)
    {
      id: "inventory",
      title: "特搜大隊空拍隊每日裝備清點表單",
      actionUrl: "https://docs.google.com/forms/u/0/d/e/1FAIpQLSdwAM5QmoW8bvvuThSZf6KTW7M24ODZl51oiKFl5bT2D2YjcQ/formResponse",
      viewUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdwAM5QmoW8bvvuThSZf6KTW7M24ODZl51oiKFl5bT2D2YjcQ/viewform",
      icon: "fas fa-clipboard-check",
      badge: "每日清點",
      basicFields: [
        {
          type: "date",
          entryId: "358359977",
          entryName: "entry.358359977",
          title: "清點日期",
          required: true
        },
        {
          type: "radio",
          entryId: "758490419",
          entryName: "entry.758490419",
          title: "清點人員",
          required: true,
          hasOther: true,
          options: ["呂昆育", "唐宏德", "黃世㨗", "陳賜典", "楊友甄", "吳灃恒", "張世源", "潘浚羱", "武煜揚"]
        }
      ],
      areas: [
        {
          id: "office",
          name: "辦公室",
          icon: "fas fa-building",
          color: "from-blue-600 to-indigo-700",
          groups: [
            {
              title: "裝備器材箱(一)",
              rows: [
                { entryId: "1029112974", entryName: "entry.1029112974", label: "ECOFLOW行動電源/1台", required: true },
                { entryId: "1204894407", entryName: "entry.1204894407", label: "輪座式延長線/1組", required: true },
                { entryId: "1648002413", entryName: "entry.1648002413", label: "HDMI線/1條", required: true },
                { entryId: "1730498330", entryName: "entry.1730498330", label: "SKYDIO X10專用平板", required: true },
                { entryId: "1707960423", entryName: "entry.1707960423", label: "BAOCH傳輸系統/1組", required: true }
              ]
            },
            {
              title: "裝備器材箱(二)",
              rows: [
                { entryId: "102702167", entryName: "entry.102702167", label: "ECOFLOW行動電源/1台", required: true },
                { entryId: "2110998384", entryName: "entry.2110998384", label: "輪座式延長線/1組", required: true }
              ]
            },
            {
              title: "辦公室電腦桌",
              rows: [
                { entryId: "876622965", entryName: "entry.876622965", label: "筆電", required: true }
              ]
            },
            {
              title: "無線電櫃",
              rows: [
                { entryId: "237820296", entryName: "entry.237820296", label: "手提無線電/9支/無線電櫃內", required: true },
                { entryId: "1442527866", entryName: "entry.1442527866", label: "救災用平板【含充電器(白)*1】", required: true },
                { entryId: "1042625757", entryName: "entry.1042625757", label: "42車鑰匙/無線電櫃外", required: true },
                { entryId: "1210587847", entryName: "entry.1210587847", label: "西屯43車鑰匙/無線電櫃外", required: true }
              ]
            },
            {
              title: "賜典抽屜",
              rows: [
                { entryId: "1228999081", entryName: "entry.1228999081", label: "42車油卡: ALU-6772", required: true },
                { entryId: "2107902043", entryName: "entry.2107902043", label: "西屯43車油卡: BCU-6167", required: true }
              ]
            }
          ]
        },
        {
          id: "equip_room",
          name: "器材室",
          icon: "fas fa-toolbox",
          color: "from-amber-500 to-orange-600",
          groups: [
            {
              title: "可移動式螢幕",
              rows: [
                { entryId: "617005678", entryName: "entry.617005678", label: "LG Standyme 27吋螢幕/1組", required: true },
                { entryId: "1291567669", entryName: "entry.1291567669", label: "移動電視及移動架【在副大辦公室】", required: true }
              ]
            },
            {
              title: "無人機SKYDIO X10 /【放置桌面上】",
              rows: [
                { entryId: "362602952", entryName: "entry.362602952", label: "無人機主體/1台", required: true },
                { entryId: "1570814779", entryName: "entry.1570814779", label: "遙控器/1台", required: true },
                { entryId: "1257185405", entryName: "entry.1257185405", label: "電池/3顆", required: true },
                { entryId: "185903321", entryName: "entry.185903321", label: "電池充電座/1台", required: true },
                { entryId: "1704745360", entryName: "entry.1704745360", label: "HDMI線/1條", required: true },
                { entryId: "1509044224", entryName: "entry.1509044224", label: "無人機主體直充充電組/1組", required: true },
                { entryId: "1617763815", entryName: "entry.1617763815", label: "備用槳(1組4支)", required: true },
                { entryId: "1635098897", entryName: "entry.1635098897", label: "原廠專用攜行箱/1箱", required: true }
              ]
            },
            {
              title: "新樂飛T4-110 /【放置桌面】",
              rows: [
                { entryId: "883022474", entryName: "entry.883022474", label: "無人機主體/1台", required: true },
                { entryId: "750327934", entryName: "entry.750327934", label: "遙控器1台含充電線(白)", required: true },
                { entryId: "69217217", entryName: "entry.69217217", label: "新樂飛電池T4-110電池/5顆", required: true },
                { entryId: "720460169", entryName: "entry.720460169", label: "新樂飛T4-110電池充電座(含電源線)", required: true },
                { entryId: "1247213338", entryName: "entry.1247213338", label: "T4-110電池充電座(無電源線)/1組/桌下抽屜", required: true }
              ]
            },
            {
              title: "新樂飛T4-100 /【放置桌下】",
              rows: [
                { entryId: "1948780774", entryName: "entry.1948780774", label: "無人機主體", required: true },
                { entryId: "669412171", entryName: "entry.669412171", label: "遙控器【含充電線(白)】", required: true },
                { entryId: "139456547", entryName: "entry.139456547", label: "電池/3顆", required: true },
                { entryId: "47389847", entryName: "entry.47389847", label: "電池充電座", required: true },
                { entryId: "667793309", entryName: "entry.667793309", label: "原廠專用攜行箱", required: true }
              ]
            },
            {
              title: "速創 / 【放置桌下】(第八大隊財產)",
              rows: [
                { entryId: "1238355333", entryName: "entry.1238355333", label: "無人機主體/1台", required: true },
                { entryId: "1843021654", entryName: "entry.1843021654", label: "遙控器/1台", required: true },
                { entryId: "1458741830", entryName: "entry.1458741830", label: "遙控器充電線/1組", required: true },
                { entryId: "1138741012", entryName: "entry.1138741012", label: "電池/4顆", required: true },
                { entryId: "1922616080", entryName: "entry.1922616080", label: "電池充電線/1組", required: true },
                { entryId: "1426150253", entryName: "entry.1426150253", label: "鏡頭/1組", required: true },
                { entryId: "145316887", entryName: "entry.145316887", label: "備用槳/正槳4組反槳4組", required: true },
                { entryId: "530095076", entryName: "entry.530095076", label: "原廠專用攜行箱", required: true }
              ]
            },
            {
              title: "速創 / 【放置桌下】(第四大隊財產)",
              rows: [
                { entryId: "256821430", entryName: "entry.256821430", label: "無人機主體/1台", required: false },
                { entryId: "946658516", entryName: "entry.946658516", label: "遙控器/1台", required: false },
                { entryId: "1728128267", entryName: "entry.1728128267", label: "遙控器充電線/1組", required: false },
                { entryId: "1800183102", entryName: "entry.1800183102", label: "電池/4顆", required: false },
                { entryId: "2012759355", entryName: "entry.2012759355", label: "電池充電線/1組", required: false },
                { entryId: "1995127640", entryName: "entry.1995127640", label: "鏡頭/1組", required: false },
                { entryId: "191217745", entryName: "entry.191217745", label: "投擲用高腳架【二支為1組】", required: false },
                { entryId: "219516794", entryName: "entry.219516794", label: "原廠專用攜行箱", required: false },
                { entryId: "595813802", entryName: "entry.595813802", label: "投擲器", required: false }
              ]
            }
          ]
        },
        {
          id: "parking",
          name: "1樓停車格",
          icon: "fas fa-truck-pickup",
          color: "from-emerald-600 to-teal-700",
          groups: [
            {
              title: "備勤車42車",
              rows: [
                { entryId: "701435083", entryName: "entry.701435083", label: "ALU-6772", required: false }
              ]
            },
            {
              title: "西屯備勤車43車(BCU-6167)",
              rows: [
                { entryId: "1120863184", entryName: "entry.1120863184", label: "桌子/2組", required: true },
                { entryId: "50014400", entryName: "entry.50014400", label: "椅子/2組", required: true },
                { entryId: "965908361", entryName: "entry.965908361", label: "快速移動帳/1組", required: true }
              ]
            }
          ]
        },
        {
          id: "basement",
          name: "地下室",
          icon: "fas fa-bolt",
          color: "from-purple-600 to-violet-700",
          groups: [
            {
              title: "發電機",
              rows: [
                { entryId: "1717479735", entryName: "entry.1717479735", label: "小型發電機 HONDA EU22i", required: true }
              ]
            }
          ]
        }
      ],
      bottomFields: [
        {
          type: "textarea",
          entryId: "1301213742",
          entryName: "entry.1301213742",
          title: "上述分類檢查有異常詳述",
          description: "若有任何裝備異常，請於此處詳細描述",
          required: false
        },
        {
          type: "text",
          entryId: "1033597155",
          entryName: "entry.1033597155",
          title: "備註（其他臨時借用交接事項）",
          description: "臨時交接或待辦事項",
          required: false
        }
      ]
    },

    // 3. 維修保養紀錄表
    {
      id: "maintenance",
      title: "臺中市政府消防局特搜大隊特搜空拍隊裝備維修保養紀錄表",
      actionUrl: "https://docs.google.com/forms/u/0/d/e/1FAIpQLSd8oDpDWeoFqjUo-FxTF8Tboinjzbp7E7anempXP-qZANKvDg/formResponse",
      viewUrl: "https://docs.google.com/forms/d/e/1FAIpQLSd8oDpDWeoFqjUo-FxTF8Tboinjzbp7E7anempXP-qZANKvDg/viewform",
      icon: "fas fa-tools",
      badge: "維修保養",
      sections: [
        {
          title: "維修保養填報",
          items: [
            {
              type: "date",
              entryId: "1343208040",
              entryName: "entry.1343208040",
              title: "維修保養日期",
              required: true
            },
            {
              type: "checkbox",
              entryId: "961194117",
              entryName: "entry.961194117",
              title: "填寫人",
              required: true,
              hasOther: false,
              options: ["呂昆育", "唐宏德", "黃世㨗", "陳賜典", "楊友甄", "吳灃恒", "張世源", "潘浚羱", "武煜揚"]
            },
            {
              type: "radio",
              entryId: "327754613",
              entryName: "entry.327754613",
              title: "本次 維修保養目的",
              required: true,
              options: ["裝備保養", "裝備維修"]
            },
            {
              type: "checkbox",
              entryId: "2004663302",
              entryName: "entry.2004663302",
              title: "本次維修保養裝備",
              required: true,
              hasOther: true,
              options: ["Skydio X10", "新樂飛T4-100", "新樂飛T4-110", "速創"]
            },
            {
              type: "textarea",
              entryId: "1172120006",
              entryName: "entry.1172120006",
              title: "維修保養原因",
              required: true
            },
            {
              type: "text",
              entryId: "1461953170",
              entryName: "entry.1461953170",
              title: "估價金額",
              required: false
            },
            {
              type: "text",
              entryId: "697139300",
              entryName: "entry.697139300",
              title: "維修廠商名稱與電話",
              required: false
            },
            {
              type: "text",
              entryId: "606687653",
              entryName: "entry.606687653",
              title: "估計維修時間",
              required: false
            },
            {
              type: "textarea",
              entryId: "535928691",
              entryName: "entry.535928691",
              title: "備註",
              required: false
            }
          ]
        }
      ]
    },

    // 4. 出勤紀錄表
    {
      id: "mission",
      title: "臺中市特搜大隊特搜空拍隊無人機出勤紀錄表",
      actionUrl: "https://docs.google.com/forms/u/0/d/e/1FAIpQLScHYz90ibN8-kphlpTH0SPUwDY7atD4iu9A-CNb4ieYkv-5iA/formResponse",
      viewUrl: "https://docs.google.com/forms/d/e/1FAIpQLScHYz90ibN8-kphlpTH0SPUwDY7atD4iu9A-CNb4ieYkv-5iA/viewform",
      icon: "fas fa-plane-departure",
      badge: "出勤紀錄",
      sections: [
        {
          title: "出勤基本資訊",
          items: [
            {
              type: "text",
              entryId: "316344842",
              entryName: "entry.316344842",
              title: "派遣單編號",
              required: true
            },
            {
              type: "date",
              entryId: "1209667024",
              entryName: "entry.1209667024",
              title: "出勤日期",
              required: true
            },
            {
              type: "timeText",
              entryId: "649405272",
              entryName: "entry.649405272",
              title: "出勤時間 (時:分)",
              description: "例: 16:30",
              required: true
            },
            {
              type: "timeText",
              entryId: "2035663237",
              entryName: "entry.2035663237",
              title: "返隊時間 (時:分)",
              description: "例: 20:30",
              required: true
            },
            {
              type: "radio",
              entryId: "1591612449",
              entryName: "entry.1591612449",
              title: "出勤地點 (行政區+地址/地點)",
              required: true,
              hasOther: true,
              options: ["北區豬事圓滿公園", "梧棲區梧棲分隊", "大里區十九甲溜冰場", "大里區創宇飛訓中心"]
            },
            {
              type: "radio",
              entryId: "1894204307",
              entryName: "entry.1894204307",
              title: "出勤地點經緯度",
              required: true,
              hasOther: true,
              options: [
                "240918.81,1204200.25 (諸事圓滿)",
                "241558.63,1203202.97 (梧棲分隊)",
                "240600.15,1204147.52 (十九甲溜冰場)",
                "24.0963, 120.6937 (創宇飛訓中心)"
              ]
            },
            {
              type: "checkbox",
              entryId: "1732585170",
              entryName: "entry.1732585170",
              title: "出勤人員",
              required: true,
              hasOther: true,
              options: ["呂昆育", "唐宏德", "黃世㨗", "陳賜典", "楊友甄", "吳灃恒", "張世源", "潘浚羱", "武煜揚"]
            },
            {
              type: "radio",
              entryId: "1389561773",
              entryName: "entry.1389561773",
              title: "勤務類型",
              required: true,
              hasOther: true,
              options: ["火災", "山搜", "水域", "演練", "救護", "訓練"]
            }
          ]
        },
        {
          title: "無人機操作與成果",
          items: [
            {
              type: "radio",
              entryId: "1740792118",
              entryName: "entry.1740792118",
              title: "是否使用無人機",
              required: true,
              options: ["是", "否"]
            },
            {
              type: "radio",
              entryId: "2142957808",
              entryName: "entry.2142957808",
              title: "是否向民航局通報(活動/緊急事件報進報離)",
              required: true,
              options: ["是", "否"]
            },
            {
              type: "checkbox",
              entryId: "1085168777",
              entryName: "entry.1085168777",
              title: "無人機機型",
              required: true,
              hasOther: true,
              options: [
                "Skydio X10 (B-AAB11860)",
                "新樂飛T4-110 (B-AAB09228)",
                "新樂飛T4-100 (B-AAB12325)",
                "速創 (B-AAB08270)",
                "速創 (B-AAB08272)"
              ]
            },
            {
              type: "checkbox",
              entryId: "280840562",
              entryName: "entry.280840562",
              title: "任務內容",
              required: false,
              hasOther: true,
              options: ["熱顯像", "現場偵查", "即時影像", "3D建模", "搜尋"]
            },
            {
              type: "text",
              entryId: "307820474",
              entryName: "entry.307820474",
              title: "飛行架次",
              required: true
            },
            {
              type: "text",
              entryId: "1553652929",
              entryName: "entry.1553652929",
              title: "飛行時間 (分鐘數)",
              required: true
            },
            {
              type: "select",
              entryId: "1237631444",
              entryName: "entry.1237631444",
              title: "任務結果",
              required: true,
              options: ["完成", "未完成", "中止/取消"]
            },
            {
              type: "radio",
              entryId: "2106293404",
              entryName: "entry.2106293404",
              title: "飛行影像及飛行軌跡是否已存檔",
              required: true,
              options: ["是", "否"]
            },
            {
              type: "checkbox",
              entryId: "1224137400",
              entryName: "entry.1224137400",
              title: "檔案儲存路徑",
              required: true,
              hasOther: true,
              options: ["業務資料夾→04訓練資料→訓練影像回存", "業務資料夾→02出勤記錄"]
            },
            {
              type: "textarea",
              entryId: "340645644",
              entryName: "entry.340645644",
              title: "備註",
              required: false
            }
          ]
        }
      ]
    },

    // 5. 飛安紀錄表
    {
      id: "accident",
      title: "臺中市特搜大隊特搜空拍隊無人機失事飛安紀錄表",
      actionUrl: "https://docs.google.com/forms/u/0/d/e/1FAIpQLScjg1145fPu7CHxWQXVSGCPdE0yXKnxh6nW7-j2I00h7haH2w/formResponse",
      viewUrl: "https://docs.google.com/forms/d/e/1FAIpQLScjg1145fPu7CHxWQXVSGCPdE0yXKnxh6nW7-j2I00h7haH2w/viewform",
      icon: "fas fa-shield-alt",
      badge: "飛安通報",
      sections: [
        {
          title: "事件基本通報",
          items: [
            {
              type: "date",
              entryId: "727427685",
              entryName: "entry.727427685",
              title: "發生日期",
              required: true
            },
            {
              type: "checkbox",
              entryId: "110497403",
              entryName: "entry.110497403",
              title: "通報人",
              required: true,
              hasOther: true,
              options: ["呂昆育", "唐宏德", "黃世㨗", "陳賜典", "楊友甄", "吳灃恒", "張世源", "潘浚羱", "武煜揚"]
            },
            {
              type: "checkbox",
              entryId: "1018051514",
              entryName: "entry.1018051514",
              title: "操作人",
              required: true,
              hasOther: true,
              options: ["呂昆育", "唐宏德", "黃世㨗", "陳賜典", "楊友甄", "吳灃恒", "張世源", "潘浚羱", "武煜揚"]
            },
            {
              type: "text",
              entryId: "369364373",
              entryName: "entry.369364373",
              title: "操作人身分證號/操作證號",
              required: true
            },
            {
              type: "radio",
              entryId: "308950700",
              entryName: "entry.308950700",
              title: "無人機資料註冊狀態",
              required: true,
              options: ["有", "無"]
            },
            {
              type: "checkbox",
              entryId: "1245737775",
              entryName: "entry.1245737775",
              title: "無人機資料(廠牌/型式)",
              required: true,
              hasOther: true,
              options: ["Skydio X10", "新樂飛T4-110", "新樂飛T4-100", "速創"]
            },
            {
              type: "text",
              entryId: "1212114011",
              entryName: "entry.1212114011",
              title: "無人機註冊號碼",
              required: false
            },
            {
              type: "radio",
              entryId: "190411791",
              entryName: "entry.190411791",
              title: "是否有人員傷亡",
              required: true,
              options: ["是", "否"]
            },
            {
              type: "textarea",
              entryId: "866303943",
              entryName: "entry.866303943",
              title: "傷亡人員基本資料",
              required: false
            }
          ]
        },
        {
          title: "飛安事件資料",
          items: [
            {
              type: "timeText",
              entryId: "193545756",
              entryName: "entry.193545756",
              title: "起飛時間 (時:分)",
              description: "例: 14:20",
              required: true
            },
            {
              type: "googleTime",
              entryId: "146249523",
              entryName: "entry.146249523",
              title: "發生時間 (時:分)",
              required: true
            },
            {
              type: "text",
              entryId: "1822885546",
              entryName: "entry.1822885546",
              title: "起飛地點 (行政區+地址)",
              required: true
            },
            {
              type: "text",
              entryId: "1230475598",
              entryName: "entry.1230475598",
              title: "起飛地點經緯度",
              required: true
            },
            {
              type: "text",
              entryId: "154118468",
              entryName: "entry.154118468",
              title: "發生地點 (行政區+地址)",
              required: true
            },
            {
              type: "text",
              entryId: "1924881107",
              entryName: "entry.1924881107",
              title: "發生地點經緯度",
              required: true
            },
            {
              type: "checkbox",
              entryId: "905182166",
              entryName: "entry.905182166",
              title: "事件類型",
              required: true,
              hasOther: true,
              options: [
                "飛航事故調查法所規定之遙控無人機飛航事故",
                "最大起飛重量二公斤以上之遙控無人機遭受實質損害或失蹤",
                "於本法第九十九條之十三第一項至第二項範圍內從事活動之遙控無人機遭受實質損害或失蹤",
                "從事本法第九十九條之十四第一項第一款至第八款活動之遙控無人機遭受實質損害或失蹤",
                "發生與其他航空器或障礙物接近或碰撞之事故",
                "一、運輸事故調查法：人員死亡或傷害(指受傷後七日之内須住院治療四十八小時以上者",
                "二、運輸事故調查法：最大起飛重量逾二十五公斤之遙控無人機遭受實質損害",
                "三、運輸事故調查法：其他造成人民生命、財產重大影響者、或毀損超過新臺幣五十萬元者",
                "四、最大起飛重量二公斤以上且裝置導航裝置之遙控無人機遭受實質損害或失蹤",
                "五、於限航區、航空站、飛行場四周之一定距離範圍內或直轄市、縣(市)政府公告之禁止限制區域內從事活動之遙控無人機遭受實質損害或失蹤",
                "六、從事400呎以上或相關操作限制活動之遙控無人機遭受實質損害或失蹤",
                "七、發生與其他航空器或障礙物接近或碰撞之事故"
              ]
            },
            {
              type: "textarea",
              entryId: "804343322",
              entryName: "entry.804343322",
              title: "事件簡述",
              required: true
            }
          ]
        }
      ]
    }
  ]
};