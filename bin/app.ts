#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {RepoBuildCtlVpc} from "../lib/repo-build-ctl-vpc";
import {OndemandContracts} from "@ondemandenv/odmd-contracts";
import {StackProps} from "aws-cdk-lib";

async function main() {
    const app = new cdk.App();

    new OndemandContracts(app)

    const buildRegion = process.env.CDK_DEFAULT_REGION;
    const buildAccount = process.env.CDK_DEFAULT_ACCOUNT
        ? process.env.CDK_DEFAULT_ACCOUNT
        : process.env.CODEBUILD_BUILD_ARN!.split(":")[4];
    if (!buildRegion || !buildAccount) {
        throw new Error("buildRegion>" + buildRegion + "; buildAccount>" + buildAccount)
    }

    const props = {
        env: {
            account: buildAccount,
            region: buildRegion
        }
    } as StackProps;

    const allMyEnvers = OndemandContracts.inst.defaultVpcRds.envers;

    const defaultVpcEnver = allMyEnvers.find(e => e.targetRevision.toString() == OndemandContracts.REV_REF_value)!;

    if (!defaultVpcEnver) {
        throw new Error('no enver found!')
    }

    new RepoBuildCtlVpc(app, defaultVpcEnver, props)


}


console.log("main begin.")
main().catch(e => {
    console.error(e)
    throw e
}).finally(() => {
    console.log("main end.")
})

