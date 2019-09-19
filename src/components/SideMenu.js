// SideMenu.js
// A sliding side menu for displaying settings and connect links
// Based on react-native-side-menu

import React, { Component } from "react";
import { ScrollView } from "react-native";
import { MediaQueryStyleSheet } from "react-native-responsive";
import { withRouter } from "react-router";
import { connect } from "react-redux";
import { setMenu } from "../redux/actions";
import { bindActionCreators } from "redux";
import config from "../redux/config.js";
import DeviceStatusWidget from "./DeviceStatusWidget";
import MenuSection from "./MenuSection.js";
import I18n from "../i18n/i18n";
import LineNoisePicker from "./LineNoisePicker";
import * as colors from "../styles/colors";
import SandboxButton from "../components/SandboxButton";

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    isOfflineMode: state.isOfflineMode
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setMenu
    },
    dispatch
  );
}

class SideMenu extends Component {
  constructor(props) {
    super(props);
    props.history.listen(() => props.setMenu(false));
  }

  navTo(path) {
    this.props.history.push(path);
  }

  render() {
    if (!this.props.isOfflineMode) {
      return (
        <ScrollView style={styles.menuContainer}>
          <DeviceStatusWidget
            connectionStatus={this.props.connectionStatus}
            isOfflineMode={this.props.isOfflineMode}
          />
          
          <MenuSection
            title={I18n.t("sleepTitle")}
            items={[
              {
                value: I18n.t("sleepTrckr"),
                disabled:
                  this.props.connectionStatus !==
                  config.connectionStatus.CONNECTED,
                active: this.props.location.pathname === "/nightTracker",
                onPress: () => this.navTo("/nightTracker")
              },
              {
                value: I18n.t("napTrckr"),
                disabled:
                  this.props.connectionStatus !==
                  config.connectionStatus.CONNECTED,
                active: this.props.location.pathname === "/powerNap",
                onPress: () => this.navTo("/powerNap")
              },
            ]}
          />
          <MenuSection
            title={I18n.t("sandboxTitle")}
            items={[
              {
                value: I18n.t("eegSandbox"),
                disabled:
                  this.props.connectionStatus !==
                  config.connectionStatus.CONNECTED,
                active: this.props.location.pathname === "/sandbox",
                onPress: () => this.navTo("/sandbox")
              },
              {
                value: I18n.t("infoScene"),
                disabled:
                  this.props.connectionStatus !==
                  config.connectionStatus.CONNECTED,
                active: this.props.location.pathname === "/info",
                onPress: () => this.navTo("/info")
              },
              {
                value: I18n.t("charts"),
                active: this.props.location.pathname === "/offline/charts",
                onPress: () => this.navTo("/offline/charts")
              }
            ]}
          />
          <LineNoisePicker />
          <SandboxButton onPress={()=>this.props.setMenu(false)}>
            {I18n.t("close")}
          </SandboxButton>
        </ScrollView>
      );
    } else
      return (
        <ScrollView style={styles.menuContainer}>
          <DeviceStatusWidget
            connectionStatus={this.props.connectionStatus}
            isOfflineMode={this.props.isOfflineMode}
          />

          <MenuSection
            title={I18n.t("offlineTitle")}
            items={[
              {
                value: I18n.t("alarmTitle"),
                disabled:
                  !this.props.isOfflineMode &&
                  this.props.connectionStatus !==
                    config.connectionStatus.CONNECTED,
                active: this.props.location.pathname === "/offline/lightTherapyOffline",
                onPress: () => this.navTo("/offline/lightTherapyOffline")
              },
              {
                value: I18n.t("infoScene"),
                disabled:
                  !this.props.isOfflineMode &&
                  this.props.connectionStatus !==
                    config.connectionStatus.CONNECTED,
                active: this.props.location.pathname === "/offline/infoOffline",
                onPress: () => this.navTo("/offline/infoOffline")
              },
              {
                value: I18n.t("charts"),
                active: this.props.location.pathname === "/offline/charts",
                onPress: () => this.navTo("/offline/charts")
              }
            ]}
          />
          <SandboxButton onPress={()=>this.props.setMenu(false)}>
            {I18n.t("close")}
          </SandboxButton>
        </ScrollView>
      );
  }
}

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(SideMenu)
);

const styles = MediaQueryStyleSheet.create(
  {
    menuContainer: {
      flex: 1,
      backgroundColor: colors.pickle
    }
  },
  {
    "@media (min-device-height: 700)": {}
  }
);
