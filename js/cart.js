"use strict";

var Cart = {};

Cart.init = function(){
	Cart.Items.init();
	
	$("input[name='address_id']").click(function(){
		var val = $(this).val();
		var wc_id = $(this).data('wc-id');
		
		if(val == 'add'){
			$("#add-address-form").slideDown();
			Cart.setCreateAddressRequired(true);
		}else{
			Cart.updateDeliveryTimeByAddressId(val);
			$("#add-address-form").slideUp();
			Cart.setCreateAddressRequired(false);
			Cart.checkItemsRegion(wc_id);
		}
	});

	
			$("#payment-type-card").click(function(){	
				$("#card-options").slideDown();
				$("#send-check").prop("required", true);
				
				var ch = $(".customer-card-check:checked");
				if(ch.length == 0){
					$("#save-card").prop('disabled', false);
				} else {
					$("#save-card").prop('disabled', true).prop('checked', false);
				}
			});
			
			$("#payment-type-cash").click(function(){	
				$("#card-options").slideUp();
				$("#send-check").prop("required", false);
			});
			
			$("#payment-type-cashless").click(function(){	
				$("#card-options").slideUp();
				$("#send-check").prop("required", false);
			});
		
			$("#place-order").click(function(){
			
				if($("#payment-type-2").prop('checked')){
					pay();
				}
			});
			
	$("#place-order").click(function(){
		Cart.check();
	});			
			
	$("#cart-form").submit(function(){
		var btn = $("#place-order");
	
		Common.addSpinner(btn);
		btn.prop('disabled', true);
		
		if(Cart.check()){
			return true;
		} else {
			btn.prop('disabled', false);
			Common.removeSpinner(btn);
			return false;
		}
		
	});
	
	$("#reg-type-phone").click(function(){
		$("#login-form-sms").slideDown(400,function(){
			$("#login-phone").focus();	
		});
		$("#login-form").slideUp();
		$("#register-form").slideUp();
		Cart.setRegisterRequired(false);
		Cart.setCreateAddressRequired(false);
		Cart.setLoginRequired(false);
		
	});
	
	$("#reg-type-login").click(function(){
		$("#login-form-sms").slideUp();
		$("#login-form").slideDown();
		$("#register-form").slideUp();
		Cart.setRegisterRequired(false);
		Cart.setCreateAddressRequired(false);
		Cart.setLoginRequired(true);
	});
	
	$("#reg-type-create").click(function(){
		$("#login-form-sms").slideUp();
		$("#login-form").slideUp();
		$("#register-form").slideDown();
		Cart.setRegisterRequired(true);
		Cart.setCreateAddressRequired(true);
		Cart.setLoginRequired(false);
	});
	
	$("#register-type-id-2").click(function(){
		$("#register-entity-fields").slideUp();
		$("#create-address-flat").show();
		$("#create-address-office").hide();
		$("#cashless-radio-cont").slideUp()
		Cart.setEntityRequired(false);
	});
	
	$("#register-type-id-1").click(function(){
		$("#register-entity-fields").slideDown(400, function(){
			$("#register-company-name").focus();	
		});
		$("#create-address-flat").hide();
		$("#create-address-office").show();
		$("#cashless-radio-cont").slideDown();
		Cart.setEntityRequired(true);
	});
	
	
	
	$("#add-order-comment").click(function(){
		$('#order-comment').show().focus(); 
		
		$(this).hide(); 
		return false;
	});
	
	$("#show-agreement-dialog").click(function(){
		$("#agreement-dialog").modal('show');
		return false;
	});
	
	$("#btn-use-social-vk").click(function(){
		VK.Auth.login(function(data){
			if(data.status == 'connected'){
				$("#register-social-vk-id").val(data.session.user.id);
				$("#register-last-name").val(data.session.user.last_name);
				$("#register-first-name").val(data.session.user.first_name);
			}
		},4194304);
	});
	
	$(".customer-card-check").click(function(){
		$("#save-card").prop('checked', false).prop('disabled', true);
	});
	
	$("#card-id-new").click(function(){
		$("#save-card").prop('disabled', false);
	});
	
	/* addresses */
	
	$("#create-address-street").select2({
		theme: 'bootstrap',
		tags: true,
		minimumInputLength: 3,
		selectOnClose: true,
		language: "ru",
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
	
	$('select[name="create_address_entrance"]').select2({
		theme: 'bootstrap',
		selectOnClose: true,
		language: "ru",
		placeholder: entrane_ru
	});	

	setInterval(function(){
		var address_id = $("input[name='address_id']:checked").val();
	
		if(address_id){
			if(address_id != "add"){
				Cart.updateDeliveryTimeByAddressId(address_id);
			}
		}

	},300000);

	
	Common.initSocial();
	
	/*
	$(".replace-cart-item-dialog").on("click", ".item", function(){
		let $this = $(this);
		
		Cart.Items.replace($this.attr("data-id"), $this.attr("data-product-id"))
		.then((data) => {
			$(".replace-cart-item-dialog").modal('hide');
			Cart.Items.update();
		})
	});
	*/
}

Cart.replaceItem = function(id, product_id){
	Cart.Items.replace(id, product_id)
	.then((data) => {
		$(".replace-cart-item-dialog").modal('hide');
		Cart.Items.update();
	});
}


Cart.updateDeliveryTimeByGeo = function(latitude, longitude){
	console.log('Cart.updateDeliveryTimeByGeo');
	
	Delivery.getTimesByGeo(latitude, longitude, function(data){
		if(data.result == 'OK'){
			$("#delivery-time").html(null);
		
			data.times.forEach(function(item) {
				$("#delivery-time").append("<option value='" + item.date + "|" + item.time_id + "'>" + item.formatted + "</option>");	
			});
					
			if(data.term.checkout_description){
				$("#delivery-terms div").text(data.term.checkout_description);
				$("#delivery-terms").slideDown();
			}else{
				$("#delivery-terms").slideUp();
			}
		}
	});
};

Cart.updateDeliveryTimeByAddressId = function(address_id){
	$("#place-order").prop('disabled', true);
	var btn = $("#place-order");
	
	var cur_val = $("#delivery-time").val();
	var val_changed = true;
	
	Common.addSpinner(btn);
	
	//$("#place-order").html('<i class="fas fa-spinner fa-spin"></i> ' + btn_text);
	btn.prop('disabled', true);
	
	$.ajax({
		url: '/api/delivery/address/' + address_id,
		type: 'GET',
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function(data) {
			if(data.result == 'OK'){
				$("#delivery-time").html(null);
			
				data.times.forEach(function(item) {
					var val = item.date + "|" + item.time_id;
					
					$("#delivery-time").append("<option value='" + val + "'>" + item.formatted + "</option>");	
					
					if(cur_val == val){
						val_changed = false;
					}
				});
						
				if(data.term.checkout_description){
					$("#delivery-terms div span").text(data.term.checkout_description);
					$("#delivery-terms").slideDown();
				}else{
					$("#delivery-terms").slideUp();
				}
				
				if(val_changed) {
					$("#intarvals-change-alert").slideDown();
				} else {
					$("#delivery-time").val(cur_val);
				}
			}
		},
		complete: function(){
			//$("#place-order").prop('disabled', false);       
			//$("#place-order").html(btn_text);
			btn.prop('disabled', false);
			Common.removeSpinner(btn);
		},
		error: function(){
			alert('Не удалось уточнить условия доставки для выбранного адреса.');
		}
	});
	
	
};


Cart.addProduct = function(product_id, qty, type){
	$.ajax({
		type: "POST",
		url: "/api/cart/add",
		data: JSON.stringify({
			product_id: product_id,
			qty: qty,
			sell_type: type	
		}),
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function(data){
			if(data.ecommerce){
				dataLayer.push({
					"ecommerce": data.ecommerce
				});
				console.log(dataLayer);
			}
		},
		error: function(errMsg) {
			            //
		},
		complete: function(){
			            
		}
	});
};

Cart.check = function(){
	Cart.clearErrors();
	
	var address_id = $("input[name='address_id']:checked").val();
	
	
	
	if(address_id)
	{
		if(address_id == "add")
		{
			console.log("Add address");
			Cart.checkCreateAddress();
		}
		else
		{
			console.log("Set addreess");
		}
	}
	else  //new customer
	{
		var reg_type = $("input[name='reg_type']:checked").val();
		
		if(reg_type == "create"){
			if(!Cart.checkRegister())
			{
				return false;
			
			}
			if(!Cart.checkCreateAddress())
			{
				return false;
			}
		}else{
			var login = $("#login-identity").val();
			
			if(login == ''){
				$("#reg-type-create").click();
				return false;	
			}
			//$("#reg-type-create").click();
			//$("#login-form").slideUp();
			//$("#register-form").slideDown();
			//Cart.setRegisterRequired(true);
			//Cart.setCreateAddressRequired(true);
			//return false;
		}
		
		
	}
	
	return true;
	
};

Cart.checkCreateAddress = function(){
	var result = true;
	
	var house = $("#create-address-house").val().trim();
	
	if(house == ""){
 	 	Cart.addError('Необходимо указать номер дома');	
		result = false;
	}
	
	if($("#create-address-flat").is(":visible"))
	{
		var flat = $("#create-address-flat").val().trim();
		
		if(flat == ""){
			Cart.addError('Необходимо указать номер квартиры');	
			result = false;
		}	
	}
	
	
	if($("#create-address-office").is(":visible"))
	{
		var flat = $("#create-address-office").val().trim();
		
		if(flat == ""){
			Cart.addError('Необходимо указать номер офиса');
			result = false;	
		}	
		
	}
	
	var street = $("#create-address-street").val();
	
	if(street == "Улица"){
		Cart.addError('Необходимо указать улицу');
		result = false;
	}
	
	return result;
}

Cart.checkRegister = function(){
	var result = true;
	
	if($("#register-first-name").val().trim() == ""){
 	 	Cart.addError('Необходимо указать имя');	
		result = false;
	}
	
	if($("#register-last-name").val().trim() == ""){
 	 	Cart.addError('Необходимо указать фамилию');	
		result = false;
	}
	
	if($("#register-first-name").val().trim() == ""){
 	 	Cart.addError('Необходимо указать телефон');	
		result = false;
	}
	

	if($("#register-phone").val().trim() == ""){
 	 	Cart.addError('Необходимо указать телефон');	
		result = false;
	}
	
	if($("#accept-check").is(":visible")){
		if(!$("#accept-check").prop('checked')){
			Cart.addError('Необходимо согласиться с условиями обработки персональных данных');		
			result = false;
		}
	}

		
	
	return result;
}

Cart.addError = function(text){
	var result = true;
	
	$("#cart-errors").append('<li>' + text + '</li>');
	
}

Cart.clearErrors = function(text){
	$("#cart-errors").html(null);
}

Cart.setCreateAddressRequired = function(required){
	$("#create-address-house").prop('required', required);
	
	if(required){
		if($("#create-address-flat").is(":visible")){
			$("#create-address-flat").prop('required', true);
		}
		if($("#create-address-office").is(":visible")){
			$("#create-address-office").prop('required', true);
		}
	}else{
		$("#create-address-flat").prop('required', false);
		$("#create-address-office").prop('required', false);
	}
	
}

Cart.setRegisterRequired = function(required){
	$("#register-first-name").prop('required', required);
	$("#register-last-name").prop('required', required);
	$("#register-phone").prop('required', required);
}

Cart.setLoginRequired = function(required){
	$("#login-identity").prop('required', required);
	$("#login-password").prop('required', required);
}

Cart.setEntityRequired = function(required){
	$("#register-company-name").prop('required', required);
	$("#register-company-inn").prop('required', required);
	
	$("#create-address-flat").prop('required', !required);
}

Cart.setQty = function(id, qty){
	Promise.resolve($.ajax({
   		url: "/cart/set-qty",
   		type: 'POST',
   		contentType: "application/json; charset=utf-8",
   		dataType: "json",
   		data: JSON.stringify({
	   		qty: qty,
	   		id: id
	   	}),
	}))
	.then((result) => {
		if(result.result == 'OK'){
	   		var cont = $('#item-' + id);	   			
	   		cont.find('.water-price').text(result.water_price);
	   		cont.find('.item-amount span').text(result.amount);
			   			
	   		$('#total-amount').text(result.total_amount);
	   		$('#total-water-qty').val(result.total_water_qty);
  		}
	})
	.then(() => {
		Cart.Items.update();
	});
};


Cart.checkItemsRegion = function(wc_id){
	var items = $(".cart-item");
	$(".cart-item").each(function (index, value) { 
		var item = $(this);
		var item_wc_id = item.attr("data-wc-id");
		
		if(item_wc_id != wc_id){
			item.find(".disable-overlay").show();
		} else {
			item.find(".disable-overlay").hide();
		}
	});
}

Cart.createAddressInit = function(){
	$("#show-map-dialog").click(function(){
			$("#map-dialog").modal();
		});
		
		        
		ymaps.ready(function(){
			var geocode = function(coord){
			    var geocoder = ymaps.geocode(coord, {kind: 'house'});
				    
				geocoder.then(
					function (res) {
						var address = res.geoObjects.get(0).properties.get('metaDataProperty').GeocoderMetaData.Address.Components;
						
				        address.forEach(function(item) {
							if(item.kind == 'house'){     
									$( "#create-address-house" ).val(item.name);        
							}else if(item.kind == 'street'){							        
								var street_select = $("#create-address-street");
								street_select.html(null).trigger("change"); 
								street_select.append('<option value="' + item.name + '" select>' + item.name + '</option>');
								street_select.trigger('change');              
						    }
						});      	        
					},
					function (err) {
					        alert('Ошибка определения коодинат доставки');
					}
				);
			}
				
				var placemark = new ymaps.GeoObject({
					geometry: {
						type: "Point", // тип геометрии - точка
						coordinates: [map_center_latitude, map_center_longitude] // координаты точки
					}
					},{
					draggable: true
				});

				

                       // Ссылка на элемент.
	            var map = new ymaps.Map("map", {
	                center: [map_center_latitude, map_center_longitude],
	                zoom: 9,
	                controls: []
	            });
	            
	            
	            // Добавим элемент управления с собственной меткой геолокации на карте.
				var geolocationControl = new ymaps.control.GeolocationControl({
				    options: {
				        noPlacemark: true
				    }
				});
				
				
				geolocationControl.events.add('locationchange', function (event) {
				    var position = event.get('position');
					//console.log(position);
				    placemark.geometry.setCoordinates(position);
					geocode(position);
				    
				    
				    map.setZoom( 16 );
				    map.panTo(position);
				    
				    //Cart.updateDeliveryTimeByGeo(position[0], position[1]);
				    
				});
				
				$("#geolocation").click(function(){
					geolocationControl.click();
				});
				
				map.controls.add(geolocationControl);
				
				map.events.add("click", function (e) {
					var coords = e.get('coords');
					//console.log(coords);
					placemark.geometry.setCoordinates(e.get("coords"));
					//geocode(coords);
					
					//Cart.updateDeliveryTimeByGeo(coords[0], coords[1]);
				});
	            
	           	map.geoObjects.add(placemark); 
				
				$("#create-address-street").on('select2:select', function (e) {
					var data = e.params.data;
					var query = data.text + ' ' + $( "input[name='house']" ).val();
					
		
					
					ymaps.geocode(query, {
						results: 1
					}).then(function (res) {
						console.log(res);
						
						var firstGeoObject = res.geoObjects.get(0);
						сoords = firstGeoObject.geometry.getCoordinates();
						
						placemark.geometry.setCoordinates(сoords);
						map.setZoom( 16 );
						map.panTo(сoords);
						
						Addresses.createAddressSetCoord(coords);
						Cart.updateDeliveryTimeByGeo(сoords[0], сoords[1]);
						
					});
					
				});
				
				$("#map-select-btn").click(function(){
					var coords = placemark.geometry.getCoordinates();
				    geocode(coords);
				    
				    Addresses.createAddressSetCoord(coords);
				    Cart.updateDeliveryTimeByGeo(coords[0], coords[1]);
				    				    
					$("#map-dialog").modal('hide');
				});
				
				var geocode_timer_id;
				
				$( "input[name='create_address_building']" ).on('keyup', function (e) {
					var data = $("#create-address-street").select2('data');
					var house = $(this).val();
					
					
					if(data.length>0){
						
						clearTimeout(geocode_timer_id);
						geocode_timer_id = setTimeout(function(){		
							var street_name = data[0].text;	
							var query = street_name + ' ' + house;
					
							ymaps.geocode(query, {
								results: 1
							}).then(
								function (res) {
									var firstGeoObject = res.geoObjects.get(0);
											
									var coords = firstGeoObject.geometry.getCoordinates();
									
									
									$("input[name='create_address_latitude']").val(coords[0]);
									$("input[name='create_address_longitude']").val(coords[1]);
									Cart.updateDeliveryTimeByGeo(coords[0], coords[1]);
																	
									placemark.geometry.setCoordinates(coords);
									map.setZoom( 16 );
									map.panTo(coords);
								},
								function(err) {
									console.log(err);
								}
								
							).catch(function(e) {
								console.log(e); // doesn't happen
							});
						}, 1000);
					} else {
						console.log("Select2 results not found");
					}
				});
		       	
		       
        });   	
}

Cart.Items = {};
Cart.Items.updateTimerId = null;
Cart.Items.updateDebounceInterval = 300;
Cart.Items.updateXHR = null;

Cart.Items.init = function(){
	$("#items-cont").on("click", ".delete-item", function(event){
		let $row = $(this).parent().parent().parent().parent();
		var id = $(this).attr('data-id');
				
		if(confirm("Вы точно хотите удалить товар из корзины?")){
			$(this).closest( ".cart-item" ).slideUp(300, function(){
				Cart.Items.deleteItem(id);	
			});
			
		}
	});
	
	$("#items-cont").on("keyup", ".item-qty", function(event){
		let id = $(this).attr('data-id');
		let qty = parseInt($(this).val());
			
		if(qty > 0){
			Cart.setQty(id, qty);
		}
	});
	
	$("#items-cont").on("click", function(event){
		let $target = $(event.target);
		
		if($target.hasClass("btn-plus")){
			let id = $target.attr('data-id');
			let inp = $target.parent().parent().find(".item-qty");
			let qty = parseInt(inp.val());
			qty++;
			inp.val(qty);
				
			Cart.setQty(id, qty);
		} else if($target.hasClass("btn-minus")){
			let id = $target.data('id');
			let inp = $target.parent().parent().find(".item-qty");
			let qty = parseInt(inp.val());
			let min_count = inp.prop('min');
			if(min_count < qty){
				qty--;
				inp.val(qty);
				Cart.setQty(id, qty);
			}
		}
	});
	
	$(".item-qty").inputFilter(function(value) {
		return /^\d*$/.test(value) && (value === "" || parseInt(value) > 0)
	});
}

Cart.Items.update = function(){
	let self = this;
	
	let spinner = "<i class='fas fa-circle-notch fa-spin'></i>";
	
	$(".cart-item-ctls .item-amount").html(spinner);
	$("#items-cont .sub-products").addClass("blur");
	
	if(this.updateTimerId == null){
		this.updateTimerId = setTimeout(() => {
			self.updateXHR = $.ajax({
				url: "/cart/items"
			})
			.then((data) => {
				self.updateXHR = null;
				$("#items-cont").html(data);
			});
			/*
			Promise.resolve($("#items-cont").load("/cart/items"))
			.then((data) => {
				console.log(this);
			});
			*/
		}, this.updateDebounceInterval);
	} else {
		clearTimeout(this.updateTimerId);
		this.updateTimerId = null;
		
		if(this.updateXHR != null){
			console.log(this.updateXHR);
			this.updateXHR.abort();
			this.updateXHR = null;
		}
		
		this.update();
	}
	
	//return Promise.resolve($("#items-cont").load("/cart/items"));
};

Cart.Items.deleteItem = function(id){
	Promise.resolve($.ajax({
		url: "/cart/" + id,
		type: "DELETE",
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	}))
	.then(() => {
		return Cart.Items.update();
	});
};

Cart.Items.add = function(product_id, qty, type){
	return Promise.resolve($.ajax({
		type: "POST",
		url: "/cart/add",
		data: JSON.stringify({
			id: product_id,
			qty: qty,
			sell_type: type	
		}),
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	}))
	.then(data => {
		if(data.ecommerce && (window.dataLayer !== undefined)){
			dataLayer.push({
				"ecommerce": data.ecommerce
			});
		}
		return data;
	});
};

Cart.Items.replace = function(id, product_id){
	return Promise.resolve($.ajax({
		type: "POST",
		url: `/cart/${id}/replace`,
		data: JSON.stringify({
			product_id: product_id
		}),
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	}))
	.then(data => {
		return data;
	});
};

