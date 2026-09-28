/**
 * Seongmo Tetris - Google Apps Script 웹 앱.
 * 같은 프로젝트에 HTML 파일 "index"(index.html)가 있어야 합니다.
 *
 * 온라인 순위표는 스크립트가 처음 점수를 저장할 때 만드는 Google 스프레드시트
 * ("Seongmo Tetris 순위표")에 기록됩니다. 이미 있는 시트를 쓰려면
 * 프로젝트 설정 > 스크립트 속성에 SHEET_ID 를 넣어 주세요.
 */

// 'low' = 짧은 시간이 좋은 모드(ms), 'high' = 높은 점수가 좋은 모드.
var MODES = { journey: 'high', zen: 'high', ultra: 'high', dig: 'low', sprint: 'low' };
var SHEET_NAME = 'scores';
var TOP_N = 10;

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Seongmo Tetris')
    // HtmlService는 HTML 안의 viewport 메타 태그를 무시하므로 여기서 지정합니다.
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss = null;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('Seongmo Tetris 순위표');
    props.setProperty('SHEET_ID', ss.getId());
  }
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['mode', 'name', 'value', 'date']);
  }
  return sh;
}

function checkMode_(mode) {
  if (!Object.prototype.hasOwnProperty.call(MODES, mode)) throw new Error('알 수 없는 모드입니다.');
}

function cleanName_(name) {
  name = String(name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 10);
  if (!name) name = '익명';
  // 시트에서 수식으로 해석되지 않도록 막습니다.
  if (/^[=+\-@]/.test(name)) name = "'" + name;
  return name;
}

function readRows_(mode) {
  var sh = getSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 4).getValues()
    .filter(function (r) { return r[0] === mode; })
    .map(function (r) {
      return {
        name: String(r[1]).replace(/^'/, ''),
        value: Number(r[2]),
        date: r[3] instanceof Date ? Utilities.formatDate(r[3], 'Asia/Seoul', 'yyyy-MM-dd') : String(r[3]),
      };
    });
}

function sortRows_(mode, rows) {
  var dir = MODES[mode] === 'low' ? 1 : -1;
  return rows.sort(function (a, b) { return (a.value - b.value) * dir; });
}

/** 모드별 상위 기록을 돌려줍니다. */
function getLeaderboard(mode) {
  checkMode_(mode);
  return sortRows_(mode, readRows_(mode)).slice(0, TOP_N);
}

/** 기록을 저장하고 순위를 돌려줍니다. value: 점수 또는 시간(ms). */
function submitScore(mode, name, value) {
  checkMode_(mode);
  value = Math.round(Number(value));
  var low = MODES[mode] === 'low';
  // 명백히 불가능한 값은 거절합니다(시간 3초~1시간, 점수 1~1억).
  if (!isFinite(value) || (low ? (value < 3000 || value > 3600000) : (value < 1 || value > 100000000))) {
    throw new Error('기록 값이 올바르지 않습니다.');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([mode, cleanName_(name), value, new Date()]);
  } finally {
    lock.releaseLock();
  }
  var better = readRows_(mode).filter(function (r) { return low ? r.value < value : r.value > value; }).length;
  return { rank: better + 1 };
}
