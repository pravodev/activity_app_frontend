import HttpDataProxy from "./httpDataProxy";

class ActivityDataProxy extends HttpDataProxy {
  constructor() {
    super("activity");
  }

  getByMonthAndYear(month, year, params = {}) {
    return this._handleResponseFrom(
      this._api.requestApi(
        "activity.getByMonthAndYear",
        params,
        `/${month}/${year}`
      )
    );
  }

  getSortByPosition() {
    return this._handleResponseFrom(
      this._api.requestApi("activity.get", {}, "?sortbyposition=true")
    );
  }

  updatePosition(values) {
    const body = {
      position: values,
    };
    return this._handleResponseFrom(
      this._api.requestApi("activity.updatePosition", body)
    );
  }

  import(values) {
    return this._handleResponseFrom(
      this._api.requestApi("activity.import")
    );
  }
}

export default ActivityDataProxy;
