// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { detectRuntime, Runtime } from '../../src/index';

describe("Browser tests", () => {
    it('detects the runtime as a browser', () => {
        expect(detectRuntime()).toEqual(Runtime.Browser);
    })
})