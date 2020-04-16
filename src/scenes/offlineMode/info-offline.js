import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { 
  Text, 
  View, 
  ScrollView,
  TextInput
} from "react-native";
import { connect } from "react-redux";
import {  
  setNightTracker, 
  setPowerNap, 
  setOfflineLightTherapy 
} from "../../redux/actions";
import config from "../../redux/config";
import I18n from "../../i18n/i18n";
import * as colors from "../../styles/colors";
import { MediaQueryStyleSheet } from "react-native-responsive";

function mapStateToProps(state) {
  return {
    //
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
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
    this.state = { 
      number: '410' 
    };
  }

  componentDidMount() {
    this.props.setNightTracker(this.props.nightTracker = false);
    this.props.setPowerNap(this.props.powerNap = false);
    this.props.setOfflineLightTherapy(this.props.offlineLightTherapy = false);
  }

  onTextChanged(value) {
    // code to remove non-numeric characters from text
    this.setState({ number: value.replace(/[- #*;,.<>\{\}\[\]\\\/]/gi, '') });
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
        </ScrollView>
        <View style={styles.materialCard}>
          <View style={styles.rowHeader}>
            <Text style={styles.text}>Alpha threshold:</Text>
            <TextInput 
              style={styles.paragraph}
              keyboardType="numeric"
              maxLength={3}
              defaultValue={this.props.number}
              onChangeText={value => this.onTextChanged(value)}
              value={this.state.number}
            />
          </View>
        </View>
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(offlineInfo);

const styles = MediaQueryStyleSheet.create(
  {
    rowHeader: {
      marginTop: 8,
      marginBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },

    text: {
      fontFamily: "OpenSans-Regular",
      textAlign: "left",
      fontSize: 18,
      margin: 15,
      color: colors.black
    },

    paragraph: {
      fontSize: 20,
      height: 50,
      width: 70,
      textAlign: "center",
      textAlignVertical : "top",
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'gray',
      color: '#000000',
      fontWeight: 'bold',
    },

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
