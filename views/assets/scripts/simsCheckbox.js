/*!
 * SmartClass Checkbox plugin
 * ===================================
 *
 * developed by Mert Simsek (simsek97@gmail.com)
 * for SmartClass Project [www.smartclass.us]
 * -------------------------
 * @usage $("#element").simsCheckbox();
 */
 
(function($) {
 
    //vars
    var _mobile = /ipad|iphone|ipod|android|blackberry|windows phone|opera mini|silk/i.test(navigator.userAgent);
 
    //plugin init
    $.fn.simsCheckbox = function(options) {
 
        var selectorElt = this,
        checkboxClass = "btn btn-social";
     
        //settings
        var settings = $.extend({
                             
             //style
             //set treat as checkbox or radio
             btnStyle: 'checkbox',
             
             //selector height
             height: 'auto',
             
             //element
             element: "li",
             
             //title icon
             titleIcon: "square-o",
             
             //layout
             layout: "vertical",
             
             //unchecked class
             uncheckedClass: "btn-default",
             
             //checked class
             checkedClass: "btn-warning",
             
             //select/unselect all button
             selectAllBtn: false,
             
             //select/unselect text
             selectAllText: 'Select/Unselect All',
             
             //callback fn ifChecked
             ifChecked: function() {},
             
             //callback fn ifUnChecked
             ifUnChecked: function() {},
             
             //callback fn ifToggled
             ifToggled: function() {},
             
        }, options);
        
        return selectorElt.each(function(){
                             
            var simsThis = $(this);
            
            //set some css for the selector
            simsThis.css({'margin': '0', 'padding': '1px'});
            
            //layout
            if(settings.layout == "horizontal") simsThis.addClass("btn-group-justified");
            
            //set the height of the selector first
            if(settings.height == 'auto') simsThis.css('height', 'auto');
            else simsThis.css({'height': settings.height, 'overflow': 'auto'});
            
            //add an identifier class to the elements
            simsThis.find(settings.element).addClass('sims-selectable');
            
            //get elements and handle
            simsThis.find(settings.element).each(function(i) {
                                                                 
                var simsElement=$(this), simsElementTitle=simsElement.html();
                
                //add checkbox class
                simsElement.addClass(checkboxClass);
                
                //layout
                if(settings.layout == "vertical") simsElement.addClass("btn-block");
                
                //add checked or unchecked class
                if(simsElement.hasClass('checked')) simsElement.addClass(settings.checkedClass).html('<i class="fa fa-fw fa-check-' + settings.titleIcon + '"></i> ' + simsElementTitle);
                else simsElement.addClass(settings.uncheckedClass).html('<i class="fa fa-fw fa-' + settings.titleIcon + '"></i> ' + simsElementTitle);
                
                //set click event if it is not disabled
                simsElement.off('click').on('click', function (e) {
                                     
                    e.preventDefault();
                    
                    //if the element is disabled then do nothing
                    if($(this).hasClass('disabled')) return false;
                    
                    //if the style is radio kind then unselect all first
                    if(settings.btnStyle == 'radio')
                    {
                        simsElement.parent().find(settings.element).addClass(settings.uncheckedClass).removeClass(settings.checkedClass).find('i').addClass('fa-' + settings.titleIcon).removeClass('fa-check-' + settings.titleIcon);
                    }
                    
                    //toggle the item
                    $(this).toggleClass(settings.uncheckedClass).toggleClass(settings.checkedClass).find('i').toggleClass('fa-' + settings.titleIcon).toggleClass('fa-check-' + settings.titleIcon);
                    
                    //callback
                    clickCheckbox($(this));
                
                }); //end simsElement click
            
            }); //end simsThis each
                 
            //set checkAll button
            if(settings.selectAllBtn)
            {
                 
                //test all checked or not
                var allChecked = (simsThis.find(settings.element).length == simsThis.find(settings.element + '.checked').length) ? true : false;
                var selectAllBtnContainer = $( '<ul></ul>' ).css({'margin': '5px 0 0 0', 'padding': '0'});
                var selectAllBtnElt = $( '<' + settings.element +  ' class="sims-btn-select-all btn-block"></' + settings.element + '>' ).css({'border': '1px dashed', 'text-align': 'left'}).addClass(checkboxClass + ' ' + (allChecked ? settings.checkedClass : settings.uncheckedClass)).html( '<i class="fa fa-fw fa-' + (allChecked ? 'check-' : '') + settings.titleIcon + '"></i> '  + settings.selectAllText );
                             
                simsThis.after( selectAllBtnContainer.append(selectAllBtnElt) );
                             
                //set click event for the selectAll button
                selectAllBtnContainer.find('.sims-btn-select-all').off('click').on('click', function (e) {
                    
                    //prevent default events
                    e.preventDefault();
                    
                    //get button
                    var thisButton = $(this);
                    
                    //get current text
                    var currentHtml = thisButton.html();
                    
                    //set processing
                    thisButton.removeClass("btn-social").prop("disabled", true).addClass("disabled").html("<i class='fa fa-spinner fa-spin'></i> Processing...");
                    
                    //if all items are selected then select-all button is checked
                    //if one of the items is unselected then select-all button is unchecked
                    simsThis.find(settings.element + '.sims-selectable:not(.disabled)').each(function(){
                                                                                                
                        //fix classes of the items
                        if( thisButton.hasClass("btn-warning") ) $(this).removeClass(settings.uncheckedClass).addClass(settings.checkedClass).find('i:first-child').removeClass('fa-' + settings.titleIcon).addClass('fa-check-' + settings.titleIcon);
                        else $(this).addClass(settings.uncheckedClass).removeClass(settings.checkedClass).find('i:first-child').addClass('fa-' + settings.titleIcon).removeClass('fa-check-' + settings.titleIcon);
                        
                        //trigger click event for the items
                        $(this).trigger("click");
                    });
                    
                    //toggle the item
                    thisButton.html(currentHtml);
                    thisButton.addClass("btn-social").prop("disabled", false).removeClass("disabled").toggleClass(settings.uncheckedClass).toggleClass(settings.checkedClass).find('i').toggleClass('fa-' + settings.titleIcon).toggleClass('fa-check-' + settings.titleIcon);
                    
                });
                
            } //end if
                             
            function clickCheckbox(item) {
            
                //check if the button checked or unchecked
                //then call function properly
                if(item.hasClass(settings.checkedClass)) settings.ifChecked.call(item);
                else settings.ifUnChecked.call(item);
                
                //call toggle function anyways
                settings.ifToggled.call(item);
            }
            
        }); //end return
 
    } //end function
    
}(jQuery));
