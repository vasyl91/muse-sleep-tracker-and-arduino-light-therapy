import React, { Component } from "react";
import { 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  Alert 
} from "react-native";
import { connect } from "react-redux";
import config from "../redux/config";
import LinkButton from "../components/WhiteLinkButton";
import WhiteButton from "../components/WhiteButton";
import ConnectorWidget from "../components/ConnectorWidget";
import I18n from "../i18n/i18n";
import * as colors from "../styles/colors";
import {
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";
import { MediaQueryStyleSheet } from "react-native-responsive";
import BluetoothSerial from 'react-native-bluetooth-serial'

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
  };
}

class ConnectorTwo extends Component {
  constructor(props) {
    super(props);
  }

  async componentWillMount() {
    const bluetoothState = await BluetoothSerial.isEnabled()
    if (!bluetoothState) {
      await this.isBluetoothEnabled()
    }
  }

  componentDidMount() {
    const bluetoothState = BluetoothSerial.isEnabled()
    if (!bluetoothState) {
      BluetoothSerial.on('bluetoothDisabled', this.isBluetoothEnabled)
    }
  }

  componentWillUnmount() {
    BluetoothSerial.removeListener('bluetoothDisabled')
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

  pathBack() {
    this.props.history.push("/ConnectorOne");
  }

  renderButton() {
    if (this.props.connectionStatus === config.connectionStatus.CONNECTED) {
      return (
        <LinkButton path="/powerNap">
          <Text style={styles.textButton}>{I18n.t("getStartedLink")}</Text>
        </LinkButton>
      );
    } else return (
        <WhiteButton onPress={() => null} disabled={true}>
          <Text style={styles.textButton}>{I18n.t("getStartedLink")}</Text>
        </WhiteButton>
      );
  }

  renderBackButton() {
    if (this.props.connectionStatus === config.connectionStatus.CONNECTED) {
      return (
        <TouchableOpacity onPress={ () => null } disabled={true}>
          <Image
            style={styles.backButton}
            source={require("../assets/back_icon.png")}
            resizeMode={"contain"}
          />
        </TouchableOpacity>
      );
    } else return (
        <TouchableOpacity onPress={this.pathBack.bind(this)}>
          <Image
            style={styles.backButton}
            source={require("../assets/back_icon.png")}
            resizeMode={"contain"}
          />
        </TouchableOpacity>
      );
  }

  render() {
    return (
      <View style={styles.container}>
        {this.renderBackButton()}
        <View style={styles.titleBox}>
          <Text style={styles.title}>
            {I18n.t("step2Title")}
          </Text>
          <Text style={styles.instructions}>
            {this.props.connectionStatus === config.connectionStatus.CONNECTED
              ? I18n.t("proceed")
              : I18n.t("waitMusePair")}
          </Text>
        </View>
        <ConnectorWidget />
        <View style={styles.buttonContainer}>
          {this.renderButton()}
        </View>
      </View>
    );
  }
}
export default connect(mapStateToProps)(ConnectorTwo);

const styles = MediaQueryStyleSheet.create(
  // Base styles
  {
    body: {
      fontFamily: "Roboto-Light",
      fontSize: 15,
      margin: 20,
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
      justifyContent: "space-around",
      alignItems: "stretch",
      width: null,
      height: null,
      backgroundColor: colors.lightGreen
    },

    buttonContainer: {
      flex: 1,
      margin: 40,
      justifyContent: "center"
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
      marginTop: -17,
      alignItems: "center",
      justifyContent: "center"
    },

    backButton: {
      marginTop: 10,
      marginLeft: 10,
      width: 30,
      height: 30
    },

    textButton: {
      color: colors.lightGreen,
      fontFamily: "Roboto-Bold",
    },
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
