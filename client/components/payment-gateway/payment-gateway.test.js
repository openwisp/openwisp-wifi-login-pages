import {shallow} from "enzyme";
import React from "react";
import {addLocale, useLocale} from "ttag";
import Loader from "../../utils/loader";
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
        onCancel={jest.fn()}
        cancelLabel="PAY_GO_BACK_BTN"
      />,
    );

    expect(wrapper.find(".main-column > .inner > h2")).toHaveLength(1);
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
    expect(wrapper).toMatchSnapshot();
  });

  describe("logo loading", () => {
    it("renders a loader for each pending logo", () => {
      const onCancel = jest.fn();
      const wrapper = shallow(
        <PaymentGateway
          gateways={[
            {key: "one", label: "One", logo_url: "https://example.com/1.svg"},
            {key: "two", label: "Two", logo_url: "https://example.com/2.svg"},
          ]}
          selected={null}
          submitting={false}
          onSelect={jest.fn()}
          onProceed={jest.fn()}
          onCancel={onCancel}
          cancelLabel="PAY_GO_BACK_BTN"
        />,
      );
      expect(wrapper.find(Loader)).toHaveLength(2);
      expect(wrapper.find(".payment-gateway-logo-loading")).toHaveLength(2);
      expect(wrapper.find("input[type='radio']")).toHaveLength(2);
      expect(wrapper.find("button.button.full")).toHaveLength(2);
      wrapper.find("button.button.full").at(1).simulate("click");
      expect(onCancel).toHaveBeenCalledTimes(1);
      wrapper.find("img").at(0).simulate("load");
      wrapper.find("img").at(1).simulate("error");
      expect(wrapper.find(Loader)).toHaveLength(0);
      expect(wrapper.find("img")).toHaveLength(1);
    });

    it("renders controls when no gateway has a logo", () => {
      const wrapper = shallow(
        <PaymentGateway
          gateways={[{key: "offline", label: "Pay at a retailer"}]}
          selected={null}
          submitting={false}
          onSelect={jest.fn()}
          onProceed={jest.fn()}
          onCancel={jest.fn()}
          cancelLabel="PAY_GO_BACK_BTN"
        />,
      );
      expect(wrapper.find("input[type='radio']")).toHaveLength(1);
      expect(wrapper.find("button.button.full")).toHaveLength(2);
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
        onCancel={jest.fn()}
        cancelLabel="PAY_GO_BACK_BTN"
      />,
    );

    expect(wrapper.find(".payment-gateway-option")).toHaveLength(2);
    expect(wrapper.find(".plans")).toHaveLength(0);
    expect(wrapper.find(".plan")).toHaveLength(0);

    wrapper.setProps({selected: "online"});

    expect(wrapper.find(".payment-gateway-option-selected")).toHaveLength(1);
    expect(wrapper.find(".plans")).toHaveLength(0);
    expect(wrapper.find(".plan")).toHaveLength(0);
  });

  it("translates API-provided gateway labels at runtime", () => {
    addLocale("gateway-test", {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "plural-forms": "nplurals = 2; plural = (n != 1);",
      },
      translations: {
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
        onCancel={jest.fn()}
        cancelLabel="PAY_GO_BACK_BTN"
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
        onCancel={jest.fn()}
        cancelLabel="PAY_GO_BACK_BTN"
      />,
    );

    wrapper
      .find("input#payment-gateway-offline")
      .simulate("change", {target: {value: "offline"}});
    expect(onSelect).toHaveBeenCalledWith("offline");
    expect(onProceed).not.toHaveBeenCalled();

    wrapper.find("button.button.full").at(0).simulate("click");
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it("offers a cancel action next to the proceed action", () => {
    const onCancel = jest.fn();
    const onProceed = jest.fn();
    const wrapper = shallow(
      <PaymentGateway
        gateways={gateways}
        selected={null}
        submitting={false}
        onSelect={jest.fn()}
        onProceed={onProceed}
        onCancel={onCancel}
        cancelLabel="PAY_GO_BACK_BTN"
      />,
    );

    const cancelButton = wrapper.find("button.button.full").at(1);
    expect(cancelButton.text()).toBe("PAY_GO_BACK_BTN");
    expect(cancelButton.prop("disabled")).toBeUndefined();
    cancelButton.simulate("click");
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onProceed).not.toHaveBeenCalled();
  });

  it("disables proceeding without a choice or while submitting", () => {
    const wrapper = shallow(
      <PaymentGateway
        gateways={gateways}
        selected={null}
        submitting={false}
        onSelect={jest.fn()}
        onProceed={jest.fn()}
        onCancel={jest.fn()}
        cancelLabel="PAY_GO_BACK_BTN"
      />,
    );
    expect(wrapper.find("button.button.full").at(0).prop("disabled")).toBe(
      true,
    );

    wrapper.setProps({selected: "online", submitting: true});
    expect(wrapper.find("button.button.full").at(0).prop("disabled")).toBe(
      true,
    );
  });

  it("shows that selection is unavailable when no gateways are returned", () => {
    const wrapper = shallow(
      <PaymentGateway
        gateways={[]}
        selected={null}
        submitting={false}
        onSelect={jest.fn()}
        onProceed={jest.fn()}
        onCancel={jest.fn()}
        cancelLabel="PAY_GO_BACK_BTN"
      />,
    );

    expect(wrapper.find(".payment-gateway-unavailable")).toHaveLength(1);
    expect(wrapper.find("button.button.full").at(0).prop("disabled")).toBe(
      true,
    );
  });

  it("shows a retry action instead of choices on error", () => {
    const onRetry = jest.fn();
    const onCancel = jest.fn();
    const wrapper = shallow(
      <PaymentGateway
        gateways={gateways}
        selected={null}
        submitting={false}
        error
        onSelect={jest.fn()}
        onProceed={jest.fn()}
        onCancel={onCancel}
        cancelLabel="PAY_GO_BACK_BTN"
        onRetry={onRetry}
      />,
    );

    expect(wrapper.find(".alert-danger")).toHaveLength(1);
    expect(wrapper.find("input[type='radio']")).toHaveLength(0);
    wrapper.find("button.button.full").at(0).simulate("click");
    expect(onRetry).toHaveBeenCalledTimes(1);
    wrapper.find("button.button.full").at(1).simulate("click");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
