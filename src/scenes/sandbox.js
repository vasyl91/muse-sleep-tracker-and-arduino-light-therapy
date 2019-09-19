import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { Text, View } from "react-native";
import { connect } from "react-redux";
import config from "../redux/config";
import { 
  setGraphViewDimensions,
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy 
} from "../redux/actions";
import LinkButton from "../components/LinkButton";
import RecorderButton from "../components/RecorderButton";
import SandboxButton from "../components/SandboxButton";
import SandboxGraph from "../components/SandboxGraph";
import ElectrodeSelector from "../components/ElectrodeSelector";
import I18n from "../i18n/i18n";
import * as colors from "../styles/colors";
import {
  HEIGHT,
  WIDTH
} from "../alarmclock/AlarmManager";
import PickerButton from "../alarmclock/PickerButton";
import BackgroundTimer from "react-native-background-timer";
import PopupDialog from 'react-native-popup-dialog';
import { MediaQueryStyleSheet } from "react-native-responsive";

function mapStateToProps(state) {
  return {
    connectionStatus: state.connectionStatus,
    dimensions: state.graphViewDimensions,
    notchFrequency: state.notchFrequency
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setGraphViewDimensions,
      setNightTracker, 
      setPowerNap, 
      setOfflineLightTherapy,
    },
    dispatch
  );
}

class Sandbox extends Component {
  constructor(props) {
    super(props);

    this.state = {
      graphType: config.graphType.EEG,
      channelOfInterest: 2,
      isRecording: false,
      filterType: config.filterType.LOWPASS
    };
  }

  componentDidMount() {
    this.props.setNightTracker(this.props.nightTracker = false);
    this.props.setPowerNap(this.props.powerNap = false);
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);  
  }

  show() {
      BackgroundTimer.setTimeout(() => {
        this.popupDisconnected.show();
      }, 1);        
  }

  pathOne() {
    this.props.history.push("/connectorOne");
  }

  renderInfoView() {
    let text = "";
    switch (this.state.graphType) {
      case config.graphType.EEG:
        return (
          <Text style={styles.body}>
            {I18n.t("descriptionOne")}
          </Text>
        );

      case config.graphType.FILTER:
        switch (this.state.filterType) {
          case config.filterType.LOWPASS:
            text = I18n.t("lowPass");
            break;
          case config.filterType.HIGHPASS:
            text = I18n.t("highPass");
            break;
          case config.filterType.BANDPASS:
            text = I18n.t("bandPass");
            break;
        }
        return (
          <View style={styles.filterContainer}>
            <Text style={styles.filterText}>
              {text}
            </Text>
            <View style={styles.filterButtonContainer}>
              <SandboxButton
                onPress={() =>
                  this.setState({
                    filterType: config.filterType.LOWPASS,
                    isRecording: false
                  })}
                active={this.state.filterType === config.filterType.LOWPASS}
              >
                {I18n.t("low")}
              </SandboxButton>
              <SandboxButton
                onPress={() =>
                  this.setState({
                    filterType: config.filterType.HIGHPASS,
                    isRecording: false
                  })}
                active={this.state.filterType === config.filterType.HIGHPASS}
              >
                {I18n.t("high")}
              </SandboxButton>
              <SandboxButton
                onPress={() =>
                  this.setState({
                    filterType: config.filterType.BANDPASS,
                    isRecording: false
                  })}
                active={this.state.filterType === config.filterType.BANDPASS}
              >
                {I18n.t("band")}
              </SandboxButton>
            </View>
          </View>
        );

      case config.graphType.WAVES:
        return (
          <Text style={styles.body}>
            {I18n.t("descriptionTwo")}
          </Text>
        );
    }
  }

  render() {
    if (this.props.connectionStatus === config.connectionStatus.DISCONNECTED) {
      this.show(); 
    }
    return (
      <View style={styles.container}>
        <View
          style={styles.graphContainer}
          onLayout={event => {
            // Captures the width and height of the graphContainer to determine overlay positioning properties in PSDGraph
            let { x, y, width, height } = event.nativeEvent.layout;
            this.props.setGraphViewDimensions({
              x: x,
              y: y,
              width: width,
              height: height
            });
          }}
        >
          <SandboxGraph
            style={styles.graphView}
            channelOfInterest={this.state.channelOfInterest}
            graphType={this.state.graphType}
            dimensions={this.props.dimensions}
            isRecording={this.state.isRecording}
            filterType={this.state.filterType}
            notchFrequency={this.props.notchFrequency}
          />
        </View>

        <Text style={styles.currentTitle}>{I18n.t("sandboxCardTitle")}</Text>

        <View style={styles.pageContainer}>
          <View style={styles.rowContainer}>
            <View style={styles.infoContainer}>
              <View style={styles.buttonContainer}>
                <SandboxButton
                  onPress={() =>
                    this.setState({
                      graphType: config.graphType.EEG,
                      isRecording: false
                    })}
                  active={this.state.graphType === config.graphType.EEG}
                >
                  {I18n.t("raw")}
                </SandboxButton>
                <SandboxButton
                  onPress={() =>
                    this.setState({
                      graphType: config.graphType.FILTER,
                      isRecording: false
                    })}
                  active={this.state.graphType === config.graphType.FILTER}
                >
                  {I18n.t("filtered")}
                </SandboxButton>
                <SandboxButton
                  onPress={() =>
                    this.setState({
                      graphType: config.graphType.WAVES,
                      isRecording: false
                    })}
                  active={this.state.graphType === config.graphType.WAVES}
                >
                  {I18n.t("psd")}
                </SandboxButton>
                <RecorderButton
                  isRecording={this.state.isRecording}
                  onPress={() => {
                    this.setState({ isRecording: !this.state.isRecording });
                  }}
                />
              </View>

              <View style={styles.textContainer}>
                {this.renderInfoView()}
              </View>
            </View>
            <ElectrodeSelector
              style={styles.electrodeSelector}
              channelOfInterest={channel =>
                this.setState({ channelOfInterest: channel })}
            />
          </View>
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
        
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Sandbox);

const styles = MediaQueryStyleSheet.create(
  // Base styles
  {
    container: {
      backgroundColor: colors.white,
      flex: 1,
      justifyContent: "space-around",
      alignItems: "stretch"
    },

    graphContainer: {
      flex: 5,
      backgroundColor: colors.lightGreen,
      justifyContent: "center",
      alignItems: "stretch"
    },

    graphView: { 
      flex: 1,
    },

    electrodeSelector: {
      alignSelf: "center"
    },

    currentTitle: {
      marginLeft: 20,
      marginTop: 10,
      marginBottom: 10,
      fontSize: 13,
      fontFamily: "Roboto-Medium",
      color: colors.lightGreen
    },

    buttonContainer: {
      paddingTop: 10,
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between"
    },

    body: {
      padding: 5,
      fontFamily: "Roboto-Light",
      color: colors.black,
      fontSize: 17
    },

    filterContainer: {
      flex: 1,
      alignItems: "center"
    },

    filterButtonContainer: {
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between"
    },

    filterText: {
      fontFamily: "Roboto-Light",
      color: colors.black,
      fontSize: 14
    },

    pageContainer: {
      flex: 4,
      marginTop: -15,
      paddingLeft: 15,
      paddingRight: 15,
      paddingBottom: 15
    },

    rowContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },

    infoContainer: {
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between"
    },

    textContainer: {
      justifyContent: "center",
      flex: 2
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
  },
  // Responsive styles
  {
    "@media (min-device-height: 700)": {
      currentTitle: {
        fontSize: 20
      },

      body: {
        fontSize: 25
      }
    }
  }
);
