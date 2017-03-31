(function (argument) {
  var wxids = ['WX01-027','WX05-019','WX02-021','WX01-029','WX05-023','WX11-030','WX03-018','WX01-033','WX06-020','WX02-025','WX03-020','WX05-027','WX04-037','WX10-038','WX11-038','WX09-023','PR-213','WX06-026','WX10-042','SP07-011','WX09-031','WX05-043','WX11-084','WD13-014','WD01-009','WX12-040','WD01-011','WX04-060','WD01-013','WX12-043','WX06-042','PR-071','WX04-071','WX01-076','WX01-077','WX10-067','WX05-062','WX10-072','WX01-097','WX07-073','WX09-054','WX06-052','WX01-101','WX10-100'];
  var infos = Object.keys(CardInfo).map(function (pid) {
    return CardInfo[pid];
  });
  wxids.forEach((wxid, index) => {
    var info = infos.filter(function (info) {
      return info.wxid === wxid;
    })[0];
    if (!info) return;
    var cid = info.cid;
    infos.forEach(function (info) {
      if (info.cid === cid) {
        info.wxbid = 'WXB-' + ('000' + (index + 1)).slice(-3);
      }
    });
  });
})();