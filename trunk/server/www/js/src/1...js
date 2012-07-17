//Static settings
var yandexTileServer = 1;
var yandexTileServerLimit = 4;
var yandexTileVersion = "2.22.0";
var yandexTileLang = "ru-RU";
var yandexTileVersionSat = "1.32.0"
//===================================================
function atanh(x)
{
    return 0.5*Math.log((1+x)/(1-x));
}
function YandexfromLatLngToPixel(lotlan,zoom)
{
    var PixelsAtZoom = 256*Math.pow(2,zoom);
    var exct = 0.0818197;
    var z = Math.sin(lotlan.latRadians());
    var c = (PixelsAtZoom/(2*Math.PI));
    var x = Math.floor(PixelsAtZoom/2+lotlan.lng()*(PixelsAtZoom/360));
    var y = Math.floor(PixelsAtZoom/2-c*(atanh(z)-exct*atanh(exct*z)));
    return new GPoint(x,y);
}
function YandexfromPixelToLatLng(pixel, zoom)
{
    var PixelsAtZoom = 256*Math.pow(2,zoom);
    var Lon = ((pixel.x)-PixelsAtZoom/2)/(PixelsAtZoom/360);
    var Lat = ((pixel.y)-PixelsAtZoom/2)/-(PixelsAtZoom/(2*Math.PI));
    Lat = Math.abs((2*Math.atan(Math.exp(Lat))-Math.PI/2)*180/Math.PI);

    var Zu = Lat/(180/Math.PI);
    var Zum1 = Zu+1;
    var exct = 0.0818197;
    var yy = -Math.abs(((pixel.y)-PixelsAtZoom/2));
    while (Math.abs(Zum1-Zu)>0.0000001)
    {
        Zum1 = Zu;
        Zu = Math.asin(1-((1+Math.sin(Zum1))*Math.pow(1-exct*Math.sin(Zum1),exct))
            /(Math.exp((2*yy)/-(PixelsAtZoom/(2*Math.PI)))*Math.pow(1+exct*Math.sin(Zum1),exct)));
    }
    if (pixel.y>PixelsAtZoom/2) {
        Lat=-Zu*180/Math.PI
    }
    else {
        Lat=Zu*180/Math.PI
    }
    return new GLatLng(Lat,Lon,false);
}

function getYandexTileServer()
{
    yandexTileServer++;
    if (yandexTileServer>yandexTileServerLimit) yandexTileServer = 1;
    return yandexTileServer;
}
function YandexGetTileUrl(a,b)
{
    var y_tiles = "http://vec0" + getYandexTileServer() + ".maps.yandex.ru/tiles?l=map&v="+yandexTileVersion+"&x=" + a.x + "&y=" + a.y + "&z=" + b + "&g=Ga&lang="+yandexTileLang;
    return  y_tiles;
}
function YandexPeopleGetTileUrl(a,b)
{
    var y_tiles = "http://wvec.maps.yandex.net/tiles?l=wmap&x=" + a.x + "&y=" + a.y + "&z=" + b;
    return  y_tiles;
}

function YandexGetTileUrlSat(a,b)
{
    var y_tiles = "http://sat0" + getYandexTileServer() + ".maps.yandex.ru/tiles?l=sat&v="+yandexTileVersionSat+"&x=" + a.x + "&y=" + a.y + "&z=" + b + "&g=Ga&lang="+yandexTileLang;
    return  y_tiles;
}

function YandexGetTileUrlHyb(a,b)
{
//  return "http://vec0"+((a.x+a.y)%5)+".maps.yandex.net/tiles?l=skl&v=2.4.2&x=" + a.x + "&y=" + a.y + "&z=" + b + ".png";
// return "http://wvec.maps.yandex.net/?l=wmap&x=" + a.x + "&y=" + a.y + "&z=" + b + "&ts=";
// return "http://vec04.maps.yandex.ru/tiles?l=skl&v=2.17.1&x=" + a.x + "&y=" + a.y + "&z=" + b;
//  return "http://sat02.maps.yandex.net/tiles?l=sat&v=1.21.0&x=" + a.x + "&y=" + a.y + "&z=" + b;
}




var mapElem;
function load() {
    if (GBrowserIsCompatible()) {
        mapElem = document.getElementById('mapArrows');
        mapElem.onmousemove = onMapDivMouseMove;
        map = new GMap2(mapElem);
        // map.addControl(new GSmallMapControl());
        // map.addControl(new GMapTypeControl());
        map.addControl(new GScaleControl());
        map.addControl(new GLargeMapControl());
        map.addControl(new GOverviewMapControl());
        map.setCenter(new GLatLng(47.991075, 33.7501116666667), 8);
        // map.enableContinuousZoom();//Плавны зум убран - тормозит
        // GEvent.addListener(map, "mousemove", onMapMouseMove);
        map.enableDoubleClickZoom();
        map.enableScrollWheelZoom();
        //======================OpenStreet Map Layer================
        CustomGetTileUrl=function(a,b){
            return "http://a.tile.openstreetmap.org/"+b+"/"+a.x+"/"+a.y+".png";
        }
        var copyright = new GCopyright(1,new GLatLngBounds(new GLatLng(53.8136257,-3.0981445),new GLatLng(53.8654855,-2.9663944) ),17, '');
        var copyrightCollection = new GCopyrightCollection('');
        copyrightCollection.addCopyright(copyright);
        var tilelayers = [new GTileLayer(copyrightCollection,1,17)];
        tilelayers[0].getTileUrl = CustomGetTileUrl;
        osmmap = new GMapType(tilelayers, G_SATELLITE_MAP.getProjection(), 'O.S.M.');
        map.addMapType(osmmap);
        //======================Ovi Map Layer================
        var CustomGetTileUrl=function(a,b){
            return "http://c.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/normal.day/"+b+"/"+a.x+"/"+a.y+"/256/png8";
        }
        var copyright = new GCopyright(1,new GLatLngBounds(new GLatLng(53.8136257,-3.0981445),new GLatLng(53.8654855,-2.9663944) ),17, '');
        var copyrightCollection = new GCopyrightCollection('');
        copyrightCollection.addCopyright(copyright);
        var tilelayers = [new GTileLayer(copyrightCollection,1,17)];
        tilelayers[0].getTileUrl = CustomGetTileUrl;
        ovimap = new GMapType(tilelayers, G_SATELLITE_MAP.getProjection(), 'Ovi Map');
        map.addMapType(ovimap);
        //======================Ovi Satellite Layer================
        var CustomGetTileUrl=function(a,b){
            return "http://b.maptile.maps.svc.ovi.com/maptiler/v2/maptile/newest/satellite.day/"+b+"/"+a.x+"/"+a.y+"/256/png8";
        }
        var copyright = new GCopyright(1,new GLatLngBounds(new GLatLng(53.8136257,-3.0981445),new GLatLng(53.8654855,-2.9663944) ),17, '');
        var copyrightCollection = new GCopyrightCollection('');
        copyrightCollection.addCopyright(copyright);
        var tilelayers = [new GTileLayer(copyrightCollection,1,17)];
        tilelayers[0].getTileUrl = CustomGetTileUrl;
        ovisat = new GMapType(tilelayers, G_SATELLITE_MAP.getProjection(), 'Ovi Satellite');
        map.addMapType(ovisat);

        //==================Yandex maps layer======================
        var YandexCopyCollection = new GCopyrightCollection('Yandex.Maps');
        var YandexCopyright = new GCopyright(1, new GLatLngBounds(new GLatLng(56.989860, 40.978317), new GLatLng(56.989860, 40.978317)), 0, "Yandex Maps");
        YandexCopyCollection.addCopyright(YandexCopyright);
        var YandexTilelayers = new Array();
        YandexTilelayers[0] = new GTileLayer(YandexCopyCollection, 0, 17 );
        YandexTilelayers[0].getTileUrl = YandexGetTileUrl;
        var YandexGMapTypeOptions = new Object();
        YandexGMapTypeOptions.minResolution = 0;
        YandexGMapTypeOptions.maxResolution = 17;
        YandexGMapTypeOptions.errorMessage = "No map data available";
        var YandexProjection = new GMercatorProjection(22);
        YandexProjection.fromLatLngToPixel=YandexfromLatLngToPixel;
        YandexProjection.fromPixelToLatLng=YandexfromPixelToLatLng;
        yandexmap = new GMapType(YandexTilelayers, YandexProjection, "Yandex Map", YandexGMapTypeOptions);
        yandexmap.getTextColor = function() {
            return "#000000";
        };
        map.addMapType(yandexmap);
        //==================Yandex maps satellite layer======================
        var YandexCopyCollection = new GCopyrightCollection('Yandex.Maps');
        var YandexCopyright = new GCopyright(1, new GLatLngBounds(new GLatLng(56.989860, 40.978317), new GLatLng(56.989860, 40.978317)), 0, "Yandex Maps");
        YandexCopyCollection.addCopyright(YandexCopyright);
        var YandexTilelayers = new Array();
        YandexTilelayers[0] = new GTileLayer(YandexCopyCollection, 0, 18 );
        YandexTilelayers[0].getTileUrl = YandexGetTileUrlSat;
        var YandexGMapTypeOptions = new Object();
        YandexGMapTypeOptions.minResolution = 0;
        YandexGMapTypeOptions.maxResolution = 18;
        YandexGMapTypeOptions.errorMessage = "No map data available";
        var YandexProjection = new GMercatorProjection(22);
        YandexProjection.fromLatLngToPixel=YandexfromLatLngToPixel;
        YandexProjection.fromPixelToLatLng=YandexfromPixelToLatLng;
        yandexmapsat = new GMapType(YandexTilelayers, YandexProjection, "Yandex Map", YandexGMapTypeOptions);
        yandexmapsat.getTextColor = function() {
            return "#000000";
        };
        map.addMapType(yandexmapsat);
        addTwoGisTileLayer();


        tooltip_ruler = document.createElement("div");
        tooltip_ruler.className = "tooltip_ruler";
        map.getPane(G_MAP_MARKER_PANE).appendChild(tooltip_ruler);

        GEvent.addListener(map, "click", function(ovl, pos, ovlpos) {
            if (mt_button_pressed == "add_object_btn") {
                addEditObject(null, pos);
            }
            if (mt_button_pressed == "add_webcam_btn") {

                addEditWebcamForm({}, pos);
            }
            if (mt_button_pressed == "add_zone_btn") {
                if (mapNewZone!=null) return;
                mapNewZone = new GPolygon([pos], "#222222",
                    4, 0.5, "#222222", 0.2, {
                        clickable : false
                    });
                //  console.info("GP: "+pos);
                map.addOverlay(mapNewZone);
                GEvent.addListener(mapNewZone, "endline", function(){
                    ZoneSQ = 0;
                    ZoneSQ = ((mapNewZone.getArea()/1000)/1000).toFixed(2);
                    // console.info(((mapNewZone.getArea()/1000)/1000).toFixed(2));
                    editZone(mapNewZone, null, 'add_zone_btn',ZoneSQ);

                    mapNewZone = null;
                });
                mapNewZone.enableDrawing();

            }
            if(mt_button_pressed == "prohodbt")
            {
                if(pos) {
                    var new_record = new RecPoint({
                        id: null,
                        s_id : store_wiz_point.getCount()+1,
                        title : "",
                        radius : 100,
                        selected: false,
                        lat:pos.lng(),
                        lng:pos.lat()
                    });
                    store_wiz_point.add(new_record);
                    store_wiz_point.sort('s_id','ASC');
                    store_wiz_point.commitChanges();
                }

            }
            if(mt_button_pressed == "controlbt")
            {
                if(pos) {
                    var new_record = new RecPoint({
                        id: null,
                        s_id : store_wiz_point.getCount()+1,
                        title : "",
                        radius : 100,
                        selected: true,
                        lat:pos.lng(),
                        lng:pos.lat()
                    });
                    store_wiz_point.add(new_record);
                    store_wiz_point.sort('s_id','ASC');
                    store_wiz_point.commitChanges();
                }

            }
            if (mt_button_pressed == "rule_btn") {

                if(pos) {
                    count_ruler++;

                    // Red marker icon
                    var icon = new GIcon();
                    icon.image = icon_url_ruler + "rule_mark_begin.png";
                    addIcon(icon);

                    // Make markers draggable
                    var marker = new GMarker(pos, {
                        icon:icon,
                        draggable:true,
                        bouncy:false,
                        bounceGravity :0,
                        autoPan:true,
                        dragCrossMove:true
                    });
                    map.addOverlay(marker);
                    marker.content = count_ruler;
                    markers_ruler.push(marker);
                    marker.tooltip = "Point "+ count_ruler;

                    GEvent.addListener(marker, "mouseover", function() {
                        showTooltip(marker);
                    });

                    GEvent.addListener(marker, "mouseout", function() {
                        tooltip_ruler.style.display = "none";
                    });

                    // Drag listener
                    GEvent.addListener(marker, "drag", function() {
                        tooltip_ruler.style.display= "none";
                        drawOverlay_ruler();
                    });

                    // Click listener to remove a marker
                    GEvent.addListener(marker, "click", function() {
                        tooltip_ruler.style.display = "none";
                        // Find out which marker to remove
                        for(var n = 0; n < markers_ruler.length; n++) {
                            if(markers_ruler[n] == marker) {
                                map.removeOverlay(markers_ruler[n]);
                                break;
                            }
                        }
                        // Shorten array of markers and adjust counter
                        markers_ruler.splice(n, 1);
                        if(markers_ruler.length == 0) {
                            count_ruler = 0;
                        }
                        else {
                            count_ruler = markers_ruler[markers_ruler.length-1].content;
                            drawOverlay_ruler();
                        }
                    });
                    drawOverlay_ruler();
                }
            }

        });






var twoGisMap;
var twoGisTileServer = 0;
var twoGisTileServerLimit = 4;
function getTwoGisTileServer()
{
    twoGisTileServer++;
    if (twoGisTileServer>twoGisTileServerLimit) twoGisTileServer = 0;
    return twoGisTileServer;
}
function TwoGisTileUrl(a,b)
{
    var y_tiles = "http://tile"+getTwoGisTileServer()+".maps.2gis.ru/tiles?x=" + a.x + "&y=" + a.y + "&z=" + b;
    return  y_tiles;
}
function addTwoGisTileLayer(){
        var TwoGisCopyCollection = new GCopyrightCollection('');
        var TwoGisCopyright = new GCopyright(1, new GLatLngBounds(new GLatLng(56.989860, 40.978317), new GLatLng(56.989860, 40.978317)), 0, "Yandex Maps");
        TwoGisCopyCollection.addCopyright(TwoGisCopyright);
        var TwoGisTilelayers = new Array();
        TwoGisTilelayers[0] = new GTileLayer(TwoGisCopyCollection, 0, 17 );
        TwoGisTilelayers[0].getTileUrl = TwoGisTileUrl;
        var TwoGisGMapTypeOptions = new Object();
        TwoGisGMapTypeOptions.minResolution = 0;
        TwoGisGMapTypeOptions.maxResolution = 17;
        TwoGisGMapTypeOptions.errorMessage = "No map data available";
        var TwoGisProjection = new GMercatorProjection(22);
        TwoGisProjection.fromLatLngToPixel=YandexfromLatLngToPixel;
        TwoGisProjection.fromPixelToLatLng=YandexfromPixelToLatLng;
        twoGisMap = new GMapType(TwoGisTilelayers, G_SATELLITE_MAP.getProjection(), "Yandex Map", TwoGisGMapTypeOptions);
        twoGisMap.getTextColor = function() {
            return "#000000";
        };
        map.addMapType(twoGisMap);
}

        //==================Yandex People map layer======================
        var YandexCopyCollection = new GCopyrightCollection('Yandex.Maps');
        var YandexCopyright = new GCopyright(1, new GLatLngBounds(new GLatLng(56.989860, 40.978317), new GLatLng(56.989860, 40.978317)), 0, "Yandex Maps");
        YandexCopyCollection.addCopyright(YandexCopyright);
        var YandexTilelayers = new Array();
        YandexTilelayers[0] = new GTileLayer(YandexCopyCollection, 0, 18 );
        YandexTilelayers[0].getTileUrl = YandexPeopleGetTileUrl;
        var YandexGMapTypeOptions = new Object();
        YandexGMapTypeOptions.minResolution = 0;
        YandexGMapTypeOptions.maxResolution = 18;
        YandexGMapTypeOptions.errorMessage = "No map data available";
        var YandexProjection = new GMercatorProjection(22);
        YandexProjection.fromLatLngToPixel=YandexfromLatLngToPixel;
        YandexProjection.fromPixelToLatLng=YandexfromPixelToLatLng;
        yandexmap_people = new GMapType(YandexTilelayers, YandexProjection, "Yandex Map", YandexGMapTypeOptions);
        yandexmap_people.getTextColor = function() {
            return "#000000";
        };
        map.addMapType(yandexmap_people);
