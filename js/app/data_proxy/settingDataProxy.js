import HttpDataProxy from "./httpDataProxy";

class SettingDataProxy extends HttpDataProxy {
  constructor() {
    super("setting");
  }

  save(key, value, data = null) {
    const body = { key, value, data };
    return this._handleResponseFrom(this._api.requestApi("setting.save", body));
  }

  // getApplicationLogs() {
  //   return this._handleResponseFrom(this._api.requestApi("applicationlogs.get"));
  // }
}

export default SettingDataProxy;
