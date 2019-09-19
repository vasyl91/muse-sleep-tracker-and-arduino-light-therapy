import React, { Component, PropTypes } from "react";
import { bindActionCreators } from "redux";
import {
  Text,
  Image,
  View,
  ScrollView,
  NativeModules,
  NativeEventEmitter,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { connect } from "react-redux";
import { 
  setSaveCsvActive, 
  setLed, 
  setInfo, 
  setMenuInvisible,
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy 
} from "../redux/actions";
import config from "../redux/config";
import NoiseIndicator from "../components/NoiseIndicator";
import I18n from "../i18n/i18n";
import * as colors from "../styles/colors";
import {
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";
import PickerButton from "../alarmclock/PickerButton";
import Classifier from "../native/Classifier.js";
import PopupDialog from 'react-native-popup-dialog';
import { MediaQueryStyleSheet } from "react-native-responsive";
import BackgroundTimer from "react-native-background-timer";
import BluetoothSerial from "react-native-bluetooth-serial";

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    notchFrequency: state.notchFrequency,
    noise: state.noise,
    isSaveCsvActive: state.isSaveCsvActive,
    isLTConnected: state.isLTConnected,
    isMenuInvisible: state.isMenuInvisible,
    led: state.led,
    info: state.info
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setSaveCsvActive,
      setLed,
      setInfo,
      setMenuInvisible,
      setNightTracker, 
      setPowerNap, 
      setOfflineLightTherapy, 
    },
    dispatch
  );
}

class Info extends Component {
  constructor(props) {
    super(props);
    this.lightValue = {};

    this.state = {
      lightId: '',
    };
  }

  componentDidMount() {
    Classifier.startClassifier(this.props.notchFrequency);
    Classifier.startNoiseListener();
    this.props.setNightTracker(this.props.nightTracker = false);
    this.props.setPowerNap(this.props.powerNap = false);
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);      
  }

  componentWillUnmount() {
    Classifier.stopNoiseListener();
    this.dismissLight();  
  }

  //Light therapy
  increaseLight() {
    this.lightValue = 0;
    const lightId = BackgroundTimer.setInterval(() => {
      if (this.lightValue < 255) {
        this.props.setLed(this.props.led = true);
        this.lightValue = this.lightValue + 1;
        this.setValue();
      } else {
          this.dismissLight();        
      }
    }, 10);
    this.setState({ lightId: lightId });   
  }

  dismissLight() {
    this.props.setLed(this.props.led = false);
    this.lightValue = 0;
    this.setValue(); 
    const lightId = this.state.lightId;
    const clearIntervalId = BackgroundTimer.clearInterval(lightId);    
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
    this.props.setInfo(this.props.info = true);
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
    this.props.history.push("/lightTherapy");
  }

  //CSV
  onPressButtonStart() {
    console.log("CSV start");
    Classifier.startSaveCSV();
    this.props.setSaveCsvActive(this.props.isSaveCsvActive = true);
  }

  onPressButtonStop() {
    console.log("CSV stop");
    Classifier.stopSaveCSV();
    this.props.setSaveCsvActive(this.props.isSaveCsvActive = false);
  }

  //Popup disconnected
  show() {
      BackgroundTimer.setTimeout(() => {
        this.popupDisconnected.show();
      }, 1);        
  }

  pathOne() {
    this.props.history.push("/connectorOne");
  }

  //Render
  renderLightButton() {
    if (this.props.isLTConnected === false) {
      return (
        <TouchableOpacity onPress={ () => this.pathLight()} style={styles.trackContainer}> 
          <Text style={styles.trackSize}>{I18n.t("connectButton")}</Text>
        </TouchableOpacity>
      );
    } else {
        if (this.props.led === false) {
          return (
            <TouchableOpacity onPress={ () => this.increaseLight()} style={styles.trackContainer}> 
              <Text style={styles.trackSize}>{I18n.t("testButton")}</Text>
            </TouchableOpacity>
          );
        } else return (
            <TouchableOpacity onPress={() => null} disabled={true} style={styles.trackContainer}>
              <Text style={styles.disabledTrackSize}>{I18n.t("testButton")}</Text>
            </TouchableOpacity>
          );
    }
  }

  renderSaveButton() {
    if (this.props.isSaveCsvActive === false) {
      return (
        <TouchableOpacity onPress={ () => this.onPressButtonStart()} style={styles.trackContainer}> 
          <Text style={styles.trackSize}>{I18n.t("recordEEG")}</Text>
        </TouchableOpacity>
      );
    } else return (
        <TouchableOpacity onPress={ () => this.onPressButtonStop()} style={styles.trackContainer}> 
          <ActivityIndicator
            size={'large'}
            color={colors.black}
          />
          <Text style={styles.trackSize}>{I18n.t("recording")}</Text>
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

  render() {
    if (this.props.connectionStatus === config.connectionStatus.DISCONNECTED) {
      this.show(); 
    }
    return (
      <View style={styles.container}>
        <ScrollView>
          <Text style={styles.currentTitle}>{I18n.t("offlineInfoTitle")}</Text>
          <View style={styles.pageContainer}>       
            {this.renderSaveButton()}
            <View style={styles.electrodeContainer}>
              {this.renderNoiseIndicator()}
            </View> 
          </View>          
          <View style={styles.materialCard}>
            <Text style={styles.infoText}>
              {I18n.t("infoOne")}
            </Text>
            <Text style={styles.infoText}>
              {I18n.t("infoTwo")}
            </Text>
            <Text style={styles.infoText}>
              {I18n.t("infoThree")}
            </Text>
            <Text style={styles.infoText}>
              {I18n.t("infoFour")}
            </Text>
            <Text style={styles.infoText}>
              {I18n.t("infoFive")}
            </Text>
            <Text style={styles.infoText}>
              {I18n.t("infoSix")}
            </Text>
          </View>
          <View style={styles.greenMaterialCard}>
            {this.props.isLTConnected
              ? <Text style={styles.infoText}>
                  {I18n.t("lightConnected")}
                </Text>

              : <Text style={styles.infoText}>
                  {I18n.t("testInfo")}
                </Text>}
          </View>
          <View style={styles.pageContainer}>       
            {this.renderLightButton()}
          </View>
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
        </ScrollView>
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Info);

const styles = MediaQueryStyleSheet.create(
  // Base styles
  {
    container: {
      backgroundColor: colors.white,
      flex: 1,
      justifyContent: "space-around",
      alignItems: "stretch"
    },

    electrodeContainer: {
      alignSelf: "center"
    },

    currentTitle: {
      marginLeft: 10,
      marginBottom: 5,
      fontSize: 20,
      fontFamily: "Roboto-Medium",
      color: colors.lightGreen
    },

    pageContainer: {
      flex: 4,
      marginTop: 5,
      paddingLeft: 15,
      paddingRight: 15,
      paddingBottom: 15
    },

    dialogText: {
      fontFamily: "OpenSans-Regular",
      fontSize: 15,
      margin: 15,
      color: colors.black
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

    materialCard: {
      marginBottom: 8,
      marginHorizontal: 8,
      padding: 8,
      borderRadius: 2,
      backgroundColor: colors.white,
      shadowOpacity: 0.1815,
      shadowRadius: 0.54,
      shadowOffset: {
        height: 0.6,
      },
      elevation: 1
    },

    greenMaterialCard: {
      marginBottom: 8,
      marginHorizontal: 8,
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
