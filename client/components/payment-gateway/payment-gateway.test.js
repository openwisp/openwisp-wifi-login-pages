import {shallow} from "enzyme";
import React from "react";
import {addLocale, useLocale} from "ttag";
import PaymentGateway from "./payment-gateway";

const gateways = [
  {key: "offline", label: "Pay at a retailer"},
  {
    key: "online",
    label: "Pay online",
    logo_url: "https://subscriptions.example/static/pay-online.svg",
  },
];

describe("<PaymentGateway />", () => {
  afterEach(() => {
    useLocale("en");
  });

  it("renders API-provided gateway choices and absolute logo URLs with native radios", () => {
    const wrapper = shallow(
      <PaymentGateway
        gateways={gateways}
        selected="online"
        submitting={false}
        onSelect={jest.fn()}
        onProceed={jest.fn()}
      />,
    );

    expect(wrapper.find("input[type='radio']")).toHaveLength(2);
    expect(wrapper.find("h2").text()).toBe("PAY_GATEWAY_REQ");
    expect(wrapper.find('[role="radiogroup"]').prop("aria-labelledby")).toBe(
      wrapper.find("h2").prop("id"),
    );
    expect(wrapper.find("label").at(0).text()).toContain("Pay at a retailer");
    expect(wrapper.find("label").at(1).text()).toContain("Pay online");
    expect(wrapper.find("input#payment-gateway-online").prop("checked")).toBe(
      true,
    );
    expect(wrapper.find("img").prop("src")).toBe(
      "https://subscriptions.example/static/pay-online.svg",
    );
    expect(wrapper.find(".payment-gateway-logo")).toHaveLength(1);
    wrapper.find("input[type='radio']").forEach((radio) => {
      expect(wrapper.find(`label[htmlFor="${radio.prop("id")}"]`)).toHaveLength(
        1,
      );
    });
  });

  it("keeps every gateway readable regardless of selection", () => {
    const wrapper = shallow(
      <PaymentGateway
        gateways={gateways}
        selected={null}
        submitting={false}
        onSelect={jest.fn()}
        onProceed={jest.fn()}
      />,
    );

    expect(wrapper.find(".plan")).toHaveLength(2);
    expect(wrapper.find(".plan.inactive")).toHaveLength(0);

    wrapper.setProps({selected: "online"});

    expect(wrapper.find(".plan.active")).toHaveLength(1);
    expect(wrapper.find(".plan.inactive")).toHaveLength(0);
  });

  it("translates API-provided gateway labels at runtime", () => {
    addLocale("gateway-test", {
      headers: {"plural-forms": "nplurals = 2; plural = (n != 1);"},
      contexts: {
        "": {
          "Pay online": {
            msgid: "Pay online",
            msgstr: ["Paga online"],
          },
        },
      },
    });
    useLocale("gateway-test");

    const wrapper = shallow(
      <PaymentGateway
        gateways={gateways}
        selected={null}
        submitting={false}
        onSelect={jest.fn()}
        onProceed={jest.fn()}
      />,
    );

    expect(wrapper.find("label").at(1).text()).toContain("Paga online");
  });

  it("keeps selection local until proceeding", () => {
    const onSelect = jest.fn();
    const onProceed = jest.fn();
    const wrapper = shallow(
      <PaymentGateway
        gateways={gateways}
        selected={null}
        submitting={false}
        onSelect={onSelect}
        onProceed={onProceed}
      />,
    );

    wrapper
      .find("input#payment-gateway-offline")
      .simulate("change", {target: {value: "offline"}});
    expect(onSelect).toHaveBeenCalledWith("offline");
    expect(onProceed).not.toHaveBeenCalled();

    wrapper.find("button.button.full").simulate("click");
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it("disables proceeding without a choice or while submitting", () => {
    const wrapper = shallow(
      <PaymentGateway
        gateways={gateways}
        selected={null}
        submitting={false}
        onSelect={jest.fn()}
        onProceed={jest.fn()}
      />,
    );
    expect(wrapper.find("button.button.full").prop("disabled")).toBe(true);

    wrapper.setProps({selected: "online", submitting: true});
    expect(wrapper.find("button.button.full").prop("disabled")).toBe(true);
  });

  it("shows that selection is unavailable when no gateways are returned", () => {
    const wrapper = shallow(
      <PaymentGateway
        gateways={[]}
        selected={null}
        submitting={false}
        onSelect={jest.fn()}
        onProceed={jest.fn()}
      />,
    );

    expect(wrapper.find(".payment-gateway-unavailable")).toHaveLength(1);
    expect(wrapper.find("button.button.full").prop("disabled")).toBe(true);
  });

  it("shows a retry action instead of choices on error", () => {
    const onRetry = jest.fn();
    const wrapper = shallow(
      <PaymentGateway
        gateways={gateways}
        selected={null}
        submitting={false}
        error
        onSelect={jest.fn()}
        onProceed={jest.fn()}
        onRetry={onRetry}
      />,
    );

    expect(wrapper.find(".alert-danger")).toHaveLength(1);
    expect(wrapper.find("input[type='radio']")).toHaveLength(0);
    wrapper.find("button.button.full").simulate("click");
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
