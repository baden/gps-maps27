// �������� ������ ���������� ������������ ������� ����� handleEvent:
// http://www.thecssninja.com/javascript/handleevent

// ------------------------------------
// ������������ ��������� ����������� UUID (~16 ��������):

var id = 'id'+(new Date()).getTime().toString(36)+Math.floor(Math.random() * 2147483648).toString(36);

// + ���������� ������������� Date:
var now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});




// ----------------------------------
// �������� dom-�������� �� ���������� �������������:
var createTable_ = function(doc, rows, columns) {
  var rowHtml = ['<tr>'];
  for (var i = 0; i < columns; i++) {
    rowHtml.push('<td></td>');
  }
  rowHtml.push('</tr>');
  rowHtml = rowHtml.join('');
  var totalHtml = ['<table>'];
  for (i = 0; i < rows; i++) {
    totalHtml.push(rowHtml);
  }
  totalHtml.push('</table>');

  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join('');
  /* //IE ����� ��������� �������������� ������� <br>:
  elem.innerHTML = '<br>' + totalHtml.join('');
  elem.removeChild(elem.firstChild);
  */

  return (elem.removeChild(elem.firstChild));
}


// ��� ���:
var htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement('div');
  tempDiv.innerHTML = '<br>' + htmlString;
  tempDiv.removeChild(tempDiv.firstChild);
  if (tempDiv.childNodes.length == 1) {
    return (tempDiv.removeChild(tempDiv.firstChild));
  } else {
    var fragment = doc.createDocumentFragment();
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
  }
};


// �������� ���� �����������:
var removeChildrens = function(node) {
  var child;
  while ((child = node.firstChild)) {
    node.removeChild(child);
  }
};
