function init() {
    var search = null;
    var deliveryZonesAll = [];
    var suggestView = new ymaps.SuggestView('suggest'),
        map,
        placemark;
    var map = new ymaps.Map('map', {
        center: [lat, long],
        zoom: 9,
        controls: ['zoomControl']
    });
    deliveryPoint = new ymaps.GeoObject({
        geometry: {type: 'Point'},
        properties: {iconCaption: 'Адрес'}
    }, {
        preset: 'islands#blackDotIconWithCaption',
        draggable: true,
        iconCaptionMaxWidth: '215'
    });

    map.container.fitToViewport();
    map.geoObjects.add(deliveryPoint);

    onZonesLoad();

    function onZonesLoad() {
        //Цвет досутпных зон (зеленый)
        var color = "#56db40";
        var geoJson = null;
        objectManager = new ymaps.ObjectManager();

        terms.forEach(function (term, index) {
            if (term.geojson != null && term.geojson != 'null') {
                //Парсим geojson условия доставки и устанавливаем ему зеленый цвет (прозрачность 100%)
                geoJson = JSON.parse(term.geojson)
                geoJson.features.forEach(function (feature, f_idx) {
                    feature.options = {
                        fillColor: color,
                        fillOpacity: 0,
                        strokeColor: feature.properties.stroke,
                        strokeWidth: 0,
                        strokeOpacity: 0,
                    };
                    feature.properties.balloonContent = feature.properties.description;
                    if(feature.geometry.type == "Polygon"){
                        feature.geometry.coordinates[0].forEach(function (coordinates, i) {
                            var b = coordinates[1];
                            coordinates[1] = coordinates[0];
                            coordinates[0] = b;
                        });
                    }
                });
                term.geojson = geoJson;

                //Добавляем geojson условия на карту и сохраняем в переменную
                //Делаем прослушку события по клику внтури полигона с условием
                deliveryZonesAll.push(ymaps.geoQuery(geoJson).addToMap(map).addEvents('click', function (event) {
                    //Прослушка события клик
                    event.preventDefault();
                    deliveryZonesAll.forEach(function (deliveryZones, index) {
                        deliveryZones.setOptions('fillOpacity', 0);
                    });
                    let coordsClick = event.get('coords');
                    ymaps.geocode(coordsClick).then(function (res) {
                        var firstGeoObject = res.geoObjects.get(0);
                        highlightResult(firstGeoObject)
                    });
                }));
            }
        });

        // При перемещении метки сбрасываем подпись, содержимое балуна и перекрашиваем метку.
        deliveryPoint.events.add('dragstart', function () {
            deliveryPoint.properties.set({iconCaption: '', balloonContent: ''});
            deliveryPoint.options.set('iconColor', 'black');
        });

        // По окончании перемещения метки вызываем функцию выделения зоны доставки.
        deliveryPoint.events.add('dragend', function () {
            highlightResult(deliveryPoint);
        });

        // Просшука клика по кнопке найти
        $('#button').bind('click', function (e) {
                $("#static_map").hide();
                $("#map").show();
            deliveryZonesAll.forEach(function (deliveryZones, index) {
                deliveryZones.setOptions('fillOpacity', 0);

            });
            var request = $('#suggest').val();
            ymaps.geocode(request).then(function (res) {
                search = res.geoObjects.get(0);
                highlightResult(search)
            });

        });

        //Прослушка клика по карте без условий доставки
        map.events.add('click', function (event) {
            event.preventDefault();
            deliveryZonesAll.forEach(function (deliveryZones, index) {
                deliveryZones.setOptions('fillOpacity', 0);
            });
            let coordsClick = event.get('coords');
            $('#suggest').val('');
            ymaps.geocode(coordsClick).then(function (res) {
                var firstGeoObject = res.geoObjects.get(0);
                highlightResult(firstGeoObject)
            });
        });

        //Функция проверки попадания клика или поискового запроса в зону доставки
        function highlightResult(obj) {
            var find = false;
            $("#express-order").hide();
            deliveryZonesAll.forEach(function (deliveryZones, index) {
                if (!find){
                    // Сохраняем координаты переданного объекта.
                    var coords = obj.geometry.getCoordinates(),
                        // Находим полигон, в который входят переданные координаты.
                        polygon = deliveryZones.searchContaining(coords).get(0);
                    if (polygon) {
                        // Уменьшаем прозрачность всех полигонов, кроме того, в который входят переданные координаты.
                        deliveryZones.setOptions('fillOpacity', 0);
                        deliveryZones.applyBoundsToMap(map);
                        polygon.options.set('fillOpacity', 0.4);
                        // Перемещаем метку с подписью в переданные координаты и перекрашиваем её в цвет полигона.
                        deliveryPoint.geometry.setCoordinates(coords);
                        deliveryPoint.options.set('iconColor', polygon.properties.get('fill'));
                        // Задаем подпись для метки и легенды.
                        getTermsForLegend(coords[0], coords[1]);
                        if (typeof(obj.getThoroughfare) === 'function') {
                            find = true;
                            setData(obj, polygon);
                        } else {
                            // Если вы не хотите, чтобы при каждом перемещении метки отправлялся запрос к геокодеру,
                            // закомментируйте код ниже.
                            ymaps.geocode(coords, {results: 1}).then(function (res) {
                                var obj = res.geoObjects.get(0);
                                setData(obj);
                            });
                        }
                    } else {
                        getTermsForLegend(coords[0], coords[1], 1);
                        // Если переданные координаты не попадают в полигон, то задаём стандартную прозрачность полигонов.
                        deliveryZones.setOptions('fillOpacity', 0,4);
                        // Перемещаем метку по переданным координатам.
                        deliveryPoint.geometry.setCoordinates(coords);
                        // Задаём контент балуна и метки.
                        deliveryPoint.properties.set({
                            iconCaption: 'Доставка на этот адрес не осуществляется',
                            balloonContent: 'Cвяжитесь с нами по телефону для уточнения информации',
                            balloonContentHeader: ''
                        });
                        // Перекрашиваем метку в чёрный цвет.
                        deliveryPoint.options.set('iconColor', 'black');
                        deliveryPoint.balloon.open()
                    }
                }
            });

            //Описание условий в легенду и бэлун
            function getTermsForLegend(latitude, longitude) {
                var html = '';
                var baloon = '';
                $.ajax({
                    url: '/api/delivery/get-times-by-geo',
                    type: 'GET',
                    data: {
                        'latitude': latitude,
                        'longitude': longitude,
                        'wc_id': wc_id,
                        'delivery_page': true,
                        'count': 5,
                    },
                    success: function(result) {
                        if (result.result == 'OK') {
                            if (result.term.not_found) {
                                baloon += '<p>К сожалению мы не нашли данные по доставке на данный адрес, но вы можете свзяться нами по телефону для уточнения информации</p>';
                                baloon += '<span>Наша компания осуществляет доставку: </span>';
                                baloon += '<ul>';
                                result.periods.forEach(function (periods, index) {
                                    baloon += '<li>' + periods.formatted_time + '</li>'
                                });
                                baloon += '</ul>';
                            } else {
                                $("#express-order").show();
                                // baloon += '<p>Минимальное кол-во бутылей: ' + result.term.min_water_count + '</p>';
                                // if (result.periods.length > 0) {
                                //     baloon += '<span>Периоды доставки: </span>';
                                //     baloon += '<ul>';
                                //     result.periods.forEach(function (periods, index) {
                                //         baloon += '<li>' + periods.formatted_time + '</li>'
                                //     });
                                //     baloon += '</ul>';
                                // }
                                if (result.times.length > 0) {
                                    html += '<span>Если вы закажите прямо сейчас, то мы сможем привести: </span>';
                                    html += '<ul>';
                                    result.times.forEach(function (time, index) {
                                        html += '<li>' + time.formatted + '</li>'
                                    });
                                    html += '</ul>';
                                }
                            }
                            deliveryPoint.properties.set({
                                balloonContent: baloon,
                            });
                            html = baloon+html;
                            $("#delivery-terms").html(html)
                        }
                    }
                });
            }

            //Добавление данных в бэлун (адрес)
            function setData(obj, polygon){
                var address = [obj.getThoroughfare(), obj.getPremiseNumber(), obj.getPremise()].join(' ');
                if (address.trim() === '') {
                    address = obj.getAddressLine();
                }
                var price = polygon.properties.get('description');
                deliveryPoint.properties.set({
                    iconCaption: address,
                    //	balloonContent: address,
                    balloonContentHeader: address
                });
                deliveryPoint.balloon.open()
            }
        }

    }
}