import { onRequestOptions as __api_extract_js_onRequestOptions } from "D:\\Tugas Indra\\PROJECT YANG AKAN DI IKLAN\\kentamal-converter\\functions\\api\\extract.js"
import { onRequestPost as __api_extract_js_onRequestPost } from "D:\\Tugas Indra\\PROJECT YANG AKAN DI IKLAN\\kentamal-converter\\functions\\api\\extract.js"

export const routes = [
    {
      routePath: "/api/extract",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_extract_js_onRequestOptions],
    },
  {
      routePath: "/api/extract",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_extract_js_onRequestPost],
    },
  ]