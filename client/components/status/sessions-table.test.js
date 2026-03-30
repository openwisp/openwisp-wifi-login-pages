import React from "react";
import {shallow} from "enzyme";
import SessionsTable from "./sessions-table";

describe("<SessionsTable /> rendering and interactions", () => {
  let props;
  const sessionData = {
    session_id: 1,
    start_time: "2020-09-08T00:22:28-04:00",
    stop_time: null,
    input_octets: 2000,
    output_octets: 1000,
    session_time: 3600,
    calling_station_id: "00:11:22:33:44:55",
  };

  beforeEach(() => {
    props = {
      activeSessions: [sessionData],
      pastSessions: [],
      language: "en",
      statusPage: {accounting_swap_octets: false},
      captivePortalLogoutForm: {logout_by_session: true},
      screenWidth: 1024,
      handleSessionLogout: jest.fn(),
    };
  });

  it("should render large table when screenWidth > 656", () => {
    const wrapper = shallow(<SessionsTable {...props} />);
    expect(wrapper.find(".large-table").exists()).toBe(true);
    expect(wrapper.find(".small-table").exists()).toBe(false);
  });

  it("should render small table when screenWidth <= 656", () => {
    props.screenWidth = 600;
    const wrapper = shallow(<SessionsTable {...props} />);
    expect(wrapper.find(".small-table").exists()).toBe(true);
    expect(wrapper.find(".large-table").exists()).toBe(false);
  });

  it("should call handleSessionLogout when logout button is clicked", () => {
    props.activeSessions.push({...sessionData, session_id: 2});

    const wrapper = shallow(<SessionsTable {...props} />);
    const logoutBtn = wrapper.find(".session-logout").first();

    expect(logoutBtn.exists()).toBe(true);
    logoutBtn.simulate("click");

    expect(props.handleSessionLogout).toHaveBeenCalledWith(sessionData);
  });

  it("should not swap download and upload when accounting_swap_octets is false", () => {
    const wrapper = shallow(<SessionsTable {...props} />);
    const tds = wrapper.find("tbody tr").first().find("td");
    expect(tds.at(3).text()).toBe("2 kB");
    expect(tds.at(4).text()).toBe("1 kB");
  });

  it("should swap download and upload when accounting_swap_octets is true", () => {
    props.statusPage.accounting_swap_octets = true;
    const wrapper = shallow(<SessionsTable {...props} />);
    const tds = wrapper.find("tbody tr").first().find("td");
    expect(tds.at(3).text()).toBe("1 kB");
    expect(tds.at(4).text()).toBe("2 kB");
  });

  it("should swap download and upload when accounting_swap_octets is true (small table)", () => {
    props.screenWidth = 600;
    props.statusPage.accounting_swap_octets = true;
    const wrapper = shallow(<SessionsTable {...props} />);

    // In the small table, rows are inside a tbody. We need the 4th and 5th tr inside it.
    const rows = wrapper.find("tbody").first().find("tr");

    // download row (index 3) and upload row (index 4)
    expect(rows.at(3).find("td").text()).toBe("1 kB");
    expect(rows.at(4).find("td").text()).toBe("2 kB");
  });

  it("should render past sessions correctly and format plural durations", () => {
    const pastSessionData = {
      session_id: 3,
      start_time: "2020-09-08T00:22:28-04:00",
      stop_time: "2020-09-08T02:24:30-04:00",
      input_octets: 1000,
      output_octets: 500,
      session_time: 7322,
      calling_station_id: "00:11:22:33:44:55",
    };

    props.pastSessions = [pastSessionData];

    let wrapper = shallow(<SessionsTable {...props} />);
    expect(wrapper.find(".large-table").exists()).toBe(true);

    // Verify plural duration formatting
    const durationCell = wrapper.find("tbody tr").at(1).find("td").at(2);
    expect(durationCell.text()).toBe("2 hrs 2 mins 2 secs ");

    props.screenWidth = 500;
    wrapper = shallow(<SessionsTable {...props} />);
    expect(wrapper.find(".small-table").exists()).toBe(true);
  });

  it("should call handleSessionLogout when logout button is clicked in the small table", () => {
    props.activeSessions.push({...sessionData, session_id: 2});
    props.screenWidth = 500;
    const wrapper = shallow(<SessionsTable {...props} />);

    const logoutBtn = wrapper.find(".logout .button").first();
    expect(logoutBtn.exists()).toBe(true);

    logoutBtn.simulate("click");
    expect(props.handleSessionLogout).toHaveBeenCalledWith(sessionData);
  });

  it("should format duration correctly with single minutes and seconds", () => {
    props.activeSessions[0].session_time = 3661;
    const wrapper = shallow(<SessionsTable {...props} />);

    // Check the actual text output of the large table's duration cell
    const durationCell = wrapper.find("tbody tr").first().find("td").at(2);
    expect(durationCell.text()).toBe("1 hr 1 min 1 sec ");
  });

  it("should handle 0 seconds and invalid inputs correctly", () => {
    // This covers the new bug fix for 0 seconds
    props.activeSessions[0].session_time = 0;
    let wrapper = shallow(<SessionsTable {...props} />);
    expect(wrapper.find("tbody tr").first().find("td").at(2).text()).toBe(
      "0 secs",
    );

    props.activeSessions[0].session_time = "invalid";
    wrapper = shallow(<SessionsTable {...props} />);
    expect(wrapper.find("tbody tr").first().find("td").at(2).text()).toBe(
      "0 secs",
    );
  });
});
