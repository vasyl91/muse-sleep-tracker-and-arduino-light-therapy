import React, { Component, PropTypes } from "react";
import moment from 'moment';
import { bindActionCreators } from "redux";
import {
  Text,
  Image,
  View,
  NativeModules,
  NativeEventEmitter,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import Modal from "react-native-modal";
import AsyncStorage from '@react-native-community/async-storage';
import Slider from '@react-native-community/slider';
import { connect } from "react-redux";
import { 
  setNightTrackerActive, 
  setMenuInvisible, 
  setSnoozeActive,
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy,
  setVibration,
  setLess 
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
import BackgroundTimer from "react-native-background-timer";
import { TimePicker } from 'react-native-wheel-picker-android'
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
    isLess: state.isLess,
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
      setLess
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
    this.evaluationCounter = {};
    this.threshold = 410;
    this.lightValue = {};
    this.selectedHours = 9;
    this.selectedMinutes = 0;
    this.displayMinutes = (this.selectedMinutes < 10 ? "0" + this.selectedMinutes : this.selectedMinutes);
    this.displayHours = (this.selectedHours < 10 ? "0" + this.selectedHours : this.selectedHours);

    this.state = {
      snoozeTime: 10,
      lightTime: 15,
      popupMenu: false,
      popupPicker: false,
      lightIntensity: 100,
      isAlarmSet: false,
    };
  }

  componentDidMount() {
    Classifier.startClassifier(this.props.notchFrequency);
    Classifier.startNoiseListener();  
    this.loadAsyncStorage(); 
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

  // AsyncStorage & Snooze
  storeTimeButton() {
    this.storeAlarm();
    this.checkTime();
    this.setState({ popupPicker: false });
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);
  }

  menuStoreButton() {
    this.storeFunction();
    this.setState({ popupMenu: false });
    this.props.setMenuInvisible(this.props.isMenuInvisible = false); 
  }

  showTimePopup() {
    this.setState({ popupPicker: true });
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
  }

  showMenuPopup() {
    this.setState({ popupMenu: true });
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
  }

  vibrationOn() {
    this.props.setVibration(this.props.vibrationActive = true);
  }

  vibrationOff() {
    this.props.setVibration(this.props.vibrationActive = false);
  }

  storeFunction() {
    if (this.props.vibrationActive === true) {
      AsyncStorage.setItem('vibrationObj', JSON.stringify(true));
    } else {
      AsyncStorage.setItem('vibrationObj', JSON.stringify(false));
    }
    AsyncStorage.setItem('snoozeTimeObj', JSON.stringify(Number(this.state.snoozeTime)));
    AsyncStorage.setItem('lightTimeNightObj', JSON.stringify(Number(this.state.lightTime)));
  }

  storeAlarm() {
    AsyncStorage.setItem('hoursObj', JSON.stringify(Number(this.selectedHours)));
    AsyncStorage.setItem('minutesObj', JSON.stringify(Number(this.selectedMinutes)));
  }

  loadAsyncStorage() {
    AsyncStorage.getItem('hoursObj').then((result) => {
        if (result !== null) {
          this.selectedHours = Number(result);
          this.displayHours = (result < 10 ? "0" + result : result);
        }
    });
    AsyncStorage.getItem('minutesObj').then((result) => {
        if (result !== null) {
          this.selectedMinutes = Number(result);
          this.displayMinutes = (result < 10 ? "0" + result : result);
        }
    });
    AsyncStorage.getItem('snoozeTimeObj').then((result) => {
        if (result !== null) {
          this.setState({ snoozeTime: Number(result) });
        }
    });
    AsyncStorage.getItem('lightIntensityObj').then((result) => {
        if (result !== null) {
          this.setState({ lightIntensity: Number(result) });
        }
    });
    AsyncStorage.getItem('lightTimeNightObj').then((result) => {
        if (result !== null) {
          this.setState({ lightTime: Number(result) });
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

  sliderValue(state) {
    return Number(state);
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

  // Alarm
  getTime() {
    var selectedTimeInMS, currentTimeInMS, mathAlarm;
    selectedTimeInMS = ((this.selectedHours * HOUR) + (this.selectedMinutes * MINUTE));
    currentTimeInMS =  currentTime();

    if(selectedTimeInMS > currentTimeInMS) {
      mathAlarm = selectedTimeInMS - currentTimeInMS;
    } else {
      mathAlarm = ((DAY - currentTimeInMS) + selectedTimeInMS);
    };

    return mathAlarm; // returns 'remaining time to an alarm' in MS
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
      this.props.setLess(this.props.isLess = true);
    } else {
        this.props.setLess(this.props.isLess = false); 
    }
  }

  initialTime() {
    return ((this.selectedHours * HOUR) + (this.selectedMinutes * MINUTE) - HOUR);
  }

  onTimeSelected = date => {
    this.selectedHours = date.getHours();
    this.selectedMinutes = date.getMinutes();
    this.displayMinutes = (this.selectedMinutes < 10 ? "0" + this.selectedMinutes : this.selectedMinutes);
    this.displayHours = (this.selectedHours < 10 ? "0" + this.selectedHours : this.selectedHours);
    this.initialTime();
  }

  // Tracker
  // Checks if wave score is above desired threshold.
  // If it is for consecutive 10 seconds - an alarm is being triggered.
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
  }

  startTrackerB() {
    const timerTrackId = BackgroundTimer.setInterval(() => {
      this.startFirstEvaluation();
    }, 1000);
    this.setState({ timerTrackId: timerTrackId });   
  }

  startFirstEvaluation() {
    this.evaluationCounter = 1;
    console.log("Night evaluation " + this.evaluationCounter + " started");
    if (this.trackerScore >= this.threshold) {
      this.dismissTrackerB();
      BackgroundTimer.setTimeout(() => {
        this.startEvaluation();
        console.log("Night evaluation " + this.evaluationCounter + " passed");
      }, 1000);
    } else if (this.trackerScore < this.threshold) {
      return null;
    }
  }

  startEvaluation() {
    this.evaluationCounter = this.evaluationCounter + 1;
    console.log("Night evaluation" + this.evaluationCounter + "started");
    if (this.evaluationCounter <= 9) {
      if (this.trackerScore >= this.threshold) {
        BackgroundTimer.setTimeout(() => {
          this.startEvaluation();
          console.log("Night evaluation" + this.evaluationCounter + "passed");
        }, 1000);
      } else if (this.trackerScore < this.threshold) {
        this.startTrackerB();
        console.log("Night tracker repeated after evaluation" + this.evaluationCounter); 
      }
    } else if (this.evaluationCounter > 9) {
        this.startLastEvaluation();
    }
  }

  startLastEvaluation() {
    this.evaluationCounter = 0;
    if (this.trackerScore >= this.threshold) {
      BackgroundTimer.setTimeout(() => {
        Classifier.stopTracking(); 
        this.setAlarm();
        console.log("Night alarm set");
      }, 1000);
    } else if (this.trackerScore < this.threshold) {
      this.startTrackerB();
      console.log("Night tracker repeated after evaluation" + this.evaluationCounter); 
    }
  }

  setAlarm() {
    this.setState({ isAlarmSet: true });

    time = (15 * MINUTE) + 1000;
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
    this.dismissTrackerB();      
  }

  willUnmountFunction() {   
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
    this.setValue(0);   
  }

  setActive() {
    this.props.setAlarmActive(this.props.isAlarmActive = true);
    AsyncStorage.setItem('NightTrackerActive', JSON.stringify(true));
    AsyncStorage.setItem('NightTracker', JSON.stringify(true));
  }

  dismissTrackerB() {
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

  // Light Therapy
  increaseLight() {
    this.lightValue = 0;
    var val = (255 * this.state.lightIntensity) / 100;
    var interval = (this.state.lightTime * MINUTE) / val;
    const lightId = BackgroundTimer.setInterval(() => {
      if (this.lightValue < val.toFixed()) {
        this.lightValue = this.lightValue + 1;
        this.setValue(this.lightValue);
      } 
    }, interval);
    this.setState({ lightId: lightId });   
  }

  async setValue(val) {
    try {
      value = "b " + val + "\n";
      await BluetoothSerial.write(value);
    } catch (e) {
      console.log(e);
    }
  }

  pathLight() {
    this.storeFunction();
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
    this.props.history.push("/btModule");
  }

  // Popup disconnected
  pathOne() {
    this.dismissButton();
    this.props.history.push("/connectorOne");
  }

  // Render
  modalMenuStyle = function(options) {
    if (this.props.isLTConnected === true) {
        return {justifyContent: "center", height: 450}
    } else {
        return {justifyContent: "center", height: 350}
    }
  }

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

  renderSliderLight() {
    if (this.props.isLTConnected === true) {
      return (
        <View>
          <Text style={styles.dialogText}>{I18n.t("illuminationTime")} {this.state.lightTime}{this.minutes(this.state.lightTime)}</Text>
          <Slider
            minimumValue={1}
            maximumValue={15}
            step={1}
            value={this.sliderValue(this.state.lightTime)}
            onValueChange={value => this.setState({ lightTime: value }) }
            style={{ paddingBottom: 15 }}
          />
        </View>
      );
    } else return (null);
  }

  renderTrackButton() {
    if (this.props.isLess === true || this.props.isSnoozeActive === true) {
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
          <Text style={styles.alarmSize}>{(this.displayHours) + ":" + (this.displayMinutes)}</Text>
        </AlarmButton>
      );
    } else return (
          <AlarmButton onPress={ () => this.showTimePopup() }>
            <Text style={styles.alarmSize}>{(this.displayHours) + ":" + (this.displayMinutes)}</Text>
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
              {this.props.isLess
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

        <Modal
          isVisible={this.state.popupPicker}
          onBackdropPress={() => {null}}
          style={{ elevation: 10 }}
        >
          <View style={styles.dialogBackground}>
            <View style={styles.dialogContainer}>
              <View style={styles.nextAlarmStyle}>
                <Text style={styles.dialogText}>{this.refreshTime()}</Text>
              </View>
                <View style={styles.rowPicker}>
                  <TimePicker 
                    onTimeSelected={this.onTimeSelected}
                    hours={hoursData}
                    minutes={minutesData}
                    format24={true}
                    initDate={this.initialTime()}
                  />
                </View>
                <View style={styles.pickerButtonContainer}>
                  <PickerButton fontSize={25} onPress={this.storeTimeButton.bind(this)}>
                    OK
                  </PickerButton>
                </View>
            </View>
          </View>
        </Modal>

        <Modal
          isVisible={this.state.popupMenu}
          onBackdropPress={() => {null}}
          style={{ elevation: 10 }}
        >
          <View style={this.modalMenuStyle()}>
            <View style={styles.dialogContainer}>
              <Text style={styles.dialogTitle}>{I18n.t("settings")}</Text>
              <View style={styles.rowHeader}>
                <Text style={styles.dialogText}>{I18n.t("vibration")}</Text>
                {this.renderVibrationButton()}
              </View>
              <Text style={styles.dialogText}>{I18n.t("setDuration")} {this.state.snoozeTime}{this.minutes(this.state.snoozeTime)}</Text>
              <Slider
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={this.sliderValue(this.state.snoozeTime)}
                onValueChange={value => this.setState({ snoozeTime: value }) }
              />
              <View style={styles.rowHeaderLow}>
                <Text style={styles.dialogText}>{I18n.t("lightTherapy")}</Text>
                {this.renderLightTherapyButton()}
              </View>
              {this.renderSliderLight()}
              <View style={styles.dialogButtonContainer}>
                <PickerButton fontSize={25} onPress={this.menuStoreButton.bind(this)}>
                  {I18n.t("closeMenu")}
                </PickerButton>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          isVisible={this.props.connectionStatus === config.connectionStatus.DISCONNECTED}
          onBackdropPress={() => {null}}
          style={{ elevation: 10 }}
        >
          <View style={styles.dialogDisconnected}>
            <View style={styles.dialogContainer}>
              <Text style={styles.disconnectedTitle}>{I18n.t("disconnected")}</Text>
              <Text style={styles.dialogText}>{I18n.t("reconnect")}</Text>
              <View style={styles.dialogButtonContainer}>
                <PickerButton onPress={this.pathOne.bind(this)}>
                  <Text style={styles.buttonText}>{I18n.t("close")}</Text>
                </PickerButton>
              </View>
            </View>
          </View>
        </Modal>

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

    dialogTitle: {
      textAlign: "center",
      color: colors.black,
      fontFamily: "YanoneKaffeesatz-Regular",
      fontSize: 30
    },

    dialogBackground: {
      justifyContent: "center",
      height: 350
    },

    dialogDisconnected: {
      justifyContent: "center",
      height: 200
    },

    dialogContainer: {
      flex: 1,
      alignItems: "stretch",
      backgroundColor: "white",
      flexDirection: 'column',
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
