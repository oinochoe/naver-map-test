var _naverMap = (function (naverMap) {
    ('use strict');

    /** styledMap 정의
     *  bg	해당하는 지도 유형의 배경 표시
        ol	실폭 도로, 실선 도로, 행정 경계, 공원 상세, 도로시설물, 시설, 역과 같이 세밀한 요소 표현
        ts	지하철 노선도(sw), 버스 정류장(bs)과 같이 대중교통 관련 요소 표현
        sw	지하철 노선도만 별도 표시하고 싶을 때
        bs	버스 정류장만 별도 표시하고 싶을 때
        pr	거리뷰, 항공뷰, 수중뷰와 같이 파노라마 촬영 위치 관련 요소 표현
        br	자전거 관련 요소 표현
        ar	등산로 관련 요소 표현
        lp	지적편집도 표현
        ctt	혼잡 교통정보 표현
        lko	한국어 라벨 표현

        // mapTypes: new naver.maps.MapTypeRegistry({
        //     normal: naver.maps.NaverStyleMapTypeOptions.getNormalMap({
        //         overlayType: 'bg.ol.ts.pr.ctt.lko',
        //     }),
        // }),
     */

    var mapOptions = {
        useStyleMap: false,
        scaleControl: true,
        logoControl: true,
        mapDataControl: true,
        zoomControl: true,
        zoomControlOptions: {
            style: naver.maps.ZoomControlStyle.SMALL,
            position: naver.maps.Position.TOP_RIGHT,
        },
        center: new naver.maps.LatLng(37.2820716, 127.0123522),
        zoom: 18,
    };

    var map = new naver.maps.Map('map', mapOptions);

    var bounds = map.getBounds();
    var southWest = bounds.getSW();
    var northEast = bounds.getNE();
    var lngSpan = northEast.lng() - southWest.lng();
    var latSpan = northEast.lat() - southWest.lat();

    var markers = [];
    var infoWindows = [];
    var infowindow = new naver.maps.InfoWindow();
    var loadCurrentPosition = 0;
    var location = '';

    var MARKER_SPRITE_X_OFFSET = 11;
    var MARKER_SPRITE_POSITION = {
        A0: [0, 0],
        B0: [MARKER_SPRITE_X_OFFSET, 0],
        C0: [MARKER_SPRITE_X_OFFSET * 2, 0],
        D0: [MARKER_SPRITE_X_OFFSET * 3, 0],
    };

    var onSuccessGeolocation = function (position) {
        if (loadCurrentPosition < 1) {
            location = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
            loadCurrentPosition++;
            return;
        }

        if (!location) {
            location = new naver.maps.LatLng(position.coords.latitude, position.coords.longitude);
        }

        map.setCenter(location); // 얻은 좌표를 지도의 중심으로 설정합니다.
        map.setZoom(19); // 지도의 줌 레벨을 변경합니다.

        infowindow.setContent('<div style="padding:20px;">' + 'geolocation.getCurrentPosition() 위치' + '</div>');
        infowindow.open(map, location);
        console.log('Coordinates: ' + location.toString());
    };

    var onErrorGeolocation = function () {
        var centerMap = map.getCenter();
        infowindow.setContent(
            '<div style="padding:20px;">' +
                '<h5 style="margin-bottom:5px;color:#f00;">Geolocation failed!</h5>' +
                'latitude: ' +
                centerMap.lat() +
                '<br />longitude: ' +
                centerMap.lng() +
                '</div>',
        );

        infowindow.open(map, centerMap);
    };

    var updateMarkers = function (maps, markerInfo) {
        var mapBounds = maps.getBounds();
        var marker, position;

        for (var i = 0; i < markerInfo.length; i++) {
            marker = markerInfo[i];
            position = marker.getPosition();

            if (mapBounds.hasLatLng(position)) {
                showMarker(maps, marker);
            } else {
                hideMarker(maps, marker);
            }
        }
    };

    var showMarker = function (maps, marker) {
        if (marker.setMap()) return;
        marker.setMap(maps);
    };

    var hideMarker = function (maps, marker) {
        if (!marker.setMap()) return;
        marker.setMap(null);
    };

    // 해당 마커의 인덱스를 seq라는 클로저 변수로 저장하는 이벤트 핸들러를 반환합니다.
    var getClickHandler = function (seq) {
        return function (e) {
            // var marker = markers[seq];
            var infoWindow = infoWindows[seq];

            if (infoWindow.getMap()) {
                infoWindow.close();
            } else {
                // alert('이벤트는 여기?' + seq)
                $('.popup_wrap').addClass('on');
                $('.contents').html(seq);
                // marker.setPosition(e.coord); // 클릭한지점으로 마크 옮김
                // infoWindow.open(map, marker); // 맵 윈도우 띄우기
            }
        };
    };

    var agreeGeoLocation = function () {
        if (navigator.geolocation) {
            if (loadCurrentPosition < 1) {
                navigator.geolocation.getCurrentPosition(onSuccessGeolocation, onErrorGeolocation);
                return;
            }
            onSuccessGeolocation(location);
        } else {
            var center = map.getCenter();
            infowindow.setContent('<div style="padding:20px;"><h5 style="margin-bottom:5px;color:#f00;">Geolocation not supported</h5></div>');
            infowindow.open(map, center);
        }
    };

    naverMap.init = function () {
        naverMap.event();
        naverMap.render();
        agreeGeoLocation();
        const autoCompleteJS = new autoComplete({
            selector: '#autoComplete',
            placeHolder: 'Search for Food...',
            data: {
                src: ['Sauce - Thousand Island', 'Wild Boar - Tenderloin', 'Goat - Whole Cut'],
                cache: true,
            },
            resultsList: {
                element: (list, data) => {
                    if (!data.results.length) {
                        // Create "No Results" message element
                        const message = document.createElement('div');
                        // Add class to the created element
                        message.setAttribute('class', 'no_result');
                        // Add message text content
                        message.innerHTML = `<span>Found No Results for "${data.query}"</span>`;
                        // Append message element to the results list
                        list.prepend(message);
                    }
                },
                noResults: true,
            },
            resultItem: {
                highlight: true,
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        autoCompleteJS.input.value = selection;
                        var location = new naver.maps.LatLng(37.2810716, 127.0423522);

                        map.setCenter(location);
                    },
                },
            },
        });
    };

    naverMap.event = function () {
        $('.buttons > input').on('click', function (e) {
            e.preventDefault();
            var mapTypeId = this.id;
            if (map.getMapTypeId() !== naver.maps.MapTypeId[mapTypeId]) {
                map.setMapTypeId(naver.maps.MapTypeId[mapTypeId]); // 지도 유형 변경하기
                $('.buttons > input').removeClass('control-on');
                $(this).addClass('control-on');
            }
        });
        $('.js-refresh').on('click', function () {
            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
            }
            naverMap.render();
        });

        $('.js-close').on('click', function () {
            $('.popup_wrap').removeClass('on');
        });

        $('.js-currentMap').on('click', function () {
            agreeGeoLocation();
        });

        var pano = null;

        function initPanorama() {
            pano = new naver.maps.Panorama('pano', {
                position: new naver.maps.LatLng(37.3599605, 127.1058814),
                pov: {
                    pan: -135,
                    tilt: 29,
                    fov: 100,
                },
                aroundControl: true,
                aroundControlOptions: {
                    position: naver.maps.Position.TOP_RIGHT,
                },
            });
        }

        naver.maps.onJSContentLoaded = initPanorama;

        $('.js-airplane').on('click', function () {
            $('#pano').addClass('active');
        });

        $('.js-road').on('click', function () {
            window.open(
                `http://map.naver.com/index.nhn?slng=126.8966655&slat=37.4830969&stext=출발지&elng=127.0276368&elat=37.4979502&etext=도착지4&menu=route&pathType=1`,
            );
        });
        naver.maps.Event.addListener(map, 'idle', function () {
            updateMarkers(map, markers);
            console.log('지도 움직임');
        });
    };

    naverMap.render = function () {
        for (var key in MARKER_SPRITE_POSITION) {
            var position = new naver.maps.LatLng(southWest.lat() + latSpan * Math.random(), southWest.lng() + lngSpan * Math.random());

            var marker = new naver.maps.Marker({
                map: map,
                position: position,
                title: key,
                icon: {
                    url: './marker.png',
                    size: new naver.maps.Size(40, 42),
                    anchor: new naver.maps.Point(12, 37),
                    // origin: new naver.maps.Point(MARKER_SPRITE_POSITION[key][0], MARKER_SPRITE_POSITION[key][1])
                    origin: new naver.maps.Point(0, 0),
                },
                zIndex: 100,
            });

            var infoWindow = new naver.maps.InfoWindow({
                content: '<div style="width:150px;text-align:center;padding:10px;">수원화성 놀러왔어? <b>"' + key.substr(0, 1) + '"</b>.</div>',
            });

            markers.push(marker);
            infoWindows.push(infoWindow);
        }

        for (var i = 0, ii = markers.length; i < ii; i++) {
            naver.maps.Event.addListener(markers[i], 'click', getClickHandler(i));
        }
    };

    return naverMap;
})(window._naverMap || {});
