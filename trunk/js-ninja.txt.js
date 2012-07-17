Группировка ярлыков:
https://github.com/jawj/OverlappingMarkerSpiderfier




Интересная методика привязки иконок к кнопкам, подписям, и вообще к чему угодно.
Оно спрятанно в статье, http://habrahabr.ru/post/140816/ см. content: attr(data-icon)
Иконки взяты с шрифта: http://nodeca.github.com/fontomas/#
Также можно собрать собственный шрифт: http://www.fontsquirrel.com/fontface/generator

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
 
/** магический трюк! **/
[data-icon]:after {
    content: attr(data-icon);
    font-family: 'FontomasCustomRegular';
    color: rgb(106, 159, 171);
    position: absolute;
    left: 10px;	
    top: 35px;	/* Конкретно в этом примере иконка рисуется на следующей строке */
    width: 30px;
}

Использование:
<label for="username" class="uname" data-icon="u"> Ваш email или логин </label>
у label должно быть position: relative;



Красивые графики:
http://www.humblesoftware.com/envision/index
http://www.highcharts.com/




// Красивый способ назначения обработчиков событий через handleEvent:
// http://www.thecssninja.com/javascript/handleevent

// ------------------------------------
// Качественная генерация уникального UUID (~16 символов):

var id = 'id'+(new Date()).getTime().toString(36)+Math.floor(Math.random() * 2147483648).toString(36);

// + комбинации использования Date:
var now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});




// ----------------------------------
// Создание dom-элемента из текстового представления:
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
  /* //IE может требовать дополнительный элемент <br>:
  elem.innerHTML = '<br>' + totalHtml.join('');
  elem.removeChild(elem.firstChild);
  */

  return (elem.removeChild(elem.firstChild));
}


// Или так:
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


// Удаление всех подчиненных:
var removeChildrens = function(node) {
  var child;
  while ((child = node.firstChild)) {
    node.removeChild(child);
  }
};

// Найден другой способ добавления нодов как текст:
node.insertAdjacentHTML('beforeEnd', ['<div>B</div>','',''].join(''));

