import { describe, expect, it } from "vitest";
import { annotations } from "../../src/annotations";
import { mockFetchResponse, mockNoContentResponse } from "../lib/mock";

const annotationsList: annotations.Annotation[] = [
  {
    id: "test",
    type: "production-deployment",
    title: "test",
    datasets: ["test1"],
    description: "Test dataset",
    url: "some-url",
    time: "2020-11-17T22:29:00.521238198Z",
    endTime: "2020-11-17T22:29:00.521238198Z",
  },
  {
    id: "test1",
    type: "test-deployment",
    title: "test1",
    datasets: ["test2"],
    description: "This is a test description",
    url: "another-url",
    time: "2020-11-17T22:29:00.521238198Z",
    endTime: "2020-11-17T22:29:00.521238198Z",
  },
];

describe("AnnotationsService", () => {
  const client = new annotations.Service({ url: "http://axiom-js.dev.local", token: "" });

  it("List", async () => {
    mockFetchResponse(annotationsList);
    const response = await client.list();
    expect(response).not.toEqual("undefined");
    expect(response).toHaveLength(2);
  });

  it("List with query", async () => {
    mockFetchResponse([annotationsList[1]]);
    const response = await client.list({ datasets: ["test2"] });
    expect(response).not.toEqual("undefined");
    expect(response).toHaveLength(1);
  });

  it("Get", async () => {
    mockFetchResponse(annotationsList[0]);
    const response = await client.get("test");
    expect(response).toBeDefined();
    expect(response.id).toEqual("test");
    expect(response.description).toEqual("Test dataset");
  });

  it("Create", async () => {
    const request: annotations.CreateRequest = {
      title: "test1",
      type: "test-deployment",
      datasets: ["test1"],
      description: "This is a test description",
      url: "some-url",
    };

    mockFetchResponse({ id: request.title, description: request.description });

    const response = await client.create(request);
    expect(response).toBeDefined();
    expect(response.id).toEqual("test1");
    expect(response.description).toEqual("This is a test description");
  });

  it("Update", async () => {
    const req: annotations.UpdateRequest = {
      ...annotationsList[1],
      description: "This is a test description",
    };

    mockFetchResponse(annotationsList[1]);

    const response = await client.update(annotationsList[1].id, req);
    expect(response).not.toEqual("undefined");
    expect(response.id).toEqual("test1");
    expect(response.description).toEqual("This is a test description");
  });

  it("Delete", async () => {
    mockNoContentResponse();

    const response = await client.delete("test1");
    expect(response).toBeDefined();
    expect(response.status).toEqual(204);
  });
});
