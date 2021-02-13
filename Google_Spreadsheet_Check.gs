//更新日時を記録するスプレッドシートのID(xxxxxの部分がスプレッドシートのID)
var UPDATE_SHEET_ID = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

//更新日時を記録するスプレッドシートのシート名（下に表示されるタブの文字）
var UPDATE_SHEET_NAME = "シート1";

var spreadsheet = SpreadsheetApp.openById(UPDATE_SHEET_ID);
var sheet = spreadsheet.getSheetByName(UPDATE_SHEET_NAME);

//Google ドキュメントのID(xxxxxの部分がGoogle ドキュメントのID)
var files = DriveApp.getFileById('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

function Slide_DateCheck(){
// 5分 × 60秒 × 1000ミリ秒
  // = つまり、5分
  var minutes = 5; 
  var seconds = 60;
  var milliseconds = 1000;
sheet.getRange("B6").setValue(new Date());
sheet.getRange("B8").setValue(files.getLastUpdated());
  //保存した時の時間から5分以上経過すると通知が来る。
  if(new Date() - files.getLastUpdated() >= minutes * seconds * milliseconds && new Date() - files.getLastUpdated() < (minutes + 1) * seconds * milliseconds) {
    //LINE Notifyへ通知する関数を実行する。
    LINE_Notify();
  }
}
// LINEで自動通知する内容。
function LINE_Notify(){
      var token = ['xxxxxxxxxxxx']; //LINEで自動通知をする宛先のトークン。(xxxxxの部分がLINEで自動通知をする宛先のトークン)
  var options =
   {
     "method"  : "post",
     "payload" : {"message": "\n今回のアップデートは、モーション設定集です。\n\nこのURLから確認お願いします！\n(ここにGoogleスプレッドシートのURL)",
                  }, 
     "headers" : {"Authorization" : "Bearer "+ token}
 
   };
 
   UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
}
