// AlarmButton.js

import React, { Component } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { MediaQueryStyleSheet } from "react-native-responsive";
import * as colors from "../styles/colors";
import {
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";

export default class AlarmButton extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const dynamicButtonStyle = this.props.active
      ? styles.activeButton
      : styles.inactiveButton;
    const dynamicTextStyle = this.props.active
      ? styles.activeText
      : styles.inactiveText;
    return (
      <TouchableOpacity
        onPress={this.props.onPress}
        disabled={this.props.disabled}
      >
        <View style={dynamicButtonStyle}>
          <Text style={dynamicTextStyle}>{this.props.children}</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

const styles = MediaQueryStyleSheet.create(
  {
    // Base styles
    activeButton: {
      justifyContent: "center",
      backgroundColor: colors.pickle,
      borderColor: colors.heather,
      borderRadius: 4,
      height: 45,
      marginLeft: 10,
      marginRight: 10,
      marginBottom: 10,
      paddingLeft: 40,
      paddingRight: 40,
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: "center",
      elevation: 3
    },

    inactiveButton: {
      justifyContent: "center",
      backgroundColor: colors.white,
      borderColor: colors.heather,
      borderRadius: 4,
      height: 45,
      marginLeft: 10,
      marginRight: 10,
      marginBottom: 10,
      paddingLeft: 40,
      paddingRight: 40,
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: "center",
      elevation: 3
    },

    activeText: {
      color: colors.white,
      fontFamily: "Roboto-Regular",
      fontSize: 15
    },

    inactiveText: {
      color: colors.lightGreen,
      fontFamily: "Roboto",
      fontSize: 15
    }
  },
  // Responsive styles
  {
    "@media (min-device-height: 700)": {
      activeButton: {
        height: 50
      },
      inactiveButton: {
        height: 50
      },

      activeText: {
        fontSize: 20
      },

      inactiveText: {
        fontSize: 20
      }
    }
  }
);
