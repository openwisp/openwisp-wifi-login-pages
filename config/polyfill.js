import {TextEncoder, TextDecoder, ReadableStream, MessagePort} from "util";

Object.assign(global, {TextDecoder, TextEncoder, ReadableStream, MessagePort});
