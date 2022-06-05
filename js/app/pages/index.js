import * as templateHelper from "./../core/template_helper";
import * as alertHelper from "./../core/alert_helper";
import * as mediaHelper from "./../core/media_helper";
import * as loadingHelper from "./../core/loading_helper";
import * as colorHelper from "./../core/color_helper";
import ActivityService from "../business_logic/service/activityService";
import ActivityDataProxy from "../data_proxy/activityDataProxy";
import HistoryService from "../business_logic/service/historyService";
import HistoryDataProxy from "../data_proxy/historyDataProxy";
import MediaGalleryComponent from "./components/media-gallery";
import FormView from "./form"

class HomeView {
  constructor() {
    this.activityService = new ActivityService(new ActivityDataProxy());
    this.historyService = new HistoryService(new HistoryDataProxy());
    this.tempData = [];
    this.is_hide = true;
  }

  async fetchActivities() {
    loadingHelper.toggleLoading(true);
    const command = await this.activityService
      .getSortByPositionCommand()
      .execute();

    if (command.success) {
      const activitiesData = command.value;
      if (activitiesData.success) {
        this.tempData = activitiesData.response.data;
        if($('#doneAction').data('activepage') == 'edit') {
          this.handleClickEditButton();
        } else {
          this.showActivitiesData(this.tempData.filter(v => !v.is_hide));
        }
        loadingHelper.toggleLoading(false);
      }
    }
  }

  showActivitiesData(dataSource) {
    const emptyContent = $("#empty-content");
    const reportWrapper = $(".report-wrapper");
    // prepare template
    let rowActivityFloatTpl = $(
      'script[data-template="row-activity-float"]'
    ).text();
    let rowActivitySpeedrunTpl = $(
      'script[data-template="row-activity-speedrun"]'
    ).text();
    let rowActivityTextfieldTpl = $(
      'script[data-template="row-activity-textfield"]'
    ).text();
    const editableValueActivityTpl = $(
      'script[data-template="editable-value-activity-template"'
    ).text();
    const disabledValueActivityTpl = $(
      'script[data-template="disabled-value-activity-template"'
    ).text();

    if (!dataSource.length) {
      emptyContent.show();
      return;
    }
    emptyContent.hide();
    // clear activities
    reportWrapper.find("#float-wrapper").empty();
    reportWrapper.find("#text-wrapper").empty();

    let tempActivityRowFloatHtml = "";
    let tempActivityRowTextfieldHtml = "";

    function changeColorBtnActivity(color, el) {
      if (color) {
        el.find(".btn-add-value").css("background-color", color);
        // el.find(".btn-add-value").css(
        //   "color",
        //   colorHelper.isDark(color) ? "#ffffff" : "#000000"
        // );
      } else {
        el.find(".btn-add-value").css("background-color", "");
        el.find(".btn-add-value").css("color", "");
      }
    }

    dataSource.forEach((activityData) => {
      // process if activity is use textfield
      if (['count'].indexOf(activityData.type) >= 0) {
        //prepare content activity row for textfield value
        let contentActivityRowTextfield = {
          title: activityData.title,
          activity_id: activityData.id,
          placeholder: activityData.type == 'speedrun' ? 'TAST' : 'Text Field',
          score_target: activityData.score_target,
          is_red: activityData.is_red ? 'true' : 'false',
          color: activityData.color,
          colorBtnHide: Number(activityData.is_hide) ? '' : 'text-primary',
          titleBtnHide: Number(activityData.is_hide) ? 'Show' : 'Hide',
          iconBtnHide: Number(activityData.is_hide) ? 'fa-eye-slash' : 'fa-eye',
          colorBtnFocus: Number(activityData.is_focus_enabled) ? 'text-primary' : '',
          titleBtnFocus: Number(activityData.is_focus_enabled) ? 'Set Inactive' : 'Set Active',
          iconBtnFocus: Number(activityData.is_focus_enabled) ? 'fa-bullseye' : 'fa-bullseye',
          order_number: activityData.position,
        };

        if(activityData.type == 'badhabit' && activityData.is_red) {
          contentActivityRowTextfield.style = "color:red";
        }

        // modify template change color of button
        rowActivityTextfieldTpl = $(rowActivityTextfieldTpl);
        rowActivityTextfieldTpl
          .find(".changepos-btn-wrapper")
          .attr("data-activityId", activityData["id"]);
        changeColorBtnActivity(activityData["color"], rowActivityTextfieldTpl);

        // get html script from modified template
        rowActivityTextfieldTpl = rowActivityTextfieldTpl[0].outerHTML;

        // render template and save to temp variable
        tempActivityRowTextfieldHtml += templateHelper.render(
          rowActivityTextfieldTpl,
          contentActivityRowTextfield
        );
        return null;
      }

      // process if activity not using textfield
      if(activityData.type == 'value' || activityData.type == 'badhabit') {
        let templateValueActivity = activityData.can_change
          ? editableValueActivityTpl
          : disabledValueActivityTpl;
  
        const contentActivityValue = {
          activity_id: activityData.id,
          value: activityData.value,
          increase_value: activityData.increase_value,
          score_target: activityData.score_target,
          is_red: activityData.is_red ? 'true' : 'false',
          color: activityData.color,
          colorBtnHide: Number(activityData.is_hide) ? '' : 'text-primary',
          titleBtnHide: Number(activityData.is_hide) ? 'Show' : 'Hide',
          iconBtnHide: Number(activityData.is_hide) ? 'fa-eye-slash' : 'fa-eye',
          colorBtnFocus: Number(activityData.is_focus_enabled) ? 'text-primary' : '',
          titleBtnFocus: Number(activityData.is_focus_enabled) ? 'Set Inactive' : 'Set Active',
          iconBtnFocus: Number(activityData.is_focus_enabled) ? 'fa-bullseye' : 'fa-bullseye',
          order_number: activityData.position,
        };

        if(activityData.type == 'badhabit' && activityData.is_red) {
          contentActivityValue.style = "color:red";
        }
  
        const valueActivityHtml = templateHelper.render(
          templateValueActivity,
          contentActivityValue
        );
  
        //prepare content activity row for float value
        let contentActivityRowFloat = {
          title: activityData.title,
          activity_id: activityData.id,
          value_activity_html: valueActivityHtml,
          score_target: activityData.score_target,
          is_red: activityData.is_red ? 'true' : 'false',
          color: activityData.color,
          colorBtnHide: Number(activityData.is_hide) ? '' : 'text-primary',
          titleBtnHide: Number(activityData.is_hide) ? 'Show' : 'Hide',
          iconBtnHide: Number(activityData.is_hide) ? 'fa-eye-slash' : 'fa-eye',
          colorBtnFocus: Number(activityData.is_focus_enabled) ? 'text-primary' : '',
          titleBtnFocus: Number(activityData.is_focus_enabled) ? 'Set Inactive' : 'Set Active',
          iconBtnFocus: Number(activityData.is_focus_enabled) ? 'fa-bullseye' : 'fa-bullseye',
          order_number: activityData.position,
        };
  
        // modify template change color of button
        rowActivityFloatTpl = $(rowActivityFloatTpl);
        rowActivityFloatTpl
          .find(".changepos-btn-wrapper")
          .attr("data-activityId", activityData["id"]);
        changeColorBtnActivity(activityData["color"], rowActivityFloatTpl);
  
        // get html script from modified template
        rowActivityFloatTpl = rowActivityFloatTpl[0].outerHTML;
  
        // render template and save to temp variable
        tempActivityRowFloatHtml += templateHelper.render(
          rowActivityFloatTpl,
          contentActivityRowFloat
        );
      } else if(activityData.type == 'speedrun') {
        let contentActivityRowSpeedrun = {
          title: activityData.title,
          activity_id: activityData.id,
          score_target: activityData.score_target,
          is_red: activityData.is_red ? 'true' : 'false',
          color: activityData.color,
          colorBtnHide: Number(activityData.is_hide) ? '' : 'text-primary',
          titleBtnHide: Number(activityData.is_hide) ? 'Show' : 'Hide',
          iconBtnHide: Number(activityData.is_hide) ? 'fa-eye-slash' : 'fa-eye',
          colorBtnFocus: Number(activityData.is_focus_enabled) ? 'text-primary' : '',
          titleBtnFocus: Number(activityData.is_focus_enabled) ? 'Set Inactive' : 'Set Active',
          iconBtnFocus: Number(activityData.is_focus_enabled) ? 'fa-bullseye' : 'fa-bullseye',
          order_number: activityData.position,
        };
  
        // modify template change color of button
        rowActivitySpeedrunTpl = $(rowActivitySpeedrunTpl);
        rowActivitySpeedrunTpl
          .find(".changepos-btn-wrapper")
          .attr("data-activityId", activityData["id"]);
        changeColorBtnActivity(activityData["color"], rowActivitySpeedrunTpl);
  
        rowActivitySpeedrunTpl.find('input[name=hour]').prop('disabled', activityData.is_ms_enable);
        rowActivitySpeedrunTpl.find('input[name=millisecond]').prop('disabled', !activityData.is_ms_enable);
        
        // get html script from modified template
        rowActivitySpeedrunTpl = rowActivitySpeedrunTpl[0].outerHTML;
  
        // render template and save to temp variable
        tempActivityRowTextfieldHtml += templateHelper.render(
          rowActivitySpeedrunTpl,
          contentActivityRowSpeedrun
        );
      }
    });

    // render list activity
    reportWrapper.find("#float-wrapper").append(tempActivityRowFloatHtml);
    reportWrapper.find("#text-wrapper").append(tempActivityRowTextfieldHtml);
  }

  getValuePositionOfActivities() {
    const values = $(".row-activity").map(function (i) {
      const btnPos = $(this).find(".changepos-btn-wrapper");
      const activityId = btnPos.data("activityid");

      return {
        activity_id: activityId,
        position: i+1,
      };
    });

    return values.toArray();
  }

  async changePosition(direction = "up", currentEl = null, parentEl = null) {
    var children = $(parentEl).children();
    var currentIndex = currentEl.index();
    var newIndex = direction == "up" ? currentIndex - 1 : currentIndex + 1;
    var totalIndex = children.length - 1;
    if (newIndex > totalIndex || newIndex < 0) {
      return;
    } else {
      var temp = children[newIndex];
      children[newIndex] = children[currentIndex];
      children[currentIndex] = temp;

      const newValue = $(children[newIndex]).find('.input-activity-position').val();
      const currentValue = $(children[currentIndex]).find('.input-activity-position').val();

      $(children[newIndex]).find('.input-activity-position').val(currentValue);
      $(children[currentIndex]).find('.input-activity-position').val(newValue);
    }
    $(parentEl).html(children);
  }

  handleClickButtonChangePosition(direction, el) {
    const floatEl = $(el).closest(".row-activity-float");
    const textfieldEl = $(el).closest(".row-activity-textfield");
    const parentEl = floatEl.length ? "#float-wrapper" : "#text-wrapper";
    const currentEl = floatEl.length ? floatEl : textfieldEl;

    this.changePosition(direction, currentEl, parentEl);
    this.updateArrangePosition();
  }

  async handleClickButtonAddValue(evt, inputElement) {
    //get activity id and input value
    var elInput = null;
    if(inputElement) {
      elInput = inputElement;
    } else {
      elInput = $(evt)
        .parents(".input-activity-group")
        .find(".input-activity-value");
    }
    let activityId = elInput.attr("activityId");
    const useTextfield = elInput.is("[type=text]");
    const useNumberField = elInput.is("[type=number]");
    const isSpeedrun = elInput.closest('.speedrun-container').length;
    
    let inputValue = null;

    if(isSpeedrun) {
      const container = elInput.closest('.speedrun-container');
      const hour = container.find('input[name=hour]').val() || 0;
      const minute = container.find('input[name=minute]').val() || 0;
      const second = container.find('input[name=second]').val() || 0;
      const millisecond = container.find('input[name=millisecond]').val() || 0;
      inputValue = `${hour}h ${minute}m ${second}s ${millisecond}ms`;
      activityId = container.attr("activityId");

      if(hour == 0 && minute == 0 && second == 0 && millisecond == 0) {
        alertHelper.showError('Invalid speedrun value');
        return;
      }
      
      if(hour < 0 || minute < 0 || second < 0 || millisecond < 0) {
        alertHelper.showError('Invalid speedrun value');
        return;
      }
      
    } else {
      if (useNumberField || useTextfield) {
        inputValue = elInput.val();
      } else {
        inputValue = elInput.attr("value");
      }
    }
    

    const attributes = {
      activity_id: activityId,
      value: inputValue,
      use_textfield: useTextfield,
    };

    const command = await this.historyService
      .insertCommand(attributes)
      .execute();
    if (command.success == false) {
      const firstErrorMsg = command.errors[0].message;
      alertHelper.showError(firstErrorMsg);
      return;
    }
    const result = command.value;
    if (result.success) {
      alertHelper.showSnackBar("Successfully added !", 1);
      if (window.setting.beep_sound == 1) {
        mediaHelper.playBeepSound();
      }
    }
  }

  changeNumber(input, direction = 'up') {
    let value = Number($(input).val());
    let increaseValue = $(input).data('increasevalue') || 1;

    // convert number
    increaseValue = Number(increaseValue)

    if(direction == 'up') {
      value += increaseValue;
    } else {
      if(value < 1) {
        return ;
      }

      value -= increaseValue;
    }
    
    $(input).val(value);
  }

  handleClickSeeAllButton(evt) {
    var data = [];
    if(this.is_hide) {
      this.is_hide = false;
      data = this.tempData;
      $('#seeAllActivity').html('Hide');
    } else {
      this.is_hide = true;
      data = this.tempData.filter(v => !v.is_hide);
      $('#seeAllActivity').html('See All');
    }

    this.showActivitiesData(data)
  }

  handleClickTargetButton(evt) {
    if($('.activity-input-container').is(':hidden')) {
      // $('.activity-input-container').show();
      // $('.activity-target-container').hide();
      this.toggleActivityPage('input', true)
      $('#targetBtn').html('Target');
      $('#titleSection').hide();
    } else {
      // $('.activity-input-container').hide();
      // $('.activity-target-container').show();
      this.toggleActivityPage('target', true)
      $('#targetBtn').html('Hide Target');
      $('#titleSection').html('<i class="fas fa-info-circle mr-2"></i>Tap for more detail').show();
    }
  }

  handleClickEditButton(evt) {
    $('#titleSection').html('<h3 class="font-weight-bold text-dark">Edit</h3>');
    $('#titleSection').show();
    
    $('.btn-section-action').hide();
    $('#doneAction').show();
    $('#doneAction').data('activepage', 'edit');

    this.showActivitiesData(this.tempData)

    $('.btn-add-value').addClass('btn-mw')

    this.toggleActivityPage('edit', true)
  }

  async updateArrangePosition() {
    const value = $('.input-activity-position').map((i, e) => ({position: Number(e.value), activity_id: Number($(e).closest('.activity-edit-container').attr('activityId'))})).toArray()

    if(value.length) {
        const resp = await this.activityService.updatePositionCommand(value).execute();
        if(resp.success) {
          this.tempData = this.tempData.map(data => {
            const selected = value.filter((a) => a.activity_id == data.id)[0]
            
            return {
              ...data,
              position: selected.position,
            }
          }).sort((a,b) => a.position - b.position)
        }
    }
  }
  
  async handleClickDoneButton(evt) {
    const activepage = $('#doneAction').data('activepage');
    if(activepage === 'edit') {
      // await this.updateArrangePosition();
    }
    
    this.disableDraggable();
    $('#titleSection').hide();
    
    $('.btn-section-action').show();
    $('#doneAction').hide();

    this.showActivitiesData(this.tempData.filter(v => !v.is_hide))

    $('.btn-add-value').removeClass('btn-mw')

    // $('.activity-input-container').show();
    // $('.activity-target-container').hide();
    // $('.activity-edit-container').hide();
    // this.toggleActivityPage('input', true)
    this.is_hide = false;
    $('#doneAction').data('activepage', '');
    this.handleClickSeeAllButton();
  }

  async handleClickButtonHideActivity(evt) {
    const activityId = $(evt).closest('.activity-edit-container').attr('activityid');

    if(!activityId) {
      console.log('no activity id selected')
    } else {
      const selected = this.tempData.filter(d => d.id == activityId)[0];

      const attributes = {
        id: activityId,
        is_hide: Number(!selected.is_hide),
        without_validation: true,
      }
      const command = await this.activityService
      .updateCommand(attributes)
      .execute();

      if (command.success == false) {
        const firstErrorMsg = command.errors[0].message;
        alertHelper.showError(firstErrorMsg);
        return;
      }
  
      const result = command.value;
      if (result.success) {
        alertHelper.showSnackBar("Successfully updated !", 1);
        // refresh activities data
        this.tempData = this.tempData.map(d => {
          if(d.id == activityId) {
            d.is_hide = attributes.is_hide;
          }
          
          return d;
        })
        $('[data-toggle="tooltip"]').tooltip('hide');
        this.showActivitiesData(this.tempData);
        $('.activity-input-container').hide();
        $('.activity-target-container').hide();
        $('.activity-edit-container').show();
        $('.btn-add-value').addClass('btn-mw')
      }
    }
  }

  async handleClickButtonFocusActivity(evt) {
    const activityId = $(evt).closest('.activity-edit-container').attr('activityid');

    if(!activityId) {
      console.log('no activity id selected')
    } else {
      const selected = this.tempData.filter(d => d.id == activityId)[0];

      const attributes = {
        id: activityId,
        is_focus_enabled: Number(!selected.is_focus_enabled),
        without_validation: true,
      }
      const command = await this.activityService
      .updateCommand(attributes)
      .execute();

      if (command.success == false) {
        const firstErrorMsg = command.errors[0].message;
        alertHelper.showError(firstErrorMsg);
        return;
      }
  
      const result = command.value;
      if (result.success) {
        alertHelper.showSnackBar("Successfully updated !", 1);
        // refresh activities data
        this.tempData = this.tempData.map(d => {
          if(d.id == activityId) {
            d.is_focus_enabled = attributes.is_focus_enabled;
          }
          
          return d;
        })
        $('[data-toggle="tooltip"]').tooltip('hide');
        this.showActivitiesData(this.tempData);
        $('.activity-input-container').hide();
        $('.activity-target-container').hide();
        $('.activity-edit-container').show();
        $('.btn-add-value').addClass('btn-mw')
      }
    }
  }

  handleClickButtonColorActivity(evt) {
    const activityId = $(evt).closest('.activity-edit-container').attr('activityid');
    const selected = this.tempData.filter(d => d.id == activityId)[0];
    var modal = $('#modalEditColor');
    modal.find('input[name=activity_id]').val(selected.id);
    colorHelper.updateColorOfInput(modal.find('input[name=color]'), selected.color);

    $('#modalEditColor').modal('show');
  }
  
  async handleClickButtonSaveModalEditColor(evt) {
    const modal = $('#modalEditColor');
    const activityId = modal.find('input[name=activity_id]').val();
    const color = modal.find('input[name=color]').val();

    const attributes = {
      id: activityId,
      color,
      without_validation: true,
    }
    const command = await this.activityService
    .updateCommand(attributes)
    .execute();

    if (command.success == false) {
      const firstErrorMsg = command.errors[0].message;
      alertHelper.showError(firstErrorMsg);
      return;
    }

    const result = command.value;
    if (result.success) {
      alertHelper.showSnackBar("Successfully updated !", 1);
      // refresh activities data
      this.tempData = this.tempData.map(d => {
        if(d.id == activityId) {
          d.color = attributes.color;
        }
        
        return d;
      })
      $('[data-toggle="tooltip"]').tooltip('hide');
      this.showActivitiesData(this.tempData);
      $('.activity-input-container').hide();
      $('.activity-target-container').hide();
      $('.activity-edit-container').show();
      $('.btn-add-value').addClass('btn-mw')

      $('#modalEditColor').modal('hide');
    }
  }

  async updateAfterDrag(wrapper) {
    const value = this.getCurrentPositionActivity(wrapper);
    const resp = await this.activityService.updatePositionCommand(value).execute();
    if(resp.success) {
      this.tempData = this.tempData.map(data => ({
        ...data,
        position: value.indexOf(data.id) < 0 ? data.position : value.indexOf(data.id),
      })).sort((a,b) => a.position - b.position)
    }
  }
  
  getCurrentPositionActivity(wrapper) {
    return $(`${wrapper} .draggable-item`).map((idx, el) => Number($(el).attr('data-id'))).toArray()
  }
  
  enableDraggable() {
    $('body').addClass('scroll-contain')
    
    if(!$('.row-activity').hasClass('draggable-item')) {
      $('.row-activity').addClass('draggable-item')
    }

    if(!$('.row-activity').hasClass('sortable-initialized')) {
      $('#float-wrapper').sortable({
        handle: '#float-wrapper div.draggable-item',
        onSort: (e) => this.updateAfterDrag('#float-wrapper'),
      });

      $('#text-wrapper').sortable({
        handle: '#text-wrapper div.draggable-item',
        onSort: (e) => this.updateAfterDrag('#text-wrapper'),
      });

      $('.row-activity').addClass('sortable-initialized')
    }
    
  }

  disableDraggable() {
    $('body').removeClass('scroll-contain')

    $('.row-activity').removeClass('draggable-item')

    if($('.row-activity').hasClass('sortable-initialized')) {
      $('.row-activity').removeClass('sortable-initialized')
      $('#float-wrapper').sortable('destroy')
      $('#text-wrapper').sortable('destroy')
    }
  }

  async handleClickRearrangeButton(evt) {
    $('#titleSection').html('<h3 class="font-weight-bold text-dark">Rearrange</h3>');
    $('#titleSection').show();
    
    $('.btn-section-action').hide();
    $('#doneAction').data('activepage', 'rearrange').show();

    this.showActivitiesData(this.tempData)

    this.toggleActivityPage('rearrange', true)

    this.enableDraggable()
  }

  toggleActivityPage(targetKey, visible) {
    const keyList = {
      input: '.activity-input-container',
      target: '.activity-target-container',
      edit: '.activity-edit-container', 
      rearrange: '.activity-rearrange-container'
    };

    Object.keys(keyList).forEach((key) => {
      const className = keyList[key];
      
      if(key === targetKey) {
        if(visible) {
          $(className).show();
        } else {
          $(className).hide();
        }
      } else {
        if(visible) {
          $(className).hide();
        } else {
          $(className).show()
        }
      }
    })
  }
  
  initialize() {
    var thisObject = this;
    thisObject.fetchActivities();

    $("body").on("click", ".btn-down", (evt) =>
      thisObject.handleClickButtonChangePosition("down", evt.target)
    );
    $("body").on("click", ".btn-up", (evt) =>
      thisObject.handleClickButtonChangePosition("up", evt.target)
    );

    $("body").on("click", ".btn-add-value", (evt) =>
      thisObject.handleClickButtonAddValue(evt.target)
    );

    $("body").on('keyup', ".input-activity-value", function (evt) {
      evt.key === 'Enter' ? thisObject.handleClickButtonAddValue(null, $(this)) : null
    });
    
    $('body').on('click', '.btn-edit-hide', function(evt){
      thisObject.handleClickButtonHideActivity(evt.target);;
    })

    $('body').on('click', '.btn-edit-focus', function(evt){
      thisObject.handleClickButtonFocusActivity(evt.target);;
    })

    $('body').on('click', '.btn-edit-color', function(evt){
      thisObject.handleClickButtonColorActivity(evt.target);;
    })

    $('body').on('click', '#saveModalEdit', function(evt){
      thisObject.handleClickButtonSaveModalEditColor(evt.target);
    })

    $('body').on('click', '#doneAction', function(evt){
      thisObject.handleClickDoneButton(evt.target);
    })

    const media = new MediaGalleryComponent();
    media.initiate();

    $('body').on('click', '.btn-step', function(){
      var direction = $(this).hasClass('step-up') ? 'up' : 'down';
      var input = $(this).closest('.activity-input-float').find('input');
      thisObject.changeNumber(input, direction)
    })

    $('body').on('click', '#seeAllActivity', function(evt){
      thisObject.handleClickSeeAllButton(evt)
    });

    $('body').on('click', '#targetBtn', function(evt){
      thisObject.handleClickTargetButton(evt)
    });

    $('body').on('click', '#editBtn', function(evt){
      thisObject.handleClickEditButton(evt)
    });

    
    $('body').on('click', '#rearrangeBtn', function(evt){
      thisObject.handleClickRearrangeButton(evt)
    });

    $(document).ready(function(){
      colorHelper.initColorInput('#modalEditColor input[type=color]', {
        flat: true,
        showInput: true,
      })

      const formView = new FormView();
      formView.changeTypeListener('.form-add-activity');
      formView.changeTypeListener('#edit_form');
      formView.initPointSystemForm();

      $('body').on('click', '.btn-delete-activity', function(evt) {
        const activityId = $(this).closest('.modal-content').find('input[name=activity_id]').val();
        formView.handleClickDeleteButton(evt, {
          activityId,
          callbackSuccess: () => {
            thisObject.fetchActivities();
            $('#modalEdit').modal('hide');
          }
        });
      })
      
      $("body").on("click", ".btn-edit-activity", (evt) => {
        const activityId = $(evt.target).closest('.activity-edit-container').attr('activityid');
        const selected = thisObject.tempData.filter(d => d.id == activityId)[0];
        formView.handleClickEditButton(evt.target, selected)
      });

      $("body").on("click", "#btn-update-activity", (evt) =>
        formView.handleClickUpdateButton({
          callbackSuccess: function(newAttributes){
            const selected = thisObject.tempData.filter(d => d.id == newAttributes.id)[0];

            thisObject.tempData = thisObject.tempData.map(d => {
              if(d.id == selected.id) {
                return {...d, ...newAttributes}
              }
              
              return d;
            })
            $('[data-toggle="tooltip"]').tooltip('hide');
            thisObject.showActivitiesData(thisObject.tempData);
            $('.activity-input-container').hide();
            $('.activity-target-container').hide();
            $('.activity-edit-container').show();
            $('.btn-add-value').addClass('btn-mw')
          }
        })
      );

      // $('#float-wrapper').sortable({
      //     containerSelector: 'div.draggable',
      //     itemSelector: 'div.draggable-item',
      // })

      // limit stopwatch input, after type two char, the focus will change to next input
      $('body').on('keyup', '.speedrun-container .input-activity-value', function(event){
        var value = $(this).val();
        var key = event.keyCode || event.charCode;
  
        if(value.length >= 2) {
          $(this).next().focus();
          $(this).next().val(value.substring(2));
        }

        if(!value && (key == 8 || key == 46)) {
          $(this).prev().focus();
        }
        
        $(this).val(value.substring(0, 2));
      })
    })

    $('body').on('click', '.activity-target-container', function(event) {
      const dateObject = new Date();
      const currentMonth = dateObject.getMonth() + 1;
      const currentYear = dateObject.getFullYear();
      const activityid = $(this).closest('.row-activity').attr('activityid');

      const link = `/report/list.html?year=${currentYear}&month=${currentMonth}&tab=month&activityid=${activityid}`;
      window.location.replace(link);
    })
  }
}

jQuery(async function () {
  new HomeView().initialize();
});
