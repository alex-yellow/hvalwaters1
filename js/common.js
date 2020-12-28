
Auth = {};
Auth.cms_code_sended = false;
Auth.smsTimeout = 60;
Auth.smsTimerId = null;

Auth.showDialog = function(){
	$("#login-dialog").modal();
};

Auth.sendSMSCode = function(phone, success, error){
	$.ajax({
		url: '/auth/send-sms-code',
		type: 'POST',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({
			phone: phone
		}),
		success: success,
		error: error
	});
};

Auth.ckeckSMSCode = function(code, success, error){
	$.ajax({
		url: '/auth/check-sms-code',
		type: 'POST',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({
			code: code
		}),
		success: success,
		error: error
	});
};

Auth.smsTimerTick = function(){
	if(Auth.smsTimeout > 1)
	{
		Auth.smsTimeout--;
	}
	else
	{
		clearInterval(Auth.smsTimerId);
		Auth.smsTimeout = 60;
		$("#login-form-sms-timer").hide();
		$("#auth-send-sms-code").prop("disabled", false);
	}
	
	$("#login-form-sms-timer span").text(Auth.smsTimeout);
};

Auth.checkPhone = function(phone, success, error){
	$.ajax({
		url: '/auth/check-phone',
		type: 'POST',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		data: JSON.stringify({
			phone: phone
		}),
		success: success,
		error: error
	});
};

Auth.init = function(){
	

	
	$("#auth-send-sms-code").click(function(){
		var phone = $("#login-phone").val();
		var button_el = this;
		phone = Common.normalizePhone(phone);
		
		
		if(/^7\d{10}$/.test(phone)){
			$(this).prop("disabled", true);
			$("#login-attemps").hide();
			$("#login-wrong-sms-code").hide();
			
			Common.addSpinner(button_el);
			
			
			Auth.sendSMSCode(phone, function(data){
				if(data.result == 'OK'){
					
					
					$("#login-form-sms-timer").slideDown();
					
					Auth.smsTimerId = setInterval(Auth.smsTimerTick, 1000);
					
					
					$("#login-form-sms-code").slideDown(400, function(){
						
						$("#sms-code").focus();
					});
				} else if(data.result == 'not_found'){
					//alert("Пользователь с таким телефоном не зарегистрирован");
					$("#reg-type-create").click();
					$("#register-phone").val($("#login-phone").val());
					$("#login-forms-cont").hide();
					
				}else{
					alert("Не удалось отправить сообщение (код ошибки: " + data.error_code + ")");	
				}
				Common.removeSpinner(button_el);
			},
			function(){
				alert("Не удалось отправить сообщение. Повторите попытку позже.");
				Common.removeSpinner(button_el);
			});
		}else{
			alert('Неверный формат номера телефона');
		}
		
	});
	
	$("#login-phone").inputFilter(function(value) {
		value = Common.normalizePhone(value);
		
	    var check = /^7\d{10}$/.test(value);
	    var mobile_check = /^7812.+/.test(value) || /^7495.+/.test(value) || /^7499.+/.test(value);
	    
	    if(check){
		    if(mobile_check){
				$("#auth-phone-continue").prop("disabled",false);	    
				$("#auth-send-sms-code").hide();
		    }else{
			    $("#auth-send-sms-code").show();
			    $("#auth-phone-continue").hide();
			    $("#auth-send-sms-code").prop("disabled",false);
		    }
	    }else{
		    $("#auth-phone-continue").show();
		    $("#auth-send-sms-code").hide();
	    }
	    
	    
  	});
  	
  	$("#sms-code").inputFilter(function(value) {
	  	
	  	
	    if(/^\d{4}$/.test(value)){
		    if(!Auth.cms_code_sended){
			    Auth.cms_code_sended = true;
			    
				Auth.ckeckSMSCode(value, function(data){

					if(data.result == 'OK'){
						//window.location.replace("/home");
						document.location.reload();
					}else if(data.result == 'wrong_code'){
						$("#login-wrong-sms-code").show();
						Auth.cms_code_sended = false;
					}else if(data.result == 'login_attempts'){
						$("#login-attemps").show();
						Auth.cms_code_sended = false;
					}else if(data.result == 'not_found'){
						$("#login-not-found").show();
						Auth.cms_code_sended = false;
					}
					
				});  
			}
			
	    }else{
		    $("#login-wrong-sms-code").hide();
	    }	    
  	});
  	
  	$("#auth-password-form-show").click(function(){
	  	$("#login-form-password").show();
	  	$("#login-form-sms").hide();
	  	$("#identity").focus();
	  	return false;
  	});
  	
  	$("#auth-sms-form-show").click(function(){
	  	$("#login-form-password").hide();
	  	$("#login-form-sms").show();
	  	
	  	$("#login-phone").focus();
	  	return false;
  	});
  	
  	$("#auth-phone-continue").click(function(){
	  	var phone = $("#login-phone").val();
		
		phone = Common.normalizePhone(phone);
		
	  	Auth.checkPhone(phone,function(data){
	  		if(data.result == 'OK'){
			  	$("#login-identity").focus();
			}else{
				$("#reg-type-create").click();
				$("#register-phone").val($("#login-phone").val());
				$("#register-first-name").focus();
			}
	  	});
  	});
  	
  	$("#auth-fb").click(function(){
	  	
  	});
  	
  	$("#login-phone").focus();
};

Delivery = {};

Delivery.getTimesByGeo = function(latitude, longitude, success){
	$.ajax({
		url: '/api/delivery/get-times-by-geo?latitude=' + latitude + '&longitude=' + longitude + '&wc_id=' + wc_id,
		type: 'GET',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function(data) {
			success(data);
		}
	});
};


Delivery.getTimesByAddressId = function(address_id, success){
	$.ajax({
		url: '/api/delivery/address/' + address_id,
		type: 'GET',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function(data) {
			success(data);
		}
	});
};

Delivery.getDefaultIntervals = function(success){
	$.ajax({
		url: '/api/delivery/get-default-times?wc_id=' + wc_id,
		type: 'GET',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function(data) {
			success(data);
		}
	});
};




Addresses = {};

/*
Addresses.init = function(){
	$("#create-address-street").select2({
		theme: 'bootstrap',
		tags: true,
		minimumInputLength: 3,
		selectOnClose: true,
		ajax: {
			url: '/api/locations/search-street',
			data: function (params) {
				var query = {
					search: params.term,
					wc_id: $("#create-address-street").data('wc-id'),
					limit: 100
				}
				return query;
			},
			processResults: function (data) {
   				var	_data = [];
					
  				data.results.forEach(function(item, i, arr) {
					_data.push({
						id: item.id,
						text: item.street_name + ' ' + item.short_name + ', ' + item.city_name
					});
				});
 				
				return {
					results: _data
				};
			}
		}
	});	

				
	};
*/
Addresses.serachAddress = function(query){
	console.log(query);
	
	ymaps.geocode(query, {
		results: 1
	}).then(function (res) {				
		var firstGeoObject = res.geoObjects.get(0);
		сoords = firstGeoObject.geometry.getCoordinates();
								
		placemark.geometry.setCoordinates(сoords);
		map.setZoom( 16 );
		map.panTo(сoords);
								
		Addresses.createAddressSetCoord(coords);
		Cart.updateDeliveryTimeByGeo(coords[0], coords[1]);
								
		console.log(coords);
								
	},function (err) {
        alert('Ошибка');
    });
	
};

Addresses.createAddressSetCoord = function(coords){
	$("input[name='create_address_latitude']").val(coords[0]);
	$("input[name='create_address_longitude']").val(coords[1]);
};

var Common = {};

Common.init = function(){
	/*
	$("#round-offer-sht").mouseover(Common.sp_offer_show).mouseout(Common.sp_offer_set);
	setTimeout(Common.sp_offer_hide, 4000);
	*/
	
	$(".city-change").click(function () {
		        if ($("#nav-city-display").text() !== $(this).text()) {
		            $("#nav-city-display").text($(this).text());
		            if (1 === debug) {
		                console.log("city is " + $(this).text());
		            }
		
		        }
		    });
    
			$('.menu-with-sub').hover(
                    function () {

                    }, function () {
                $(this).removeClass("show");
                    $(this).find(".dropdown-menu").removeClass("show");
            });
		
	//Common.delete_cookie('hw_dev_session', '/','dev.hvalwaters.ru');
	//$.removeCookie('hw_dev_session', { path: '/' });
};

Common.sp_offer_hide = function() {
	$("#round-offer-sht").animate({left: "-165px"}, 1000, function () {});
}

Common.sp_offer_show = function() {
	$("#round-offer-sht").animate({left: "0px"}, 300, function () {});
};
                   
Common.sp_offer_set = function() {
	setTimeout(Common.sp_offer_hide, 1000);
};

Common.normalizePhone = function(phone){
	phone = phone.replace(/[^0-9]/g, '');
	
	if('8' == phone.substr(0,1)){
		phone = '7' + phone.substr(1);
	}
	
	return phone;
};



Common.pay  = function (options, success, error) {
    var widget = new cp.CloudPayments();
    
	widget.charge({ // options
		publicId: 'pk_aa81715ac71760b52453300531855',  
		description: 'Оплата на сайте Хваловских Вод', 
		amount: options.amount,
		currency: 'RUB', 
		invoiceId: options.order_number,
		accountId: options.customer_id,
		data: {
			order_id: options.order_id,
			send_check: options.send_check
		},
		success: success,
		error: error
	});
}; 

Common.initSocial= function(){
	VK.init({
		apiId: 6608681
	});
		
	FB.init({
		appId      : '2111189665820405',
		cookie     : true,
		xfbml      : true,
		version    : 'v3.0'
    });
};

Common.addSpinner = function(el){	
	$( "<i class='fas fa-circle-notch fa-spin'></i> " ).prependTo( el );
};

Common.removeSpinner = function(el){
	$(el).find("i.fa-spin").remove();
};

Common.delete_cookie = function( name, path, domain ) {

    document.cookie = name + "=" +
      ((path) ? ";path="+path:"")+
      ((domain)?";domain="+domain:"") +
      ";expires=Thu, 01 Jan 1970 00:00:01 GMT";

};

Common.select2Ru = function() {
	$.fn.select2.amd.define('select2/i18n/ru',[],function () {
	    // Russian
	    return {
	        errorLoading: function () {
	            return 'Результат не может быть загружен.';
	        },
	        inputTooLong: function (args) {
	            var overChars = args.input.length - args.maximum;
	            var message = 'Пожалуйста, удалите ' + overChars + ' символ';
	            if (overChars >= 2 && overChars <= 4) {
	                message += 'а';
	            } else if (overChars >= 5) {
	                message += 'ов';
	            }
	            return message;
	        },
	        inputTooShort: function (args) {
	            var remainingChars = args.minimum - args.input.length;
	
	            var message = 'Пожалуйста, введите ' + remainingChars + ' или более символов';
	
	            return message;
	        },
	        loadingMore: function () {
	            return 'Загружаем ещё ресурсы…';
	        },
	        maximumSelected: function (args) {
	            var message = 'Вы можете выбрать ' + args.maximum + ' элемент';
	
	            if (args.maximum  >= 2 && args.maximum <= 4) {
	                message += 'а';
	            } else if (args.maximum >= 5) {
	                message += 'ов';
	            }
	
	            return message;
	        },
	        noResults: function () {
	          return 'Ничего не найдено';
	        },
	        searching: function () {
	          return 'Поиск…';
	        }
	    };
	});
};

var Ecommerce = {};

Ecommerce.addToCard = function(id, name, price, brand, category, qty) {
	let obj = {
	    "ecommerce": {
	        "add": {
	            "products": [
	                {
	                    "id": id,
	                    "name": name,
	                    "price": price,
	                    "brand": brand,
	                    "category": category,
	                    "quantity": qty
	                }
	            ]
	        }
	    }
	}
	dataLayer.push(obj);
	console.log(dataLayer);
};

Common.getWaterPrice = function(qty, pricing){
	let price = 0;

	$.each(pricing, function(index, value) {
		if(qty >= index){		
			price = value;
			return;
		}
	}); 
		
	return price;
};


(function($) {

	
	
  $.fn.inputFilter = function(inputFilter) {
    return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function() {
      if (inputFilter(this.value)) {
        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      }
    });
  };
  
  jQuery.browser = {};
	(function () {
	    jQuery.browser.msie = false;
	    jQuery.browser.version = 0;
	    if (navigator.userAgent.match(/MSIE ([0-9]+)\./)) {
	        jQuery.browser.msie = true;
	        jQuery.browser.version = RegExp.$1;
	    }
	})();
  
  Delivery.getDefaultIntervals(function(data){
	  console.log(data);
	  var time = data.times[0].formatted;
	  
	  //console.log(time);
	  
	  time = time.replace(" с ", "<br> <span>c<span> " );
	  time = time.replace(" до ", "<span> до <span>" );
	  
	  //console.log(time);
	  
	  $(".time-select-bottom span").html(time);
  });
  
  Common.init();
  
}(jQuery));