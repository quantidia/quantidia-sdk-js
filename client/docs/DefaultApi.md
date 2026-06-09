# DefaultApi

All URIs are relative to *https://api.dev.trusthub.cloud*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**apiRestCoreAuthLoginPost**](DefaultApi.md#apirestcoreauthloginpostoperation) | **POST** /api/rest/core/auth/login |  |



## apiRestCoreAuthLoginPost

> apiRestCoreAuthLoginPost(apiRestCoreAuthLoginPostRequest)



### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { ApiRestCoreAuthLoginPostOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // ApiRestCoreAuthLoginPostRequest
    apiRestCoreAuthLoginPostRequest: ...,
  } satisfies ApiRestCoreAuthLoginPostOperationRequest;

  try {
    const data = await api.apiRestCoreAuthLoginPost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **apiRestCoreAuthLoginPostRequest** | [ApiRestCoreAuthLoginPostRequest](ApiRestCoreAuthLoginPostRequest.md) |  | |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`
- **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

