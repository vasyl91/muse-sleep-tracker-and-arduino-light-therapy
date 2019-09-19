import React, { Component } from "react";
import { Image, View, Text, TouchableOpacity } from "react-native";
import { MediaQueryStyleSheet } from "react-native-responsive";
import { connect } from "react-redux";
import { withRouter } from 'react-router';
import { bindActionCreators } from "redux";
import { setMenu, setRefresh, setHorizontal, setHideContainer } from "../redux/actions";
import * as colors from "../styles/colors";
import config from "../redux/config";
import {
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";
import BackgroundTimer from "react-native-background-timer";

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    isMenuOpen: state.isMenuOpen,
    isMenuInvisible: state.isMenuInvisible,
    isNightTrackerActive: state.isNightTrackerActive,
    isNapTrackerActive: state.isNapTrackerActive,
    isAlarmActive: state.isAlarmActive,
    isSnoozeActive: state.isSnoozeActive,
    refresh: state.refresh,
    batteryValue: state.batteryValue,
    isHorizontal: state.isHorizontal
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setMenu,
      setRefresh,
      setHorizontal,
      setHideContainer
    },
    dispatch
  );
}

class NavBar extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount () {
    const batteryId = BackgroundTimer.setInterval(() => {
      this.props.setRefresh(!this.props.refresh);
    }, 1000);
    this.setState({ batteryId: batteryId });
  }

  componentWillUnmount() {
    const batteryId = this.state.batteryId;
    const clearBatteryId = BackgroundTimer.clearTimeout(batteryId);
    this.setState(clearBatteryId);  
  }

  chartsButton() {
    this.props.setHorizontal(this.props.isHorizontal = false)
    this.props.setHideContainer(this.props.containerHidden = false);
  }

  batteryStyle = function(options) {
    if (this.props.isHorizontal === true) {
        return {width: 0.125 * WIDTH, transform: [{ rotate: '180deg'}]}
    } else {
        return {width: 0.125 * WIDTH}
    }
  }

  percentageStyle = function(options) {
    if (this.props.isHorizontal === true) {
        return {textAlign: "center", color: colors.white, fontFamily: "Roboto-Medium", fontSize: 0.042 * WIDTH, transform: [{ rotate: '90deg'}]}
    } else {
        return {textAlign: "center", color: colors.white, fontFamily: "Roboto-Medium", fontSize: 0.042 * WIDTH}
    }
  }

  lowPercentageStyle = function(options) {
    if (this.props.isHorizontal === true) {
        return {textAlign: "center", color: colors.red, fontFamily: "Roboto-Medium", fontSize: 0.042 * WIDTH, transform: [{ rotate: '90deg'}]}
    } else {
        return {textAlign: "center", color: colors.red, fontFamily: "Roboto-Medium", fontSize: 0.042 * WIDTH}
    }
  }

  renderBatteryIcon() {   
    if (this.props.batteryValue === null) {
      return (
        <View style={styles.batteryContainer}>
          <Text style={this.percentageStyle()}>--- </Text>
          <Image
            style={this.batteryStyle()}
            source={require("../assets/battery.png")}
            resizeMode={"contain"}
          />
        </View>
      );
    } else if (this.props.batteryValue > 80) {
      return (
        <View style={styles.batteryContainer}>
          <Text style={this.percentageStyle()}>{this.props.batteryValue}% </Text>
          <Image
            style={this.batteryStyle()}
            source={require("../assets/battery100.png")}
            resizeMode={"contain"}
          />
        </View>
      );
    } else if (this.props.batteryValue >55) {
      return  (
        <View style={styles.batteryContainer}>
          <Text style={this.percentageStyle()}>{this.props.batteryValue}% </Text>
          <Image
            style={this.batteryStyle()}
            source={require("../assets/battery75.png")}
            resizeMode={"contain"}
          />
        </View>
      );
    } else if (this.props.batteryValue > 30) {
      return  (
        <View style={styles.batteryContainer}>
          <Text style={this.percentageStyle()}>{this.props.batteryValue}% </Text>
          <Image
            style={this.batteryStyle()}
            source={require("../assets/battery50.png")}
            resizeMode={"contain"}
          />
        </View>
      );
    } else if (this.props.batteryValue > 5) {
      return  (
        <View style={styles.batteryContainer}>
          <Text style={this.percentageStyle()}>{this.props.batteryValue}% </Text>
          <Image
            style={this.batteryStyle()}
            source={require("../assets/battery25.png")}
            resizeMode={"contain"}
          />
        </View>
      );
    } else if (this.props.batteryValue <= 5) {
      return  (
        <View style={styles.batteryContainer}>
          <Text style={this.lowPercentageStyle()}>{this.props.batteryValue}% </Text>
          <Image
            style={this.batteryStyle()}
            source={require("../assets/battery0.png")}
            resizeMode={"contain"}
          />
        </View>
      );
    }
  }

  menuButton() {
    var propsStatement = this.props.isAlarmActive || this.props.isNapTrackerActive || this.props.isNightTrackerActive || this.props.isSnoozeActive;

    if (this.props.isHorizontal === true) {
      return (
        <TouchableOpacity onPress={ () => this.chartsButton() }>
          <Image
            style={styles.backButton}
            source={require("../assets/back_icon.png")}
            resizeMode={"contain"}
          />
        </TouchableOpacity>
      );      
    } else {
      if (this.props.isMenuInvisible) {
        return null; 
      } else {
        if (propsStatement) {
          return (
            <TouchableOpacity onPress={() => null} disabled={true}>
              <Image
                style={styles.burger}
                source={require("../assets/burger.png")}
                resizeMode={"contain"}
              />
            </TouchableOpacity>
          );
        } else {
            return (
              <TouchableOpacity onPress={()=>this.props.setMenu(true)}>
                <Image
                  style={styles.burger}
                  source={require("../assets/burger.png")}
                  resizeMode={"contain"}
                />
              </TouchableOpacity>
            );        
        }
      }
    }
  }

  renderNavBar() {
    if (this.props.connectionStatus === config.connectionStatus.CONNECTED) {
      return (
        <View style={styles.navContainer}>
          {this.menuButton()}
          <View>
          </View>
          {this.renderBatteryIcon()}
        </View>
      );     
    } else {
      return (
        <View style={styles.navContainer}>
          {this.menuButton()}
        </View>
      );        
    }
  }

  render() {
    return (
      <View>
        {this.renderNavBar()}
      </View>
    );
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NavBar));

const styles = MediaQueryStyleSheet.create(
  // Base styles
  {
    navContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingLeft: 0.042 * WIDTH,
      height: 0.07 * HEIGHT,
      backgroundColor: colors.pickle
    },

    batteryContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 0.013 * WIDTH
    },

    burger: {
      width: 0.083 * WIDTH,
      height: 0.083 * WIDTH
    },

    backButton: {
      width: 0.083 * WIDTH,
      height: 0.083 * WIDTH,
      transform: [{ rotate: '90deg'}]
    },
  },
  // Responsive styles
  {
    "@media (min-device-height: 700)": {},
    "@media (min-device-height: 1000)": {}
  }
);
