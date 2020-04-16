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
  TouchableOpacity
} from 'react-native';
import Modal from "react-native-modal";
import BluetoothSerial from 'react-native-bluetooth-serial'
import { MediaQueryStyleSheet } from "react-native-responsive";
import BackgroundTimer from "react-native-background-timer";
import AsyncStorage from '@react-native-community/async-storage';
import Slider from '@react-native-community/slider';
import { connect } from "react-redux";
import { 
  setConnecting, 
  setLTConnected, 
  setNightTracker, 
  setPowerNap, 
  setMenuInvisible,
  setInfo,
  setOfflineInfo,
  setOfflineLightTherapy,
  setLed,
  setBTenabled
} from "../redux/actions";
import I18n from "../i18n/i18n";
import * as colors from "../styles/colors";
import {
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";
import PickerButton from "../alarmclock/PickerButton";
import config from "../redux/config";

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    connecting: state.connecting,
    isLTConnected: state.isLTConnected,
    powerNap: state.powerNap,
    nightTracker: state.nightTracker,
    info: state.info,
    offlineInfo: state.offlineInfo,
    offlineLightTherapy: state.offlineLightTherapy,
    led: state.led,
    isBTenabled: state.isBTenabled
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
      setOfflineLightTherapy,
      setLed,
      setBTenabled 
    },
    dispatch
  );
}

class BTmodule extends Component {
  constructor(props) {
    super(props)
    this.willMount();
    this.connectedDevice = '';
    this.lightValue = {};

    this.state = {
      pairedDevices: [],
      deviceName: '',
      deviceId: '',
      btDevicesList: false,
      lightId: '',
      lightIntensity: 100,
    }
  }

  async willMount() {
    await this.getPairedDevices()
  }

  componentDidMount() {
    this.isBluetoothConnected();
    this.loadConnectedDevice();
    this.checkConnection();
    AsyncStorage.getItem('lightIntensityObj').then((result) => {
        if (result !== null) {
          this.setState({ lightIntensity: Number(result) });
        }
    });
  }

  componentWillUnmount() {
    this.dismissLight();
    BluetoothSerial.removeListener('bluetoothDisabled')
  }

  checkConnection() {
    BackgroundTimer.setInterval(() => {
      this.isBluetoothConnected();
    }, 500); 
  }

  isBluetoothConnected = async () => {
    try {
      const bluetoothState = await BluetoothSerial.isEnabled();
      if (bluetoothState === true) {
        this.props.setBTenabled(this.props.isBTenabled = true);
      } else {
        this.props.setBTenabled(this.props.isBTenabled = false);
      }
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
    this.toggleVisible(false);
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
      await BluetoothSerial.write(data);
    } catch (e) {
      console.log(e);
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

  toggleVisible(visible) {
    this.setState({ btDevicesList: visible })
  }

  openList() {
    this.toggleVisible(true);
    this.getPairedDevices();
  }

  // AsyncStorage
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

  // Led test
  increaseLight() {
    this.lightValue = 0;
    this.props.setLed(this.props.led = true);
    var val = (255 * this.state.lightIntensity) / 100;
    var time = 3000;
    var interval = time / val;
    const lightId = BackgroundTimer.setInterval(() => {
      if (this.lightValue < val.toFixed()) {
        this.props.setLed(this.props.led = true);
        this.lightValue = this.lightValue + 1;
        this.setValue();
      } else {
          this.dismissLight();        
      }
    }, interval);
    this.setState({ lightId: lightId });   
  }

  dismissLight() {
    this.props.setLed(this.props.led = false);
    this.lightValue = 0;
    this.setValue(0); 
    const lightId = this.state.lightId;
    const clearIntervalId = BackgroundTimer.clearInterval(lightId);    
  }

  setValue = async value => {
    try {
      value = "b " + this.lightValue + "\n";
      await BluetoothSerial.write(value);
    } catch (e) {
      console.log(e);
    }
  }

  lightIntensityFunction(value) {
    this.setState({ lightIntensity: Number(value) });
    AsyncStorage.setItem('lightIntensityObj', JSON.stringify(Number(value)));
  }

  // Popup disconnected
  pathOne() {
    this.props.setMenuInvisible(this.props.isMenuInvisible = false);
    this.props.history.push("/connectorOne");
  }

  // Render
  renderListButton() {
    if (this.props.connecting === true) {
      return (
        <TouchableOpacity style={styles.btListButtonDisabled} disabled={true}>
          <Text style={styles.btListTextDisabled}>{I18n.t("devicesList")}</Text>
        </TouchableOpacity>
      );
    } else if (this.props.isBTenabled === false) {
      return (
        <TouchableOpacity style={styles.btListButton} onPress={ () => BluetoothSerial.enable() }>
          <Text style={styles.btListText}>{I18n.t("enableBT")}</Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity style={styles.btListButton} onPress={ () => this.openList() }>
          <Text style={styles.btListText}>{I18n.t("devicesList")}</Text>
        </TouchableOpacity>
      );
    }
  }

  renderCard() {
    if (this.props.isLTConnected === true) {
      return (
        <View>
          <View style={styles.materialCard}>
            <Text style={styles.connectStyle}>{I18n.t("connectedTo")}</Text>
              <View style={styles.paddingTop}>
                <Text style={styles.connectStyle}>{this.state.deviceName} {this.state.deviceId}</Text>
              </View>
          </View>

          <View style={styles.pageContainer}>   
            {this.props.led
              ? <TouchableOpacity onPress={() => null} disabled={true} style={styles.trackContainer}>
                  <Text style={styles.disabledTrackSize}>{I18n.t("testButton")}</Text>
                </TouchableOpacity>
              :  <TouchableOpacity onPress={ () => this.increaseLight()} style={styles.trackContainer}> 
                  <Text style={styles.trackSize}>{I18n.t("testButton")}</Text>
                </TouchableOpacity>
            }    

          </View>

          <View style={styles.materialCard}>
            <Text style={styles.infoText}>{I18n.t("setLightIntensity")} {this.state.lightIntensity}</Text>
            <Slider
              minimumValue={10}
              maximumValue={100}
              step={1}
              value={this.state.lightIntensity}
              onValueChange={ value => this.lightIntensityFunction(value) }
            />
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
    if (this.props.connecting === true || this.props.led === true) {
       return (
        <PickerButton disabled={true}>
          <Text style={styles.buttonText}>{I18n.t("done")}</Text>
        </PickerButton>
      );     
    } else {
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
      } else if (this.props.offlineLightTherapy === true) {
          return (
            <PickerButton onPress={this.pathOfflineLightTherapy.bind(this)}>
              <Text style={styles.buttonText}>{I18n.t("done")}</Text>
            </PickerButton>
          );
      }
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.paddingTop}>
          {this.renderListButton()}

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
              </View>}

          <View style={styles.buttonContainer}>                  
            {this.renderDoneButton()}
          </View>
        </View>

        <Modal
          isVisible={this.state.btDevicesList}
          onBackdropPress={ () => this.toggleVisible(false) }
          style={{ elevation: 10 }}
        >
          <View style={styles.dialogBackground}>
            <View style={styles.dialogContainer}>
              <Text style={styles.connectStyle}>
                {I18n.t("btList")}
              </Text>
              <FlatList
                contentContainerStyle={styles.paddingTop}
                data={this.state.pairedDevices}
                keyExtractor={item => item.id}
                ItemSeparatorComponent={ () => <View style={{ height: 1, marginVertical: 8, backgroundColor: colors.black }}/> }
                renderItem={({ item: device }) =>
                  <TouchableOpacity style={styles.listButton} onPress={() => this.connectToDevice(device)}>
                    <Text style={styles.connectStyle}>
                      {device.name} {device.id}
                    </Text>
                  </TouchableOpacity>}
              />
              <TouchableOpacity style={styles.greenButton} onPress={ () => this.toggleVisible(false) }>
                <Text style={styles.buttonText}>{I18n.t("close")}</Text>
              </TouchableOpacity>
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
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BTmodule);

const styles = MediaQueryStyleSheet.create(
  // Base styles
  {
    container: {
      backgroundColor: colors.white,
      flex: 1,
      justifyContent: "flex-start",
      alignItems: "stretch"
    },

    paddingTop: {
      padding: 8
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
      justifyContent: "center",
      alignSelf: 'flex-start'
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

    buttonContainer: {
      marginTop: 15,
      marginBottom: 30,
      alignItems: "center",
      justifyContent: "center"
    },

    buttonText: {
      fontSize: 15,
      fontFamily: "Roboto-Medium",
      color: colors.white
    },

    greenButton: {
      justifyContent: "center",
      backgroundColor: colors.fern,
      borderColor: colors.heather,
      borderWidth: 1,
      borderRadius: 4,
      height: 30,
      marginTop: 15,
      marginBottom: 15,
      marginLeft: 7,
      marginRight: 7,
      padding: 5,
      alignItems: "center",
      elevation: 3
    },

    listButton: {
      flex: 1,
      justifyContent: "center",
      backgroundColor: colors.white,
      borderColor: colors.black,
      borderWidth: 1,
      borderRadius: 5,
      height: 'auto',
      margin: 5,
      padding: 5,
      elevation: 3
    },

    btListButton: {
      justifyContent: "center",
      backgroundColor: colors.fern,
      borderRadius: 4,
      height: 'auto',
      marginTop: 15,
      marginBottom: 25,
      marginLeft: 7,
      marginRight: 7,
      padding: 10,
      alignItems: "center",
      elevation: 3
    },

    btListButtonDisabled: {
      justifyContent: "center",
      backgroundColor: colors.white,
      borderRadius: 4,
      height: 'auto',
      marginTop: 15,
      marginBottom: 25,
      marginLeft: 7,
      marginRight: 7,
      padding: 10,
      alignItems: "center",
      elevation: 3
    },

    btListText: {
      fontSize: 20,
      fontFamily: "Roboto-Medium",
      color: colors.white
    },

    btListTextDisabled: {
      fontSize: 20,
      fontFamily: "Roboto-Medium",
      color: colors.faintGrey
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
  }
);
