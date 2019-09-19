import React, { Component } from "react";
import PropTypes from 'prop-types';
import { 
  View, 
  AppRegistry, 
  AsyncStorage 
} from "react-native";
import {
  NativeRouter,
  AndroidBackButton,
  Route,
  Switch
} from "react-router-native";
import { 
  setMenu, 
  setNightTrackerActive, 
  setNapTrackerActive,
  setAlarmActive, 
  setSnoozeActive,
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy,
  setAlarmOn,
  setVibration,
  setOfflineMode 
} from "./src/redux/actions";
import { Provider, connect } from "react-redux";
import { bindActionCreators } from "redux";
import { withRouter } from "react-router";
import Drawer from "react-native-drawer";
import { initNativeEventListeners } from "./src/redux/actions";
import NavBar from "./src/components/NavBar";
import AlarmPopup from "./src/alarmclock/AlarmPopup";
import Status from "./src/alarmclock/StatusBar";
import { stringToBoolean } from "./src/alarmclock/AlarmManager";
import SideMenu from "./src/components/SideMenu";
import * as colors from "./src/styles/colors.js";
import CSVGraphHelper from "./src/native/CSVGraphHelper.js";

// Scenes
import Landing from "./src/scenes/begin-landing";
import ConnectorOne from "./src/scenes/connector-01";
import ConnectorTwo from "./src/scenes/connector-02";
import NightTracker from "./src/scenes/night-tracker.js";
import PowerNap from "./src/scenes/power-nap.js";
import Sandbox from "./src/scenes/sandbox";
import LightTherapy from "./src/scenes/light-therapy";
import Info from "./src/scenes/info";
import InfoOffline from "./src/scenes/offlineMode/info-offline";
import LightTherapyOffline from "./src/scenes/offlineMode/light-therapy-offline";
import Charts from "./src/scenes/offlineMode/charts";

// Store
import store from "./src/redux/store";

function mapStateToProps(state) {
  return {
    open: state.isMenuOpen
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      onClose: () => setMenu(false)
    },
    dispatch
  );
}

// Connect SideMenu to Redux
const DrawerWithRedux = withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Drawer)
);

const mainViewStyle = { flex: 1 };

class SleepTracker extends Component {

  static propTypes = {
    alarmID: PropTypes.string,
    alarmOn: PropTypes.bool
  }

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // If you dismiss an alarm and then leave app for a long time in background - android will load new component with old propTypes if you try
    // to wake it up and AlarmPopup will show up even though it's not alarm time. 'null' alarmID loaded from AsyncStorage (it always
    // returns 'null' if you dismissed an alarm) prevents this and further errors.
    AsyncStorage.getItem('alarmID').then((value) => {
      if (this.props.alarmOn === true && stringToBoolean(value) !== null) {
        store.dispatch(setAlarmOn(true));
      }
    });
    AsyncStorage.getItem('vibrationObj').then((value) => {
      if (value !== null) {
        store.dispatch(setVibration(stringToBoolean(value)));
      }
    });
    AsyncStorage.getItem('SnoozeActive').then((value) => {
      if (value !== null) {
        store.dispatch(setSnoozeActive(stringToBoolean(value)));
      }
    });

    AsyncStorage.getItem('NapTracker').then((value) => {
      if (value !== null) {
        store.dispatch(setPowerNap(stringToBoolean(value)));
      }
    });
    AsyncStorage.getItem('NapTrackerActive').then((value) => {
      if (value !== null) {
        store.dispatch(setNapTrackerActive(stringToBoolean(value)));
      }
    });

    AsyncStorage.getItem('NightTracker').then((value) => {
      if (value !== null) {
        store.dispatch(setNightTracker(stringToBoolean(value)));
      }
    });
    AsyncStorage.getItem('NightTrackerActive').then((value) => {
      if (value !== null) {
        store.dispatch(setNightTrackerActive(stringToBoolean(value)));
      }
    });

    AsyncStorage.getItem('OfflineLightTherapy').then((value) => {
      if (value !== null) {
        store.dispatch(setOfflineLightTherapy(stringToBoolean(value)));
      }
    });
    AsyncStorage.getItem('AlarmActive').then((value) => {
      if (value !== null) {
        store.dispatch(setAlarmActive(stringToBoolean(value)));
      }
    });
    AsyncStorage.getItem('offlineMode').then((value) => {
      if (value !== null) {
        store.dispatch(setOfflineMode(stringToBoolean(value)));
      }
    });
    CSVGraphHelper.setFiles();
  }

  render() {
    return (
      <Provider store={store}>
        <NativeRouter>
          <AndroidBackButton>
            <View style={mainViewStyle}>
              <Status/>            
              <DrawerWithRedux
                content={<SideMenu drawer={this.ref} />}
                type="overlay"
                tapToClose={true}
                openDrawerOffset={0.2} // 20% gap on the right side of drawer
                panCloseMask={0.2}
                closedDrawerOffset={-5}
                captureGestures="open"
                styles={{
                  drawer: { elevation: 3 },
                  main: { paddingLeft: 3 }
                }}
                tweenHandler={ratio => ({
                  main: { opacity: (2 - ratio) / 2, backgroundColor: "black" }
                })}
              >
                <AlarmPopup/>
                <NavBar />
                <Switch>                  
                  <Route exact path="/" component={Landing} />
                  <Route path="/connectorOne" component={ConnectorOne} />
                  <Route path="/connectorTwo" component={ConnectorTwo} />
				          <Route path="/nightTracker" component={NightTracker} />
                  <Route path="/powerNap" component={PowerNap} />
                  <Route path="/sandbox" component={Sandbox} />
				          <Route path="/lightTherapy" component={LightTherapy} />
                  <Route path="/info" component={Info} />
                  <Route path="/offline/infoOffline" component={InfoOffline} />
                  <Route path="/offline/lightTherapyOffline" component={LightTherapyOffline} /> // this is Alarm Clock scene which has been created to handle Light Therapy without Muse headband
                  <Route path="/offline/charts" component={Charts} />
                </Switch>
              </DrawerWithRedux>
            </View>
          </AndroidBackButton>
        </NativeRouter>
      </Provider>
    );
  }
}

// Defines which component is the root for the whole project
AppRegistry.registerComponent("SleepTracker", () => SleepTracker);
