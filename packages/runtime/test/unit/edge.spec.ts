// @vitest-environment edge-runtime
import { describe, it, expect } from "vitest";
import { detectRuntime, Runtime } from '../../src/index';

describe("Edge tests", () => {
    it('detects edge runtime', () => {
        expect(detectRuntime()).toEqual(Runtime.EdgeRuntime);
    })
})
