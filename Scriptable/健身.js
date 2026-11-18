// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: magic;
// 独立的 Scriptable 锁屏矩形小组件，按本地日期显示训练计划。
const week = [
  {
    heading: "周日 · 完全休息", title: "Rest — 完全休息", duration: "全天",
    symbol: "leaf.fill", lockLines: ["散步或轻度拉伸（可选）"],
    exercises: [["散步或轻度拉伸（可选）", "按需"]],
    notes: ["保证睡眠，让肌肉恢复。今天可以完全休息。"],
  },
  {
    heading: "周一 · 胸肩三头", title: "Push Day — 胸、肩、三头", duration: "60–70 分钟",
    symbol: "dumbbell.fill", lockLines: ["杠铃卧推·上斜卧推·肩推", "侧平举·三头下压"],
    exercises: [
      ["杠铃卧推", "4 × 6–8", "2–3 分钟"], ["上斜哑铃卧推", "3 × 8–12", "90 秒"],
      ["坐姿哑铃肩推", "3 × 8–10", "90 秒"], ["哑铃侧平举", "3 × 12–15", "60 秒"],
      ["绳索三头下压", "3 × 10–15", "60 秒"],
    ],
    notes: ["卧推是当天主项。先练胸，再练肩和三头。", "肩推时避免为了加重而过度后仰。"],
    strength: true,
  },
  {
    heading: "周二 · 背和二头", title: "Pull Day — 背、二头", duration: "60–70 分钟",
    symbol: "figure.strengthtraining.traditional", lockLines: ["高位下拉·坐姿划船", "胸托划船·面拉·哑铃弯举"],
    exercises: [
      ["高位下拉", "4 × 8–12", "90 秒"], ["坐姿划船", "3 × 8–12", "90 秒"],
      ["胸托划船", "3 × 10–12", "90 秒"], ["面拉", "3 × 12–15", "60 秒"],
      ["哑铃弯举", "3 × 10–12", "60 秒"],
    ],
    notes: ["高位下拉重点练背阔肌。", "两种划船可用不同肘部角度；时间紧时任选一种。"],
    strength: true,
  },
  {
    heading: "周三 · 主动恢复", title: "Recovery — 主动恢复", duration: "约 25–40 分钟",
    symbol: "figure.walk", lockLines: ["轻松步行 20–30 分钟", "肩髋活动 5–10 分钟"],
    exercises: [["轻松步行", "20–30 分钟"], ["肩部与髋部活动度", "5–10 分钟"]],
    notes: ["今天不做力量训练，步行和活动度练习保持轻松。"],
  },
  {
    heading: "周四 · 游泳课", title: "Swimming — 游泳课", duration: "按课程时间",
    symbol: "figure.pool.swim", lockLines: ["跟教练练自由泳", "课后轻松活动 5 分钟"],
    exercises: [["游泳教练课程", "按教练安排"], ["课后轻松活动", "5 分钟"]],
    notes: ["优先练身体位置、呼吸节奏和自由泳技术。", "课后不用再加高强度有氧。"],
  },
  {
    heading: "周五 · 私教腿部", title: "PT — 深蹲、腿部", duration: "约 60 分钟",
    symbol: "figure.strengthtraining.functional", lockLines: ["深蹲·罗马尼亚硬拉", "分腿蹲·腿弯举·平板支撑"],
    exercises: [
      ["杠铃深蹲", "4 × 5–6", "2–3 分钟"], ["罗马尼亚硬拉", "2 × 8", "2 分钟"],
      ["保加利亚分腿蹲", "2 × 8 / 腿", "90 秒"], ["腿弯举", "3 × 10–12", "60–90 秒"],
      ["平板支撑", "3 × 30–45 秒", "60 秒"],
    ],
    adjustment: "听私教安排，以下是建议模板，重点练深蹲技术。",
    notes: ["罗马尼亚硬拉保留余力，避免影响周六训练。"],
    strength: true,
  },
  {
    heading: "周六 · 全身补强", title: "Full Body — 硬拉与上肢补强", duration: "60–70 分钟",
    symbol: "dumbbell.fill", lockLines: ["硬拉·轻卧推·坐姿划船", "腿举(可选)·举膝或卷腹"],
    exercises: [
      ["传统硬拉", "3 × 3–5", "2–3 分钟"], ["轻重量杠铃卧推", "3 × 8", "2 分钟"],
      ["坐姿划船", "3 × 10", "90 秒"], ["腿举（可选）", "2 × 10", "90 秒"],
      ["悬垂举膝或卷腹", "3 × 10–15", "60 秒"],
    ],
    lockHeading: "周六 · 腿酸明显则练上肢",
    homeHeading: "周六 · 腿酸明显→上肢",
    adjustment: "周五训练后腿部酸痛明显，跳过硬拉和腿举，改练上肢。",
    notes: ["硬拉使用轻到中等重量，保留约 3 次余力。"],
    strength: true,
  },
];

function addLine(container, text, font) {
  const line = container.addText(text);
  line.font = font;
  line.lineLimit = 1;
  line.minimumScaleFactor = 0.77;
}

function drawLockScreen(widget, plan) {
  widget.setPadding(0, 0, 0, 0);
  widget.spacing = 1;
  const header = widget.addStack();
  header.centerAlignContent();
  header.spacing = 3;
  const symbol = SFSymbol.named(plan.symbol) || SFSymbol.named("figure.walk");
  if (symbol) {
    const icon = header.addImage(symbol.image);
    icon.imageSize = new Size(12, 12);
  }
  addLine(header, plan.lockHeading || plan.heading, Font.boldSystemFont(13));
  for (const exercises of plan.lockLines) {
    addLine(widget, exercises, Font.mediumSystemFont(13));
  }
}

// Short forms keep a single exercise legible on the smallest Home Screen tile.
const shortNames = {
  "散步或轻度拉伸（可选）": "散步或轻拉伸",
  "肩部与髋部活动度": "肩髋活动",
  "游泳教练课程": "自由泳练习",
  "轻重量杠铃卧推": "轻重量卧推",
  "悬垂举膝或卷腹": "举膝或卷腹",
};

function drawHomeScreen(widget, plan) {
  const lime = new Color("#DDF884");
  widget.backgroundColor = new Color("#152D27");
  widget.setPadding(9, 14, 9, 10);
  const heading = widget.addText("健身 " + (plan.homeHeading || plan.heading));
  heading.font = Font.boldSystemFont(14);
  heading.textColor = lime;
  heading.lineLimit = 1;
  heading.minimumScaleFactor = 0.75;

  const compact = plan.exercises.length > 2;
  widget.addSpacer(compact ? 4 : 10);
  for (const [name, dose] of plan.exercises) {
    const line = widget.addText(shortNames[name] || name);
    line.font = Font.boldSystemFont(compact ? 21 : 23);
    line.textColor = Color.white();
    line.lineLimit = 1;
    line.minimumScaleFactor = 0.9;
    if (!compact) {
      const quantity = widget.addText(dose === "按需" ? "按需，自选" : dose);
      quantity.font = Font.mediumSystemFont(14);
      quantity.textColor = lime;
      widget.addSpacer(4);
    }
  }
  widget.addSpacer();
}

function makeWidget(today, plan) {
  const widget = new ListWidget();
  if (["small", "medium", "large", "extraLarge"].includes(config.widgetFamily)) {
    drawHomeScreen(widget, plan);
  } else {
    drawLockScreen(widget, plan);
  }
  const runURL = URLScheme.forRunningScript();
  widget.url = runURL + (runURL.includes("?") ? "&" : "?") + "view=today";
  // 请求在下一个当地午夜更新。iOS 决定实际刷新时间。
  widget.refreshAfterDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  return widget;
}

function addRow(table, title, subtitle, height, titleSize = 16) {
  const row = new UITableRow();
  row.height = height;
  const cell = row.addText(title, subtitle);
  cell.titleFont = Font.semiboldSystemFont(titleSize);
  cell.subtitleFont = Font.systemFont(15);
  table.addRow(row);
}

function fillTable(table, today, plan, art) {
  const date = (today.getMonth() + 1) + "月" + today.getDate() + "日";
  addRow(table, "健身 · " + plan.heading, date + " · " + plan.duration + " · " + plan.title.split(" — ")[0], 64, 23);
  if (art) {
    const banner = new UITableRow();
    banner.height = 148;
    banner.addImage(art).centerAligned();
    table.addRow(banner);
  }
  if (plan.adjustment) {
    const label = today.getDay() === 6 ? "腿部酸痛时调整" : "私教课安排";
    addRow(table, label, plan.adjustment, 78, 19);
  }
  for (const [index, [name, dose, rest]] of plan.exercises.entries()) {
    const details = rest ? dose + "　·　组间休息 " + rest : dose;
    addRow(table, (index + 1) + ". " + name, details, 62, 19);
  }
  if (plan.strength) addRow(table, "热身与余力", "训练前热身 5–10 分钟。主项保留 2–3 次余力。", 68);
  for (const note of plan.notes) addRow(table, "训练提示", note, 66);
  if (today.getDay() === 1) addRow(table, "卧推进阶", "卧推能稳定完成 4 × 8 后，下次试加 2–2.5 kg。", 70);
  if (plan.strength) {
    addRow(table, "辅助动作", "先增加次数，再考虑加重。", 56);
    addRow(table, "调整训练量", "每 4–6 周评估一次疲劳，累积疲劳时安排一周减组。", 66);
  }
}

// 训练表先显示；照片可用时再更新。断网或 iCloud 未启用仍可看动作。
async function loadArt(weekday) {
  try {
    const files = FileManager.iCloud();
    const directory = files.joinPath(files.documentsDirectory(), "DailyMoveArt");
    const path = files.joinPath(directory, weekday + ".jpg");
    if (!files.fileExists(path)) return null;
    if (!files.isFileDownloaded(path)) await files.downloadFileFromiCloud(path);
    return files.readImage(path);
  } catch {
    return null;
  }
}

async function showPlan(today, plan) {
  const table = new UITable();
  table.showSeparators = true;
  fillTable(table, today, plan, null);
  const dismissed = table.present();
  let visible = true;
  loadArt(today.getDay()).then(art => {
    if (art && visible) {
      table.removeAllRows();
      fillTable(table, today, plan, art);
      table.reload();
    }
  });
  await dismissed;
  visible = false;
}

const today = new Date();
const plan = week[today.getDay()];
const widget = makeWidget(today, plan);
Script.setWidget(widget);
if (config.runsInApp) {
  if (args.queryParameters.view === "preview") {
    await widget.presentAccessoryRectangular();
  } else {
    await showPlan(today, plan);
  }
}
Script.complete();
