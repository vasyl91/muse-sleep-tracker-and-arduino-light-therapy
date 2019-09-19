// actions.js
// Functions that interact with the Redux store.
import Connector from "../native/Connector";
import Classifier from "../native/Classifier";
import { NativeModules, NativeEventEmitter } from "react-native";
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
} from "./actionTypes.js";
import config from "./config";
import Battery from "../native/Battery.js";
import { stringToBoolean } from "../alarmclock/AlarmManager";

// --------------------------------------------------------------------------
// Action Creators
export const setConnectionStatus = payload => ({ payload, type: SET_CONNECTION_STATUS });

export const setGraphViewDimensions = payload => ({ payload, type: SET_GRAPHVIEW_DIMENSIONS });

export const setOfflineMode = payload => ({ payload, type: SET_OFFLINE_MODE });

export const setMenu = payload => ({ payload, type: SET_MENU });

export const setConnectedMuseInfo = payload => ({ payload, type: SET_MUSE_INFO });

export const setAvailableMuses = payload => ({ payload, type: SET_AVAILABLE_MUSES });

export const setNotchFrequency = payload => ({ payload, type: SET_NOTCH_FREQUENCY });

export const setNoise = payload => ({ payload, type: SET_NOISE });

export const updateClassifierData = payload => ({ payload, type: UPDATE_CLASSIFIER_DATA });

export const setNativeEventEmitter = payload => ({ payload, type: SET_NATIVE_EMITTER });

export const setNightTrackerActive = payload => ({ payload, type: SET_NIGHT_TRACKER_ACTIVE });

export const setNapTrackerActive = payload => ({ payload, type: SET_NAP_TRACKER_ACTIVE });

export const setAlarmActive = payload => ({ payload, type: SET_ALARM_ACTIVE });

export const setMenuInvisible = payload => ({ payload, type: SET_MENU_INVISIBLE });

export const setSnoozeActive = payload => ({ payload, type: SET_SNOOZE_ACTIVE });

export const setSaveCsvActive = payload => ({ payload, type: SET_SAVECSV_ACTIVE });

export const setConnecting = payload => ({ payload, type: SET_CONNECTING });

export const setLTConnected = payload => ({ payload, type: SET_BT_CONNECTED });

export const setLed = payload => ({ payload, type: SET_LED });

export const setPowerNap = payload => ({ payload, type: SET_POWER_NAP });

export const setNightTracker = payload => ({ payload, type: SET_NIGHT_TRACKER });

export const setRefresh = payload => ({ payload, type: SET_REFRESH });

export const setVibration = payload => ({ payload, type: SET_VIBRATION });

export const setInfo = payload => ({ payload, type: SET_INFO });

export const setOfflineInfo = payload => ({ payload, type: SET_OFFLINE_INFO });

export const setOfflineLightTherapy = payload => ({ payload, type: SET_OFFLINE_LIGHT_THERAPY });

export const setLessThanHour = payload => ({ payload, type: LESS_THAN_HOUR });

export const setAlarmOn = payload => ({ payload, type: SET_ALARM_ON });

export const setBatteryValue = payload => ({ payload, type: SET_BATTERY_VALUE });

export const setHorizontal = payload => ({ payload, type: SET_HORIZONTAL });
  
export const setHideContainer = payload => ({ payload, type: HIDE_CONTAINER });
// -----------------------------------------------------------------------------
// Actions

export function getMuses() {
  return dispatch => {
    return Connector.getMuses().then(
      resolveValue => dispatch(setAvailableMuses(resolveValue)),
      rejectValue => {
        if (rejectValue.code === config.connectionStatus.BLUETOOTH_DISABLED) {
          dispatch(
            setConnectionStatus(config.connectionStatus.BLUETOOTH_DISABLED)
          );
        } else {
          dispatch(setConnectionStatus(config.connectionStatus.NO_MUSES));
        }
        return dispatch(setAvailableMuses(new Array()));
      }
    );
  };
}

export function initNativeEventListeners() {
  return (dispatch, getState) => {
    const nativeEventEmitter = new NativeEventEmitter(
      NativeModules.AppNativeEventEmitter
    );

    const batteryListener = new NativeEventEmitter(
      NativeModules.Battery
    );

    var subscription;
    var listenerOn;

    // Connection Status
    nativeEventEmitter.addListener("CONNECTION_CHANGED", params => {
      switch (params.connectionStatus) {
        case "CONNECTED":
          dispatch(setConnectionStatus(config.connectionStatus.CONNECTED));
          if (getState().batteryValue === null) {
            Battery.startReading();
            subscription = batteryListener.addListener("BATTERY", battery => {
                dispatch(setBatteryValue(battery));
            });
            listenerOn = true;
          }
          break;

        case "CONNECTING":
          dispatch(setConnectionStatus(config.connectionStatus.CONNECTING));
          break;

        case "DISCONNECTED":
        default:
          dispatch(setConnectionStatus(config.connectionStatus.DISCONNECTED));
          if (listenerOn === true) {
            subscription.remove();
            dispatch(setBatteryValue(null));
            listenerOn = false;
            Battery.stopReading();   
          }
          break;
      }
    });

    // Muse List
    nativeEventEmitter.addListener("MUSE_LIST_CHANGED", params => {
      dispatch(setAvailableMuses(params));
    });

    // Noise
    nativeEventEmitter.addListener("NOISE", message => {
      dispatch(setNoise(Object.keys(message)));
    });

    return dispatch(setNativeEventEmitter(nativeEventEmitter));
  };
}