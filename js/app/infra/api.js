import Axios from "axios";
import * as alertHelper from "./../core/\alert_helper";

const message =
{
    "connection": "Check your internet connection !"
};

export const axios = Axios;

axios.interceptors.response.use((response) => response, (error) => {
    if(error.response.status === 401) {
        window.localStorage.removeItem('APP_USER');
        window.localStorage.removeItem('APP_SID');
        window.location.replace(`${window.location.origin}/login.html`)
    }
    // catch CORS error
    if (typeof error.response === 'undefined') {
      error.response = ('A network error occurred. '
          + 'This could be a CORS issue or a dropped internet connection. '
          + 'It is not possible for us to know.')
    }
    return Promise.reject(error)
  })
// export const server = "https://backend.myrecord.club";
// export const server = "https://stagingbackend.myrecord.club";
export const server = "http://localhost:8000";

var listApi = {
    "activity.get": {
        method: 'GET',
        url: server + "/api/activities",
        withToken: false,
    },
    "activity.getByMonthAndYear" : {
        method : "GET",
        url: server + "/api/activities/getUsingMonthYear",
        withToken: false,
    },
    "activity.getDailyReport" : {
        method : "GET",
        url: server + "/api/activities/getDailyUsingMonthYear",
        withToken: false,
    },
    "activity.add" : {
        method : "POST",
        url: server + "/api/activities",
        withToken: false,
    },
    "activity.delete" : {
        method : "DELETE",
        url: server + "/api/activities",
        withToken: false,
    },
    "activity.update" : {
        method : "PATCH",
        url: server + "/api/activities",
        withToken: false,
    },
    "activity.updatePosition" : {
        method : "PATCH",
        url: server + "/api/activities/updatePosition",
        withToken: false,
    },
    "activity.import": {
        method: "POST",
        url: server + "/api/activities/importActivitiesForStudents",
        withToken: false,
    },
    "history.get": {
        method: "GET",
        url : server + "/api/histories",
        widthToken: false,
    },
    "history.add" : {
        method: "POST",
        url : server + "/api/histories",
        withToken : false,
    },
    "history.delete" : {
        method : "DELETE",
        url : server + "/api/histories",
        withToken : false,
    },
    "history.getHistoryRange": {
        method: 'GET',
        url: server + "/api/histories/getHistoryRange",
        withToken: false,
    },
    "history.bulkStore" : {
        method : "POST",
        url : server + "/api/histories/bulkStore",
        withToken : false,
    },
    "history.update" : {
        method : "PATCH",
        url : server + "/api/histories",
        withToken : false,
    },
    "history.bulkDelete" : {
        method : "POST",
        url : server + "/api/histories/bulkDelete",
        withToken : false,
    },
    "setting.get": {
        method: 'GET',
        url: server + "/api/setting",
        withToken: false,
    },
    "setting.save": {
        method: 'POST',
        url: server + "/api/setting",
        withToken: false,
    },
    "mediaGallery.get": {
        method: 'GET',
        url: server + "/api/media-galleries",
        withToken: false,
    },
    "mediaGallery.add" : {
        method : "POST",
        url: server + "/api/media-galleries",
        withToken: false,
    },
    "mediaGallery.delete" : {
        method : "DELETE",
        url: server + "/api/media-galleries",
        withToken: false,
    },
    "mediaGallery.update" : {
        method : "PATCH",
        url: server + "/api/media-galleries",
        withToken: false,
    },
    "category.get": {
        method: 'GET',
        url: server + "/api/categories",
        withToken: false,
    },
    "category.add" : {
        method : "POST",
        url: server + "/api/categories",
        withToken: false,
    },
    "category.delete" : {
        method : "DELETE",
        url: server + "/api/categories",
        withToken: false,
    },
    "category.update" : {
        method : "PATCH",
        url: server + "/api/categories",
        withToken: false,
    },
    "applicationLog.get": {
        method: 'GET',
        url: server + "/api/application-logs",
        withToken: false,
    },
    "applicationLog.add" : {
        method : "POST",
        url: server + "/api/application-logs",
        withToken: false,
    },
    "applicationLog.delete" : {
        method : "DELETE",
        url: server + "/api/application-logs",
        withToken: false,
    },
    "applicationLog.update" : {
        method : "PATCH",
        url: server + "/api/application-logs",
        withToken: false,
    },
    "pointTransaction.get": {
        method: "GET",
        url : server + "/api/point-transactions",
        widthToken: false,
    },
    "pointTransaction.delete" : {
        method : "DELETE",
        url : server + "/api/point-transactions",
        withToken : false,
    },
    "pointTransaction.getHistoryRange": {
        method: 'GET',
        url: server + "/api/point-transactions/getHistoryRange",
        withToken: false,
    },
    "pointTransaction.update" : {
        method : "PATCH",
        url : server + "/api/point-transactions",
        withToken : false,
    },
    "pointTransaction.bulkDelete" : {
        method : "POST",
        url : server + "/api/point-transactions/bulkDelete",
        withToken : false,
    },
    "auth.profile": {
        method: 'GET',
        url : server + "/api/auth/profile",
        withToken : false,
    },
    "auth.updateParentEmail": {
        method: 'PATCH',
        url: server + "/api/auth/updateParentEmail",
        withToken: false,
    },
    "auth.getStudents": {
        method: 'GET',
        url: server + "/api/auth/getAllStudents",
    },
    "auth.getDetailStudent": {
        method: 'GET',
        url: server + "/api/auth/getDetailStudent",
    }
};

function isIterable(variable) {
    if(typeof variable[Symbol.iterator] === 'function') {
        return true;
    }

    return false;
}

//this function will process message to readable message (not object)
//example : 
//message = {username: ["The username field is required.", "other error"]}
//this function will return :
//"The username field is required., other error"
function processMessage(message) {
    console.log("🚀 MESSAGE ERROR -> ", message)
    var result = "";
    var listMessage = [];

    if(Array.isArray(message)) {
        for(var i = 0;i<message.length;i++) {
            if(typeof(message[i]) == 'string') {
                listMessage.push(message[i]);
            }
        }
    } else if(typeof message == 'string') {
        listMessage.push(message);
    } else if(typeof message == 'object') {
        Object.keys(message).forEach(attrName => {
            listMessage.push(message[attrName].toString());
        });
    } else if(isIterable(message)) {
        for (var [key, value] of message) {
            listMessage.push(value.toString());
        }
    }

    if (listMessage.length > 0) {
        result = listMessage.toString();
    }
    else {
        result = message.toString();
    }

    if (result.includes("[object Object]")) {
        result = "Please try again";
    }
    return result;
}


//this function used to convert SUCCESS plain response from API to formated response
//example, plain response : 
//{'data' : {'access_token' : 'xxx', ...}, 'config' : {...}, 'header' : {...}, ... }
//then convert to : 
//{'already_display_alert' : false, 'is_json' : true, 'message' : '', 'result' : {..data..}, 'success' : true}
export function processResponse(r, ignoreAlert) {
    var result =
    {
        "success": false,
        "response": null,
        "is_json": false,
        "message": "",
        "already_display_alert": false,
    };

    //if response is not a valid value, then just return result with message : connection problem
    if(!r) {
        result['is_json'] = false;
        result['success'] = false;
        result['message'] = message.connection;
        if (!ignoreAlert) {
            alertHelper.showError('Failed ! ' + message.connection);
            result['already_display_alert'] = true;
        }
        return result;
    }

    //if response is valid and there is no error, then return result with that response
    if (r.error == false) {
        //if request success, then return success information + data
        result['is_json'] = true;
        result['success'] = true;
        result['response'] = r;
        return result;
    }

    //if request failed, then return failed information
    result['is_json'] = true;
    result['success'] = false;
    if (r.message) {
        result['message'] = processMessage(r.message);
        if (!ignoreAlert) {
            alertHelper.showError('Failed ! ' + result['message']);
            result['already_display_alert'] = true;
        }
    }
    else {
        result['is_json'] = false;
        result['success'] = false;
        result['message'] = message.connection;
        if (!ignoreAlert) {
            alertHelper.showError('Failed ! ' + message.connection);
            result['already_display_alert'] = true;
        }
    }
    
    if (result['message'].includes("[object Object]")) {
        result['message'] = "Please try again";
    }

    return result;
}

export async function requestApi(nameApi, bodyRequest = {}, additionalUrl = "", ignoreAlert = false, customUrl = null, customMethod = null) {
    var url = "";
    var method = "";
    if (nameApi != null) {
        url = listApi[nameApi]['url'];
        method = listApi[nameApi]['method'];
    }
    else {
        if (customUrl != null && customMethod != null && (["GET", "POST", "PATCH", "UPDATE", "DELETE"].includes(customMethod.toUpperCase()))) {
            url = customUrl;
            method = customMethod;
        }
        else {
            return false;
        }

    }
    //1. prepare params or formData
    var dataRequest = null;
    dataRequest = bodyRequest;


    //2. request GET / POST / PUT / DELETE
    if (!(["GET", "POST", "PATCH", "UPDATE", "DELETE"].includes(method.toUpperCase()))) {
        if (!ignoreAlert) {
            alertHelper.showError("Failed ! Error Api.js (1) ! Method is wrong !");
            resultReturn['already_display_alert'] = true;
        }
        return resultReturn;
    }

    const config = {
        method: method,
        url: url + additionalUrl,
        headers: {
            'Authorization': `Bearer ${window.localStorage.getItem('APP_SID')}`
        }
    }
    
    if(['POST', 'PATCH', 'UPDATE', "DELETE"].includes(method.toUpperCase())) {
        config.data = dataRequest;
    } else {
        config.params = dataRequest;
    }
    
    try {
        const response = await axios(config).then((r) => r.data)

        Promise.resolve(response);
        return response;
    } catch (error) {
        Promise.reject(error.response.data);
        return error.response.data;
    }
}