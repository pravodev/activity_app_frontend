import * as templateHelper from "./../core/template_helper";
import * as alertHelper from "./../core/alert_helper";
import * as loadingHelper from "./../core/loading_helper";
import * as arrayHelper from "./../core/array_helper";
import * as dateHelper from "./../core/datetime_helper";
import HistoryService from "../business_logic/service/historyService";
import HistoryDataProxy from "../data_proxy/historyDataProxy";

class HistoryView {
  constructor() {
    this.historyService = new HistoryService(new HistoryDataProxy());
    this.tempData = [];
  }

  async fetchHistoriesData() {
    loadingHelper.toggleLoading(true);
    const command = await this.historyService.getAllCommand().execute();
    if (command.success) {
      const result = command.value;

      // save response to tempData
      this.tempData = result.response.data;
      this.showHistoriesData(result.response.data);
      loadingHelper.toggleLoading(false);
      $(".table-responsive").show();
    }
  }

  showHistoriesData(histories) {
    //clear histories
    $(".list-history").empty();

    if (!histories.length) {
      var rowEmptyContentTpl = $(
        'script[data-template="row-empty-content"'
      ).text();

      $(".list-history").html(rowEmptyContentTpl);
      $(".list-history").find(".empty-content").show();
      return;
    }

    //prepare template
    var rowHistoriesTpl = $('script[data-template="row-history"').text();

    const addMonthYear = histories.map(data => ({...data, monthYear: data.date.substr(0, data.date.lastIndexOf('-'))}));
    const groupByMonth = arrayHelper.groupBy(addMonthYear, data => data.monthYear);
    const _this = this;
    //generate row history, then put it on .list-history
    $(".list-history").append(
      Object.keys(groupByMonth).map(monthYear => {
        const dataHistories = groupByMonth[monthYear] || [];
        const [year, month] = monthYear.split('-');

        const title = `${dateHelper.monthToText(Number(month))} ${year}`;
        const titleElement = `
        <tr style="background-color: #ffe6cd">
          <td class="text-left py-1" colspan="5"><span class="font-weight-bold">${title}</span></td>
        </tr>
        `
        
        const dataElement = dataHistories.map(function (historyData, i) {
          var value = null;
          if (historyData["value"] != null) {
            value = historyData["value"];
          } else if (historyData["value_textfield"] != null) {
            value = historyData["value_textfield"];
          } else {
            value = 0;
          }

          value = _this.addStyleToValue(historyData['activity_type'], value)
          const dateNumber = historyData["date"].substr(historyData["date"].lastIndexOf('-')+1)
          
          return templateHelper.render(rowHistoriesTpl, {
            activity_id: historyData["activity_id"],
            activity_type: historyData["activity_type"],
            id: historyData["id"],
            date: dateNumber,
            time: historyData["time"],
            activity_title: historyData["activity_title"],
            value: value,
            history_id: historyData["id"],
            useTextField: historyData["value_textfield"] ? 'true' : 'false',
            is_value_editable: historyData['activity_can_change'] ? 'true' : 'false',
          });
        })
        
        return [titleElement, ...dataElement];
      })
    );
  }

  async handleClickButtonDelete(btn) {
    // - show confirmation popup
    var result = await alertHelper.showConfirmation("Your history will be delete and cannot be restore");

    // - if user cancel delete
    if(!result.isConfirmed) return;

    // - delete history
    // o show loading
    loadingHelper.toggleLoading(true);

    // o get history id
    const historyId = $(btn).attr("historyid");

    // o run command
    const command = await this.historyService
      .destroyCommand(historyId)
      .execute();
    
    // o hide loading
    loadingHelper.toggleLoading(false);

    // o show success message if success delete
    if (command.success) {
      const result = command.value;
      if (result.success) {
        alertHelper.showSnackBar("successfully deleted !");

        this.fetchHistoriesData();
      }
    }
  }

  handleClickRowTable(evt) {
    evt.stopPropagation();
    const el = $(evt.target);
    const value = $(el).text();
    const isEditable = $(el).data("editable");
    const hasInput = $(el).find(".input-editable").length;

    if (isEditable && !hasInput) {
      // save default content
      $(el).data("defaultcontent", $(el).html());
      const rowEditable = $('script[data-template="row-editable"').text();
      const content = templateHelper.render(rowEditable, {
        name: $(el).data("name"),
        value: value,
      });
      $(el).html(content);
    }
  }

  handleClickButtonCancelEdit(evt) {
    evt.stopPropagation();
    const td = $(evt.target).closest("td");
    const defaultContent = td.data("defaultcontent");

    td.html(defaultContent);
  }

  addStyleToValue(type, value) {
    if(type === 'count') {
      value = `<small><i>${value}</i></small>`;
    } else if(type === 'speedrun') {
      value = value.split(' ').map((str) => {
          let [num, unit] = str.match(/\D+|\d+/g);
          if(Number(num) > 1) {
              return `<span class="font-weight-bold" style="color: #00cbab">${num}${unit}</span>`
          }
          return `<span class="font-weight-bold">${num}${unit}</span>`
      }).join(' ');
    } else if(type === 'badhabit') {
      value = `<span class="font-weight-bold" style="color: #fc8790">${value}</span>`;
    } else if(type === 'value') {
      value = `<span class="font-weight-bold" style="color: #00cbab">${value}</span>`;
    }

    return value;
  }
  
  async handleClickButtonSaveEdit(evt) {
    evt.stopPropagation();
    const el = $(evt.target);
    const inputContainer = $(el).closest(".input-editable-container");
    const value = inputContainer.find(".input-editable").val();
    const td = $(el).closest("td");
    const id = $(el).closest("tr").data("historyid");
    const activity_id = $(el).closest("tr").data("activityid");
    const activity_type = $(el).closest("tr").data("activitytype");
    let name = td.data("name");
    // const useTextField = td.data("usetextfield");

    // if (useTextField) {
    //   name = "value_textfield";
    // }
    const body = {
      id,
      activity_id,
      [name]: value,
    };
    const command = await this.historyService.updateCommand(body).execute();
    if (command.success) {
      const result = command.value;
      if (result.success) {
        td.html(this.addStyleToValue(activity_type, value));
        alertHelper.showSnackBar("Successfully Updated");
      }
    }
  }

  handleClickButtonSelectBulkDelete(evt) {
    // - hide button select bulk delete
    $(".btn-select-bulk-delete").hide();

    // - show button cancel bulk delete, button confirm bulk delete, checkbox on table
    $(".btn-cancel-bulk-delete, .btn-confirm-bulk-delete, .table-header-checkbox, .table-row-checkbox").show();
  }

  handleClickButtonCancelBulkDelete(evt) {
    // - show button select bulk delete
    $(".btn-select-bulk-delete").show();

    // - hide button cancel bulk delete, button confirm bulk delete, checkbox on table
    $(".btn-cancel-bulk-delete, .btn-confirm-bulk-delete, .table-header-checkbox, .table-row-checkbox").hide();

    // - uncheck all
    $(".table-row-checkbox").attr("checked", false);
  }

  async handleClickButtonConfirmBulkDelete(evt) {
    // - delete histories
    // o show loading
    loadingHelper.toggleLoading(true);

    // o collect history ids
    var historiesIds = [];
    $(".table-row-checkbox").each(function() {
      var elCheckbox = $(this).closest("tr").find("input[type=checkbox]");
      if(elCheckbox.prop("checked")) {
        var historyId = $(this).closest("tr").attr("data-historyid");
        if(historyId) historiesIds.push(historyId);
      }
    });

    if(historiesIds.length == 0) {
      alertHelper.showError("Please select histories !");
      loadingHelper.toggleLoading(false);
      return;
    }

    // o run command
    const command = await this.historyService
      .bulkDestroyCommand(historiesIds)
      .execute();
    
    // o hide loading
    loadingHelper.toggleLoading(false);

    // o show success message if success delete
    if (command.success) {
      const result = command.value;
      if (result.success) {
        alertHelper.showSnackBar("successfully deleted !");
        this.handleClickButtonCancelBulkDelete();
        this.fetchHistoriesData();
      }
    }
  }

  openModalEditHistory(historyid) {
    const selected = this.tempData.filter(d => d.id == historyid)[0];
    var modal = $('#modalEditHistory');
    
    modal.find('input[name=id]').val(selected.id);
    modal.find('input[name=activity_id]').val(selected.activity_id);
    modal.find('input[name=title]').val(selected.activity_title);
    modal.find('input[name=date]').val(selected.date);
    modal.find('input[name=time]').val(selected.time);
    modal.find('input[name=value]').val(selected.value).prop('disabled', !selected.activity_can_change);
    modal.modal('show');
  }

  async saveEditHistory() {
    var modal = $('#modalEditHistory');
    const body = {
      id: modal.find('input[name=id]').val(),
      activity_id: modal.find('input[name=activity_id]').val(),
      date: modal.find('input[name=date]').val(),
      time: modal.find('input[name=time]').val(),
      value: modal.find('input[name=value]').val(),
    };
    const command = await this.historyService.updateCommand(body).execute();
    if (command.success) {
      const result = command.value;
      if (result.success) {
        alertHelper.showSnackBar("Successfully Updated");

        modal.modal('hide');

        this.fetchHistoriesData();
      }
    }
  }
  
  initialize() {
    this.fetchHistoriesData();
    const thisObject = this;

    // event handler
    $("body").on("click", ".btn-delete-history", function (evt)  {
      evt.stopPropagation();
      thisObject.handleClickButtonDelete(this)
    });

    // $("body").on("click", ".table-responsive td", (evt) =>
    //   this.handleClickRowTable(evt)
    // );

    // $("body").on("click", ".btn-cancel-editable", (evt) =>
    //   this.handleClickButtonCancelEdit(evt)
    // );

    // $("body").on("click", ".btn-save-editable", (evt) =>
    //   this.handleClickButtonSaveEdit(evt)
    // );

    $("body").on('click', '.btn-select-bulk-delete', (evt) => 
      this.handleClickButtonSelectBulkDelete(evt)
    );

    $("body").on('click', '.btn-cancel-bulk-delete', (evt) => 
      this.handleClickButtonCancelBulkDelete(evt)
    );

    $("body").on('click', '.btn-confirm-bulk-delete', (evt) => 
      this.handleClickButtonConfirmBulkDelete(evt)
    );

    $("body").on("click", ".table-responsive td", (evt) => {
      evt.stopPropagation();
      const historyid = $(evt.target).closest('tr').data('historyid')
      this.openModalEditHistory(historyid)
    });

    $('body').on('click', '#btnSaveEditHistory', (evt) => {
      this.saveEditHistory();
    })
  }
}

jQuery(async function () {
  new HistoryView().initialize();
});
