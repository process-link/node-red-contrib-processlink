/**
 * Tests for processlink-mail node logic
 */

// Test request body building logic (mirrors node logic from lines 78-98)
describe("mail request body building", () => {
  function buildRequestBody(options) {
    const {
      to,
      subject,
      body = "You have a new notification from ProcessMail.",
      bodyType = "text",
      cc,
      bcc,
      replyTo,
      attachments,
      useTemplate = true,
      linkOnly = false,
    } = options;

    const requestBody = {
      to,
      subject,
      body,
      bodyType,
      useTemplate,
    };

    if (cc) requestBody.cc = cc;
    if (bcc) requestBody.bcc = bcc;
    if (replyTo) requestBody.replyTo = replyTo;
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
    it("should include to, subject, body, bodyType, useTemplate", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test Subject",
        body: "Test body",
      });
      expect(result).toEqual({
        to: "test@example.com",
        subject: "Test Subject",
        body: "Test body",
        bodyType: "text",
        useTemplate: true,
      });
    });

    it("should use default body when not provided", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
      });
      expect(result.body).toBe("You have a new notification from ProcessMail.");
    });

    it("should use provided bodyType", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        bodyType: "html",
      });
      expect(result.bodyType).toBe("html");
    });

    it("should default bodyType to text", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
      });
      expect(result.bodyType).toBe("text");
    });
  });

  describe("optional fields", () => {
    it("should include cc when provided", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        cc: "cc@example.com",
      });
      expect(result.cc).toBe("cc@example.com");
    });

    it("should include bcc when provided", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        bcc: "bcc@example.com",
      });
      expect(result.bcc).toBe("bcc@example.com");
    });

    it("should include replyTo when provided", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        replyTo: "reply@example.com",
      });
      expect(result.replyTo).toBe("reply@example.com");
    });

    it("should not include cc/bcc/replyTo when not provided", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
      });
      expect(result.cc).toBeUndefined();
      expect(result.bcc).toBeUndefined();
      expect(result.replyTo).toBeUndefined();
    });

    it("should include all optional fields together", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        cc: "cc@example.com",
        bcc: "bcc@example.com",
        replyTo: "reply@example.com",
      });
      expect(result.cc).toBe("cc@example.com");
      expect(result.bcc).toBe("bcc@example.com");
      expect(result.replyTo).toBe("reply@example.com");
    });
  });

  describe("attachments handling", () => {
    it("should include attachments array when provided", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        attachments: [{ fileId: "file-123" }],
      });
      expect(result.attachments).toEqual([{ fileId: "file-123" }]);
    });

    it("should not include empty attachments array", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        attachments: [],
      });
      expect(result.attachments).toBeUndefined();
    });

    it("should support multiple attachments", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        attachments: [{ fileId: "file-1" }, { fileId: "file-2" }],
      });
      expect(result.attachments).toHaveLength(2);
    });

    it("should not include attachments when undefined", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        attachments: undefined,
      });
      expect(result.attachments).toBeUndefined();
    });

    it("should not include attachments when null", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        attachments: null,
      });
      expect(result.attachments).toBeUndefined();
    });
  });

  describe("linkOnly option", () => {
    it("should use fileLinks instead of attachments when linkOnly is true", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        attachments: [{ fileId: "file-123" }],
        linkOnly: true,
      });
      expect(result.fileLinks).toEqual([{ fileId: "file-123" }]);
      expect(result.attachments).toBeUndefined();
    });

    it("should use attachments when linkOnly is false", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        attachments: [{ fileId: "file-123" }],
        linkOnly: false,
      });
      expect(result.attachments).toEqual([{ fileId: "file-123" }]);
      expect(result.fileLinks).toBeUndefined();
    });

    it("should default linkOnly to false", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        attachments: [{ fileId: "file-123" }],
      });
      expect(result.attachments).toEqual([{ fileId: "file-123" }]);
      expect(result.fileLinks).toBeUndefined();
    });
  });

  describe("useTemplate flag", () => {
    it("should default to true", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
      });
      expect(result.useTemplate).toBe(true);
    });

    it("should allow disabling template", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        useTemplate: false,
      });
      expect(result.useTemplate).toBe(false);
    });
  });

  describe("array recipients", () => {
    it("should support array of recipients in to field", () => {
      const result = buildRequestBody({
        to: ["user1@example.com", "user2@example.com"],
        subject: "Test",
      });
      expect(result.to).toEqual(["user1@example.com", "user2@example.com"]);
    });

    it("should support array of cc recipients", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        cc: ["cc1@example.com", "cc2@example.com"],
      });
      expect(result.cc).toEqual(["cc1@example.com", "cc2@example.com"]);
    });

    it("should support array of bcc recipients", () => {
      const result = buildRequestBody({
        to: "test@example.com",
        subject: "Test",
        bcc: ["bcc1@example.com", "bcc2@example.com"],
      });
      expect(result.bcc).toEqual(["bcc1@example.com", "bcc2@example.com"]);
    });
  });
});

// Test file_id to attachments auto-conversion (mirrors node logic from lines 49-53)
describe("file_id auto-conversion", () => {
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

  it("should handle UUID-style file_id", () => {
    const msg = { file_id: "550e8400-e29b-41d4-a716-446655440000" };
    const result = convertFileIdToAttachments(msg);
    expect(result).toEqual([{ fileId: "550e8400-e29b-41d4-a716-446655440000" }]);
  });
});

// Test validation logic (mirrors node logic from lines 56-69)
describe("mail validation", () => {
  function validateMailInput(to, subject) {
    const errors = [];
    if (!to) errors.push("Missing required field: to");
    if (!subject) errors.push("Missing required field: subject");
    return errors;
  }

  it("should pass with valid to and subject", () => {
    const errors = validateMailInput("test@example.com", "Test Subject");
    expect(errors).toHaveLength(0);
  });

  it("should fail when to is missing", () => {
    const errors = validateMailInput(null, "Test Subject");
    expect(errors).toContain("Missing required field: to");
  });

  it("should fail when to is undefined", () => {
    const errors = validateMailInput(undefined, "Test Subject");
    expect(errors).toContain("Missing required field: to");
  });

  it("should fail when subject is missing", () => {
    const errors = validateMailInput("test@example.com", null);
    expect(errors).toContain("Missing required field: subject");
  });

  it("should fail when subject is undefined", () => {
    const errors = validateMailInput("test@example.com", undefined);
    expect(errors).toContain("Missing required field: subject");
  });

  it("should fail when both are missing", () => {
    const errors = validateMailInput(null, null);
    expect(errors).toHaveLength(2);
  });

  it("should accept empty string as invalid for to", () => {
    const errors = validateMailInput("", "Test");
    expect(errors).toContain("Missing required field: to");
  });

  it("should accept empty string as invalid for subject", () => {
    const errors = validateMailInput("test@example.com", "");
    expect(errors).toContain("Missing required field: subject");
  });
});

// Test recipient label extraction for status display (mirrors node logic from line 120)
describe("recipient label extraction", () => {
  function getRecipientLabel(to) {
    return Array.isArray(to) ? to[0] : to;
  }

  it("should return string recipient as-is", () => {
    expect(getRecipientLabel("test@example.com")).toBe("test@example.com");
  });

  it("should return first recipient from array", () => {
    expect(
      getRecipientLabel(["first@example.com", "second@example.com"])
    ).toBe("first@example.com");
  });

  it("should handle single-element array", () => {
    expect(getRecipientLabel(["only@example.com"])).toBe("only@example.com");
  });

  it("should handle empty array by returning undefined", () => {
    expect(getRecipientLabel([])).toBeUndefined();
  });
});

// Test useTemplate resolution logic (mirrors node logic from line 73)
describe("useTemplate resolution", () => {
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

  it("should be false when both set false", () => {
    expect(resolveUseTemplate(false, false)).toBe(false);
  });

  it("should be true when config is true and msg is undefined", () => {
    expect(resolveUseTemplate(true, undefined)).toBe(true);
  });

  it("should be false when config is true but msg is false", () => {
    expect(resolveUseTemplate(true, false)).toBe(false);
  });
});

// Test linkOnly resolution logic (mirrors node logic from line 76)
describe("linkOnly resolution", () => {
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

  it("should be true when both set true", () => {
    expect(resolveLinkOnly(true, true)).toBe(true);
  });

  it("should be false when config is false and msg is undefined", () => {
    expect(resolveLinkOnly(false, undefined)).toBe(false);
  });

  it("should be true when config is false but msg is true", () => {
    expect(resolveLinkOnly(false, true)).toBe(true);
  });
});
