import React, { Component } from "react";
import { bindActionCreators } from "redux";
import { 
  Text, 
  View, 
  Image,  
  TouchableOpacity, 
  DeviceEventEmitter,
  ViewPagerAndroid
} from "react-native";
import { connect } from "react-redux";
import {
  HEIGHT,
  WIDTH
} from "../../alarmclock/AlarmManager";
import { 
  setHorizontal, 
  setHideContainer 
} from "../../redux/actions";
import config from "../../redux/config";
import I18n from "../../i18n/i18n";
import CSVGraph from "../../native/CSVGraph.js";
import CSVGraphHelper from "../../native/CSVGraphHelper.js";
import * as colors from "../../styles/colors";
import { MediaQueryStyleSheet } from "react-native-responsive";

function mapStateToProps(state) {
  return {
    isHorizontal: state.isHorizontal,
    containerHidden: state.containerHidden
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      setHorizontal,
      setHideContainer
    },
    dispatch
  );
}

class charts extends Component {
  constructor(props) {
    super(props);
    this.subscription = {};

    this.state = {
      // Titles
      chart1: null,
      chart2: null,
      chart3: null,
      chart4: null,
      chart5: null,

      // Info
      info1: null,
      info2: null,
      info3: null,
      info4: null,
      info5: null,

      // Avoid rendering all graphs at one time
      chart1Visible: false,
      chart2Visible: false,
      chart3Visible: false,
      chart4Visible: false,
      chart5Visible: false,
    };
  }

  componentDidMount() {
    this.addListeners();
    CSVGraphHelper.setFiles();
  }

  componentWillUnmount() {
    this.subscription.forEach((sub) => {
      sub.remove();
    });
    this.props.setHideContainer(this.props.containerHidden = true);
  }

  // Functions
  addListeners() {
    this.subscription = [
          // Title 
          DeviceEventEmitter.addListener("TITLE_0", fileData => { 
            if (fileData !== null) {
              this.setState({ chart1: fileData });
            }
          }), 
          DeviceEventEmitter.addListener("TITLE_1", fileData => { 
            if (fileData !== null) {
              this.setState({ chart2: fileData });
            }
          }),
          DeviceEventEmitter.addListener("TITLE_2", fileData => { 
            if (fileData !== null) {
              this.setState({ chart3: fileData });
            }
          }),
          DeviceEventEmitter.addListener("TITLE_3", fileData => { 
            if (fileData !== null) {
              this.setState({ chart4: fileData });
            }
          }), 
          DeviceEventEmitter.addListener("TITLE_4", fileData => { 
            if (fileData !== null) {
              this.setState({ chart5: fileData });
            }
          }),
          // Info
          DeviceEventEmitter.addListener("INFO_0", fileData => { 
            if (fileData !== null) {
              this.setState({ info1: fileData });
            }
          }),
          DeviceEventEmitter.addListener("INFO_1", fileData => { 
            if (fileData !== null) {
              this.setState({ info2: fileData });
            }
          }),
          DeviceEventEmitter.addListener("INFO_2", fileData => { 
            if (fileData !== null) {
              this.setState({ info3: fileData });
            }
          }),
          DeviceEventEmitter.addListener("INFO_3", fileData => { 
            if (fileData !== null) {
              this.setState({ info4: fileData });
            }
          }), 
          DeviceEventEmitter.addListener("INFO_4", fileData => { 
            if (fileData !== null) {
              this.setState({ info5: fileData });
            }
          }), 
    ];
  }

  pageSelector(Number) {
    switch(Number) {
      case 1: this.viewPager.setPageWithoutAnimation(Number);
              this.setState({ chart1Visible: true });
              this.props.setHideContainer(this.props.containerHidden = false);
      case 2: this.viewPager.setPageWithoutAnimation(Number);
              this.setState({ chart2Visible: true });
              this.props.setHideContainer(this.props.containerHidden = false);
      case 3: this.viewPager.setPageWithoutAnimation(Number); 
              this.setState({ chart3Visible: true });
              this.props.setHideContainer(this.props.containerHidden = false);
      case 4: this.viewPager.setPageWithoutAnimation(Number);
              this.setState({ chart4Visible: true });
              this.props.setHideContainer(this.props.containerHidden = false);
      case 5: this.viewPager.setPageWithoutAnimation(Number); 
              this.setState({ chart5Visible: true });
              this.props.setHideContainer(this.props.containerHidden = false);
    }
  }

  backButton() {
    this.setState({
      chart1Visible: false,
      chart2Visible: false,
      chart3Visible: false,
      chart4Visible: false,
      chart5Visible: false,
    });
    this.viewPager.setPageWithoutAnimation(0);
    this.props.setHideContainer(this.props.containerHidden = true);
  }

  horizontalButton() {
    this.props.setHideContainer(this.props.containerHidden = true);
    this.props.setHorizontal(this.props.isHorizontal = true);   
  }

  graphStyle = function(options) {
    if (this.props.isHorizontal === true) {
        return {height: 0.9 * WIDTH, width: 0.9 * HEIGHT, transform: [{ rotate: '90deg'}, {translateY: 0.35 * WIDTH}]}
    } else {
        return {height: 0.9 * WIDTH, width: 0.99 * WIDTH, transform: [{translateX: -0.04 * WIDTH}]}
    }
  }

  // Render
  renderGraph(Number) {
    return (
      <View>
        <CSVGraph 
          style={this.graphStyle()}       
          graphNumber={(Number - 1)}
        />
      </View>
    );       
  }

  renderPageButton(Number) {
    switch(Number) {
      case 1: if (this.state.chart1 !== null) {
          return (
            <TouchableOpacity onPress={ () => this.pageSelector(Number) }> 
              <Text style={styles.dialogText}>{this.state.chart1}</Text>
            </TouchableOpacity>
          ); 
        } else {
            return (
              <TouchableOpacity onPress={ () => null } disabled={true}> 
                <Text style={styles.dialogText}>EMPTY</Text>
              </TouchableOpacity>
            );             
        } 
      case 2: if (this.state.chart2 !== null) {
          return (
            <TouchableOpacity onPress={ () => this.pageSelector(Number) }> 
              <Text style={styles.dialogText}>{this.state.chart2}</Text>
            </TouchableOpacity>
          ); 
        } else {
            return (
              <TouchableOpacity onPress={ () => null } disabled={true}> 
                <Text style={styles.dialogText}>EMPTY</Text>
              </TouchableOpacity>
            );             
        } 
      case 3: if (this.state.chart3 !== null) {
          return (
            <TouchableOpacity onPress={ () => this.pageSelector(Number) }> 
              <Text style={styles.dialogText}>{this.state.chart3}</Text>
            </TouchableOpacity>
          ); 
        } else {
            return (
              <TouchableOpacity onPress={ () => null } disabled={true}> 
                <Text style={styles.dialogText}>EMPTY</Text>
              </TouchableOpacity>
            );             
        }  
      case 4: if (this.state.chart4 !== null) {
          return (
            <TouchableOpacity onPress={ () => this.pageSelector(Number) }> 
              <Text style={styles.dialogText}>{this.state.chart4}</Text>
            </TouchableOpacity>
          ); 
        } else {
            return (
              <TouchableOpacity onPress={ () => null } disabled={true}> 
                <Text style={styles.dialogText}>EMPTY</Text>
              </TouchableOpacity>
            );             
        }  
      case 5: if (this.state.chart5 !== null) {
          return (
            <TouchableOpacity onPress={ () => this.pageSelector(Number) }> 
              <Text style={styles.dialogText}>{this.state.chart5}</Text>
            </TouchableOpacity>
          ); 
        } else {
            return (
              <TouchableOpacity onPress={ () => null } disabled={true}> 
                <Text style={styles.dialogText}>EMPTY</Text>
              </TouchableOpacity>
            );             
        }  
      }
  }

  renderContainer() {
    if (this.props.containerHidden === false) {
        return (
          <View>
            <TouchableOpacity onPress={ () => this.horizontalButton() }> 
              <Text style={styles.dialogText}>{I18n.t("showChart")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={ () => this.backButton() }> 
              <Text style={styles.dialogText}>Back</Text>
            </TouchableOpacity>
          </View>
        );
    } else {
        return null;
    }
  }

  render() {
    return ( 
      <View style={styles.container}>
        {this.props.isHorizontal === true
          ? null
          : <Text style={styles.currentTitle}>{I18n.t("chartsTitle")}</Text>}
        <ViewPagerAndroid
          style={styles.viewPager}
          initialPage={0}
          scrollEnabled={false}
          ref={(viewPager) => {this.viewPager = viewPager}}
        >
          <View style={styles.pageStyle}>
            <Text style={styles.infoText}>
              Will be some initial info
            </Text>         
            {this.renderPageButton(1)}
            {this.renderPageButton(2)}
            {this.renderPageButton(3)}
            {this.renderPageButton(4)}
            {this.renderPageButton(5)}
          </View>

          <View style={styles.pageStyle}>
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>{this.state.chart1}</Text>}
            {this.state.chart1Visible === true
              ? this.renderGraph(1)
              : null}
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>Duration: {this.state.info1}</Text>}  
          </View>

          <View style={styles.pageStyle}>
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>{this.state.chart2}</Text>}
            {this.state.chart2Visible === true
              ? this.renderGraph(2)
              : null}
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>Duration: {this.state.info2}</Text>}  
          </View>

          <View style={styles.pageStyle}>
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>{this.state.chart3}</Text>}
            {this.state.chart3Visible === true
              ? this.renderGraph(3)
              : null}
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>Duration: {this.state.info3}</Text>} 
          </View>

          <View style={styles.pageStyle}>
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>{this.state.chart4}</Text>}
            {this.state.chart4Visible === true
              ? this.renderGraph(4)
              : null}
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>Duration: {this.state.info4}</Text>} 
          </View>

          <View style={styles.pageStyle}>
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>{this.state.chart5}</Text>}
            {this.state.chart5Visible === true
              ? this.renderGraph(5)
              : null}
            {this.props.isHorizontal === true
              ? null
              : <Text style={styles.infoText}>Duration: {this.state.info5}</Text>} 
          </View>
        </ViewPagerAndroid> 
        {this.renderContainer()}                   
      </View>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(charts);

const styles = MediaQueryStyleSheet.create(
  // Base styles
  {
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

    greenMaterialCard: {
      marginBottom: 8,
      marginHorizontal: 8,
      paddingTop: 16,
      paddingLeft: 16,
      paddingRight: 16,
      paddingBottom: 8,
      borderRadius: 2,
      backgroundColor: colors.lightGreen,
      shadowOpacity: 0.1815,
      shadowRadius: 0.54,
      shadowOffset: {
        height: 0.6,
      },
      elevation: 1
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

    viewPager: {
      flex: 4
    },

    pageStyle: {
      padding: 20,
      alignItems: "stretch",
      justifyContent: "space-around"
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
