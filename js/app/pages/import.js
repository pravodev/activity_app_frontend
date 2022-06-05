import * as templateHelper from "./../core/template_helper";
import * as alertHelper from "./../core/alert_helper";
import ActivityService from "../business_logic/service/activityService";
import ActivityDataProxy from "../data_proxy/activityDataProxy";
import HistoryService from "../business_logic/service/historyService";
import HistoryDataProxy from "../data_proxy/historyDataProxy";

class ImportView {
  constructor() {
    this.activityService = new ActivityService(new ActivityDataProxy());
    this.historyService = new HistoryService(new HistoryDataProxy());
  }

  async fetchActivities() {
    const command = await this.activityService.getAllCommand().execute();
    if (command.success) {
      const result = command.value;

      this.showActivitiesData(result.response.data);
    }
  }

  showActivitiesData(activities) {
    //clear histories
    $("#importer").empty();

    //prepare template
    const optionActivityTpl = $(
      'script[data-template="option-activity"'
    ).text();

    //render template
    $("#importer").append("<option disabled selected value> -- select an option -- </option>");
    $("#importer").append(
      activities.map(function (activity, i) {
        return templateHelper.render(optionActivityTpl, {
          title: activity["title"],
          id: activity["id"],
          useTextfield: activity["use_textfield"],
        });
      })
    );
  }
  async handleClickButtonSubmit(evt) {
    //get activityId
    const activityId = $("#importer").find(":selected").val();
    const useTextfield = $("#importer").find(":selected").attr("useTextfield");

    //get input history
    const plainInput = $("textarea[name='histories']").val();

    const attributes = {
      activity_id: activityId,
      history: plainInput,
      use_textfield: useTextfield,
    };

    const command = await this.historyService
      .bulkInsertCommand(attributes)
      .execute();

    if (command.success == false) {
      const firstErrorMsg = command.errors[0].message;
      alertHelper.showError(firstErrorMsg);
      return;
    }

    const result = command.value;
    if(result.success) {
      alertHelper.showSuccess("successfully added !");

    } else {
      
    }

  }

  initialize() {
    this.fetchActivities();

    $("body").on("click", "#submit-btn", (evt) =>
      this.handleClickButtonSubmit(evt)
    );
  }
}

jQuery(async function () {
  new ImportView().initialize();
});
