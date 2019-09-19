import React, { Component } from "react";
import { View, StatusBar } from "react-native";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import * as colors from "../styles/colors";

function mapStateToProps(state) {
  return {
    alarmOn: state.alarmOn
  };
}

class Status extends Component {
  constructor(props) {
    super(props);
  }

  renderStatusBar() {
    if (this.props.alarmOn === true) {
      return <StatusBar backgroundColor={colors.white}/>
    } else {
      return <StatusBar backgroundColor={colors.pickle}/>
    }
  }

  render() {
    return (
      <View>
        {this.renderStatusBar()}
      </View>
    );  
  }
}

export default withRouter(
  connect(mapStateToProps)(Status)
);