import SettingService from "../business_logic/service/settingService";
import SettingDataProxy from "../data_proxy/settingDataProxy";
import ApplicationLogService from "../business_logic/service/applicationLogService";
import ApplicationLogDataProxy from "../data_proxy/applicationLogDataProxy";
import AuthService from "../business_logic/service/authService";
import AuthDataProxy from "../data_proxy/authDataProxy";
import ActivityService from "../business_logic/service/ActivityService";
import ActivityDataProxy from "../data_proxy/ActivityDataProxy";
import * as alertHelper from "./../core/alert_helper";
import * as loadingHelper from "./../core/loading_helper";
import * as templateHelper from "./../core/template_helper";

class SettingView {
  constructor() {
    this.defaultValue = {
      applicationLogVersion: "",
      applicationLogDescription: "",
    };

    this.settingService = new SettingService(new SettingDataProxy());
    this.applicationLogService = new ApplicationLogService(new ApplicationLogDataProxy());
    this.tableApplicationLog = $(".table-application-log");
    this.authService = new AuthService(new AuthDataProxy());
    this.activityService = new ActivityService(new ActivityDataProxy());
  }

  updateLocalSetting(setting) {
    window.localStorage.setItem('SETTING_ACTIVITY', JSON.stringify(setting));
    window.setting = setting;
  }

  async fetchSettingData() {
    const command = await this.settingService.getAllCommand().execute();
    if (command.success) {
      const result = command.value;
      if (result.success) {
        const setting = result.response.data;
        this.updateLocalSetting(setting);
        // set value
        $("#toggleBeepSound").prop("checked", setting.beep_sound == 1);
        $("#togglePointSystem").prop("checked", setting.point_system == 1);
        $("#toggleParentalInspection").prop("checked", setting.parental_inspection == 1);

        Object.keys(setting.point_focus).forEach((idx) => {
          $(`input[name='day[${idx}]']`).val(setting.point_focus[idx])
        })
      }
    }
  }

  /**
   * Fetch all application log data
   */
  async fetchApplicationLogData() {
    this.tableApplicationLog.hide();
    loadingHelper.toggleLoading(true);
    const command = await this.applicationLogService.getAllCommand().execute();
    loadingHelper.toggleLoading(false);

    if (command.success) {
      const applicationLogData = command.value;
      if (applicationLogData.success) {
        this.showApplicationLogData(applicationLogData.response.data);
        this.tableApplicationLog.show();
        $('div.form-wrapper').show();
      }
    }
  }

  /**
   * Render application log data to table
   *
   * @param {array} applicationLogs
   */
   showApplicationLogData(applicationLogs) {
    //clear application log data
    $(".list-application-log").empty();

    if (!applicationLogs.length) {
      const rowEmptyContentTpl = $(
        'script[data-template="row-empty-content"'
      ).text();
      $(".list-application-log").html(rowEmptyContentTpl);
      $(".list-application-log").find(".empty-content").show();
    }

    //prepare template
    var rowApplicationLogTpl = $('script[data-template="row-application-log"').text();

    //generate row application-log, then put it on .list-application-log
    $(".list-application-log").append(
      applicationLogs.map(function (applicationLogData, i) {
        var html = templateHelper.render(rowApplicationLogTpl, {
          version: applicationLogData["version"],
          description: applicationLogData["description"],
          id: applicationLogData["id"],
        });

        html = $(html);
        html.data("applicationLog", applicationLogData);

        return html;
      })
    );
  }

  async handleChangeBeepSound(evt) {
    const value = $(evt.target).prop("checked") ? 1 : 0;

    const command = await this.settingService.saveCommand('beep_sound', value).execute();
    if (command.success) {
      const result = command.value;

      if (result.success) {
        alertHelper.showSnackBar("Successfully saved !", 1);
      }

      const localSetting = window.setting;
      localSetting.beep_sound = value;
      this.updateLocalSetting(localSetting);
    }
  }

  async handleChangePointSystem(evt) {
    const value = $(evt.target).prop("checked") ? 1 : 0;

    const command = await this.settingService.saveCommand('point_system', value).execute();
    if (command.success) {
      const result = command.value;
      const localSetting = window.setting;
      
      if (result.success) {
        alertHelper.showSnackBar("Successfully saved !", 1);
        if(value) {
          $('.point-system-form').show();
          $('.section-point-menu').show();
        } else {
          $('.point-system-form').hide();
          $('.section-point-menu').hide();
        }

        localSetting.point_system = value;
        this.updateLocalSetting(localSetting);
      }
    }
  }

  async handleChangeParentalInspection(evt) {
    const value = $(evt.target).prop("checked") ? 1 : 0;

    const command = await this.settingService.saveCommand('parental_inspection', value).execute();
    if (command.success) {
      const result = command.value;
      const localSetting = window.setting;
      
      if (result.success) {
        alertHelper.showSnackBar("Successfully saved !", 1);
        if(value) {
          $('.section-parentalInspection-menu').show();
        } else {
          $('.section-parentalInspection-menu').hide();
        }

        localSetting.parental_inspection = value;
        this.updateLocalSetting(localSetting);
      }
    }
  }

  async handleSubmitApplicationLog(evt) {
    // - gett data
    const attributes = {
      version : $("#application_log_version").val(),
      description : $("#application_log_description").val(),
    }

    // - show loading
    loadingHelper.toggleLoading(true);

    // - isnert application log
    const command = await this.applicationLogService
      .insertCommand(attributes)
      .execute();
    
    // - show error if there is error
    if (command.success == false) {
      const firstErrorMsg = command.errors[0].message;
      alertHelper.showError(firstErrorMsg);
      return;
    }

    // - show popup when success
    const result = command.value;
    if (result.success) {
      alertHelper.showSnackBar("Successfully added !", 1);

      // - set form to default value
      $("#application_log_version").val(this.defaultValue.applicationLogVersion);
      $("#application_log_description").val(this.defaultValue.applicationLogDescription);

      // - refresh application log data
      this.fetchApplicationLogData();
    }
  }

  async handleClickEditApplicationLog(evt) {
    const btn = $(evt);
    const tr = btn.closest("tr");
    const applicationLogData = tr.data("applicationLog");
    const modalEdit = $("#modalEditApplicationLog");

    // set form
    modalEdit.find("#version2").val(applicationLogData.version);
    modalEdit.find("#description2").val(applicationLogData.description);
    modalEdit.find("input[name=application_log_id]").val(applicationLogData.id);
    modalEdit.modal("show");
  }

  async handleClickUpdateApplicationLog(evt) {
    const attributes = {
      id: $("#modalEditApplicationLog").find("input[name=application_log_id]").val(),
      version: $("#version2").val(),
      description: $("#description2").val(),
    };

    const command = await this.applicationLogService
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
      // refresh application log data
      this.fetchApplicationLogData();

      $("#modalEditApplicationLog").modal("hide");
    }
  }

  async handleClickDeleteApplicationLog(evt) {
    // - show confirmation popup
    var result = await alertHelper.showConfirmation("Your application log will be delete and cannot be restore");

    // - if user cancel delete
    if(!result.isConfirmed) return;

    // - delete application log
    // o show loading
    loadingHelper.toggleLoading(true);

    // o get application log id
    const applicationLogId = $(evt).attr("applicationLogId");

    // o run command
    const command = await this.applicationLogService
      .destroyCommand(applicationLogId)
      .execute();
      
    // o hide loading
    loadingHelper.toggleLoading(false);

    // o show success message if success delete
    if (command.success) {
      const result = command.value;
      if (result.success) {
        alertHelper.showSuccess("successfully deleted !");
        this.fetchApplicationLogData();
      }
    }
  }
  
  async handleClickSaveEmailParent(evt) {
    const email = $('#emailParent').val();

    const command = await this.authService.updateParentEmailCommand(email).execute();

    loadingHelper.toggleLoading(false);

    if (command.success == false) {
      const firstErrorMsg = command.errors[0].message;
      alertHelper.showError(firstErrorMsg);
      loadingHelper.toggleLoading(false);
      return;
    }

    const result = command.value;
    if(result.success) {
      alertHelper.showSnackBar("Successfully Updated !", 1);
    }
  }

  async handleClickImportActivities(evt) {
    const button = $(evt);
    button.prop('disabled', true).html('<i class="fa fa-spin fa-spinner"></i> Import')
    const command = await this.activityService.importCommand().execute()

    button.prop('disabled', false).html('<i class="fa fa-file-import"></i> Import')

    if(command.success == false) {
      const firstErrorMsg = command.errors[0].message;
      alertHelper.showError(firstErrorMsg);
      button.prop('disabled', false).html('<i class="fa fa-file-import"></i> Import')
    }

    const result = command.value;
    if(result.success) {
      const { message } = result.response;
      alertHelper.showSnackBar(`Successfully: ${message}`, 1);
    }
  }

  async handleClickSavePointFocus(evt) {
    const button = $(evt);
    console.log("🚀 ~ file: setting.js ~ line 320 ~ SettingView ~ handleClickSavePointFocus ~ button", button)
    button.prop('disabled', true).html('<i class="fa fa-spin fa-spinner"></i> Save Changes');

    const value = $('.input-point-focus').map((idx, el) => $(el).val()).toArray();
    const data = {};

    for (let index = 1; index <= value.length; index++) {
      data[index] = value[index-1];
    }
    
    console.log("🚀 ~ file: setting.js ~ line 327 ~ SettingView ~ handleClickSavePointFocus ~ data", data)
    const command = await this.settingService.saveCommand('point_focus', null, data).execute();
    console.log("🚀 ~ file: setting.js ~ line 332 ~ SettingView ~ handleClickSavePointFocus ~ command", command)
    button.prop('disabled', false).html('Save Changes');

    if (command.success) {
      const result = command.value;

      if (result.success) {
        alertHelper.showSnackBar("Successfully saved !", 1);
      }

      const localSetting = window.setting;
      localSetting.point_focus = data;
      this.updateLocalSetting(localSetting);
    }
    
  }
  
  initialize() {
    this.fetchSettingData();
    this.fetchApplicationLogData();

    $("#toggleBeepSound").on("change", (evt) =>
      this.handleChangeBeepSound(evt)
    );

    $("#togglePointSystem").on("change", (evt) =>
      this.handleChangePointSystem(evt)
    );

    $("#toggleParentalInspection").on("change", (evt) =>
      this.handleChangeParentalInspection(evt)
    );

    $("body").on("click", "#submit-application-log-btn", (evt) => 
      this.handleSubmitApplicationLog(evt)
    );

    $("body").on("click", ".btn-edit-application-log", (evt) =>
      this.handleClickEditApplicationLog(evt.target)
    );

    $("body").on("click", "#btn-update-application-log", (evt) =>
      this.handleClickUpdateApplicationLog(evt.target)
    );

    $("body").on("click", ".btn-delete-application-log", (evt) =>
      this.handleClickDeleteApplicationLog(evt.target)
    );

    $('body').on('click', '#btnSaveEmail', (evt) => {
      this.handleClickSaveEmailParent(evt.target);
    })

    $('body').on('click', '#btnImportActivities', (evt) => {
      this.handleClickImportActivities(evt.target);
    })

    $('body').on('click', '#btnSavePointFocus', (evt) => {
      this.handleClickSavePointFocus();
    })
  }
}

jQuery(async function () {
  new SettingView().initialize();
});