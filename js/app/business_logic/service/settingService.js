import { BusinessService, Command } from "peasy-js";

class SettingService extends BusinessService {
  constructor(dataProxy) {
    super(dataProxy);
  }

  saveCommand(key, value, data = null) {
    const dataProxy = this.dataProxy;
    return new Command({
      _onValidationSuccess() {
        return dataProxy.save(key, value, data);
      }
    })
  }

  // getApplicationLogs() {
  //   const dataProxy = this.dataProxy;
  //   return new Command({
  //     _onValidationSuccess() {
  //       return dataProxy.getApplicationLogs();
  //     }
  //   })
  // }
}

export default SettingService;
