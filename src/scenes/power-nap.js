import React, { Component, PropTypes } from "react";
import moment from 'moment';
import { bindActionCreators } from "redux";
import {
  Text,
  Image,
  View,
  NativeModules,
  NativeEventEmitter,
  Switch,
  Slider, 
  AsyncStorage,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { connect } from "react-redux";
import { 
  setNapTrackerActive,
  setMenuInvisible, 
  setSnoozeActive,
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy,
  setVibration  
} from "../redux/actions";
import config from "../redux/config";
import SandboxButton from "../components/SandboxButton";
import NoiseIndicator from "../components/NoiseIndicator";
import I18n from "../i18n/i18n";
import * as colors from "../styles/colors";
import LinkButton from "../components/WhiteLinkButton";
import PickerButton from "../alarmclock/PickerButton";
import {
  dismissAlarm,
  translation,
  stringToBoolean,
  SECOND,
  MINUTE,
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";
import Classifier from "../native/Classifier.js";
import { MediaQueryStyleSheet } from "react-native-responsive";
import BluetoothSerial from "react-native-bluetooth-serial";
import PopupDialog from 'react-native-popup-dialog';
import BackgroundTimer from "react-native-background-timer";
import AndroidAlarms from 'react-native-android-alarms';

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    notchFrequency: state.notchFrequency,
    noise: state.noise,
    isNapTrackerActive: state.isNapTrackerActive,
    isSnoozeActive: state.isSnoozeActive,
    isLTConnected: state.isLTConnected,
    vibrationActive: state.vibrationActive
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setNapTrackerActive,
      setMenuInvisible, 
      setSnoozeActive,
      setNightTracker, 
      setPowerNap, 
      setOfflineLightTherapy,
      setVibration  
    },
    dispatch
  );
}

class PowerNap extends Component {
  constructor(props) {
    super(props);
    this.predictSubscription = {};
    this.trackerScore = {};
    this.lightValue = {};

    // Initialize States
    this.state = {
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
    this.loadSnoozeTime();
    this.loadVibration();
    this.setSnoozeAlarm();
    this.props.setNightTracker(this.props.nightTracker = false);
    this.props.setPowerNap(this.props.powerNap = false);
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);  
  }

  componentWillUnmount() {
    Classifier.stopNoiseListener();
    this.willUnmountFunction();
    this.props.setPowerNap(this.props.powerNap = true);
  }

  //AsyncStorage & Snooze
  snoozeTimeObj() {
    return (this.state.snoozeTime * 1);
  };

  menuStoreButton() {
    this.storeFunction();
    this.popupMenu.dismiss();
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);    
  }

  storeFunction() {
    AsyncStorage.setItem('snoozeTimeObj', JSON.stringify(Number(this.state.snoozeTime)));
    if (this.props.vibrationActive === true) {
      AsyncStorage.setItem('vibrationObj', JSON.stringify(true));
    } else {
      AsyncStorage.setItem('vibrationObj', JSON.stringify(false));
    }
  }

  loadVibration() {
    AsyncStorage.getItem('vibrationObj').then((value) => {
      this.props.setVibration(this.props.vibrationActive = stringToBoolean(value));
    });
  }

  loadSnoozeTime() {
    AsyncStorage.getItem('snoozeTimeObj', (err, result) => {
        if (result !== null) {
          this.setState({ snoozeTime: result * 1 });
        }
    });
  }

  sliderValue() {
    return (this.state.snoozeTime * 1)
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

  setSnoozeAlarm() {
    var timestamp = moment();
    var setTimestamp = timestamp * 1;
    if (this.props.isSnoozeActive === true) {
      AsyncStorage.getItem('snoozeTimeObj', (err, result) => {
          if (result !== null) {
            var time = JSON.parse(result) * MINUTE;
            alarmID = setTimestamp;
            var alarmTime = setTimestamp + time;
            AndroidAlarms.setAlarm(alarmID, alarmTime.valueOf(), false);           
            AsyncStorage.setItem('alarmID', JSON.stringify(alarmID));
            this.setActive();
          } else if (result === null) {
              var time = this.state.snoozeTime * MINUTE;
              alarmID = setTimestamp;
              var alarmTime = setTimestamp + time;
              AndroidAlarms.setAlarm(alarmID, alarmTime.valueOf(), false);
              AsyncStorage.setItem('alarmID', JSON.stringify(alarmID));
              this.setActive();
          }
      });
    }
  }

  dismissSnooze() {
    this.props.setSnoozeActive(this.props.isSnoozeActive = false);
    this.dismissButton();
  }

  vibrationOn() {
    this.props.setVibration(this.props.vibrationActive = true);
  }

  vibrationOff() {
    this.props.setVibration(this.props.vibrationActive = false);
  }

  showMenuPopup() {
    this.popupMenu.show();
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
  }

  //Tracker
  setTracker() {
    this.startTrackerA();
    this.startTrackerB(); 
    console.log("Nap tracker started"); 
  }

  startTrackerA() {
    Classifier.startTracking(); 
    this.setScore();
    this.setState({ evaluation1Active: true });
    this.props.setNapTrackerActive(this.props.isNapTrackerActive = true);
    AsyncStorage.setItem('NapTrackerActive', JSON.stringify(true));
  }

  startTrackerB() {
    const timerTrackId = BackgroundTimer.setInterval(() => {
      this.start1Evaluation();
      console.log("Nap evaluation 1 started");
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
          console.log("Nap evaluation 2 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        return null;
      }
  }

  start2Evaluation() {
    if (this.state.evaluation2Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation2Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation3Active: true });
          this.start3Evaluation();
          console.log("Nap evaluation 3 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation2Active: false });
        this.startTrackerB();
        console.log("Nap tracker repeated after 2"); 
      }
  }

  start3Evaluation() {
    if (this.state.evaluation3Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation3Active: false });
        BackgroundTimer.setTimeout(() => {         
          this.setState({ evaluation4Active: true });
          this.start4Evaluation();
          console.log("Nap evaluation 4 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation3Active: false });
        this.startTrackerB();
        console.log("Nap tracker repeated after 3"); 
      }
  }

  start4Evaluation() {
    if (this.state.evaluation4Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation4Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation5Active: true });
          this.start5Evaluation();
          console.log("Nap evaluation 5 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation4Active: false });
        this.startTrackerB();
        console.log("Nap tracker repeated after 4"); 
      }
  }

  start5Evaluation() {
    if (this.state.evaluation5Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation5Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation6Active: true });
          this.start6Evaluation();
          console.log("Nap evaluation 6 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation5Active: false });
        this.startTrackerB();
        console.log("Nap tracker repeated after 5"); 
      }
  }

  start6Evaluation() {
    if (this.state.evaluation6Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation6Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation7Active: true });
          this.start7Evaluation();
          console.log("Nap evaluation 7 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation6Active: false });
        this.startTrackerB();
        console.log("Nap tracker repeated after 6"); 
      }
  }

  start7Evaluation() {
    if (this.state.evaluation7Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation7Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation8Active: true });
          this.start8Evaluation();
          console.log("Nap evaluation 8 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation7Active: false });
        this.startTrackerB();
        console.log("Nap tracker repeated after 7"); 
      }
  }

  start8Evaluation() {
    if (this.state.evaluation8Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation8Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation9Active: true });
          this.start9Evaluation();
          console.log("Nap evaluation 9 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation8Active: false });
        this.startTrackerB();
        console.log("Nap tracker repeated after 8"); 
      }
  }

  start9Evaluation() {
    if (this.state.evaluation9Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation9Active: false });
        BackgroundTimer.setTimeout(() => {
          this.setState({ evaluation10Active: true });
          this.start10Evaluation();
          console.log("Nap evaluation 10 started");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation9Active: false });
        this.startTrackerB();
        console.log("Nap tracker repeated after 9"); 
      }
  }

  start10Evaluation() {
    if (this.state.evaluation10Active === true)
      if (this.trackerScore >= 410) {
        this.setState({ evaluation10Active: false });
        BackgroundTimer.setTimeout(() => {
          Classifier.stopTracking(); 
          this.setAlarm();
          console.log("Nap alarm set");
        }, 1000);
      } else if (this.trackerScore < 410) {
        this.setState({ evaluation10Active: false });
        this.startTrackerB();
        console.log("Nap tracker repeated after 10"); 
      }
  }

  setAlarm() {
    this.setState({ isAlarmSet: true });
    timestamp = moment();
    setTimestamp = timestamp * 1;
    time = 10 * MINUTE;
    
    alarmID = setTimestamp;
    alarmTime = setTimestamp + time;
    AndroidAlarms.setAlarm(alarmID, alarmTime.valueOf(), false);
    AsyncStorage.setItem('alarmID', JSON.stringify(alarmID));
    
    if (this.props.isLTConnected === true) {
      const alarmLightId = BackgroundTimer.setTimeout(() => {
        this.increaseLight();
        console.log("Nap light activated");
      }, (time - (5 * MINUTE)));
      this.setState({ alarmLightId: alarmLightId });        
    }
    AsyncStorage.setItem('PowerNap', JSON.stringify(true));
  }

  dismissButton() {   
    if (this.state.isAlarmSet === true) {
      AndroidAlarms.clearAlarm(alarmID); 
      this.setState({ isAlarmSet: false });
    }
    this.props.setNapTrackerActive(this.props.isNapTrackerActive = false);
    AsyncStorage.setItem('NapTrackerActive', JSON.stringify(false));   
    AsyncStorage.setItem('PowerNap', JSON.stringify(false)); 
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
    AsyncStorage.setItem('NapTrackerActive', JSON.stringify(true));
    AsyncStorage.setItem('PowerNap', JSON.stringify(true));
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
    }, 1100);
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

  renderTrackButton() {
    if (this.props.isSnoozeActive === true) {
      return (
        <TouchableOpacity onPress={() => null} disabled={true} style={styles.trackContainer}>
          <Text style={styles.disabledTrackSize}>{I18n.t("track")}</Text>
        </TouchableOpacity>
      );
    } else if (this.props.isNapTrackerActive === false) {
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

  renderMenuIcon() {
    if (this.props.isSnoozeActive === true || this.props.isNapTrackerActive === true) {
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
          <Text style={styles.currentTitle}>{I18n.t("napTitle")}</Text>
          <View style={styles.menuContainer}>
            {this.renderLightBulb()}
            {this.renderMenuIcon()}      
          </View>  
        </View>
		
        <View style={styles.pageContainer}>
          <View style={styles.itemsContainer}>
            <View style={styles.materialCard}>
              {this.props.isNapTrackerActive
                ? <Text style={styles.infoText}>
                    {I18n.t("sleepWell")}
                  </Text>
                     
                : <Text style={styles.infoText}>
                    {I18n.t("pressTrack")}
                  </Text>}
            </View>
            {this.renderTrackButton()}
          </View>
          {this.renderDismissSnooze()}
          <View style={styles.electrodeContainer}>
            {this.renderNoiseIndicator()}
          </View>
        </View>

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

export default connect(mapStateToProps, mapDispatchToProps)(PowerNap);

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

    materialCard: {
      marginTop: 5,
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
