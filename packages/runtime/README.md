## Runtime

## Quickstart

Install using `npm install`:

```shell
npm install @axiomhq/runtime
```

## Usage

```javascript
import { detectRuntime } from '@axiomhq/runtime';

const runtime = detectRuntime();
console.log(runtime.toString());
```