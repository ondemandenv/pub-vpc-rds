import {App, Stack, StackProps, Tags} from 'aws-cdk-lib'
import {
    CfnRoute,
    CfnRouteTable,
    CfnTransitGatewayAttachment,
    IpAddresses,
    SelectedSubnets,
    SubnetType,
    Vpc,
    VpcProps
} from "aws-cdk-lib/aws-ec2";
import {RepoBuildCtlVpcRds} from "./repo-build-ctl-vpc-rds";
import {
    AnyContractsEnVer,
    ContractsCrossRefProducer, ContractsEnverCdk,
    ContractsShareOut,
    OdmdNames,
    OndemandContracts
} from "@ondemandenv/odmd-contracts";
import {
    ContractsEnverCdkDefaultVpc
} from "@ondemandenv/odmd-contracts/lib/repos/_default-vpc-rds/odmd-enver-default-vpc-rds";


export class RepoBuildCtlVpc extends Stack {

    public readonly vpc: Vpc
    public readonly vpcEnver: ContractsEnverCdkDefaultVpc
    public readonly privateSubnets: SelectedSubnets;

    constructor(parent: App, vpcEnver: ContractsEnverCdkDefaultVpc, props: StackProps) {
        const revStr = vpcEnver.targetRevision.type == 'b' ? vpcEnver.targetRevision.value : vpcEnver.targetRevision.toString();
        super(parent, ContractsEnverCdk.SANITIZE_STACK_NAME(`${vpcEnver.owner.buildId}--${revStr}`), props);
        this.vpcEnver = vpcEnver

        if (vpcEnver.owner.buildId == OndemandContracts.inst.networking.buildId) {
            throw new Error(`No vpc should be shared in ${OndemandContracts.inst.networking.buildId}`)
        }

        const vpcProps = {
            vpcName: vpcEnver.vpcConfig.vpcName,
            maxAzs: vpcEnver.vpcConfig.maxAzs,
            natGateways: vpcEnver.vpcConfig.natGateways,
            ipAddresses: IpAddresses.awsIpamAllocation({
                ipv4IpamPoolId: vpcEnver.vpcConfig.ipAddresses.ipv4IpamPoolRef.getSharedValue(this),
                ipv4NetmaskLength: vpcEnver.vpcConfig.ipAddresses.ipv4NetmaskLength,
                defaultSubnetIpv4NetmaskLength: vpcEnver.vpcConfig.ipAddresses.defaultSubnetIpv4NetmaskLength
            })
        } as VpcProps;


        this.vpc = new Vpc(this, this.stackName + '_vpc_' + vpcEnver.vpcConfig.vpcName, vpcProps)

        new Set(this.vpc.privateSubnets.concat(this.vpc.publicSubnets).concat(this.vpc.isolatedSubnets)).forEach(sbn => {
            Tags.of(sbn).add('Name', OdmdNames.create(sbn, '', 255), {
                priority: 100
            })
            sbn.node.children.filter(c => c instanceof CfnRouteTable).forEach(rt => {
                Tags.of(rt).add('Name', OdmdNames.create(rt, '', 255), {
                    priority: 100
                })
            })
        })

        try {
            this.privateSubnets = this.vpc.selectSubnets({subnetType: SubnetType.PRIVATE_WITH_EGRESS});
        } catch (e) {
            console.warn((e as Error).message)
            this.privateSubnets = this.vpc.selectSubnets({subnetType: SubnetType.PRIVATE_ISOLATED});
        }

        new ContractsShareOut(this, new Map<ContractsCrossRefProducer<AnyContractsEnVer>, string | number>([
            [vpcEnver.vpcConfig.ipAddresses.ipv4Cidr, this.vpc.vpcCidrBlock]
        ]))

        if (vpcEnver.vpcConfig.transitGatewayRef) {
            if (this.privateSubnets.subnets.length == 0) {
                throw new Error("privateSubnets.subnets.length == 0")
            }

            const tgwAttach = new CfnTransitGatewayAttachment(this, 'tgwAttach', {
                vpcId: this.vpc.vpcId, subnetIds: this.privateSubnets.subnetIds,
                transitGatewayId: vpcEnver.vpcConfig.transitGatewayRef.getSharedValue( this )
            })
            this.privateSubnets.subnets.forEach((s, i) => {
                const r = new CfnRoute(this, `tgw-${i}`, {
                    routeTableId: s.routeTable.routeTableId,
                    destinationCidrBlock: '0.0.0.0/0',
                    transitGatewayId: tgwAttach.transitGatewayId
                })
                r.addDependency(tgwAttach)
            })
        } else {
            console.warn(`No TGW ~~~~ for build:${vpcEnver.owner.buildId}, vpc:${vpcProps.vpcName}`)
        }
        if (vpcEnver.rdsConfigs.length > 0) {
            vpcEnver.rdsConfigs.forEach(r => {
                new RepoBuildCtlVpcRds(parent, this, r, props)
            })
        }

    }
}
