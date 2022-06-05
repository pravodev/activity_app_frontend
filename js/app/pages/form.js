import * as alertHelper from "./../core/alert_helper";
import * as loadingHelper from "./../core/loading_helper";
import * as templateHelper from "./../core/template_helper";
import * as colorHelper from "./../core/color_helper";
import ActivityService from "./../business_logic/service/activityService";
import ActivityDataProxy from "./../data_proxy/activityDataProxy";

export default class FormView {
  constructor() {
    this.defaultValue = {
      type: 'value',
      title: "",
      value: "",
      target: "",
      description: "",
      color: "#3987fd",
    };

    this.activityService = new ActivityService(new ActivityDataProxy());
    this.tableElement = $(".table-responsive");
  }

  /**
   * Fetch all activities data
   */
  async fetchActivities() {
    this.tableElement.hide();

    loadingHelper.toggleLoading(true);
    const command = await this.activityService.getAllCommand().execute();

    if (command.success) {
      const activitiesData = command.value;
      if (activitiesData.success) {
        this.showActivitiesData(activitiesData.response.data);
        loadingHelper.toggleLoading(false);
        this.tableElement.show();
        $("div.form-wrapper").show();
      }
    }
  }

  /**
   * Render activities data to table
   *
   * @param {array} activities
   */
  showActivitiesData(activities) {
    //clear activities
    $(".list-activity").empty();

    if (!activities.length) {
      const rowEmptyContentTpl = $(
        'script[data-template="row-empty-content"'
      ).text();
      $(".list-activity").html(rowEmptyContentTpl);
      $(".list-activity").find(".empty-content").show();
    }

    //prepare template
    var rowActivitiesTpl = $('script[data-template="row-activity"').text();
    var rowSpeedrunTpl = $('script[data-template="row-activity-speedrun"').text();

    //generate row activity, then put it on .list-activity
    $(".list-activity").html(
      activities.filter(v => v.type !== 'speedrun').map(function (activityData, i) {
        var html = templateHelper.render(rowActivitiesTpl, {
          type: activityData["type_text"],
          title: activityData["title"],
          value: activityData["value"],
          target: activityData["target"],
          description: activityData["description"],
          color: activityData["color"],
          id: activityData["id"],
          textColor: colorHelper.isDark(activityData["color"])
            ? "#ffffff"
            : "#000000",
        });

        html = $(html);
        html.data("activity", activityData);

        return html;
      })
    );

    $(".list-activity-speedrun").html(
      activities.filter(v => v.type == 'speedrun').map(function (activityData, i) {
        var html = templateHelper.render(rowSpeedrunTpl, {
          type: activityData["type_text"],
          title: activityData["title"],
          value: activityData["value"],
          target: activityData["target"],
          description: activityData["description"],
          color: activityData["color"],
          id: activityData["id"],
          criteria: activityData["criteria"],
          textColor: colorHelper.isDark(activityData["color"])
            ? "#ffffff"
            : "#000000",
        });

        html = $(html);
        html.data("activity", activityData);

        return html;
      })
    );
  }

  async handleClickSubmitButton(formContainer, options = {}) {
    // - get data
    const attributes = this.getValueFromForm(formContainer);

    if(attributes === false) {
      return ;
    }

    if(!options.disableLoading) {
      loadingHelper.toggleLoading(true);
    }
    // - show loading

    // - insert activity
    const command = await this.activityService
      .insertCommand(attributes)
      .execute();

    // - show error if there is error
    if (command.success == false) {
      const firstErrorMsg = command.errors[0].message;
      alertHelper.showError(firstErrorMsg);
      loadingHelper.toggleLoading(false);
      return;
    }

    // - show popup when success
    const result = command.value;
    if (result.success) {
      alertHelper.showSnackBar("Successfully added !", 1);

      // - set form to default value
      $(formContainer).find("select[name=type]").val(this.defaultValue.type).trigger('change');
      $(formContainer).find("input[name=title]").val(this.defaultValue.title);
      $(formContainer).find("input[name=value]").val(this.defaultValue.value);
      $(formContainer).find("input[name=target]").val(this.defaultValue.target);
      $(formContainer).find("input[name=description]").val(this.defaultValue.description);
      $(formContainer).find("input[name=is_editable]").prop("checked", false);
      $(formContainer).find("input[name=is_use_textfield]").prop("checked", false);
      $(formContainer).find("input[name=is_ms_enable]").prop("checked", true).trigger('change');
      $(formContainer).find("input[name=hour]").val('');
      $(formContainer).find("input[name=minute]").val('');
      $(formContainer).find("input[name=second]").val('');
      $(formContainer).find("input[name=millisecond]").val('');
      colorHelper.updateColorOfInput("#color", this.defaultValue.color);

      if(typeof options.callbackSuccess == 'function') {
        options.callbackSuccess()
      }

      if($("div.form-wrapper").length) {
        this.fetchActivities();
      }
      loadingHelper.toggleLoading(false);
    } else {
      loadingHelper.toggleLoading(false);
    }
  }

  /**
   * Handle Change is_use_textfield element
   *
   * if is_use_textfield true set is editable true
   * @param {bool} isChecked
   */
  handleChangeUseTextfield(isChecked, isFormEdit) {
    const valueEl = isFormEdit ? $("#value2") : $("#value");
    const editableEl = isFormEdit ? $("#is_editable2") : $("#is_editable");

    if (isChecked) {
      valueEl.val(0);
      valueEl.prop("disabled", true);
      editableEl.prop("checked", true);
    } else {
      valueEl.val(0);
      valueEl.prop("disabled", false);
    }
  }

  handleChangeTimeSpeedTarget(evt, isFormEdit = false) {
    const useTextfieldEl = $("#is_use_textfield");
    const editableEl = isFormEdit ? $("#is_editable2") : $("#is_editable");
    this.handleChangeUseTextfield(true);
    useTextfieldEl.prop('checked', true);
    $('#target').prop('type', 'text');
  }

  async handleClickDeleteButton(evt, {activityId = null, callbackSuccess = null}) {
    // - show confirmation popup
    var result = await alertHelper.showConfirmation("Your activity will be delete and cannot be restore", {
      input: 'text',
      inputPlaceholder: 'Type "delete" to confirm',
      didOpen: () => {
        $(swal.getConfirmButton()).prop('disabled', true)
        $(swal.getInput()).on('keyup', function() {
          if($(this).val().toLowerCase() === 'delete') {
            $(swal.getConfirmButton()).prop('disabled', false)
          }
        })
      }
    })
    // - if user cancel delete
    if (!result.isConfirmed) return;

    // - delete activity
    // o show loading
    loadingHelper.toggleLoading(true);

    // o get activity id
    activityId = activityId ? activityId : $(evt).attr("activityId");
    callbackSuccess = typeof callbackSuccess == 'function' ? callbackSuccess : () => {
      this.fetchActivities();
    }

    // o run command
    const command = await this.activityService
      .destroyCommand(activityId)
      .execute();

    // o hide loading
    loadingHelper.toggleLoading(false);

    // o show success message if success delete
    if (command.success) {
      const result = command.value;
      if (result.success) {
        alertHelper.showSuccess("successfully deleted !");
        callbackSuccess();
      }
    }
  }

  async handleClickEditButton(evt, activityData = null) {
    const btn = $(evt);
    if(!activityData) {
      const tr = btn.closest("tr");
      activityData = tr.data("activity");
    }
    const modalEdit = $("#modalEdit");

    if(activityData.type == 'speedrun') {
      modalEdit.find('input[name=is_ms_enable]').prop('checked', Boolean(activityData.is_ms_enable)).trigger('change');
      modalEdit.find("input[name=hour]").val(activityData.speedrun_parsed.h);
      modalEdit.find("input[name=minute]").val(activityData.speedrun_parsed.m);
      modalEdit.find("input[name=second]").val(activityData.speedrun_parsed.s);
      modalEdit.find("input[name=millisecond]").val(activityData.speedrun_parsed.ms);
    } else {
      modalEdit.find("input[name=value]").val(activityData.value);
    }
    // set form
    modalEdit.find("select[name=type]").val(activityData.type).trigger('change');
    modalEdit.find("input[name=title]").val(activityData.title);
    modalEdit.find("input[name=target]").val(activityData.target);
    modalEdit.find("input[name=description]").val(activityData.description);
    modalEdit.find("input[name=increase_value]").val(activityData.increase_value);
    modalEdit.find("select[name=is_hide]").val(activityData.is_hide).trigger("change");
    modalEdit.find("select[name=is_focus_enabled]").val(activityData.is_focus_enabled).trigger("change");
    colorHelper.updateColorOfInput(
      modalEdit.find("input[name=color]"),
      activityData.color
    );
    modalEdit
      .find("input[name=is_editable]")
      .prop("checked", activityData.can_change == 1);
    // modalEdit
    //   .find("#is_use_textfield2")
    //   .prop("checked", activityData.use_textfield == 1);

    if(Number(window.setting.point_system)) {
      modalEdit.find("input[name=bonus_value]").val(activityData.bonus_value);
      modalEdit.find("input[name=penalty_value]").val(activityData.penalty_value);
      modalEdit.find("input[name=point_weight]").val(activityData.point_weight || 1);
    }
    
    modalEdit.find("input[name=activity_id]").val(activityData.id);
    modalEdit.modal("show");
  }

  async handleClickUpdateButton(options = {}) {
    const allValue = this.getValueFromForm('#modalEdit');

    if(allValue === false) {
      return ;
    }
    
    const attributes = {
      id: $("#modalEdit").find("input[name=activity_id]").val(),
      ...allValue
    };

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

      if(typeof options.callbackSuccess == 'function') {
        options.callbackSuccess(attributes)
      } else {
        this.fetchActivities();
      }

      $("#modalEdit").modal("hide");
    }
  }

  getValueFromForm(formContainer) {
    const type = $(formContainer).find('select[name=type]').val();
    // - get data
    const attributes = {
      type,
      title: $(formContainer).find("input[name=title]").val(),
      value: $(formContainer).find("input[name=value]").val(),
      target: $(formContainer).find("input[name=target]").val(),
      description: $(formContainer).find("input[name=description]").val(),
      color: $(formContainer).find("input[name=color]").val(),
      is_hide: $(formContainer).find("select[name=is_hide]").val(),
      is_focus_enabled: $(formContainer).find("select[name=is_focus_enabled]").val(),
    };

    if(type == 'value' || type == 'badhabit') {
      attributes.can_change = $(formContainer).find('input[name=is_editable]').prop("checked") ? 1 : 0;
    }

    if(type == 'speedrun') {
      const hour = $(formContainer).find('input[name=hour]').val() || 0;
      const minute = $(formContainer).find('input[name=minute]').val() || 0;
      const second = $(formContainer).find('input[name=second]').val() || 0;
      const millisecond = $(formContainer).find('input[name=millisecond]').val() || 0;

      if(hour == 0 && minute == 0 && second == 0 && millisecond == 0) {
        alertHelper.showError('Invalid speedrun value');
        return false;
      }
      
      if(hour < 0 || minute < 0 || second < 0 || millisecond < 0) {
        alertHelper.showError('Invalid speedrun value');
        return false;
      }

      attributes.value = `${hour}h ${minute}m ${second}s ${millisecond}ms`;

      attributes.criteria = $(formContainer).find("select[name=criteria]").val();
      attributes.is_ms_enable = $(formContainer).find('input[name=is_ms_enable]').prop('checked') ? 1 : 0;
    }

    if(type == 'alarm') {
      delete attributes.target;
      delete attributes.value;
    }

    if(type != 'speedrun' && type != 'count') {
      attributes.increase_value = $(formContainer).find('input[name=increase_value]').val()
    }

    if(Number(window.setting.point_system)) {
      attributes.bonus_value = $(formContainer).find('input[name=bonus_value]').val();
      attributes.penalty_value = $(formContainer).find('input[name=penalty_value]').val();
      attributes.point_weight = $(formContainer).find('input[name=point_weight]').val();
    }
    
    return attributes;
  }
  
  changeTypeListener(formContainer) {
      const handleChange = function (el) {
        const typeValue = $(el).val();
        const targetEl = $(formContainer).find('input[name=target]');
        const valueEl = $(formContainer).find('input[name=value]');
        const valueContainerEl = $(formContainer).find('.value-container');
        const valueLabelEl = valueContainerEl.find('label')
        const targetContainerEl = $(formContainer).find('.target-container');
        const targetLabelEl = targetContainerEl.find('label')
        const speedrunContainerEl = $(formContainer).find('.value-speedrun-container');
        const canChangeChekbox = $(formContainer).find(".form-can-change");
        const increaseValueContainerEl = $(formContainer).find('.increase-value-container');
        switch (typeValue) {
          case 'value':
            valueContainerEl.attr('style', '');
            speedrunContainerEl.attr('style', 'display:none !important');
            canChangeChekbox.attr('style', '');
            valueEl.prop('type', 'number');
            valueEl.prop('placeholder', 'Count Default Value');
            valueLabelEl.html('Default Input')
            targetContainerEl.attr('style', '');
            increaseValueContainerEl.attr('style', '');
            targetLabelEl.html('Monthly Target');
            
            targetEl.prop('placeholder', 'Count Target');
            break;
  
          case 'count':
            speedrunContainerEl.attr('style', 'display:none !important');
            valueContainerEl.attr('style', 'display: none !important');
            canChangeChekbox.attr('style', 'display: none !important');
            targetContainerEl.attr('style', '');
            targetEl.prop('placeholder', 'Count Target');
            increaseValueContainerEl.attr('style', 'display:none !important');
            targetLabelEl.html('Monthly Target');
            break;
  
          case 'badhabit':
            valueContainerEl.attr('style', '');
            speedrunContainerEl.attr('style', 'display:none !important');
            canChangeChekbox.attr('style', '');
            valueLabelEl.html('Value')
            valueEl.prop('type', 'number');
            valueEl.prop('placeholder', 'Activity Default Value');
            targetContainerEl.attr('style', '');
            increaseValueContainerEl.attr('style', '');
            
            targetEl.prop('placeholder', 'Count Target');
            targetLabelEl.html('Monthly Target');
            break;
        
          case 'speedrun':
            speedrunContainerEl.attr('style', '');
            valueContainerEl.attr('style', 'display:none !important');
            canChangeChekbox.attr('style', 'display: none !important');
            targetContainerEl.attr('style', '');
            valueEl.prop('type', 'text');
            valueEl.prop('placeholder', 'Time as speed target (TAST). ex:  1h 34m 33s 00ms')
            increaseValueContainerEl.attr('style', 'display:none !important');
            targetLabelEl.html('Target Count');
            break;
  
          case 'alarm':
            speedrunContainerEl.attr('style', 'display:none !important');
            valueContainerEl.attr('style', 'display:none !important');
            canChangeChekbox.attr('style', 'display: none !important');
            targetContainerEl.attr('style', 'display: none !important');
            increaseValueContainerEl.attr('style', '');
            targetLabelEl.html('Monthly Target');
            break;
  
          default:
            break;
        }
        
      }
      
      $('body').on('change', `${formContainer} select[name=type]`, function(){
        handleChange(this);
      })
      $(`${formContainer} select[name=type]`).each(function(el) {
        handleChange(this)
      })

      $('body').on('change ready', `${formContainer} input[name=is_ms_enable]`, function() {
        const isEnableMS = $(this).prop('checked');
        const formContainer = $(this).closest('.value-speedrun-container');
        
        formContainer.find('input[name=hour]').val('').prop('disabled', isEnableMS)
        formContainer.find('input[name=millisecond]').val('').prop('disabled', !isEnableMS)
      })
  }

  // showPointForm() {
    // if(window.setting && Number(window.setting.point_system)) {
    //   console.log('show point form')
    //   $('.point-system-form').show();
    // } else {
    //   $('.point-system-form').hide();
    //   console.log('hide point form')
    // }
  // }
  
  initPointSystemForm() {
    $('.point-system-form input[name=bonus_value]').on('change', function(){
      const container = $(this).closest('.point-system-form');
      const penaltyValue = Math.floor(Number($(this).val()) / 2);
      container.find('input[name=penalty_value]').val(penaltyValue)
    })
  }
  
  initialize() {
    this.fetchActivities();

    this.changeTypeListener('.form-add-activity');
    this.changeTypeListener('#edit_form');

    colorHelper.initColorInput('input[type=color]')

    this.initPointSystemForm();
    

    // event handler
    $("#submit-btn").on("click", () => this.handleClickSubmitButton('.form-add-activity'));
    $("body").on("click", ".btn-delete-activity", (evt) =>
      this.handleClickDeleteButton(evt.target)
    );
    $("body").on("click", ".btn-edit-activity", (evt) =>
      this.handleClickEditButton(evt.target)
    );
    $("body").on("click", "#btn-update-activity", (evt) =>
      this.handleClickUpdateButton(evt.target)
    );

    if($('#activity_table').length) {
      $('#addActivityBtnTop').hide();
    }
  }
}

// window.isActivityInitialized = typeof window.isActivityInitialized == 'undefined' ? null : window.isActivityInitialized;

jQuery(async function ($) {
  const formView = new FormView();
  if(!window.isActivityInitialized && $('#activity_table').length) {
    formView.initialize();

    window.isActivityInitialized = true;
  }

  // formView.showPointForm();

  // if(!window.setting && !window.settingInterval) {
  //   window.settingInterval = setInterval(function(){
  //     if(window.setting) {
  //       window.clearInterval(window.settingInterval);
  //       formView.showPointForm();
  //     } 
  //   }, 500)
  // }
});
