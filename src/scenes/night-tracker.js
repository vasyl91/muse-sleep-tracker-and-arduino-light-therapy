import React, { Component, PropTypes } from "react";
import moment from 'moment';
import { bindActionCreators } from "redux";
import {
  Text,
  Image,
  View,
  NativeModules,
  NativeEventEmitter,
  Slider, 
  AsyncStorage,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import { connect } from "react-redux";
import { 
  setNightTrackerActive, 
  setMenuInvisible, 
  setSnoozeActive,
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy,
  setVibration,
  setLessThanHour 
} from "../redux/actions";
import config from "../redux/config";
import SandboxButton from "../components/SandboxButton";
import NoiseIndicator from "../components/NoiseIndicator";
import I18n from "../i18n/i18n";
import * as colors from "../styles/colors";
import AlarmButton from "../alarmclock/AlarmButton";
import PickerButton from "../alarmclock/PickerButton";
import {
  dismissAlarm,
  currentTime, 
  translation,
  stringToBoolean,
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  hoursData,
  minutesData,
  HEIGHT,
  WIDTH 
} from "../alarmclock/AlarmManager";
import Classifier from "../native/Classifier.js";
import { MediaQueryStyleSheet } from "react-native-responsive";
import BluetoothSerial from "react-native-bluetooth-serial";
import PopupDialog from 'react-native-popup-dialog';
import BackgroundTimer from "react-native-background-timer";
import { WheelPicker } from 'react-native-wheel-picker-android';
import AndroidAlarms from 'react-native-android-alarms';

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    notchFrequency: state.notchFrequency,
    noise: state.noise,
    isNightTrackerActive: state.isNightTrackerActive,
    isSnoozeActive: state.isSnoozeActive,
    isLTConnected: state.isLTConnected,
    vibrationActive: state.vibrationActive,
    isLessThanHour: state.isLessThanHour,
    refresh: state.refresh
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setNightTrackerActive,
      setMenuInvisible,
      setSnoozeActive,
      setNightTracker, 
      setPowerNap, 
      setOfflineLightTherapy,
      setVibration,
      setLessThanHour
    },
    dispatch
  );
}

function parseMillisecondsIntoReadableTime(milliseconds){
  var hours = milliseconds / (1000*60*60);
  var absoluteHours = Math.floor(hours);

  var minutes = (hours - absoluteHours) * 60;
  var absoluteMinutes = Math.floor(minutes);

  var translationHours = translation(absoluteHours);
  var translationMinutes = translation(absoluteMinutes);

  if(absoluteHours == 1) {
    hTxt = I18n.t("hour");
  } else {
    if (translationHours) {
      hTxt = I18n.t("hours234");
    } else {
      hTxt = I18n.t("hours");    
    }
  };

  if(absoluteMinutes == 1) {
    mTxt = I18n.t("minute");
  } else {
    if (translationMinutes) {
      mTxt = I18n.t("minutes234");
    } else {
      mTxt = I18n.t("minutes"); 
    }   
  };

  if(absoluteHours == 0) {
    return I18n.t("toShort");
  } else {
    return I18n.t("alarmIn") + absoluteHours + hTxt + I18n.t("and") + absoluteMinutes + mTxt;
  }; 
}

class NightTracker extends Component {
  constructor(props) {
    super(props);
    this.predictSubscription = {};
    this.trackerScore = {};
    this.lightValue = {};

    // Initialize States
    this.state = {
      selectedHours: "09",
      selectedMinutes: "00",
      selectedPickerHour: 9,
      selectedPickerMinute: 0,
      snoozeTime: 10,
      isAlarmSet: false,
      evaluation1Active: false,
      evaluation2Active: false,
      evaluation3Active: false,
      evaluation4Active: false,
      evaluation5Active: false,
      evaluation6Active: false,
      evaluation7Active: false,
      evaluation8Active: false,
      evaluation9Active: false,
      evaluation10Active: false,
    };
  }

  componentDidMount() {
    Classifier.startClassifier(this.props.notchFrequency);
    Classifier.startNoiseListener();  
    this.loadAlarm(); 
    this.setSnoozeAlarm();
    this.props.setNightTracker(this.props.nightTracker = false);
    this.props.setPowerNap(this.props.powerNap = false);
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);  
    
    const checkId = BackgroundTimer.setInterval(() => {
      this.checkTime();
      this.refreshTime();
    }, 1000);
    this.setState({ checkId: checkId }); 
  }

  componentWillUnmount() {
    Classifier.stopNoiseListener();
    this.willUnmountFunction();
    this.props.setNightTracker(this.props.nightTracker = true);
    
    const checkId = this.state.checkId;
    const clearCheckId = BackgroundTimer.clearTimeout(checkId);
    this.setState(clearCheckId);
  }

  //AsyncStorage & Snooze
  storeTimeButton() {
    this.storeAlarm();
    this.checkTime();
    this.popupDialog.dismiss();
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);
  }

  menuStoreButton() {
    this.storeFunction();
    this.popupMenu.dismiss();
    this.props.setMenuInvisible(this.props.isMenuInvisible = false); 
  }

  showTimePopup() {
    this.popupDialog.show();
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
  }

  showMenuPopup() {
    this.popupMenu.show();
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
  }

  vibrationOn() {
    this.props.setVibration(this.props.vibrationActive = true);
  }

  vibrationOff() {
    this.props.setVibration(this.props.vibrationActive = false);
  }

  storeFunction() {
    AsyncStorage.setItem('snoozeTimeObj', JSON.stringify(Number(this.state.snoozeTime)));
    if (this.props.vibrationActive === true) {
      AsyncStorage.setItem('vibrationObj', JSON.stringify(true));
    } else {
      AsyncStorage.setItem('vibrationObj', JSON.stringify(false));
    }
  }

  storeAlarm() {
    AsyncStorage.setItem('hoursObj', JSON.stringify(Number(this.state.selectedHours)));
    AsyncStorage.setItem('minutesObj', JSON.stringify(Number(this.state.selectedMinutes)));
  }

  loadAlarm() {
    AsyncStorage.getItem('hoursObj').then((result) => {
        if (result !== null) {
          this.setState({ selectedHours: (result < 10 ? "0" + result : result) });
          this.setState({ selectedPickerHour: Number(result) });
        }
    });
    AsyncStorage.getItem('minutesObj').then((result) => {
        if (result !== null) {
          this.setState({ selectedMinutes: (result < 10 ? "0" + result : result) });
          this.setState({ selectedPickerMinute: Number(result) });
        }
    });
    AsyncStorage.getItem('snoozeTimeObj').then((result) => {
        if (result !== null) {
          this.setState({ snoozeTime: Number(result) });
        }
    });
  }

  setSnoozeAlarm() {
    AsyncStorage.getItem('alarmID').then((value) => {
      if (this.props.isSnoozeActive === true && stringToBoolean(value) === null) { // prevents from triggering second snooze alarm if app was killed and opened again while snooze 
        AsyncStorage.getItem('snoozeTimeObj').then((result) => {
            if (result !== null) {
              time = JSON.parse(result) * MINUTE;
              alarmTime = Number(moment()) + time;
              AndroidAlarms.setAlarm(alarmTime, alarmTime.valueOf(), false);
              AsyncStorage.setItem('alarmID', JSON.stringify(alarmTime));          
              this.setActive();
            } else if (result === null) {
                time = this.state.snoozeTime * MINUTE;
                alarmTime = Number(moment()) + time;
                AndroidAlarms.setAlarm(alarmTime, alarmTime.valueOf(), false);
                AsyncStorage.setItem('alarmID', JSON.stringify(alarmTime));    
                this.setActive();
            }
        });
      }
    });
  }

  dismissSnooze() { 
    this.props.setSnoozeActive(this.props.isSnoozeActive = false);
    AsyncStorage.setItem('SnoozeActive', JSON.stringify(false));
    this.dismissButton();
  }

  sliderValue() {
    return Number(this.state.snoozeTime);
  }

  minutes() {
    var absoluteMinutes = this.state.snoozeTime
    var translationMinutes = absoluteMinutes == 2 || absoluteMinutes == 3 || absoluteMinutes == 4;

    if(absoluteMinutes == 1) {
      return I18n.t("minuteSnooze");
    } else {
      if (translationMinutes) {
        return I18n.t("minutes234");
      } else {
        return I18n.t("minutes"); 
      }   
    };
  }

  //Alarm
  getTime() {
    var selectedTimeInMS, currentTimeInMS, mathAlarm;
    selectedTimeInMS = ((this.state.selectedHours * HOUR) + (this.state.selectedMinutes * MINUTE));
    currentTimeInMS =  currentTime();

    if(selectedTimeInMS > currentTimeInMS) {
      mathAlarm = selectedTimeInMS - currentTimeInMS;
    } else {
      mathAlarm = ((DAY - currentTimeInMS) + selectedTimeInMS);
    };

    return mathAlarm; // returns time to next alarm in MS
  }

  readableTime() {
    return parseMillisecondsIntoReadableTime(Number(this.getTime()));
  }

  refreshTime() {
    if (this.props.refresh === true) {
      return this.readableTime();
    } else {
        return this.readableTime();
      }
  } 

  checkTime() {
    if (this.getTime() <= HOUR) {
      this.props.setLessThanHour(this.props.isLessThanHour = true);
    } else {
        this.props.setLessThanHour(this.props.isLessThanHour = false); 
    }
  }

  //Tracker
  setTracker() {
    var wakeTime = this.getTime();

    const wakeTimeId = BackgroundTimer.setTimeout(() => {
      this.startTracker();
    }, wakeTime - HOUR);
    this.setState({ wakeTimeId: wakeTimeId });

    this.props.setNightTrackerActive(this.props.isNightTrackerActive = true);
    AsyncStorage.setItem('NightTrackerActive', JSON.stringify(true));
    console.log("Night tracker set");
  }

  startTracker() {
    this.startTrackerA();
    this.startTrackerB();  
    console.log("Night tracker started");
  }

  startTrackerA() {
    Classifier.startTracking(); 
    this.setScore();
    this.setState({ evaluation1Active: true });
  }

  startTrackerB() {
    const timerTrackId = BackgroundTimer.setInterval(() => {
      this.start1Evaluation();
      console.log("Night evaluation 1 started");
    }, 1000);
    this.setState({ timerTrackId: timerTrackId });   
  }

  start1Evaluation() {
    if (this.state.evaluation1Active === true)
      if (this.trackerScore >= 410) {
        this.dismissTracker();
        this.setState({ evaluation1Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation2Active: true });
          this.start2Evaluation();
          console.log("Night evaluation 2 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        return null;
        console.log("Night tracker repeated after 1");
      }
  }

  start2Evaluation() {
    if (this.state.evaluation2Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation2Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation3Active: true });
          this.start3Evaluation();
          console.log("Night evaluation 3 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation2Active: false });
        this.startTrackerB();
        console.log("Night tracker repeated after 2");
      }
  }

  start3Evaluation() {
    if (this.state.evaluation3Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation3Active: false });
        BackgroundTimer.setTimeout(() => {         
          this.setState({ evaluation4Active: true });
          this.start4Evaluation();
          console.log("Night evaluation 4 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation3Active: false });
        this.startTrackerB();
        console.log("Night tracker repeated after 3");
      }
  }

  start4Evaluation() {
    if (this.state.evaluation4Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation4Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation5Active: true });
          this.start5Evaluation();
          console.log("Night evaluation 5 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation4Active: false });
        this.startTrackerB();
        console.log("Night tracker repeated after 4");
      }
  }

  start5Evaluation() {
    if (this.state.evaluation5Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation5Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation6Active: true });
          this.start6Evaluation();
          console.log("Night evaluation 6 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation5Active: false });
        this.startTrackerB();
        console.log("Night tracker repeated after 5");
      }
  }

  start6Evaluation() {
    if (this.state.evaluation6Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation6Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation7Active: true });
          this.start7Evaluation();
          console.log("Night evaluation 7 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation6Active: false });
        this.startTrackerB();
        console.log("Night tracker repeated after 6");
      }
  }

  start7Evaluation() {
    if (this.state.evaluation7Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation7Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation8Active: true });
          this.start8Evaluation();
          console.log("Night evaluation 8 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation7Active: false });
        this.startTrackerB();
        console.log("Night tracker repeated after 7");
      }
  }

  start8Evaluation() {
    if (this.state.evaluation8Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation8Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation9Active: true });
          this.start9Evaluation();
          console.log("Night evaluation 9 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation8Active: false });
        this.startTrackerB();
        console.log("Night tracker repeated after 8");
      }
  }

  start9Evaluation() {
    if (this.state.evaluation9Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation9Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation10Active: true });
          this.start10Evaluation();
          console.log("Night evaluation 10 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation9Active: false });
        this.startTrackerB();
        console.log("Night tracker repeated after 9");
      }
  }

  start10Evaluation() {
    if (this.state.evaluation10Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation10Active: false });
        BackgroundTimer.setTimeout(() => {
          Classifier.stopTracking(); 
          this.setAlarm();
          console.log("Night alarm set");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation10Active: false });
        this.startTrackerB();
        console.log("Night tracker repeated after 10");
      }
  }

  setAlarm() {
    this.setState({ isAlarmSet: true });

    time = 15 * MINUTE;
    alarmTime = Number(moment()) + time;
    
    AndroidAlarms.setAlarm(alarmTime, alarmTime.valueOf(), false);
    AsyncStorage.setItem('alarmID', JSON.stringify(alarmTime));
    
    if (this.props.isLTConnected === true) {      
      this.increaseLight();
      console.log("Night light activated");    
    }
    AsyncStorage.setItem('NightTracker', JSON.stringify(true));
  }

  dismissButton() {
    if (this.state.isAlarmSet === true) {
      AndroidAlarms.clearAlarm(alarmID);
      this.setState({ isAlarmSet: false }); 
    }
    this.props.setNightTrackerActive(this.props.isNightTrackerActive = false);
    AsyncStorage.setItem('NightTrackerActive', JSON.stringify(false));   
    AsyncStorage.setItem('NightTracker', JSON.stringify(false)); 
    this.willUnmountFunction();
    AsyncStorage.setItem('alarmID', JSON.stringify(null));
    this.dismissTracker();      
  }

  willUnmountFunction() {
    this.setState({ evaluation1Active: false });
    this.setState({ evaluation2Active: false });
    this.setState({ evaluation3Active: false });
    this.setState({ evaluation4Active: false });
    this.setState({ evaluation5Active: false });
    this.setState({ evaluation6Active: false });
    this.setState({ evaluation7Active: false });
    this.setState({ evaluation8Active: false });
    this.setState({ evaluation9Active: false });
    this.setState({ evaluation10Active: false });
    
    Classifier.stopTracking();
    this.removeListenerFunc();
    
    const wakeTimeId = this.state.wakeTimeId;
    const clearWakeTimeId = BackgroundTimer.clearTimeout(wakeTimeId);
    this.setState(clearWakeTimeId);
    
    const lightId = this.state.lightId;
    const clearIntervalId = BackgroundTimer.clearInterval(lightId); 
    this.setState(clearIntervalId);
    
    const alarmLightId = this.state.alarmLightId;
    const clearAlarmLightId = BackgroundTimer.clearTimeout(alarmLightId); 
    this.setState(clearAlarmLightId);  

    this.lightValue = 0;
    this.setValue();   
  }

  setActive() {
    this.props.setAlarmActive(this.props.isAlarmActive = true);
    AsyncStorage.setItem('NightTrackerActive', JSON.stringify(true));
    AsyncStorage.setItem('NightTracker', JSON.stringify(true));
  }

  dismissTracker() {
    const timerTrackId = this.state.timerTrackId;
    const clearTrackId = BackgroundTimer.clearInterval(timerTrackId);
    this.setState(clearTrackId);   
  }

  setScore() {
    const scoreListener = new NativeEventEmitter(
      NativeModules.Classifier
    );
    this.predictSubscription = scoreListener.addListener(
      "SLEEP_SCORE", score => {
        this.trackerScore = score;
      }
    );
  }

  removeListenerFunc() {
    const scoreListener = new NativeEventEmitter(
      NativeModules.Classifier
    );
    this.predictSubscription = scoreListener.removeListener();
  }

  //Light Therapy
  increaseLight() {
    this.lightValue = 0;
    const lightId = BackgroundTimer.setInterval(() => {
      if (this.lightValue < 255) {
        this.lightValue = this.lightValue + 1;
        this.setValue();
      } 
    }, 2300);
    this.setState({ lightId: lightId });   
  }

  setValue = async value => {
    try {
      value = "b " + this.lightValue + "\n";
      await BluetoothSerial.write(value)
    } catch (e) {
      console.log(e)
    }
  }

  pathLight() {
    this.storeFunction();
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
    this.props.history.push("/lightTherapy");
  }

  //Popup disconnected
  show() {
    BackgroundTimer.setTimeout(() => {
      this.popupDisconnected.show();
      this.props.setMenuInvisible(this.props.isMenuInvisible = false);
      if (this.props.isNightTrackerActive === true) {
        this.dismissSnooze();
      }
    }, 1);        
  }

  pathOne() {
    this.props.history.push("/connectorOne");
  }

  //Render
  renderVibrationButton() {
    if (this.props.vibrationActive === true) {
      return (
        <TouchableOpacity onPress={this.vibrationOff.bind(this)} style={styles.lightButton}>
          <Text style={styles.dialogTextEnabled}>{I18n.t("on")}</Text>
        </TouchableOpacity>
      );
    } else return (
        <TouchableOpacity onPress={this.vibrationOn.bind(this)} style={styles.lightButton}>
          <Text style={styles.dialogTextButton}>{I18n.t("off")}</Text>
        </TouchableOpacity>
      );   
  }

  renderLightBulb() {
    if (this.props.isLTConnected === true) {
      return (
        <Image source={require('../assets/light_bulb.png')} style={styles.image} resizeMode="contain"/>
      );
    } else {
      return null;
    }  
  }

  renderNoiseIndicator() {
    if (this.props.noise.length >= 1) {
      return <NoiseIndicator noise={this.props.noise} height={80} width={80} />;
    }
    return (
      <Image
        source={require("../assets/ok.png")}
        style={{ height: 80, width: 80 }}
      />
    );
  }

  renderLightTherapyButton() {
    if (this.props.isLTConnected === true) {
      return (
        <TouchableOpacity onPress={this.pathLight.bind(this)} style={styles.lightButton}>
          <Text style={styles.dialogTextEnabled}>{I18n.t("enabled")}</Text>
        </TouchableOpacity>
      );
    } else return (
        <TouchableOpacity onPress={this.pathLight.bind(this)} style={styles.lightButton}>
          <Text style={styles.dialogTextButton}>{I18n.t("disabled")}</Text>
        </TouchableOpacity>
      );   
  }

  renderTrackButton() {
    if (this.props.isLessThanHour === true || this.props.isSnoozeActive === true) {
      return (
        <TouchableOpacity onPress={() => null} disabled={true} style={styles.trackContainer}>
          <Text style={styles.disabledTrackSize}>{I18n.t("track")}</Text>
        </TouchableOpacity>
      );
    } else if (this.props.isNightTrackerActive === false) {
        return (
          <TouchableOpacity onPress={this.setTracker.bind(this)} style={styles.trackContainer}> 
            <Text style={styles.trackSize}>{I18n.t("track")}</Text>
          </TouchableOpacity>
        );
      } else {
          return (
            <TouchableOpacity onPress={this.dismissButton.bind(this)} style={styles.trackContainer}> 
              <ActivityIndicator
                size={'large'}
                color={colors.black}
              />
            <Text style={styles.trackSize}>{I18n.t("tracking")}</Text>
            </TouchableOpacity>
          );
        }
  }

  renderDismissSnooze() {
    if (this.props.isSnoozeActive === true) {
      return (
        <SandboxButton onPress={ () => this.dismissSnooze()}>
          <Text style={styles.activeButtonText}>{I18n.t("dismissSnooze")}</Text>
        </SandboxButton>
      );
    } else return (
        <SandboxButton onPress={() => null} disabled={true}>
          <Text style={styles.disabledButtonText}>{I18n.t("dismissSnooze")}</Text>
        </SandboxButton>
      );
  }

  renderAlarmButton() {
    if (this.props.isSnoozeActive === true || this.props.isNightTrackerActive === true) {
      return (
        <AlarmButton onPress={ () => null } disabled={true}>
          <Text style={styles.alarmSize}>{(this.state.selectedHours) + ":" + (this.state.selectedMinutes)}</Text>
        </AlarmButton>
      );
    } else return (
          <AlarmButton onPress={ () => this.showTimePopup() }>
            <Text style={styles.alarmSize}>{(this.state.selectedHours) + ":" + (this.state.selectedMinutes)}</Text>
          </AlarmButton>
        ); 
  }

  renderMenuIcon() {
    if (this.props.isSnoozeActive === true || this.props.isNightTrackerActive === true) {
      return (
        <TouchableOpacity onPress={ () => null } disabled={true}>
          <Image source={require('../assets/menu_button.png')} style={styles.image} resizeMode={"contain"}/>
        </TouchableOpacity>
      );
    } else return (
        <TouchableOpacity onPress={ () => this.showMenuPopup() }>
          <Image source={require('../assets/menu_button.png')} style={styles.image} resizeMode={"contain"}/>
        </TouchableOpacity>
      );
  }

  render() {
    if (this.props.connectionStatus === config.connectionStatus.DISCONNECTED) {
      this.show(); 
    }
    return (
      <View style={styles.container}>
        <View style={styles.rowHeader}>
          <Text style={styles.currentTitle}>{I18n.t("sleepTrackerTitle")}</Text>
          <View style={styles.menuContainer}>
            {this.renderLightBulb()}
            {this.renderMenuIcon()}           
          </View>  
        </View>
		
        <View style={styles.pageContainer}>
          <View style={styles.itemsContainer}>
            <View style={styles.materialCard}>
              {this.props.isNightTrackerActive
                ? <Text style={styles.infoText}>
                    {I18n.t("sleepWell")}
                  </Text>
                     
                : <Text style={styles.infoText}>
                    {I18n.t("setTime")}
                  </Text>}
            </View>
            <View style={styles.alarmContainer}>
              {this.props.isLessThanHour
                ? <Text style={styles.alarmSet}>{I18n.t("toShort")}</Text>
                     
                : <Text style={styles.alarmSet}>{I18n.t("wakeTime")}</Text>} 
              {this.renderAlarmButton()}
            </View>

            {this.renderTrackButton()}
          </View> 
          {this.renderDismissSnooze()}

          <View style={styles.electrodeContainer}>
            {this.renderNoiseIndicator()}
          </View> 
        </View>

        <PopupDialog
          ref={(popupDialog) => { this.popupDialog = popupDialog; }}
          height={350}
          dismissOnTouchOutside={false}
          containerStyle={{ elevation: 10 }}
        >
          <View>
              <View style={styles.nextAlarmStyle}>
                <Text style={styles.dialogText}>{this.refreshTime()}</Text>
              </View>
                <View style={styles.rowPicker}>
                  <WheelPicker
                     onItemSelected={ (event)=> this.setState({ index: event.position, selectedHours: event.data }) }
                     isCurved
                     isCyclic
                     renderIndicator
                     selectedItemPosition={this.state.selectedPickerHour}
                     indicatorColor={colors.black}
                     selectedItemTextColor={colors.black}
                     data={hoursData}
                     style={styles.wheelPicker}
                  />
                  <WheelPicker
                     onItemSelected={ (event)=> this.setState({ index: event.position, selectedMinutes: event.data }) }
                     isCurved
                     isCyclic
                     renderIndicator
                     selectedItemPosition={this.state.selectedPickerMinute}
                     indicatorColor={colors.black}
                     selectedItemTextColor={colors.black}
                     data={minutesData}
                     style={styles.wheelPicker}
                  />
                </View>
                <View style={styles.pickerButtonContainer}>
                  <PickerButton fontSize={25} onPress={this.storeTimeButton.bind(this)}>
                    OK
                  </PickerButton>
                </View>
          </View>
        </PopupDialog>

        <PopupDialog
          ref={(popupMenu) => { this.popupMenu = popupMenu; }}
          height={340}
          dismissOnTouchOutside={false}
          containerStyle={{ elevation: 10 }}
        >
          <View style={styles.dialogBackground}>
            <View style={styles.dialogInnerContainer}>
              <Text style={styles.dialogTitle}>{I18n.t("settings")}</Text>
              <View style={styles.rowHeader}>
                <Text style={styles.dialogText}>{I18n.t("vibration")}</Text>
                {this.renderVibrationButton()}
              </View>
              <Text style={styles.dialogText}>{I18n.t("setDuration")} {this.state.snoozeTime}{this.minutes()}</Text>
              <Slider
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={this.sliderValue()}
                onValueChange={value => this.setState({ snoozeTime: value }) }
              />
              <View style={styles.rowHeaderLow}>
                <Text style={styles.dialogText}>{I18n.t("lightTherapy")}</Text>
                {this.renderLightTherapyButton()}
              </View>
              <View style={styles.dialogButtonContainer}>
                <PickerButton fontSize={25} onPress={this.menuStoreButton.bind(this)}>
                  {I18n.t("closeMenu")}
                </PickerButton>
              </View>
            </View>
          </View>
        </PopupDialog>

        <PopupDialog
          ref={(popupDisconnected) => { this.popupDisconnected = popupDisconnected; }}
          height={230}
          dismissOnTouchOutside={false}
          containerStyle={{ elevation: 10 }}
        >
          <View style={styles.dialogBackground}>
            <View style={styles.dialogInnerContainer}>
              <Text style={styles.disconnectedTitle}>{I18n.t("disconnected")}</Text>
              <Text style={styles.dialogText}>{I18n.t("reconnect")}</Text>
              <View style={styles.dialogButtonContainer}>
                <PickerButton fontSize={25} onPress={this.pathOne.bind(this)}>
                  {I18n.t("close")}
                </PickerButton>
              </View>
            </View>
          </View>
        </PopupDialog>

      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(NightTracker);

const styles = MediaQueryStyleSheet.create(
  // Base styles
  {
    container: {
      backgroundColor: colors.white,
      flex: 1,
      justifyContent: "space-around",
      alignItems: "stretch"
    },

    menuContainer: {
      flexDirection: "row",
      marginRight: 10,
    },

    electrodeContainer: {
      alignSelf: "center"
    },

    currentTitle: {
      marginLeft: 10,
      marginBottom: 15,
      fontSize: 20,
      fontFamily: "Roboto-Medium",
      color: colors.lightGreen
    },

    alarmSet: {
      marginLeft: 10,
      marginTop: 3,
      fontSize: 15,
      fontFamily: "Roboto-Medium",
      color: colors.black
    },

    alarmSize: {
      marginLeft: 10,
      marginBottom: 10,
      fontSize: 40,
      fontFamily: "Roboto-Medium",
      color: colors.lightGreen
    },

    buttonContainer: {
      paddingTop: 10,
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between"
    },

    pageContainer: {
      flex: 4,
      marginTop: 5,
      paddingLeft: 15,
      paddingRight: 15,
      paddingBottom: 15,
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "space-between"
    },

    itemsContainer: {
      alignItems: "stretch",
    },  

    rowHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },

    rowHeaderLow: {
      marginTop: 8,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },

    rowContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },

  	alarmCard: {
  		alignSelf: 'stretch',
  		backgroundColor: colors.lightGreen
  	},
	
  	alarmContainer: {
      height: 85,
      marginTop: 5,
      paddingLeft: -5,
      paddingRight: -5,
      paddingBottom: -5,
      alignSelf: "stretch",
      flexDirection: "column",
      justifyContent: "space-between",
      backgroundColor: colors.lightGreen
  	},

    dialogText: {
      fontFamily: "OpenSans-Regular",
      textAlign: "left",
      fontSize: 15,
      margin: 15,
      color: colors.black
    },

    dialogTextButton: {
      fontFamily: "OpenSans-Regular",
      textAlign: "center",
      fontSize: 15,
      margin: 15,
      color: colors.black
    },

    dialogTextEnabled: {
      fontFamily: "OpenSans-Regular",
      textAlign: "center",
      fontSize: 15,
      margin: 15,
      color: colors.fern
    },

    dialogBackground: {
      flex: 1,
      justifyContent: "center",
      alignItems: "stretch",
      backgroundColor: colors.black
    },

    dialogTitle: {
      textAlign: "center",
      color: colors.black,
      fontFamily: "YanoneKaffeesatz-Regular",
      fontSize: 30
    },

    dialogInnerContainer: {
      flex: 1,
      alignItems: "stretch",
      backgroundColor: "white",
      padding: 20
    },

    dialogButtonContainer: {
      alignItems: "center",
      margin: 20,
      flex: 1,
      justifyContent: "center"
    },

    disconnectedTitle: {
      textAlign: "center",
      color: colors.black,
      fontFamily: "YanoneKaffeesatz-Regular",
      fontSize: 30
    },

    pickerButtonContainer: {
      paddingTop: 30,
      alignItems: "center",
      justifyContent: "center"
    },

    rowPicker: {
      paddingTop: 30,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center"
    },

    wheelPicker: {
      width: 100,
      height: 150
    },

    nextAlarmStyle: {
      alignSelf: 'stretch',
      alignItems: "center",
      backgroundColor: colors.lightGreen
    },

    trackContainer: {
      borderColor: colors.heather,
      borderRadius: 4,
      height: 65,
      marginLeft: 15,
      marginRight: 15,
      marginBottom: 15,
      marginTop: 15,
      alignSelf: "stretch",
      flexDirection: "row",
      justifyContent: "center",
      backgroundColor: colors.white,
      elevation: 3
    },

    trackSize: {
      justifyContent: "center",
      alignSelf: "center",
      fontSize: 40,
      fontFamily: "Roboto-Medium",
      color: colors.lightGreen
    },

    disabledTrackSize: {
      justifyContent: "center",
      alignSelf: "center",
      fontSize: 40,
      fontFamily: "Roboto-Medium",
      color: colors.lightGrey
    },

    lightButton: {
      borderColor: colors.heather,
      borderRadius: 4,
      height: 25,
      width: 120,
      justifyContent: "center",
      backgroundColor: colors.white,
      elevation: 3
    },

    activeButtonText: {
      fontFamily: "Roboto-Medium",
      textAlign: "center",
      fontSize: 15,
      margin: 15,
      color: colors.lightGreen
    },

    disabledButtonText: {
      fontFamily: "Roboto-Medium",
      textAlign: "center",
      fontSize: 15,
      margin: 15,
      color: colors.faintGrey
    },

    materialCard: {
      marginTop: 5,
      marginBottom: 8,
      padding: 16,
      borderRadius: 2,
      backgroundColor: colors.lightGreen,
      shadowOpacity: 0.1815,
      shadowRadius: 0.54,
      shadowOffset: {
        height: 0.6,
      },
      elevation: 1
    },

    infoText: {
      textAlign: "center",
      color: colors.black,
      fontFamily: "Roboto-Medium",
      fontSize: 15
    },

    image: {
      height: 25,
      width: 25,
    },
  },
  // Responsive styles
  {
    "@media (min-device-height: 700)": {
      currentTitle: {
        fontSize: 20
      },
    }
  }
);
