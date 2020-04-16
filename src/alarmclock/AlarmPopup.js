import React, { Component } from "react";
import moment from 'moment';
import { bindActionCreators } from "redux";
import { 
  Text, 
  View, 
  Vibration,
  Dimensions 
} from "react-native";
import AsyncStorage from '@react-native-community/async-storage';
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { 
  setNightTrackerActive, 
  setNapTrackerActive,
  setAlarmActive, 
  setSnoozeActive,
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy
} from "../redux/actions";
import I18n from "../i18n/i18n";
import * as colors from "../styles/colors";
import PickerButton from "../alarmclock/PickerButton";
import SnoozeButton from "../alarmclock/SnoozeButton";
import { 
  activateAlarm, 
  dismissAlarm, 
  minimizeApplication,
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";
import { MediaQueryStyleSheet } from "react-native-responsive";
import BluetoothSerial from "react-native-bluetooth-serial";
import KeepAwake from 'react-native-keep-awake';

function mapStateToProps(state) {
  return {
    powerNap: state.powerNap,
    nightTracker: state.nightTracker,
    offlineLightTherapy: state.offlineLightTherapy,
    alarmOn: state.alarmOn,
    isLTConnected: state.isLTConnected,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setNightTrackerActive, 
      setNapTrackerActive,
      setAlarmActive, 
      setSnoozeActive,
      setNightTracker, 
      setPowerNap, 
      setOfflineLightTherapy
    },
    dispatch
  );
}

class AlarmPopup extends Component {
  constructor(props) {
    super(props);
    this.isAlarmOn = {};
  }

  componentDidMount() {
    this.isAlarmOn = false;
  }

  async setValue(val) {
    if (this.props.isLTConnected === true) {
      try {
        value = "b " + val + "\n";
        await BluetoothSerial.write(value)
      } catch (e) {
        console.log(e)
      }
    }
  }

  snoozeButton() {
    this.props.setSnoozeActive(this.props.isSnoozeActive = true);
    AsyncStorage.setItem('SnoozeActive', JSON.stringify(true));
    this.dismiss();
  }

  dismissButton() {
    this.props.setSnoozeActive(this.props.isSnoozeActive = false);
    AsyncStorage.setItem('SnoozeActive', JSON.stringify(false));
    this.dismiss();
  }

  dismiss() {
    dismissAlarm(); 
    AsyncStorage.setItem('alarmID', JSON.stringify(null));
    if (this.props.NightTracker === true) {
      this.props.setNightTrackerActive(this.props.isNightTrackerActive = false);
      AsyncStorage.setItem('NightTrackerActive', JSON.stringify(false));
      this.pathNight();     
    } else if (this.props.powerNap === true) {
        this.props.setNapTrackerActive(this.props.isNapTrackerActive = false);
        AsyncStorage.setItem('NapTrackerActive', JSON.stringify(false));
        this.pathNap();       
    } else if (this.props.offlineLightTherapy === true) {
        this.props.setAlarmActive(this.props.isAlarmActive = false);
        AsyncStorage.setItem('AlarmActive', JSON.stringify(false));
        this.pathOfflineLightTherapy();       
    }
    KeepAwake.deactivate(); 
    this.setValue(0);
    minimizeApplication();
  }

  pathNight() {
    this.props.setNightTracker(this.props.nightTracker = false);
    AsyncStorage.setItem('NightTracker', JSON.stringify(false));
    this.props.history.push("/nightTracker");
  }

  pathNap() {
    this.props.setPowerNap(this.props.powerNap = false);
    AsyncStorage.setItem('PowerNap', JSON.stringify(false));
    this.props.history.push("/powerNap");
  }

  pathOfflineLightTherapy() {
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);
    AsyncStorage.setItem('OfflineLightTherapy', JSON.stringify(false));
    this.props.history.push("/offline/lightTherapyOffline");
  }

  renderPopup() {
    if (this.props.alarmOn === true) {
      if (this.isAlarmOn === false) { // this prevents from runing twice
        this.isAlarmOn = true;
        activateAlarm();
        KeepAwake.activate();        
        this.setValue(255);
      }
      return (
        <View style={styles.container}>
            <View style={styles.alarmButtonContainer}>
              <View style={styles.snoozeButtonContainer}>
                <SnoozeButton onPress={this.snoozeButton.bind(this)}>
                  <Text style={styles.snoozeTxt}>{I18n.t("snooze")}</Text>
                </SnoozeButton>
              </View>  
              <PickerButton onPress={this.dismissButton.bind(this)}>
                <Text style={styles.dismissTxt}>{I18n.t("dismiss")}</Text>
              </PickerButton>            
            </View> 
        </View>
      )
    } else {
      return (
        <View>
        </View>
      ); 
    }
  }

  render() {
    return (
      <View>
        {this.renderPopup()}
      </View>
    );  
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(AlarmPopup)
);

const styles = MediaQueryStyleSheet.create(
  {
    // Base styles
    container: {
      height: HEIGHT,
      width: WIDTH,
      marginBottom: 100,
      alignItems: "center",
      justifyContent: "center"
    },

    alarmButtonContainer: {
      flex: 4,
      marginTop: -40,
      marginBottom: 50,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    },

    snoozeButtonContainer: {
      flex: 3,
      alignItems: "center",
      justifyContent: "center"
    },

    snoozeTxt: {
      color: colors.white,
      fontFamily: "Roboto-Bold",
      fontSize: 50
    },

    dismissTxt: {
      color: colors.white,
      fontFamily: "Roboto-Bold",
      fontSize: 25
    },
  }
);
