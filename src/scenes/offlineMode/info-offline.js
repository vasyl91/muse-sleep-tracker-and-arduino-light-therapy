import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { 
  Text, 
  View, 
  Image,  
  ScrollView, 
  TouchableOpacity, 
  Alert,
  DeviceEventEmitter
} from "react-native";
import { connect } from "react-redux";
import { 
  setLed, 
  setOfflineInfo, 
  setMenuInvisible,
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy 
} from "../../redux/actions";
import config from "../../redux/config";
import I18n from "../../i18n/i18n";
import * as colors from "../../styles/colors";
import {
  HEIGHT,
  WIDTH
} from "../../alarmclock/AlarmManager";
import BluetoothSerial from "react-native-bluetooth-serial";
import BackgroundTimer from "react-native-background-timer";
import { MediaQueryStyleSheet } from "react-native-responsive";

function mapStateToProps(state) {
  return {
    isOfflineMode: state.isOfflineMode,
    offlineInfo: state.offlineInfo,
    isLTConnected: state.isLTConnected,
    isMenuInvisible: state.isMenuInvisible,
    led: state.led
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setLed,
      setOfflineInfo,
      setMenuInvisible,
      setNightTracker, 
      setPowerNap, 
      setOfflineLightTherapy, 
    },
    dispatch
  );
}


class offlineInfo extends Component {
  constructor(props) {
    super(props);
    this.lightValue = {};

    this.state = {
      lightId: '',
    };
  }

  componentDidMount() {
    this.props.setNightTracker(this.props.nightTracker = false);
    this.props.setPowerNap(this.props.powerNap = false);
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);
  }

  componentWillUnmount() {
    this.dismissLight();  
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
    this.isBluetoothEnabled();
    this.props.setOfflineInfo(this.props.offlineInfo = true);
    this.props.setMenuInvisible(this.props.isMenuInvisible = true);
    this.props.history.push("/lightTherapy");
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

  render() {
    return (
      <View style={styles.container}>
        <ScrollView>
          <Text style={styles.currentTitle}>{I18n.t("offlineInfoTitle")}</Text>
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
        </ScrollView>
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(offlineInfo);

const styles = MediaQueryStyleSheet.create(
  // Base styles
  {
    currentTitle: {
      marginLeft: 10,
      marginBottom: 15,
      fontSize: 20,
      fontFamily: "Roboto-Medium",
      color: colors.lightGreen
    },

    container: {
      backgroundColor: colors.white,
      flex: 1,
      justifyContent: "space-around",
      alignItems: "stretch"
    },

    infoText: {
      marginBottom: 10,
      textAlign: "center",
      color: colors.black,
      fontFamily: "Roboto-Medium",
      fontSize: 15
    },

    trackContainer: {
      borderColor: colors.heather,
      borderRadius: 4,
      height: 65,
      marginLeft: 15,
      marginRight: 15,
      marginBottom: 25,
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
      padding: 16,
      borderRadius: 2,
      backgroundColor: colors.white,
      elevation: 1,
      shadowOpacity: 0.1815,
      shadowRadius: 0.54,
      shadowOffset: {
        height: 0.6,
      },
    },

    greenMaterialCard: {
      marginBottom: 8,
      marginHorizontal: 8,
      paddingTop: 16,
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 8,
      borderRadius: 2,
      backgroundColor: colors.lightGreen,
      shadowOpacity: 0.1815,
      shadowRadius: 0.54,
      shadowOffset: {
        height: 0.6,
      },
      elevation: 1
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
