import * as templateHelper from "./../core/template_helper";
import * as loadingHelper from "./../core/loading_helper";
import * as dateTimeHelper from "./../core/datetime_helper";
import * as alertHelper from "./../core/alert_helper";
import ActivityService from "../business_logic/service/activityService";
import ActivityDataProxy from "../data_proxy/activityDataProxy";
import HistoryService from "../business_logic/service/historyService";
import HistoryDataProxy from "../data_proxy/historyDataProxy";
import AuthService from "../business_logic/service/authService";
import AuthDataProxy from "../data_proxy/authDataProxy";
import { parseQueryString, updateUrl } from "../core/url_helper";
import { copyTextToClipboard } from '../core/copy_helper';

class ReportListView {
  constructor() {
    this.activityService = new ActivityService(new ActivityDataProxy());
    this.historyService = new HistoryService(new HistoryDataProxy());
    this._reportData = [];
    this.authService = new AuthService(new AuthDataProxy());
  }

  getMonthAndYearFromUrlParameter() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const month = urlParams.get("month");
    const year = urlParams.get("year");
    if (month == null || year == null) {
      return null;
    } else {
      return {
        month: month,
        year: year,
      };
    }
  }

  getDetailActivityFromResult(result, id, dataMonthAndYear) {
    //find activity detail
    let detailActivity = {};
    for (let i = 0; i < result.length; i++) {
      if (result[i]["id"] == id) {
        detailActivity = result[i];
        break;
      }
    }

    return detailActivity;
  }

  async fetchActivities(params) {
    loadingHelper.toggleLoading(true);

    const command = await this.activityService
      .getByMonthAndYearCommand(params.month, params.year, params)
      .execute();
    if (command.success) {
      const result = command.value;
      if (result.success) {
        const activitySummary = result.response.data.filter(v => v.type !== 'speedrun')
        this._reportData = result.response.data;
        this.showActivitiesSummary(activitySummary);

        const activitySummarySpeedrun = result.response.data.filter(v => v.type == 'speedrun')
        this.showActivitiesSummary(activitySummarySpeedrun, '.data-activity-speedrun-summary');

        loadingHelper.toggleLoading(false);
        $(".report-summary-activity").show();
        $('.content-container').show();

        
        const focusData = result.response.focusData;
        this.showFocusData(focusData);
      }
    }

    const queryParams = parseQueryString(window.location.search);
    if(queryParams.activityid) {
      $(`.activity_button[activityid=${queryParams.activityid}]`).click();
    }
  }

  async fetchHistoryRange(params) {
    const command = await this.historyService.getHistoryRangeCommand(params).execute();

    if(command.success) {
      const result = command.value;
      if(result.success) {
        const data = result.response.data;

        if(data.length) {
          $('#monthSelection').show();

          const ranges = data[0].range;
          const currentValue = `${params.month}-${params.year}`;
          let options = ranges.map(r => `<option value="${r.month}-${r.year}" ${`${r.month}-${r.year}` === currentValue ? 'selected': ''}>${dateTimeHelper.monthToText(r.month)} ${r.year}</option>`)

          const check = ranges.filter(v => v.year == params.year && v.month == params.month).length;
          if(!check) {
            const optionForCurrentMonth = `<option value="${params.month}-${params.year}" selected>${dateTimeHelper.monthToText(params.month)} ${params.year}</option>`;
            options = [ optionForCurrentMonth, ...options];
          }

          $('#monthSelection').html(options.toString());

          const firstRangeIndex = ranges[0];
          const lastRangesIndex = ranges[ranges.length-1];
          
          const endDate = firstRangeIndex ? new Date(firstRangeIndex.year, firstRangeIndex.month-1, new Date().getDate()) : new Date(params.year, params.month-1, new Date().getDate());
          const startDate = lastRangesIndex ? new Date(lastRangesIndex.year, lastRangesIndex.month-1) : new Date(params.year, params.month-1);
          
          const optionsMonthPicker = {
            autoHide: true,
            autoPick: true,
            date: new Date(params.year, params.month-1, params.date || new Date().getDate()),
            startDate,
            endDate,
            trigger: '.datepicker-trigger',
          };
          $('#monthPicker').datepicker(optionsMonthPicker)
        }
      }
    }
  }

  showActivitiesSummary(activities, tbodyClassName = '.data-activity-summary') {

    //show report summary activity and hide report detail activity
    $(".report-summary-activity").show();
    $(".report-detail-activity").hide();

    //clear histories
    $(`.report-summary-activity ${tbodyClassName}`).empty();

    //prepare template
    var rowActivitySummaryTpl = $(
      'script[data-template="row-activity-summary"'
    ).text();

    //render html
    $(`.report-summary-activity ${tbodyClassName}`).append(activities.map(function(activity) {
        // var redScore = activity["score"] < activity["target"];
        let title = activity["title"];
        if(activity.type == 'speedrun') {
          title += '<br/>' + activity.value;
        }
        return templateHelper.render(rowActivitySummaryTpl, {
            "activity_id" : activity["id"],
            "activity_name" : title,
            "target" : activity["target"],
            "score" : activity["score"],
            "count" : activity["count"],
            "point" : activity["point"] === null ? 'N/A' : Number(activity["point"]),
            "redscore" : activity['is_red'],
            "redcount" : activity.type == 'speedrun' ? activity['is_red_count'] : false,
        });
      })

      );
    if(Number(window.setting.point_system)) {
      $('.section-point-menu').show();
    }
  }

  showDetailActivity(detailActivity) {

    //show report detail activity and hi hide report summary activity
    $(".report-summary-activity").hide();
    $(".report-detail-activity").show();

    //clear report heading, data report detail, footer report detail
    $(".report-detail-activity .report-heading").remove();
    $(".report-detail-activity .data-report-detail-activity").empty();
    $(".report-detail-activity .total-report-detail-activity").empty();

    //prepare template
    var reportHeadingTpl = $('script[data-template="report-heading"').text();
    var rowDataReportDetailActivityTpl = $(
      'script[data-template="row-data-report-detail-activity"'
    ).text();

    var templateDetail = detailActivity.type === 'speedrun' ? 'row-footer-report-detail-activity-speedrun' : 'row-footer-report-detail-activity';
    var rowFooterReportDetailActivityTpl = $(
      `script[data-template="${templateDetail}"`
    ).text();

    //render html
    let title = detailActivity["title"];
    if(detailActivity.type == 'speedrun') {
      title += '<br/>' + detailActivity.value;
    }
    //- render heading
    $(".report-detail-activity").prepend(
      templateHelper.render(reportHeadingTpl, {
        activity_name: title,
        year: detailActivity["year"],
        month: detailActivity["month"],
      })
    );

    //- render data report detail activity
    $(".report-detail-activity .data-report-detail-activity").append(
      detailActivity["histories"].map(function (history) {
        var value = null;
        if (history["value"] != null) {
          value = history["value"];
        } else if (history["value_textfield"] != null) {
          value = history["value_textfield"];
        } else {
          value = 0;
        }
        return templateHelper.render(rowDataReportDetailActivityTpl, {
          date: history["date"],
          time: history["time"],
          value: value,
        });
      })
    );

    const leftStyle = detailActivity['left'] < 0 ? 'display:none' : '';
    
    //- render total report detail activity
    $(".report-detail-activity .total-report-detail-activity").append(
      templateHelper.render(rowFooterReportDetailActivityTpl, {
        score: detailActivity["score"],
        target: detailActivity["target"],
        left: detailActivity["left"],
        best_time: detailActivity["best_time"],
        best_record_alltime: detailActivity["best_record_alltime"],
        average_time: detailActivity["score"],
        count: detailActivity["count"],
        leftStyle: leftStyle,
        point: detailActivity["point"] === null ? 'N/A' : Number(detailActivity["point"]),
      })
    );
    $("#btnBack").show();
    $('#monthSelection').hide();
      // change button back action
    $("#btnBack").on("click", function (e) {
      e.preventDefault();

      $(".report-summary-activity").show();
      $(".report-detail-activity").hide();
      $('#monthSelection').show();

      $("#btnBack").off();
      $("#btnBack").hide();
    });

    
    if(Number(window.setting.point_system)) {
      $('.section-point-menu').show();
    }
  }

  showFocusData(activities) {
    const tbodyClassName = '.data-activity-pointFocus-summary';
    //show report summary activity and hide report detail activity
    $(".report-focus-activity").show();

    //clear histories
    $(`.report-focus-activity ${tbodyClassName}`).empty();

    //prepare template
    var rowFocusSummaryTpl = $(
      'script[data-template="row-focus-activity"'
    ).text();

    //render html
    $(`.report-focus-activity ${tbodyClassName}`).append(activities.map(function(activity) {
        // var redScore = activity["score"] < activity["target"];
        let title = activity["activity_title"];
        if(activity.type == 'speedrun') {
          title += '<br/>' + activity.activity_value;
        }
        return templateHelper.render(rowFocusSummaryTpl, {
            "activity_id" : activity["activity_id"],
            "activity_name" : title,
            "start_date": activity['start_date'],
            "end_date": activity['end_date'],
            "repeated_days_count": activity['repeated_days_count'],
            "point": activity['point']
        });
      })

    );
  }

  handleClickActivityTitle(evt) {
    const activityId = $(evt.target).attr("activityId");
    const params = parseQueryString(window.location.search);
    const detailActivity = this.getDetailActivityFromResult(
      this._reportData,
      activityId,
      params
    );
    this.showDetailActivity(detailActivity);
  }

  
  async fetchDetailStudent(id) {
    const command = await this.authService.getDetailStudentCommand(id).execute();

    if (command.success) {
      const result = command.value;
      if (result.success) {
        const detail = result.response.data
        $('#titleReport').html(`${detail.name} Reports`)

        if(Number(detail.settings.point_system)) {
          $('.section-pointStudent-menu').show();
        }
      }
    }
  }
  
  async fetchDailyReport(params) {
    loadingHelper.toggleLoading(true);

    const command = await this.activityService
      .getDailyReportCommand(params)
      .execute();
    if (command.success) {
      const result = command.value;
      if (result.success) {
        const activitySummary = result.response.data;
        this.showActivitiesDailyReport(activitySummary);

        loadingHelper.toggleLoading(false);
        $(".report-daily-activity").show();
        $('.content-container').show();
      }
    }
  }
  
  showActivitiesDailyReport(activities) {
    const tbodyClassName = '.data-activity-daily';
    $(".report-daily-activity").show();

    //clear histories
    $(`.report-daily-activity ${tbodyClassName}`).empty();

    //prepare template
    var rowActivitySummaryTpl = $(
      'script[data-template="row-activity-daily"'
    ).text();

    if(!activities.length) {
      $(`.report-daily-activity ${tbodyClassName}`).html(`
        <tr>
          <td colspan="2" class="text-center">No Data</td>
        </tr>
      `)
    }
    
    //render html
    $(`.report-daily-activity ${tbodyClassName}`).append(activities.map(function(activity) {
        // var redScore = activity["score"] < activity["target"];
        let title = activity["title"];
        if(activity.type == 'speedrun') {
          title += '<br/>' + activity.value;
        }
        let score_value = '';

        if(activity.score && activity.type !== 'speedrun') {
          score_value = `+${activity.score} (${activity.percent}%)`;
        } else if(activity.score && activity.type == 'speedrun') {
          const stopwatchValue = activity.stopwatch_value.map((val) => `(${val})`).join(' ');
          score_value = `+${activity.score} ${stopwatchValue} (${activity.percent}%)`;
        }
        
        return templateHelper.render(rowActivitySummaryTpl, {
            "activity_id" : activity["id"],
            "activity_name" : title,
            "score_value": score_value
        });
      })

      );
    if(Number(window.setting.point_system)) {
      $('.section-point-menu').show();
    }
  }
  
  initialize() {
    const params = parseQueryString(window.location.search);
    this.fetchActivities(params);
    this.fetchHistoryRange(params);

    if($('#dailyContent').length) {
      this.fetchDailyReport(params)
    }
    
    if(params.student_id) {
      this.fetchDetailStudent(params.student_id);
    }

    // if has params tab, set active tab base on query param
    if(['month', 'daily'].indexOf(params.tab) >= 0) {
      const idEl = {
        month: '#monthly-tab',
        daily: '#daily-tab'
      }

      $(idEl[params.tab]).click();
    }

    // event handler
    $("body").on("click", ".activity_button", (evt) =>
      this.handleClickActivityTitle(evt)
    );

    if(params.month) {
      $('#titleContent').html(`Report of ${dateTimeHelper.monthToText(params.month)} ${params.year}`)
    }

    const _this = this;
    $('#monthSelection').on('change', function(){
      const value = $(this).val();
      const split = value.split('-');
      const params = {
        month: split[0],
        year: split[1],
      };

      const url = window.location.protocol + "//" + window.location.host + window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('month', params.month);
      searchParams.set('year', params.year);
      
      const newUrl = `${url}?${searchParams.toString()}`;

      if(history.pushState) {

        _this.fetchActivities(params);
        history.pushState({path: newUrl}, '', newUrl)
        $('#titleContent').html(`Report of ${dateTimeHelper.monthToText(params.month)} ${params.year}`)
      } else {
        window.location.replace(newUrl);
      }
    })

    $('#monthPicker').on('pick.datepicker', function(e) {
      const params = {
        month: e.date.getMonth()+1,
        date: e.date.getDate(),
        year: e.date.getFullYear(),
      };
      
      updateUrl(params);
      
      _this.fetchActivities(params);
      _this.fetchDailyReport(params)
    })


    // bind event on click column daily
    // $('body').on('click', '.data-activity-daily tr', function(e) {
    //   var text = $(this).find('td').map((i, td) => $(td).text().trim()).toArray().join(' ')
    //   copyTextToClipboard(text).then(() => {
    //     alertHelper.showSnackBar(`Copied: ${text}`, 1)
    //   })
    // })

    $('body').on('click', '.doCopyAllText', function(e) {
      var text = $('.data-activity-daily').find('tr').map((i, el) => {
        return $(el).find('td').map((i, td) => $(td).text().trim()).toArray().join(' ');
      }).toArray().join("\n");

      copyTextToClipboard(text).then(() => {
        alertHelper.showSnackBar('Copied !');
      })
    });

    $('[data-toggle=tab]').on('click', function() {
      const tabkey = $(this).data('tabkey')

      updateUrl({
        tab: tabkey
      })
    })
  }
}

jQuery(async function () {
  new ReportListView().initialize();
});
