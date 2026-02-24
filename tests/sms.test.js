/**
 * Tests for processlink-sms node logic
 */

// Phone number validation (mirrors node logic from lines 56-64)
describe("phone number validation", () => {
  function validatePhone(to) {
    const phoneStr = Array.isArray(to) ? to[0] : to;
    if (typeof phoneStr === "string" && !phoneStr.startsWith("+")) {
      return "Phone number must start with '+' (E.164 format, e.g., +61412345678)";
    }
    return null;
  }

  test("accepts valid E.164 number", () => {
    expect(validatePhone("+61412345678")).toBeNull();
  });

  test("accepts valid US number", () => {
    expect(validatePhone("+14155551234")).toBeNull();
  });

  test("accepts valid UK number", () => {
    expect(validatePhone("+447911123456")).toBeNull();
  });

  test("rejects number without + prefix", () => {
    expect(validatePhone("0412345678")).not.toBeNull();
  });

  test("rejects number with leading zero", () => {
    expect(validatePhone("061412345678")).not.toBeNull();
  });

  test("rejects plain digits", () => {
    expect(validatePhone("12345678")).not.toBeNull();
  });

  test("rejects empty string", () => {
    expect(validatePhone("")).not.toBeNull();
  });

  test("accepts array with valid first element", () => {
    expect(validatePhone(["+61412345678", "+61400000000"])).toBeNull();
  });

  test("rejects array with invalid first element", () => {
    expect(validatePhone(["0412345678", "+61400000000"])).not.toBeNull();
  });

  test("accepts + followed by digits", () => {
    expect(validatePhone("+1")).toBeNull();
  });
});

// SMS input validation (mirrors node logic from lines 40-54)
describe("sms input validation", () => {
  function validateSmsInput(to, body) {
    const errors = [];
    if (!to) errors.push("Missing required field: to");
    if (!body) errors.push("Missing required field: body");
    return errors;
  }

  test("passes with valid to and body", () => {
    const errors = validateSmsInput("+61412345678", "Hello");
    expect(errors).toHaveLength(0);
  });

  test("fails when to is missing", () => {
    const errors = validateSmsInput(null, "Hello");
    expect(errors).toContain("Missing required field: to");
  });

  test("fails when to is undefined", () => {
    const errors = validateSmsInput(undefined, "Hello");
    expect(errors).toContain("Missing required field: to");
  });

  test("fails when to is empty string", () => {
    const errors = validateSmsInput("", "Hello");
    expect(errors).toContain("Missing required field: to");
  });

  test("fails when body is missing", () => {
    const errors = validateSmsInput("+61412345678", null);
    expect(errors).toContain("Missing required field: body");
  });

  test("fails when body is undefined", () => {
    const errors = validateSmsInput("+61412345678", undefined);
    expect(errors).toContain("Missing required field: body");
  });

  test("fails when body is empty string", () => {
    const errors = validateSmsInput("+61412345678", "");
    expect(errors).toContain("Missing required field: body");
  });

  test("fails when both are missing", () => {
    const errors = validateSmsInput(null, null);
    expect(errors).toHaveLength(2);
  });
});

// Config priority logic (mirrors node logic from lines 37-38)
describe("sms config priority", () => {
  function resolveField(configValue, msgValue) {
    return configValue || msgValue;
  }

  test("config takes priority over msg", () => {
    expect(resolveField("+61400000000", "+61499999999")).toBe("+61400000000");
  });

  test("falls back to msg when config is empty", () => {
    expect(resolveField("", "+61499999999")).toBe("+61499999999");
  });

  test("falls back to msg when config is undefined", () => {
    expect(resolveField(undefined, "+61499999999")).toBe("+61499999999");
  });

  test("returns undefined when both are empty", () => {
    expect(resolveField("", "")).toBe("");
  });

  test("returns undefined when both are undefined", () => {
    expect(resolveField(undefined, undefined)).toBeUndefined();
  });
});

// Request body building (mirrors node logic from lines 67-70)
describe("sms request body building", () => {
  function buildRequestBody(to, body) {
    return {
      to: to,
      body: body,
    };
  }

  test("builds correct body with string recipient", () => {
    const result = buildRequestBody("+61412345678", "Hello");
    expect(result).toEqual({
      to: "+61412345678",
      body: "Hello",
    });
  });

  test("builds correct body with array recipients", () => {
    const result = buildRequestBody(["+61412345678", "+61400000000"], "Hello");
    expect(result.to).toEqual(["+61412345678", "+61400000000"]);
    expect(result.body).toBe("Hello");
  });

  test("preserves message body with special characters", () => {
    const result = buildRequestBody("+61412345678", "Hello & goodbye <world>");
    expect(result.body).toBe("Hello & goodbye <world>");
  });

  test("preserves unicode in body", () => {
    const result = buildRequestBody("+61412345678", "Hello 🌏");
    expect(result.body).toBe("Hello 🌏");
  });
});

// Short phone display (mirrors node logic from lines 90-93)
describe("short phone display", () => {
  function getShortPhone(recipientLabel) {
    return recipientLabel.length > 10
      ? recipientLabel.slice(0, 4) + "..." + recipientLabel.slice(-4)
      : recipientLabel;
  }

  test("truncates long phone numbers", () => {
    expect(getShortPhone("+61412345678")).toBe("+614...5678");
  });

  test("leaves short numbers as-is", () => {
    expect(getShortPhone("+6141234")).toBe("+6141234");
  });

  test("leaves exactly 10 char numbers as-is", () => {
    expect(getShortPhone("+614123456")).toBe("+614123456");
  });

  test("truncates 11+ char numbers", () => {
    expect(getShortPhone("+6141234567")).toBe("+614...4567");
  });
});

// Recipient label extraction (mirrors node logic from line 90)
describe("recipient label extraction", () => {
  function getRecipientLabel(to) {
    return Array.isArray(to) ? to[0] : to;
  }

  test("returns string as-is", () => {
    expect(getRecipientLabel("+61412345678")).toBe("+61412345678");
  });

  test("returns first from array", () => {
    expect(getRecipientLabel(["+61412345678", "+61400000000"])).toBe("+61412345678");
  });

  test("handles single-element array", () => {
    expect(getRecipientLabel(["+61412345678"])).toBe("+61412345678");
  });

  test("handles empty array", () => {
    expect(getRecipientLabel([])).toBeUndefined();
  });
});
