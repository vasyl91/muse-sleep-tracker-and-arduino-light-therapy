// CSVGraphManager.js
// Exposes CSVGraph.java to JS and allows to display graphs based on 10 most recent .csv files
// Depending on 'graphNumber': the newest file - 0; second - 1; third - 2; ...tenth - 9
import PropTypes from "prop-types";
import { requireNativeComponent } from "react-native";

const iface = {
  name: 'CSVGraph',
  propTypes: {
        graphNumber: PropTypes.number
  },
};

module.exports = requireNativeComponent("CSV_GRAPH", iface);