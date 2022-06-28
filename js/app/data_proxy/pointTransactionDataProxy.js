import HttpDataProxy from "./httpDataProxy";

class PointTransactionDataProxy extends HttpDataProxy {
  constructor() {
    super("pointTransaction");
  }

  insert(data) {
    // if (data.use_textfield) {
    //   data.value_textfield = data.value;
    //   delete data.value;
    // }

    // delete data.use_textfield;

    return this._handleResponseFrom(
      this._api.requestApi(`${this._entity}.add`, data)
    );
  }

  bulkInsert(attributes) {
    const body = {
      activity_id: attributes.activity_id,
      history: attributes.history,
    };

    return this._handleResponseFrom(
      this._api.requestApi(`${this._entity}.bulkStore`, body)
    );
  }

  getHistoryRange(params) {
    let additionalUrl = "";

    if(params && params.year) {
      additionalUrl = `?year=${params.year}`;
    }
    
    return this._handleResponseFrom(
      this._api.requestApi(`${this._entity}.getHistoryRange`, {}, additionalUrl)
    );
  }
  
  getAll(params) {
    let additionalUrl = "";

    if(params) {
      additionalUrl = `?activity_id=${params.activity_id}&month=${params.month}&year=${params.year}`;
    }
    
    return this._handleResponseFrom(
      this._api.requestApi(`${this._entity}.get`, {}, additionalUrl)
    );
  }

  bulkDestroy(historiesIds) {
    const body = {
      pointTransaction: historiesIds
    };
    return this._handleResponseFrom(
      this._api.requestApi(`${this._entity}.bulkDelete`, body)
    );
  }
}

export default PointTransactionDataProxy;
