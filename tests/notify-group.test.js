/**
 * Tests for processlink-notify-group node logic
 */

// Test request body building logic (mirrors node logic from lines 82-96)
describe("notify-group request body building", () => {
  function buildRequestBody(options) {
    const {
      groupKey,
      subject,
      body,
      bodyType = "text",
      attachments,
      useTemplate = true,
      linkOnly = false,
    } = options;

    const bodyStr = typeof body === "string" ? body : JSON.stringify(body);

    const requestBody = {
      group_key: groupKey,
      subject: subject,
      body: bodyStr,
      bodyType: bodyType,
      useTemplate: useTemplate,
    };

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      if (linkOnly) {
        requestBody.fileLinks = attachments;
      } else {
        requestBody.attachments = attachments;
      }
    }

    return requestBody;
  }

  describe("required fields", () => {
    it("should include group_key, subject, body, bodyType, useTemplate", () => {
      const result = buildRequestBody({
        groupKey: "maintenance-alerts",
        subject: "Test Subject",
        body: "Test body",
      });
      expect(result).toEqual({
        group_key: "maintenance-alerts",
        subject: "Test Subject",
        body: "Test body",
        bodyType: "text",
        useTemplate: true,
      });
    });

    it("should use provided bodyType", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        bodyType: "html",
      });
      expect(result.bodyType).toBe("html");
    });

    it("should default bodyType to text", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
      });
      expect(result.bodyType).toBe("text");
    });
  });

  describe("body type coercion", () => {
    it("should stringify non-string body (object)", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: { temp: 95, unit: "C" },
      });
      expect(result.body).toBe('{"temp":95,"unit":"C"}');
    });

    it("should stringify non-string body (number)", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: 42,
      });
      expect(result.body).toBe("42");
    });

    it("should pass string body through unchanged", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Plain text body",
      });
      expect(result.body).toBe("Plain text body");
    });
  });

  describe("attachments handling", () => {
    it("should include attachments array when provided", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        attachments: [{ fileId: "file-123" }],
      });
      expect(result.attachments).toEqual([{ fileId: "file-123" }]);
    });

    it("should not include empty attachments array", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        attachments: [],
      });
      expect(result.attachments).toBeUndefined();
    });

    it("should support multiple attachments", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        attachments: [{ fileId: "file-1" }, { fileId: "file-2" }],
      });
      expect(result.attachments).toHaveLength(2);
    });

    it("should not include attachments when undefined", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        attachments: undefined,
      });
      expect(result.attachments).toBeUndefined();
    });

    it("should not include attachments when null", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        attachments: null,
      });
      expect(result.attachments).toBeUndefined();
    });
  });

  describe("linkOnly option", () => {
    it("should use fileLinks instead of attachments when linkOnly is true", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        attachments: [{ fileId: "file-123" }],
        linkOnly: true,
      });
      expect(result.fileLinks).toEqual([{ fileId: "file-123" }]);
      expect(result.attachments).toBeUndefined();
    });

    it("should use attachments when linkOnly is false", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        attachments: [{ fileId: "file-123" }],
        linkOnly: false,
      });
      expect(result.attachments).toEqual([{ fileId: "file-123" }]);
      expect(result.fileLinks).toBeUndefined();
    });

    it("should default linkOnly to false", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        attachments: [{ fileId: "file-123" }],
      });
      expect(result.attachments).toEqual([{ fileId: "file-123" }]);
      expect(result.fileLinks).toBeUndefined();
    });
  });

  describe("useTemplate flag", () => {
    it("should default to true", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
      });
      expect(result.useTemplate).toBe(true);
    });

    it("should allow disabling template", () => {
      const result = buildRequestBody({
        groupKey: "alerts",
        subject: "Test",
        body: "Test",
        useTemplate: false,
      });
      expect(result.useTemplate).toBe(false);
    });
  });
});

// Test file_id to attachments auto-conversion (mirrors node logic from lines 50-53)
describe("notify-group file_id auto-conversion", () => {
  function convertFileIdToAttachments(msg) {
    let attachments = msg.attachments;
    if (!attachments && msg.file_id) {
      attachments = [{ fileId: msg.file_id }];
    }
    return attachments;
  }

  it("should convert msg.file_id to attachments array", () => {
    const msg = { file_id: "abc-123" };
    const result = convertFileIdToAttachments(msg);
    expect(result).toEqual([{ fileId: "abc-123" }]);
  });

  it("should prefer msg.attachments over msg.file_id", () => {
    const msg = {
      file_id: "ignored",
      attachments: [{ fileId: "preferred" }],
    };
    const result = convertFileIdToAttachments(msg);
    expect(result).toEqual([{ fileId: "preferred" }]);
  });

  it("should return undefined when neither is present", () => {
    const msg = { payload: "test" };
    const result = convertFileIdToAttachments(msg);
    expect(result).toBeUndefined();
  });

  it("should return empty array if msg.attachments is empty array", () => {
    const msg = { attachments: [], file_id: "should-be-ignored" };
    const result = convertFileIdToAttachments(msg);
    expect(result).toEqual([]);
  });
});

// Test validation logic (mirrors node logic from lines 56-76)
describe("notify-group validation", () => {
  function validateNotifyGroupInput(groupKey, subject, body) {
    const errors = [];
    if (!groupKey) errors.push("Missing required field: group_key");
    if (!subject) errors.push("Missing required field: subject");
    if (!body) errors.push("Missing required field: body");
    return errors;
  }

  it("should pass with all required fields", () => {
    const errors = validateNotifyGroupInput("alerts", "Test Subject", "Test body");
    expect(errors).toHaveLength(0);
  });

  it("should fail when group_key is missing", () => {
    const errors = validateNotifyGroupInput(null, "Test", "Body");
    expect(errors).toContain("Missing required field: group_key");
  });

  it("should fail when subject is missing", () => {
    const errors = validateNotifyGroupInput("alerts", null, "Body");
    expect(errors).toContain("Missing required field: subject");
  });

  it("should fail when body is missing", () => {
    const errors = validateNotifyGroupInput("alerts", "Test", null);
    expect(errors).toContain("Missing required field: body");
  });

  it("should fail when all are missing", () => {
    const errors = validateNotifyGroupInput(null, null, null);
    expect(errors).toHaveLength(3);
  });

  it("should reject empty strings", () => {
    const errors = validateNotifyGroupInput("", "", "");
    expect(errors).toHaveLength(3);
  });

  it("should reject undefined values", () => {
    const errors = validateNotifyGroupInput(undefined, undefined, undefined);
    expect(errors).toHaveLength(3);
  });
});

// Test useTemplate resolution logic (mirrors node logic from line 44)
describe("notify-group useTemplate resolution", () => {
  function resolveUseTemplate(configValue, msgValue) {
    return configValue !== false && msgValue !== false;
  }

  it("should default to true when both undefined", () => {
    expect(resolveUseTemplate(undefined, undefined)).toBe(true);
  });

  it("should be false when config sets false", () => {
    expect(resolveUseTemplate(false, undefined)).toBe(false);
  });

  it("should be false when msg sets false", () => {
    expect(resolveUseTemplate(undefined, false)).toBe(false);
  });

  it("should be true when config is true and msg is undefined", () => {
    expect(resolveUseTemplate(true, undefined)).toBe(true);
  });
});

// Test linkOnly resolution logic (mirrors node logic from line 47)
describe("notify-group linkOnly resolution", () => {
  function resolveLinkOnly(configValue, msgValue) {
    return configValue === true || msgValue === true;
  }

  it("should default to false when both undefined", () => {
    expect(resolveLinkOnly(undefined, undefined)).toBe(false);
  });

  it("should be true when config sets true", () => {
    expect(resolveLinkOnly(true, undefined)).toBe(true);
  });

  it("should be true when msg sets true", () => {
    expect(resolveLinkOnly(undefined, true)).toBe(true);
  });

  it("should be false when both false/undefined", () => {
    expect(resolveLinkOnly(false, undefined)).toBe(false);
  });
});
