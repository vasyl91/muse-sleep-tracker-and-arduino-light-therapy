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
import Modal from "react-native-modal";
import { connect } from "react-redux";
import { 
  setSaveCsvActive,
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
import PickerButton from "../alarmclock/PickerButton";
import Classifier from "../native/Classifier.js";
import { MediaQueryStyleSheet } from "react-native-responsive";
import BackgroundTimer from "react-native-background-timer";

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    notchFrequency: state.notchFrequency,
    noise: state.noise,
    isSaveCsvActive: state.isSaveCsvActive,
    isMenuInvisible: state.isMenuInvisible,
    info: state.info
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setSaveCsvActive,
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
  }

  // CSV
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

  // Popup disconnected
  pathOne() {
    if (this.props.isSaveCsvActive === true) {
      this.onPressButtonStop();
    }
    this.props.history.push("/connectorOne");
  }

  // Render
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
