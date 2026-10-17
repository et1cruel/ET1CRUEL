# js/ — สคริปต์หน้าเว็บ (vanilla, ไม่มี build step)

ไฟล์แยกตามห้อง/ระบบที่เรียกใช้ โหลดด้วย `<script defer>` ธรรมดา
แผนที่เจ้าของด้านล่าง generate จาก `grep` ชื่อไฟล์ใน `*.html` (16 ต.ค. 2569) — ย้ายไฟล์ต้องแก้ `src` ตาม

## ตารางเจ้าของ (ไฟล์ → หน้าที่เรียก)

| ไฟล์ | ใช้ที่ไหน | หน้าที่ |
|---|---|---|
| `agency.js` | agency.html | Command Center: tabs, agent grid, approvals, workflows |
| `provider.js` | agency.html | AI provider adapter (Not Connected จนกว่ามี local runtime) |
| `chat.js` | agency.html | กล่องแชท agency |
| `office.js` | agency.html | ออฟฟิศ pixel-art |
| `port.js` | index.html | ตารางพอร์ต NASDAQ (ราคาสด TradingView + localStorage) |
| `stock-talk.js` | index.html | วอทช์ลิสต์ + แชทบอทหุ้น/คริปโต + พอร์ต DIME |
| `shield.js` | index.html | ตารางหุ้นกันตาย 17 ตัว (ราคาสด + แคช 5 นาที) |
| `sp500.js` | index.html | ตาราง S&P 500 75 ตัว |
| `watch.js` | index.html | วอทช์ลิสต์ 17 หุ้น AI Infra (1Y/3Y) |
| `tv-widgets.js` | index.html | วิดเจ็ต TradingView |
| `diary.js` | index.html | สมุดไดอารี่รายวัน |
| `growth.js` | growth.html | Growth Log |
| `money-tree.js` | index.html | ต้นไม้การเงิน |
| `life-os-os.js` | index.html | แกน LIFE OS (เงิน/เควส/vaults) |
| `level-up.js` | index.html | ระบบเลเวล/XP |
| `hero-clock.js` | index.html | นาฬิกา hero |
| `command-console.js` | index.html | คอนโซลคำสั่ง |
| `reactive-lens.js` | index.html | เลนส์รีแอคทีฟ |
| `sky-breaks.js` | index.html | เอฟเฟกต์ท้องฟ้า |
| `ambient.js` | index.html | เสียงธรรมชาติ (หลีกทางให้ fx/audio.js เมื่อ V2 ขึ้น) |
| `knowledge.js` | index.html | การ์ดเกร็ดความรู้ |
| `knowledge-data.js` | index.html | ข้อมูลเกร็ดความรู้ 80 ข้อ |
| `knowledge-orbit.js` | (ยังไม่มีหน้าเรียก) | วงโคจรความรู้ 1200 facts — รอเจ้าของเลือกตำแหน่ง (ห้าม auto-เสียบ) |
| `site-polish.js` | 13 หน้า (ทุกห้องหลัก) | โปแลนด์กลาง: memory map, nav, polish |
| `create-ai-app.js` | create-ai.html | แอปห้อง CREATE AI |
| `create-ai-data.js` | create-ai.html | ข้อมูลห้อง CREATE AI |
| `create-ai-models.js` | create-ai.html | โมเดลห้อง CREATE AI |
| `create-ai-m2.js` | create-ai.html | โมดูล M2 |
| `create-ai-m34.js` | create-ai.html | โมดูล M3–M4 |
| `create-ai-m6.js` | create-ai.html | โมดูล M6 |
| `create-ai-m91012.js` | create-ai.html | โมดูล M9–M12 |
| `create-ai-m1115.js` | create-ai.html | โมดูล M11–M15 |
| `create-ai-m13.js` | create-ai.html | โมดูล M13 |
| `create-ai-lab.js` | create-ai.html | แล็บ 1 |
| `create-ai-lab2.js` | create-ai.html | แล็บ 2 |
| `teacher-mixing-app.js` | teacher-mixing-mastering.html | แอปห้องครูมิกซ์ |
| `teacher-mixing-data.js` | teacher-mixing-mastering.html | ข้อมูลห้องครูมิกซ์ |

## กฎ
- ไฟล์ใหม่ตั้งตามชื่อห้อง/ระบบ ลงตารางนี้ด้วย 1 บรรทัด
- ห้ามย้าย/เปลี่ยนชื่อโดยไม่แก้ `src` ในคอลัมน์ "ใช้ที่ไหน" ให้ครบ
- key localStorage ใหม่ต้องไม่ชนของเดิม (ดูหัวไฟล์ก่อนตั้ง)
