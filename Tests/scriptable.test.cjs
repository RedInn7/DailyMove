const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.TZ = "America/Los_Angeles";
const script = readFileSync(join(__dirname, "../Scriptable/今日练什么.js"), "utf8");

// Scriptable mocks cover its renderer and read-only iCloud art access.
async function runWidget(date, runsInApp = false, queryParameters = {}, artState = "missing", widgetFamily = "accessoryRectangular") {
  let table;
  let widget;
  const events = [];
  const fileCalls = [];
  const files = {
    documentsDirectory: () => "/cloud",
    joinPath: join,
    fileExists(path) { fileCalls.push(["exists", path]); return artState !== "missing"; },
    isFileDownloaded() { return artState === "cached"; },
    async downloadFileFromiCloud(path) {
      fileCalls.push(["download", path]);
      if (artState === "offline") throw Error("offline");
    },
    readImage(path) { fileCalls.push(["read", path]); return path; },
  };
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [date.valueOf()])); }
  }
  class Color {
    constructor(hex) { this.hex = hex.replace(/^#/, ""); }
    static white() { return new Color("ffffff"); }
  }
  class ListWidget {
    lines = [];
    setPadding() {}
    addSpacer() {}
    addStack() {
      return {
        centerAlignContent() {},
        addSpacer() {},
        addImage: image => { this.symbol = image; return {}; },
        addText: text => this.addText(text),
      };
    }
    addText(text) {
      const line = { text };
      this.lines.push(line);
      return line;
    }
    async presentAccessoryRectangular() { events.push("preview"); }
  }
  class UITableRow {
    addText(title, subtitle) { this.title = title; this.subtitle = subtitle; return {}; }
    addImage(image) { this.image = image; return { centerAligned() {} }; }
  }
  class UITable {
    rows = [];
    addRow(row) { this.rows.push(row); }
    removeAllRows() { this.rows = []; }
    reload() { events.push("reload"); }
    async present() {
      table = this;
      events.push("details");
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  await runInNewContext("(async () => {\n" + script + "\n})()", {
    Date: FixedDate, ListWidget, Font: { semiboldSystemFont: Number, systemFont: Number, boldSystemFont: Number, mediumSystemFont: Number },
    Color, Size: class { constructor(width, height) { this.width = width; this.height = height; } }, SFSymbol: { named: name => ({ image: name }) },
    FileManager: { iCloud: () => files },
    UITable, UITableRow, args: { queryParameters }, config: { runsInApp, widgetFamily },
    URLScheme: { forRunningScript: () => "scriptable:///run?scriptName=test" },
    Script: {
      setWidget(value) { widget = value; events.push("widget"); },
      complete() { events.push("complete"); },
    },
  });
  return { widget, table, events, fileCalls };
}

test("lock screen lists every planned movement in at most three lines", async () => {
  const days = [
    ["周日 · 完全休息", "散步或轻度拉伸（可选）"],
    ["周一 · 胸肩三头", "杠铃卧推·上斜卧推·肩推", "侧平举·三头下压"],
    ["周二 · 背和二头", "高位下拉·坐姿划船", "胸托划船·面拉·哑铃弯举"],
    ["周三 · 主动恢复", "轻松步行 20–30 分钟", "肩髋活动 5–10 分钟"],
    ["周四 · 游泳课", "跟教练练自由泳", "课后轻松活动 5 分钟"],
    ["周五 · 私教腿部", "深蹲·罗马尼亚硬拉", "分腿蹲·腿弯举·平板支撑"],
    ["周六 · 腿酸明显则练上肢", "硬拉·轻卧推·坐姿划船", "腿举(可选)·举膝或卷腹"],
  ];
  for (let index = 0; index < days.length; index++) {
    const date = new Date(2026, 10, 15 + index, 23, 59);
    const { widget, events } = await runWidget(date);
    assert.deepEqual(events, ["widget", "complete"]);
    assert.equal(new URL(widget.url).searchParams.get("view"), "today");
    assert.ok(widget.symbol);
    assert.deepEqual(widget.lines.map(line => line.text), days[index]);
    assert.ok(widget.lines.length <= 3);
    assert.equal(+widget.refreshAfterDate, +new Date(2026, 10, 16 + index));
  }
});

test("in-app preview closes before completion", async () => {
  const { events } = await runWidget(new Date(), true, { view: "preview" });
  assert.deepEqual(events, ["widget", "preview", "complete"]);
});

test("refresh uses local midnight across month, year and DST changes", async () => {
  for (const [start, end] of [
    ["2026-01-31T23:59:00-08:00", "2026-02-01T00:00:00-08:00"],
    ["2026-12-31T23:59:00-08:00", "2027-01-01T00:00:00-08:00"],
    ["2026-03-08T00:00:00-08:00", "2026-03-09T00:00:00-07:00"],
    ["2026-11-01T00:00:00-07:00", "2026-11-02T00:00:00-08:00"],
  ]) {
    const { widget } = await runWidget(new Date(start));
    assert.equal(+widget.refreshAfterDate, Date.parse(end));
  }
});

test("a tap opens today's full plan including exercise doses and rests", async () => {
  const days = [
    ["全天", ["散步或轻度拉伸（可选）"], "按需"],
    ["60–70 分钟", ["杠铃卧推", "上斜哑铃卧推", "坐姿哑铃肩推", "哑铃侧平举", "绳索三头下压"], "4 × 6–8　·　组间休息 2–3 分钟"],
    ["60–70 分钟", ["高位下拉", "坐姿划船", "胸托划船", "面拉", "哑铃弯举"], "4 × 8–12　·　组间休息 90 秒"],
    ["约 25–40 分钟", ["轻松步行", "肩部与髋部活动度"], "20–30 分钟"],
    ["按课程时间", ["游泳教练课程", "课后轻松活动"], "按教练安排"],
    ["约 60 分钟", ["杠铃深蹲", "罗马尼亚硬拉", "保加利亚分腿蹲", "腿弯举", "平板支撑"], "4 × 5–6　·　组间休息 2–3 分钟"],
    ["60–70 分钟", ["传统硬拉", "轻重量杠铃卧推", "坐姿划船", "腿举（可选）", "悬垂举膝或卷腹"], "3 × 3–5　·　组间休息 2–3 分钟"],
  ];
  for (const [index, [duration, names, firstDose]] of days.entries()) {
    const date = new Date(2026, 10, 15 + index, 20);
    const { table, widget, events } = await runWidget(date, true, { view: "today" });
    assert.deepEqual(events, ["widget", "details", "complete"]);
    assert.ok(table.rows[0].subtitle.includes(duration));
    const exercises = table.rows.filter(row => /^\d+\./.test(row.title));
    assert.deepEqual(exercises.map(row => row.title), names.map((name, i) => (i + 1) + ". " + name));
    assert.equal(exercises[0].subtitle, firstDose);
    if (index === 5) assert.match(widget.lines[0].text, /私教/);
    if (index === 6) {
      assert.match(widget.lines[0].text, /腿酸明显则练上肢/);
      assert.match(table.rows[1].subtitle, /跳过硬拉和腿举.*上肢/);
    }
    if (index === 1) assert.ok(table.rows.some(row => /4 × 8.*2–2.5 kg/.test(row.subtitle)));
  }
});

test("direct runs open the plan and art is optional", async () => {
  const date = new Date(2026, 10, 16, 9);
  const path = "/cloud/DailyMoveArt/1.jpg";
  for (const [state, calls, hasArt] of [
    ["cached", ["exists", "read"], true],
    ["placeholder", ["exists", "download", "read"], true],
    ["offline", ["exists", "download"], false],
    ["missing", ["exists"], false],
  ]) {
    const { events, fileCalls, table } = await runWidget(date, true, {}, state);
    assert.deepEqual(fileCalls, calls.map(action => [action, path]));
    assert.deepEqual(events, hasArt ? ["widget", "details", "reload", "complete"] : ["widget", "details", "complete"]);
    assert.equal(table.rows.some(row => row.image === path), hasArt);
    assert.ok(table.rows.some(row => row.title === "1. 杠铃卧推"));
  }
});

function luminance(color) {
  assert.match(color.hex, /^[0-9a-fA-F]{6}$/);
  const [red, green, blue] = color.hex.match(/../g).map(byte => {
    const channel = parseInt(byte, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

test("home widgets show Tuesday's full exercise names in separate high-contrast rows", async () => {
  const date = new Date(2026, 10, 17, 8);
  const expected = ["高位下拉", "坐姿划船", "胸托划船", "面拉", "哑铃弯举"];
  for (const family of ["small", "medium", "large"]) {
    const { widget } = await runWidget(date, false, {}, "missing", family);
    const [title, ...actions] = widget.lines;
    assert.match(title.text, /周二/);
    assert.deepEqual(actions.map(line => line.text), expected);
    const background = luminance(widget.backgroundColor);
    for (const line of actions) {
      assert.ok(line.font >= 20, family + " action font is " + line.font);
      assert.equal(line.lineLimit, 1);
      const foreground = luminance(line.textColor);
      const contrast = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      assert.ok(contrast >= 7, family + " action contrast is " + contrast);
    }
  }
});

test("small home widget allocates one row to every planned movement all week", async () => {
  const counts = [1, 5, 5, 2, 2, 5, 5];
  for (const [weekday, count] of counts.entries()) {
    const date = new Date(2026, 10, 15 + weekday, 9);
    const { widget } = await runWidget(date, false, {}, "missing", "small");
    const exerciseRows = widget.lines.slice(1).filter(line => line.font >= 20);
    assert.equal(exerciseRows.length, count);
    assert.ok(exerciseRows.every(line => line.text.trim() && line.lineLimit === 1));
    assert.equal(+widget.refreshAfterDate, +new Date(2026, 10, 16 + weekday));
  }
});
