function checkTweetStatus() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // D列（4列目）にURLがあると仮定します。実際のスプレッドシートに合わせて変更してください。
  var urlColumn = 4; // A=1, B=2, C=3, D=4
  
  // URLの右隣（1つ右の列）に結果を書き込みます
  var statusColumn = urlColumn + 1; 
  
  var startRow = 2; // 2行目から開始（1行目はヘッダー）
  var numRows = sheet.getLastRow() - 1;
  
  if (numRows <= 0) return;
  
  // データを一括で取得
  var dataRange = sheet.getRange(startRow, urlColumn, numRows, 1);
  var urls = dataRange.getValues();
  
  // 結果を格納する配列
  var results = [];
  
  for (var i = 0; i < urls.length; i++) {
    var tweetUrl = urls[i][0].toString().trim();
    
    if (tweetUrl === "") {
      results.push([""]);
      continue;
    }
    
    // X(Twitter)公式のoEmbed APIを利用
    // これを使うと、削除されていたり鍵垢になっていると404が返ります
    var apiUrl = "https://publish.twitter.com/oembed?url=" + encodeURIComponent(tweetUrl);
    
    try {
      var response = UrlFetchApp.fetch(apiUrl, {
        muteHttpExceptions: true // エラーでスクリプトが止まらないようにする
      });
      
      var responseCode = response.getResponseCode();
      
      if (responseCode === 200) {
        results.push(["✅ OK"]);
      } else if (responseCode === 404) {
        results.push(["❌ 削除/非公開"]);
      } else {
        results.push(["⚠️ 確認不可 (" + responseCode + ")"]);
      }
      
    } catch (e) {
      results.push(["⚠️ 通信エラー"]);
    }
    
    // 大量のリクエストでブロックされないよう、1秒待機
    Utilities.sleep(1000);
  }
  
  // 結果を一括で書き込み
  var statusRange = sheet.getRange(startRow, statusColumn, numRows, 1);
  statusRange.setValues(results);
  
  // 1行目にヘッダーを書き込む
  sheet.getRange(1, statusColumn).setValue("生存確認");
  
  Browser.msgBox("チェックが完了しました！");
}
