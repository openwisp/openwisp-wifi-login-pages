/**
 * @jest-environment node
 */
import axios from "axios";

describe("Captive Portal API", () => {
  const getUrl = (organization) =>
    `http://localhost:8080/api/v1/${organization}/captive-portal`;

  it("should return 200 with the expected JSON structure", async () => {
    const organization = "default";
    const response = await axios.get(getUrl(organization));
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty("captive");
    expect(response.data.captive).toBe(true);
    expect(response.data).toHaveProperty("user-portal-url");
    expect(response.data["user-portal-url"]).toBe(
      `http://localhost:8080/${organization}/login`,
    );
  });

  it("should return 404 for an invalid organization", async () => {
    const organization = "invalid-org";
    await expect(axios.get(getUrl(organization))).rejects.toMatchObject({
      response: {
        status: 404,
        data: expect.objectContaining({
          response_code: "NOT_FOUND",
        }),
      },
    });
  });
});
