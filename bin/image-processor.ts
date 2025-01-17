#!/usr/bin/env node
import * as cdk from "aws-cdk-lib"
import { ImagenProcessingStack } from "../lib/image-processing-stack"

const app = new cdk.App()
new ImagenProcessingStack(app, "image-processor-stack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
})
