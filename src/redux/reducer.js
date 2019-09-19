// reducer.js
// Our Redux reducer. Handles important global data such as Muse connection status

import config from "./config";
import {
  SET_CONNECTION_STATUS,
  SET_GRAPHVIEW_DIMENSIONS,
  SET_OFFLINE_MODE,
  SET_MENU,
  SET_MUSE_INFO,
  SET_AVAILABLE_MUSES,
  SET_NOTCH_FREQUENCY,
  SET_NOISE,
  UPDATE_CLASSIFIER_DATA,
  SET_NATIVE_EMITTER,
  SET_NIGHT_TRACKER_ACTIVE,
  SET_NAP_TRACKER_ACTIVE,
  SET_ALARM_ACTIVE,   
  SET_MENU_INVISIBLE,
  SET_SNOOZE_ACTIVE,
  SET_SAVECSV_ACTIVE,
  SET_CONNECTING,
  SET_BT_CONNECTED,
  SET_LED,
  SET_POWER_NAP,
  SET_NIGHT_TRACKER,
  SET_REFRESH,
  SET_VIBRATION,
  SET_INFO,
  SET_OFFLINE_INFO,
  SET_OFFLINE_LIGHT_THERAPY,
  LESS_THAN_HOUR,
  SET_ALARM_ON,
  SET_BATTERY_VALUE,
  SET_HORIZONTAL,
  HIDE_CONTAINER
} from "./actionTypes";

const initialState = {
  connectionStatus: config.connectionStatus.NOT_YET_CONNECTED,
  availableMuses: [],
  museInfo: {},
  graphViewDimensions: { x: 0, y: 0, width: 300, height: 250 },
  isMenuOpen: false,
  isOfflineMode: false,
  notchFrequency: 60,
  noise: ["1", "2", "3", "4"],
  classifierData: new Array(30).fill(1),
  nativeEventEmitter: {},
  isNightTrackerActive: false,
  isNapTrackerActive: false,
  isMenuInvisible: false,
  isAlarmActive: false,
  isSnoozeActive: false,
  isSaveCsvActive: false,
  connecting: false,
  isLTConnected: false,
  led: false,
  powerNap: false,
  nightTracker: false,
  refresh: false,
  vibrationActive: true,
  info: false,
  offlineInfo: false,
  offlineLightTherapy: false,
  isLessThanHour: true,
  alarmOn: false,
  batteryValue: null,
  isHorizontal: false,
  containerHidden: true
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case SET_CONNECTION_STATUS:
      return {
        ...state,
        connectionStatus: action.payload,
        isOfflineMode: false
      };

    case SET_GRAPHVIEW_DIMENSIONS:
      return {
        ...state,
        graphViewDimensions: action.payload
      };

    case SET_OFFLINE_MODE:
      return {
        ...state,
        isOfflineMode: action.payload,
        connectionStatus: config.connectionStatus.NO_MUSES
      };

    case SET_MENU:
      return {
        ...state,
        isMenuOpen: action.payload
      };

    case SET_MUSE_INFO:
      return {
        ...state,
        museInfo: action.payload
      };

    case SET_AVAILABLE_MUSES:
      return {
        ...state,
        availableMuses: action.payload
      };

    case SET_NOTCH_FREQUENCY:
      return {
        ...state,
        notchFrequency: action.payload
      };

    case SET_NOISE:
      return {
        ...state,
        noise: action.payload
      };

    case UPDATE_CLASSIFIER_DATA:
      return {
        ...state,
        classifierData: state.classifierData.concat(action.payload).slice(1)
      };

    case SET_NATIVE_EMITTER:
      return {
        ...state,
        nativeEventEmitter: action.payload
      };

    case SET_NIGHT_TRACKER_ACTIVE:
      return {
        ...state,
        isNightTrackerActive: action.payload
      };

    case SET_NAP_TRACKER_ACTIVE:
      return {
        ...state,
        isNapTrackerActive: action.payload
      };

    case SET_ALARM_ACTIVE:
      return {
        ...state,
        isAlarmActive: action.payload
      };

    case SET_MENU_INVISIBLE:
      return {
        ...state,
        isMenuInvisible: action.payload
      };

    case SET_SNOOZE_ACTIVE:
      return {
        ...state,
        isSnoozeActive: action.payload
      };

    case SET_SAVECSV_ACTIVE:
      return {
        ...state,
        isSaveCsvActive: action.payload
      };

    case SET_CONNECTING:
      return {
        ...state,
        connecting: action.payload
      };

    case SET_BT_CONNECTED:
      return {
        ...state,
        isLTConnected: action.payload
      };

    case SET_LED:
      return {
        ...state,
        led: action.payload
      };

    case SET_POWER_NAP:
      return {
        ...state,
        powerNap: action.payload
      };

    case SET_NIGHT_TRACKER:
      return {
        ...state,
        nightTracker: action.payload
      };

    case SET_REFRESH:
      return {
        ...state,
        refresh: action.payload
      };

    case SET_VIBRATION:
      return {
        ...state,
        vibrationActive: action.payload
      };

    case SET_INFO:
      return {
        ...state,
        info: action.payload
      };

    case SET_OFFLINE_INFO:
      return {
        ...state,
        offlineInfo: action.payload
      };

    case SET_OFFLINE_LIGHT_THERAPY:
      return {
        ...state,
        offlineLightTherapy: action.payload
      };

    case LESS_THAN_HOUR:
      return {
        ...state,
        isLessThanHour: action.payload
      };

    case SET_ALARM_ON:
      return {
        ...state,
        alarmOn: action.payload
      };
      
    case SET_BATTERY_VALUE:
      return {
        ...state,
        batteryValue: action.payload
      };
      
    case SET_HORIZONTAL:
      return {
        ...state,
        isHorizontal: action.payload
      };

    case HIDE_CONTAINER:
      return {
        ...state,
        containerHidden: action.payload
      };
    default:
      return state;
  }
}
