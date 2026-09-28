/**
 * Seongmo Tetris - Google Apps Script 웹 앱 진입점.
 * 같은 프로젝트에 HTML 파일 "index"(index.html)가 있어야 합니다.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Seongmo Tetris')
    // HtmlService는 HTML 안의 viewport 메타 태그를 무시하므로 여기서 지정합니다.
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}
