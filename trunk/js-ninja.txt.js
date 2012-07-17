����������� �������:
https://github.com/jawj/OverlappingMarkerSpiderfier




���������� �������� �������� ������ � �������, ��������, � ������ � ���� ������.
��� ��������� � ������, http://habrahabr.ru/post/140816/ ��. content: attr(data-icon)
������ ����� � ������: http://nodeca.github.com/fontomas/#
����� ����� ������� ����������� �����: http://www.fontsquirrel.com/fontface/generator

@font-face {
    font-family: 'FontomasCustomRegular';
    src: url('fonts/fontomas-webfont.eot');
    src: url('fonts/fontomas-webfont.eot?#iefix') format('embedded-opentype'),
         url('fonts/fontomas-webfont.woff') format('woff'),
         url('fonts/fontomas-webfont.ttf') format('truetype'),
         url('fonts/fontomas-webfont.svg#FontomasCustomRegular') format('svg');
    font-weight: normal;
    font-style: normal;
}
 
/** ���������� ����! **/
[data-icon]:after {
    content: attr(data-icon);
    font-family: 'FontomasCustomRegular';
    color: rgb(106, 159, 171);
    position: absolute;
    left: 10px;	
    top: 35px;	/* ��������� � ���� ������� ������ �������� �� ��������� ������ */
    width: 30px;
}

�������������:
<label for="username" class="uname" data-icon="u"> ��� email ��� ����� </label>
� label ������ ���� position: relative;



�������� �������:
http://www.humblesoftware.com/envision/index
http://www.highcharts.com/




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

// ������ ������ ������ ���������� ����� ��� �����:
node.insertAdjacentHTML('beforeEnd', ['<div>B</div>','',''].join(''));

