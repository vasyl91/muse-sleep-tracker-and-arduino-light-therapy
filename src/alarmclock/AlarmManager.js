import { AsyncStorage, Vibration, Dimensions } from "react-native";
import AndroidAlarms from 'react-native-android-alarms';
import { setAlarmOn } from "../redux/actions";
import store from "../redux/store.js";

const PATTERN = [500, 1000];
let deviceHeight = Dimensions.get('window').height;
let deviceWidth = Dimensions.get('window').width;
export const HEIGHT: number = deviceHeight;
export const WIDTH: number = deviceWidth;
export const SECOND = 1000;
export const MINUTE = SECOND * 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const hoursData = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
export const minutesData = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];

export function activateAlarm() {
    AndroidAlarms.startAlarm(); 
    if (store.getState().vibrationActive === true) {
        Vibration.vibrate(PATTERN, true);
    }
}

export function dismissAlarm() {
    AndroidAlarms.stopAlarm();
    store.dispatch(setAlarmOn(false));
    Vibration.cancel(); 
    AsyncStorage.getItem('alarmID').then((value) => {
        AndroidAlarms.clearAlarm(JSON.parse(value)); 
    });
    AsyncStorage.setItem('alarmID', JSON.stringify(null));
} 
 
export function minimizeApplication() {
    AndroidAlarms.minimizeApp(); 
} 

export function currentTime() {
    var date = new Date();
    var currentHour = date.getHours(); 
    var currentMinutes = date.getMinutes();
    var currentSeconds = date.getSeconds();
    var currentMS = date.getMilliseconds();
    currentTimeInMS =  ((currentHour * HOUR) + (currentMinutes * MINUTE) + (currentSeconds * SECOND)  + currentMS);
    return currentTimeInMS;
} 

export function translation(string){
    switch(string){
        case 2: return true;
        case 3: return true;
        case 4: return true;
        case 22: return true;
        case 23: return true;
        case 24: return true;
        case 32: return true;
        case 33: return true;
        case 34: return true;
        case 42: return true;
        case 43: return true;
        case 44: return true;
        case 52: return true;
        case 53: return true;
        case 54: return true;
        default: return false;
    }
}

export function stringToBoolean(string){
    switch(string){
        case "true": return true;
        case "false": return false;
        case "null": return null;
        default: return Boolean(string);
    }
}