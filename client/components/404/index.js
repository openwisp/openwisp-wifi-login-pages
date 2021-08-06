import {connect} from "react-redux";
import {setTitle} from "../../actions/dispatchers";

import Component from "./404";

const mapStateToProps = (state) => ({
  page: state.organization.configuration.components["404_page"],
  orgSlug: state.organization.configuration.slug,
  orgName: state.organization.configuration.name,
});

const mapDispatchToProps = (dispatch) => ({
  setTitle: setTitle(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Component);
