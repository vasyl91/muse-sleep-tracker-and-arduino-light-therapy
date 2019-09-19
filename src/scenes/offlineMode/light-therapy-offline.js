import React, { Component, PropTypes } from "react";
import moment from 'moment';
import { bindActionCreators } from "redux";
import {
  Text,
  Image,
  View,
  Slider, 
  AsyncStorage,
  TouchableOpacity,
  Alert
} from "react-native";
import { connect } from "react-redux";
import { 
  setAlarmActive, 
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy,
  setMenuInvisible, 
  setSnoozeActive, 
  setVibration
} from "../../redux/actions";
import config from "../../redux/config";
import I18n from "../../i18n/i18n";
import SandboxButton from "../../components/SandboxButton";
import * as colors from "../../styles/colors";
import AlarmButton from "../../alarmclock/AlarmButton";
import PickerButton from "../../alarmclock/PickerButton";
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
} from "../../alarmclock/AlarmManager";
import { MediaQueryStyleSheet } from "react-native-responsive";
import BluetoothSerial from "react-native-bluetooth-serial";
import PopupDialog from 'react-native-popup-dialog';
import BackgroundTimer from "react-native-background-timer";
import { WheelPicker } from 'react-native-wheel-picker-android';
import AndroidAlarms from 'react-native-android-alarms';

function mapStateToProps(state) {
  return {
    isAlarmActive: state.isAlarmActive,
    isSnoozeActive: state.isSnoozeActive,
    isLTConnected: state.isLTConnected,
    vibrationActive: state.vibrationActive,
    refresh: state.refresh
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setAlarmActive,
      setNightTracker, 
      setPowerNap, 
      setOfflineLightTherapy,
      setMenuInvisible,
      setSnoozeActive,      
      setVibration
    },
    dispatch
  );
}

function parseMillisecondsIntoReadableTime(milliseconds){ // translationHours and translationMinutes are necessary for polish translations
  var hours = milliseconds / HOUR;
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
    if(absoluteMinutes < 1) {
      return I18n.t("belowMinute");
    } else if(absoluteMinutes >= 1) {
        return I18n.t("alarmIn") + absoluteMinutes + mTxt;
      } 
  } else {
      return I18n.t("alarmIn") + absoluteHours + hTxt + I18n.t("and") + absoluteMinutes + mTxt;
  }
}

class OfflineLightTherapy extends Component {
  constructor(props) {
    super(props);
    this.lightValue = {};

    this.state = {
      selectedHours: "09",
      selectedMinutes: "00",
      selectedPickerHour: 9,
      selectedPickerMinute: 0,
      snoozeTime: 10,
    };
  }

  componentDidMount() {
    this.loadAlarm(); 
    this.setSnoozeAlarm();
    this.props.setNightTracker(this.props.nightTracker = false);
    this.props.setPowerNap(this.props.powerNap = false);
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);
    
    const refreshId = BackgroundTimer.setInterval(() => {
      this.refreshTime();
    }, 1000); 
    this.setState({ refreshId: refreshId });  
  }

  componentWillUnmount() {
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = true);
    this.willUnmountFunction(); 

    const refreshId = this.state.refreshId;
    const clearRefreshId = BackgroundTimer.clearTimeout(refreshId);
    this.setState(clearRefreshId);
  }

  isBluetoothEnabled = async () => {
    try {
      const bluetoothState = await BluetoothSerial.isEnabled()
      if (!bluetoothState) {
        Alert.alert(
          I18n.t("btDisabled"),
          I18n.t("btQuestion"),
          [
            {
              text: I18n.t("no"),
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {
              text: I18n.t("yes"),
              onPress: () => this.enableBluetoothAndRefresh(),
            },
          ],
          { cancelable: false },
        )
      }
    } catch (e) {
      console.log(e)
    }
  }

  enableBluetoothAndRefresh = async () => {
    try {
      await BluetoothSerial.enable()
    } catch (e) {
      console.log(e)
    }
  }

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
    this.isBluetoothEnabled();
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
    this.props.history.push("/lightTherapy");
  }

  //AsyncStorage & Snooze
  storeTimeButton() {
    this.storeAlarm();
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
    var absoluteMinutes = this.state.snoozeTime;
    var translationMinutes = translation(absoluteMinutes);

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

  refreshTimeActivated() {
    if (this.props.isAlarmActive === false || this.props.isSnoozeActive === true) {
      return null;
    } else {
        if (this.props.refresh === true) {
          return this.readableTime();
        } else {
            return this.readableTime();
          }
    }
  }

  setAlarm() {
    time = this.getTime();    
    alarmTime = Number(moment()) + time;

    AndroidAlarms.setAlarm(alarmTime, alarmTime.valueOf(), false);
    AsyncStorage.setItem('alarmID', JSON.stringify(alarmTime));
    
    if (this.props.isLTConnected === true) { // increases light value every 2,3s for 15 minutes (only if Arduino module is connected)
      if (time > (15 * MINUTE)) {
        const alarmLightId = BackgroundTimer.setTimeout(() => {
          this.increaseLight();
        }, (time - (15 * MINUTE)));
        this.setState({ alarmLightId: alarmLightId });        
      }
    }
    this.setActive();
  }

  dismissButton() {
    this.props.setAlarmActive(this.props.isAlarmActive = false);  
    AsyncStorage.setItem('AlarmActive', JSON.stringify(false));
    AsyncStorage.setItem('OfflineLightTherapy', JSON.stringify(false)); 
    this.willUnmountFunction();
    dismissAlarm();
  }

  willUnmountFunction() {
    const lightId = this.state.lightId;
    const clearIntervalId = BackgroundTimer.clearInterval(lightId); 
    this.setState(clearIntervalId);
    
    const alarmLightId = this.state.alarmLightId;
    const clearAlarmLightId = BackgroundTimer.clearInterval(alarmLightId); 
    this.setState(clearAlarmLightId);
    
    this.lightValue = 0;
    this.setValue();     
  }

  setActive() {
    this.props.setAlarmActive(this.props.isAlarmActive = true);
    AsyncStorage.setItem('AlarmActive', JSON.stringify(true));
    AsyncStorage.setItem('OfflineLightTherapy', JSON.stringify(true));
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

  renderLightBulb() { // if Arduino module is connected, green light bulb icon will appear near the menu button
    if (this.props.isLTConnected === true) {
      return (
        <Image source={require('../../assets/light_bulb.png')} style={styles.image} resizeMode="contain"/>
      );
    } else {
      return null;
    }  
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

  renderSetButton() {
    if (this.props.isSnoozeActive === true) {
      return (
        <TouchableOpacity onPress={() => null} disabled={true} style={styles.trackContainer}>
          <Text style={styles.disabledTrackSize}>{I18n.t("setButton")}</Text>
        </TouchableOpacity>
      );
    } else {
      if (this.props.isAlarmActive === false) {
        return (
          <TouchableOpacity onPress={this.setAlarm.bind(this)} style={styles.trackContainer}>
            <Text style={styles.trackSize}>{I18n.t("setButton")}</Text>
          </TouchableOpacity>
        );
      } else return (
          <TouchableOpacity onPress={this.dismissButton.bind(this)} style={styles.trackContainer}> 
            <Text style={styles.trackSize}>{I18n.t("dismiss")}</Text>
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
    if (this.props.isSnoozeActive === true || this.props.isAlarmActive === true) {
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

  renderCard() {
    if (this.props.isLTConnected === true) {
      if (this.props.isAlarmActive === false) {
        return (
          <View style={styles.materialCard}>
            <Text style={styles.infoText}>{I18n.t("setAlarm")}</Text>
          </View>
        );
      } else return (
            <View style={styles.materialCard}>
              <Text style={styles.infoText}>{I18n.t("sleepWell")}</Text>
            </View>
          ); 
    } else {
        if (this.props.isAlarmActive === false) {
          return (
            <View style={styles.materialCard}>
              <Text style={styles.infoText}>{I18n.t("connectArduino")}</Text>
            </View>
          );
        } else return (
            <View style={styles.materialCard}>
              <Text style={styles.infoText}>{I18n.t("sleepWell")}</Text>
            </View>
          ); 
      }
  }

  renderMenuIcon() {
    if (this.props.isSnoozeActive === true || this.props.isAlarmActive === true) {
      return (
        <TouchableOpacity onPress={ () => null } disabled={true}>
          <Image source={require('../../assets/menu_button.png')} style={styles.image} resizeMode={"contain"}/>
        </TouchableOpacity>
      );
    } else return (
        <TouchableOpacity onPress={ () => this.showMenuPopup() }>
          <Image source={require('../../assets/menu_button.png')} style={styles.image} resizeMode={"contain"}/>
        </TouchableOpacity>
      );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.rowHeader}>
          <Text style={styles.currentTitle}>{I18n.t("alarmClock")}</Text>
          <View style={styles.menuContainer}>
            {this.renderLightBulb()}
            {this.renderMenuIcon()}     
          </View>  
        </View>
    
        <View style={styles.pageContainer}>
          <View style={styles.itemsContainer}>
            {this.renderCard()}
            <View style={styles.alarmContainer}> 
              <Text style={styles.alarmSet}>{this.refreshTimeActivated()}</Text>
              {this.renderAlarmButton()}
            </View>

            {this.renderSetButton()}
          </View> 
          {this.renderDismissSnooze()}
          <View>
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
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(OfflineLightTherapy);

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