import React, { Component } from "react";
import { bindActionCreators } from "redux";
import {
  Text,
  View,
  Button,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
  Slider,
  AsyncStorage,
  TouchableOpacity
} from 'react-native'
import { connect } from "react-redux";
import { 
  setConnecting, 
  setLTConnected, 
  setNightTracker, 
  setPowerNap, 
  setMenuInvisible,
  setInfo,
  setOfflineInfo,
  setOfflineLightTherapy  
} from "../redux/actions";
import I18n from "../i18n/i18n";
import * as colors from "../styles/colors";
import {
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";
import config from "../redux/config";
import SandboxButton from "../components/SandboxButton";
import PickerButton from "../alarmclock/PickerButton";
import PopupDialog from 'react-native-popup-dialog';
import BluetoothSerial from 'react-native-bluetooth-serial'
import { MediaQueryStyleSheet } from "react-native-responsive";
import BackgroundTimer from "react-native-background-timer";

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    connecting: state.connecting,
    isLTConnected: state.isLTConnected,
    powerNap: state.powerNap,
    nightTracker: state.nightTracker,
    info: state.info,
    offlineInfo: state.offlineInfo,
    offlineLightTherapy: state.offlineLightTherapy
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setConnecting,
      setLTConnected,
      setNightTracker, 
      setPowerNap,
      setMenuInvisible,
      setInfo,
      setOfflineInfo,
      setOfflineLightTherapy  
    },
    dispatch
  );
}

class LightTherapy extends Component {
  constructor(props) {
    super(props)
    this.lightValue = {};
    this.connectedDevice = '';

    this.state = {
      pairedDevices: [],
      deviceName: '',
      deviceId: '',
    }
  }

  async componentWillMount() {
    await this.getPairedDevices()
  }

  componentDidMount() {
    this.loadConnectedDevice();
    this.checkConnection();
  }

  checkConnection() {
    BackgroundTimer.setInterval(() => {
      this.isBluetoothConnected()
    }, 500); 
  }

  isBluetoothConnected = async () => {
    try {
      const bluetoothConnected = await BluetoothSerial.isConnected()
      if (bluetoothConnected === true) {
        this.props.setLTConnected(this.props.isLTConnected = true);
      } else if (bluetoothConnected === false) {
        this.props.setLTConnected(this.props.isLTConnected = false);
      }
    } catch (e) {
      console.log(e)
    }
  }

  getPairedDevices = async () => {
    try {
      const pairedDevices = await BluetoothSerial.list()
      this.setState({
        pairedDevices,
      })
    } catch (e) {
      console.log(e)
    }
  }

  connectToDevice = async device => {
    const { connectedDevice } = this
    const connectedDeviceId = connectedDevice && connectedDevice.id
    if (this.props.isLTConnected === true) {
        alert(I18n.t("alreadyConnected"))
    } else {
        try {
          this.props.setConnecting(this.props.connecting = true);
          await BluetoothSerial.connect(device.id);
          this.props.setConnecting(this.props.connecting = false);
          this.connectedDevice = device;
          this.state.deviceId = device.id;
          this.state.deviceName = device.name;
          await AsyncStorage.setItem('deviceNameObj', JSON.stringify(this.state.deviceName));
          await AsyncStorage.setItem('deviceIdObj', JSON.stringify(this.state.deviceId));
    } catch (e) {
        console.log(e)
        this.connectedDevice = null;
        this.props.setConnecting(this.props.connecting = false);
        alert(I18n.t("unableToConnect"))
      }
    }
  }

  sendStringToDevice = async data => {
    try {
      await BluetoothSerial.write(data)
    } catch (e) {
      console.log(e)
    }
  }

  pathNight() {
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);
    this.props.setNightTracker(this.props.nightTracker = false);
    this.props.history.push("/nightTracker");
  }

  pathNap() {
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);
    this.props.setPowerNap(this.props.powerNap = false);
    this.props.history.push("/powerNap");
  }

  pathInfo() {
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);
    this.props.setInfo(this.props.info = false);
    this.props.history.push("/info");
  }

  pathOfflineLightTherapy() {
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);
    this.props.history.push("/offline/lightTherapyOffline");
  }

  pathOfflineInfo() {
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);
    this.props.setOfflineInfo(this.props.offlineInfo = false);
    this.props.history.push("/offline/infoOffline");
  }

  //AsyncStorage
  loadConnectedDevice = async () => {
    try {
      const result = await AsyncStorage.getItem('deviceIdObj');
          if (result !== null) {
            this.setState({ deviceId: JSON.parse(result) })
          }
      const result2 = await AsyncStorage.getItem('deviceNameObj');
          if (result2 !== null) {
            this.setState({ deviceName: JSON.parse(result2) })
          } 
      } catch (e) {
        console.log(e)
    }
  }

  //Popup disconnected
  show() {
      BackgroundTimer.setTimeout(() => {
        this.popupDisconnected.show();
      }, 1);        
  }

  pathOne() {
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);
    this.props.history.push("/connectorOne");
  }

  //Render
  renderCard() {
    if (this.props.isLTConnected === true) {
      return (
        <View style={styles.materialCard}>
          <Text style={styles.connectStyle}>{I18n.t("connectedTo")}</Text>
            <View style={styles.paddingTop}>
              <Text style={styles.connectStyle}>{this.state.deviceName} {this.state.deviceId}</Text>
            </View>
        </View>

      );
    } else return (
        <View style={styles.materialCard}>
          <Text style={styles.connectStyle}>{I18n.t("notConnected")}</Text>
        </View> 
    );
  }

  renderDoneButton() {
    if (this.props.nightTracker === true) {
      return (
        <PickerButton onPress={this.pathNight.bind(this)}>
          <Text style={styles.buttonText}>{I18n.t("done")}</Text>
        </PickerButton>
      );
    } else if (this.props.powerNap === true) {
        return (
          <PickerButton onPress={this.pathNap.bind(this)}>
            <Text style={styles.buttonText}>{I18n.t("done")}</Text>
          </PickerButton>
        );
    } else if (this.props.info === true) {
        return (
          <PickerButton onPress={this.pathInfo.bind(this)}>
            <Text style={styles.buttonText}>{I18n.t("done")}</Text>
          </PickerButton>
        );
    } else if (this.props.offlineLightTherapy === true) {
        return (
          <PickerButton onPress={this.pathOfflineLightTherapy.bind(this)}>
            <Text style={styles.buttonText}>{I18n.t("done")}</Text>
          </PickerButton>
        );
    } else if (this.props.offlineInfo === true) {
        return (
          <PickerButton onPress={this.pathOfflineInfo.bind(this)}>
            <Text style={styles.buttonText}>{I18n.t("done")}</Text>
          </PickerButton>
        );
    }
  }

  render() {
    if (this.props.connectionStatus === config.connectionStatus.DISCONNECTED) {
      this.show(); 
    }
    return (
      <View style={styles.container}>
        <ScrollView style={styles.paddingTop}>
          <View style={styles.materialCard}>
            <Text style={styles.connectStyle}>
              {I18n.t("devicesList")}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={this.getPairedDevices}>
              <Text style={styles.refreshText}>{I18n.t("refresh")}</Text>
            </TouchableOpacity>
            <FlatList
              contentContainerStyle={styles.paddingTop}
              data={this.state.pairedDevices}
              keyExtractor={item => item.id}
              ItemSeparatorComponent={() =>
                <View
                  style={[
                    { height: 1, backgroundColor: colors.black },
                    styles.marginStyle,
                  ]}
                />}
              renderItem={({ item: device }) =>
                <SandboxButton onPress={() => this.connectToDevice(device)}>
                  <Text style={styles.connectStyle}>
                    {device.name} {device.id}
                  </Text>
                </SandboxButton>}
            />
          </View>
            {this.props.connecting
              ? <View style={styles.centerAligned}>
                  <ActivityIndicator
                    size={'large'}
                    color={colors.black}
                  />
                  <Text style={styles.connectStyle}>{I18n.t("statusConnecting")}</Text>
                </View>
               
              : <View>
                  {this.renderCard()}
                  <View style={styles.buttonContainer}>                  
                    {this.renderDoneButton()}
                  </View>
                </View>}
        </ScrollView>

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
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(LightTherapy);

const styles = MediaQueryStyleSheet.create(
  // Base styles
  {
    container: {
      backgroundColor: colors.white,
      flex: 1,
      justifyContent: "space-around",
      alignItems: "stretch"
    },

    paddingTop: {
      paddingTop: 8,
    },

    marginStyle: {
      marginVertical: 8,
    },    

    materialCard: {
      marginBottom: 8,
      marginHorizontal: 8,
      padding: 16,
      borderRadius: 2,
      backgroundColor: colors.white,
      shadowOpacity: 0.1815,
      shadowRadius: 0.54,
      shadowOffset: {
        height: 0.6,
      },
      elevation: 1,
    },

    connectStyle: {
      marginBottom: 10,
      fontSize: 20,
      fontFamily: "Roboto-Medium",
      color: colors.black
    },

    devicesStyle: {
      fontSize: 20,
      fontFamily: "Roboto-Medium",
      color: colors.black
    },

    centerAligned: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
    },

    dialogText: {
      fontFamily: "OpenSans-Regular",
      textAlign: "center",
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

    buttonContainer: {
      marginTop: 15,
      alignItems: "center",
      justifyContent: "center"
    },

    buttonText: {
      fontSize: 15,
      fontFamily: "Roboto-Medium",
      color: colors.white
    },

    refreshButton: {
      justifyContent: "center",
      backgroundColor: colors.fern,
      borderColor: colors.heather,
      borderRadius: 4,
      height: 30,
      margin: 5,
      padding: 5,
      alignItems: "center",
      elevation: 3
    },

    refreshText: {
      fontSize: 15,
      fontFamily: "Roboto-Medium",
      color: colors.white
    },
  }
);
