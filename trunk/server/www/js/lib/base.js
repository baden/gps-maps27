/*
	��뢠���� �� ���樠����樨. �������� �㭪樨 � ��६����.
*/
define(function () {

	var base = {};

	base.init = function() {

		window.document.onselectstart = function(ev){
			if((ev.target.getAttribute && ev.target.getAttribute('contenteditable')) || (ev.target.parentNode && ev.target.parentNode.getAttribute('contenteditable')!=null)) {
				return true;
			}
			return false;
		}	// ����⨬ �뤥����� (�������� �襭�� ����� ���� �� �����㧥୮)

		if(('google' in window) && ('maps' in google)){
		} else {
			var fileref=document.createElement('script');
			fileref.setAttribute('type', 'text/javascript');
			fileref.setAttribute('src', '/js/googlemaps/js.js');
			document.getElementsByTagName('head')[0].appendChild(fileref);
		}

/*		if(('google' in window) && ('load' in google)) {
			google.load('visualization', '1', {packages: ['corechart']});
		} else {
			alert('��ࢥ� Google ������㯥�. \n1. �஢���� ���୥�-ᮥ�������. \n2. ������� ��࠭��� (F5).');
		}*/

	}


	return base;

});
