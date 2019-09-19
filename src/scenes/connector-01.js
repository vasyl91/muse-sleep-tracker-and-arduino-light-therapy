import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { 
  Text, 
  View, 
  PermissionsAndroid, 
  AsyncStorage  
} from "react-native";
import { connect } from "react-redux";
import { 
  setOfflineMode, 
  initNativeEventListeners,
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy
} from "../redux/actions";
import Classifier from "../native/Classifier.js";
import LinkButton from "../components/WhiteLinkButton";
import SandboxButton from "../components/SandboxButton";
import I18n from "../i18n/i18n";
import * as colors from "../styles/colors";
import {
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";
import { MediaQueryStyleSheet } from "react-native-responsive";
import Battery from "../native/Battery.js";

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    isOfflineMode: state.isOfflineMode,
    powerNap: state.powerNap,
    nightTracker: state.nightTracker,
    offlineLightTherapy: state.offlineLightTherapy
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setOfflineMode,
      initNativeEventListeners,
      setNightTracker, 
      setPowerNap, 
      setOfflineLightTherapy
    },
    dispatch
  );
}

class ConnectorOne extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.requestPermissions();
    this.props.initNativeEventListeners();
    this.props.setNightTracker(this.props.nightTracker = false);
    this.props.setPowerNap(this.props.powerNap = false);
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);
  }

  async requestPermissions() {
    var permissions = [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
         PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
         PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,];
    try {
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      Battery.batteryOptimization();
    } catch (err) {
      console.warn(err);
    }
  }

  offlineMode() {
    this.props.setOfflineMode(this.props.isOfflineMode = true);
    AsyncStorage.setItem('offlineMode', JSON.stringify(true));
  }

  onlineMode() {
    this.props.setOfflineMode(this.props.isOfflineMode = false);
    AsyncStorage.setItem('offlineMode', JSON.stringify(false));
  }

  renderButton() {
    if (this.props.isOfflineMode) {
      return (
        <LinkButton path="/offline/lightTherapyOffline">
          <Text style={styles.textButton}>{I18n.t("getStartedLink")}</Text>
        </LinkButton>
      );
    } else
      return (
        <LinkButton path="/ConnectorTwo">
          <Text style={styles.textButton}>{I18n.t("connector2Link")}</Text>
        </LinkButton>
      );
  }

  renderInstructions() {
    if (this.props.isOfflineMode === false) {
      return (
        <View>
          <Text style={styles.instructions}>
            {I18n.t("musePowerOnWarning")}
          </Text>
          <Text style={styles.body}>{I18n.t("museFirstGenWarning")}</Text>
        </View>
      );
    } else
      return (
        <View>
          <Text style={styles.instructions}>
            {I18n.t("offlineInfo")}
          </Text>
          <Text style={styles.body}>{I18n.t("arduinoInfo")}</Text>
        </View>
      );
  }

  renderOfflineMode() {
    if (this.props.isOfflineMode === false) {
      return (
        <SandboxButton
          onPress={() => this.offlineMode()}
          active={false}
        >
          {I18n.t("offlineModeEnable")}
        </SandboxButton>        
      );
    } else {
        return (
           <SandboxButton
            onPress={() => this.onlineMode()}
            active={true}
          >
            {I18n.t("offlineModeDisable")}
          </SandboxButton>          
        );
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>{I18n.t("step1Title")}</Text>
          {this.renderInstructions()}
        </View>
        <View style={styles.offlineButtonContainer}>
          {this.renderOfflineMode()}
        </View>
        <View style={styles.buttonContainer}>{this.renderButton()}</View>
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectorOne);

const styles = MediaQueryStyleSheet.create(
  {
    // Base styles
    body: {
      fontFamily: "Roboto-Light",
      fontSize: 15,
      marginLeft: 40,
      marginRight: 40,
      marginBottom: 10,
      color: colors.white,
      textAlign: "center"
    },

    instructions: {
      fontFamily: "Roboto-Bold",
      fontSize: 18,
      margin: 20,
      color: colors.white,
      textAlign: "center"
    },

    container: {
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "stretch",
      width: null,
      height: null,
      backgroundColor: colors.lightGreen
    },

    buttonContainer: {
      flex: 1,
      marginLeft: 40,
      marginRight: 40,
      marginBottom: 20,
      justifyContent: "center"
    },

    offlineButtonContainer: {
      flex: 1,
      marginTop: -30,
      marginLeft: 10,
      marginRight: 10,
      marginBottom: 10,
      justifyContent: "center",
      alignSelf: "center"
    },

    logo: {
      width: 50,
      height: 50
    },

    title: {
      textAlign: "center",
      margin: 15,
      lineHeight: 50,
      color: colors.white,
      fontFamily: "Roboto-Black",
      fontSize: 48
    },

    titleBox: {
      flex: 3,
      marginTop: -25,
      alignItems: "center",
      justifyContent: "center"
    },

    burger: {
      marginTop: 10,
      marginLeft: 10,
      width: 30,
      height: 30
    },

    textButton: {
      color: colors.lightGreen,
      fontFamily: "Roboto-Bold",
    }
  },
  // Responsive styles
  {
    "@media (min-device-height: 700)": {
      body: {
        fontSize: 20,
        marginLeft: 50,
        marginRight: 50
      },

      instructions: {
        fontSize: 30
      }
    }
  }
);
