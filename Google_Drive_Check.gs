//対象とするGoogleDriveフォルダのID(xxxxxの部分がGoogleDriveフォルダのID)
var MAGNOID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
//更新日時を記録するのスプレッドシートのID(aaaaaの部分がスプレッドシートのID)
var UPDATE_SHEET_ID = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
//スプレッドシートのシート名（下に表示されるタブの文字）
var UPDATE_SHEET_NAME = "シート1";
var sttime;
//終了時間用の変数
  var edtime = "";

//フォルダ内を再帰的に探索してすべてのファイルIDを配列にして返す
function getAllFilesId(targetFolder) {
  

  var filesIdList = [];
  files = targetFolder.getFiles();
  while (files.hasNext()) {
    filesIdList.push(files.next().getId());
  }

  var child_folders = targetFolder.getFolders();
  while (child_folders.hasNext()) {
    var child_folder = child_folders.next();
    filesIdList = filesIdList.concat(getAllFilesId(child_folder));
  }
  return filesIdList;
}

function updateCheck() {
  var Folder = DriveApp.getFolderById(ここに任意のIDを入力);
  var folders = Folder.getFolders();
  var folderData = {};
  
  //開始時間を取得する
  sttime = new Date();
  
  // 取得したイテレータ内のファイルのうち、未処理のファイルを判別
  while (folders.hasNext()) {
    var folder = folders.next();
    // フォルダ最終更新日時
    var lastFolderUpdateDate = folder.getLastUpdated();
    // フォルダ内のファイルの最終更新日時が新しい場合もあるのでそれに対応
    var files = folder.getFiles();
    while (files.hasNext()) {
      var fileobj = files.next();
      if (fileobj.getLastUpdated() > lastFolderUpdateDate) {
        // Logger.log("update LastUpdated: " + lastFolderUpdateDate + ", " + fileobj.getLastUpdated())
        lastFolderUpdateDate = fileobj.getLastUpdated();
      }
    }
    // 情報を連想配列に格納
    folderData[folder.getName()] = {
      name: folder.getName(),
      lastUpdate: lastFolderUpdateDate, // フォルダ最終更新日時
      filenum: getAllFilesId(folder).length, // フォルダ内のファイル数
      url: folder.getUrl(), // フォルダのURL
      diff: 0
    };
  }
 
  // スプレッドシートに記載されているフォルダ名と更新日時を取得。
  var spreadsheet = SpreadsheetApp.openById(UPDATE_SHEET_ID);
  var sheet = spreadsheet.getSheetByName(UPDATE_SHEET_NAME);
  var data = sheet.getDataRange().getValues();

  // 取得したデータをMapに変換。
  var sheetData = {};
  //  headerがあるので2から開始
  for (var i = 1; i < data.length; i++) {
    sheetData[data[i][0]] = {
      name: data[i][0],
      lastUpdate: data[i][1],
      filenum: data[i][2],
      url: data[i][3],
      rowNo: i + 1
    };
  }

  // 実際のフォルダとスプレッドシート情報を比較。
  var updateFolderList = [];
  for (key in folderData) {
    if (key in sheetData) {
      // フォルダ名がシートに存在する場合。
      if (folderData[key].lastUpdate > sheetData[key].lastUpdate | folderData[key].filenum != sheetData[key].filenum) {
        // フォルダが更新されているか、ファイルが追加されている場合。
        updateFolderList.push(key);
        folderData[key].diff = folderData[key].filenum - sheet.getRange(sheetData[key].rowNo, 3).getValue();
        Logger.log(key+", folderData[key].diff: " + folderData[key].diff);
        sheet.getRange(sheetData[key].rowNo, 2).setValue(folderData[key].lastUpdate);
        sheet.getRange(sheetData[key].rowNo, 3).setValue(folderData[key].filenum);
        sheet.getRange(sheetData[key].rowNo, 4).setValue(folderData[key].url);
      }
    } else {
      // フォルダ名がシートに存在しない場合。
      var lowno = sheet.getLastRow() + 1
      sheet.getRange(lowno, 1).setValue(key);
      sheet.getRange(lowno, 2).setValue(folderData[key].lastUpdate);
      sheet.getRange(lowno, 3).setValue(folderData[key].filenum);
      sheet.getRange(lowno, 4).setValue(folderData[key].url);
      updateFolderList.push(key);
    }
  }
 
  // 削除されたフォルダをチェックして、フォルダ一覧から削除
  var deleteFolderList = [];
  for (key in sheetData) {
    if (!(key in folderData)) {
      Logger.log(key + " is deleted. row" + sheetData[key].rowNo)
      sheet.deleteRow(sheetData[key].rowNo)
      deleteFolderList.push(key);
    }
  }
  
  // 新規及び更新された情報をメール送信
  if (updateFolderList.length != 0) {

    // フォルダ名、フォルダ更新日時、フォルダ内のファイル数
    if (updateFolderList != 0) {
      var titletext = "【" + Folder.getName() + "】更新連絡通知\n";
      bodyText += Folder.getUrl() + "\n\n";
      for (key in updateFolderList) {
        fld = updateFolderList[key];
        var bodyText = Folder.getName() + "フォルダに、" + updateFolderList.length + "個のフォルダ、またはファイルが追加(変更)されました。\n\n";
        bodyText += "----変更が適用されたフォルダ情報----\n変更フォルダ名：" + fld + "\n追加(変更)されたデータ数：" + folderData[fld].diff + "\nフォルダURL：" + folderData[fld].url + "\n-------------------------------\n";
      }
      bodyText += "\n\n※追加(変更)されたデータ数の数字が正の数なら追加、負の数なら削除を表します。\n空フォルダは通知されません。";
      
      // LINEで自動通知する内容。
      var content = "\n";
      content += titletext + bodyText;
      var token = ['LLLLLLLLLLLLLLLLLLLLLLLLL']; //LINEで自動通知をする宛先のトークン。(LLLLLの部分がLINEトークン)
  var options =
   {
     "method"  : "post",
     "payload" : {"message": content + "\n\n以下のURLからドライブ内にある欲しいファイルへ素早くアクセスできます。\n\n(プロジェクトのルートディレクトリのURL)" ,
                  }, 
     "headers" : {"Authorization" : "Bearer "+ token}
 
   };
 
   UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
     }
    }
  listAllFile(); 
  }
  
// 開始フォルダの下の全てのフォルダを取得後、全てのファイルを取得
function listAllFile() {

  var sheet = SpreadsheetApp.openById('xxxxxxxxxxxxxxxxxxxxxxx').getSheetByName('シート2');
  
  // 探索を開始するフォルダ。
  var key = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";	//var MAGNOID = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";の文字列と同じ 
  var stt = DriveApp.getFolderById(key);
  var name = "";
  var i = 0; // 配列の行位置を記録している
  var j = 0; // 配列を上から拾って、サブフォルダ探索。探索は配列の二行目から行う
  var folderlist = new Array(); //フォルダリストを格納する配列
  
  
  sheet.clear() //シートをクリア

  // 一行目を配列に書き出す（開始フォルダ）
  folderlist.push([stt, key]);

  // nameに開始フォルダ追加する
  name = stt + " > ";

  // フォルダリストを配列に書き出す
  do {
    //フォルダ一覧を取得
    var folders = DriveApp.searchFolders("'"+key+"' in parents");
    //フォルダ一覧からフォルダを順に取り出し、配列にフォルダ名称とIdを出力
    while(folders.hasNext()){
      i++;
      var folder = folders.next();
      var tmparray = new Array();
      tmparray.push(name + folder.getName());
      tmparray.push(folder.getId());
      folderlist.push(tmparray);
    }

    //配列の上から順にフォルダ名称（>をつける）とIdを取り出す
    j++;
    // j（配列を取りに行こうとする行数）がi（配列の行数、ゼロから始まる）と同じか小さいなら
    if(j <= i){
      name = folderlist[j][0] + " > ";
      key = folderlist[j][1];
    }
  } while (j <= i); //配列を最後まで舐める

  // folderlist配列（フォルダリスト）を使って、フォルダ下にあるファイルを取得しシートに吐き出し
  j = 1; //シートへの出力行
  // ヘッダ記入
  sheet.getRange(j, 1).setValue("フォルダ");
  sheet.getRange(j, 2).setValue("ファイル");
  sheet.getRange(j, 3).setValue("作成日");
  sheet.getRange(j, 4).setValue("オーナー");
  sheet.getRange(j, 5).setValue("ファイルURL");
  j++;
  // ボディ記入
  for (i=0; i<=folderlist.length-1; i++) {
    var key = DriveApp.getFolderById(folderlist[i][1]).getId();
    var files = DriveApp.searchFiles("'"+key+"' in parents");
    while(files.hasNext()){
      var file = files.next();
      sheet.getRange(j, 1).setValue(folderlist[i][0]);
      sheet.getRange(j, 2).setValue(file.getName());
      sheet.getRange(j, 3).setValue(file.getDateCreated());
      sheet.getRange(j, 4).setValue(file.getOwner().getName());
      sheet.getRange(j, 5).setValue(file.getUrl());
      j++;
    }
  }
}
